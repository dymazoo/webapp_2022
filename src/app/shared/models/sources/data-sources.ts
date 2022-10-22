import {Injectable} from '@angular/core';
import {Source} from './source';
import {Mailchimp} from './mailchimp';
import {Sendinblue} from './sendinblue';
import {Shopify} from './shopify';
import {Woocommerce} from './woocommerce';
import {Eventbrite} from './eventbrite';
import {Zapier} from './zapier';
import {Dymazooapi} from './dymazooapi';
import {SourceSetting} from '../sourceSetting';
import {HttpService} from '../../services/http.service';
import {Observable, Subject, Subscription} from 'rxjs';
import {delay} from 'rxjs/operators';
import {SourceSettingValue} from '../sourceSettingValue';
import {FuseNavigationItem} from '@fuse/components/navigation/navigation.types';
import {FuseConfigService} from '@fuse/services/config';

@Injectable()
export class DataSources {

    private sources: Source[] = [];
    private sourceSettings: SourceSetting[] = [];
    private availableSourceDescriptionsSubject = new Subject<any>();
    private activeDescriptionsSubject = new Subject<any>();
    private sourceSavedSubject = new Subject<any>();
    private errorsSubject = new Subject<any>();
    private espSubject = new Subject<any>();

    private activeDescriptions: any[] = [];
    private _fuseNavigationService;

    private isLoggedIn: boolean = false;
    private canClientAdmin: boolean = false;
    private userData: any;
    private userSubscription: Subscription;

    public constructor(
        private httpService: HttpService,
        private _fuseConfigService: FuseConfigService
    ) {
        this.sources.push(new Mailchimp());
        this.sources.push(new Sendinblue());
        this.sources.push(new Shopify());
//        this.sources.push(new Woocommerce());
        this.sources.push(new Eventbrite());
        this.sources.push(new Zapier());
        this.sources.push(new Dymazooapi());

        if (this.isLoggedIn) {
            this.getCurrentDescriptions();
        }

        this.userSubscription = this.httpService.getCurrentUser().subscribe(userData => {
            this.userData = userData;
            this.isLoggedIn = this.httpService.loggedIn;
            if (this.isLoggedIn) {
                // Check permissions
                this.canClientAdmin = this.httpService.hasPermission('client_admin');
                this.getCurrentDescriptions();
            }
        });
    }

    public getAvailableSourceDescriptions(): Observable<any> {
        return this.availableSourceDescriptionsSubject.asObservable().pipe(delay(0));
    }

    public getSourceSaved(): Observable<any> {
        return this.sourceSavedSubject.asObservable().pipe(delay(0));
    }

    public getErrors(): Observable<any> {
        return this.errorsSubject.asObservable().pipe(delay(0));
    }

    public getEsp(): Observable<any> {
        return this.espSubject.asObservable().pipe(delay(0));
    }

    public getCurrentDescriptions(): void {
        this.httpService.getEntity('source-settings', '')
            .subscribe(result => {
                let plan = 'analyst';
                if (this.userData.plan !== undefined) {
                    plan = this.userData.plan;
                }
                this.sourceSettings = result;

                // check if there is already an esp in use and make ESP available to other components
                // via the espSubject
                let hasEsp = false;
                this.sourceSettings.forEach((sourceSetting) => {
                    this.sources.forEach(source => {
                        if (source.name === sourceSetting.name && source.esp) {
                            hasEsp = true;
                            this.espSubject.next(source.name);
                        }
                    });
                });

                const availableDescriptions = [];
                this.activeDescriptions = [];
                let sourceActive;
                this.sources.forEach(source => {
                    sourceActive = false;

                    this.sourceSettings.forEach(sourceSetting => {
                        if (source.description === sourceSetting.description) {
                            sourceActive = true;
                        }
                    });
                    if (sourceActive) {
                        this.activeDescriptions.push({name: source.name, description: source.description});
                    }

                    // if the source is an ESP and there is already an ESP then fake sourceActive
                    // so that the source is not available
                    if (source.esp && hasEsp) {
                        sourceActive = true;
                    }

                    if (plan === 'analyst') {
                        if (source.name === 'shopify' || source.name === 'eventbrite' || source.name === 'dymazooapi' || source.name === 'zapier') {
                            sourceActive = true;
                        }
                    }

                    if (plan === 'specialist') {
                        if (source.name === 'dymazooapi' || source.name === 'zapier') {
                            sourceActive = true;
                        }
                    }

                    if (!sourceActive) {
                        availableDescriptions.push({name: source.name, description: source.description});
                    }
                });
                this.availableSourceDescriptionsSubject.next(availableDescriptions);
                this.activeDescriptionsSubject.next(this.activeDescriptions);
                this.errorsSubject.next([]);
                if (this._fuseNavigationService) {
                    const navComponent = this._fuseNavigationService.getComponent('mainNavigation');
                    if (navComponent) {
                        const navigation = navComponent.navigation;
                        const item = this._fuseNavigationService.getItem('integrations', navigation);
                        this.setIntegrationsSettingsNavigation(item);
                    }
                    // Set the config
                    const layout = this.userData.layout;
                    const scheme = this.userData.scheme;
                    const theme = this.userData.theme;
                    this._fuseConfigService.config = {layout};
                    this._fuseConfigService.config = {scheme};
                    this._fuseConfigService.config = {theme};
                }
            }, (errors) => {
                this.errorsSubject.next(errors);
            });
    }

    public addSourceSetting(sourceName): void {
        this.sources.forEach(source => {
            if (source.name === sourceName) {
                const sourceSetting = new SourceSetting(
                    {
                        name: source.name,
                        description: source.description,
                        default: 0,
                        enabled: 1
                    }
                );
                let sourceSettingValue;
                source.values.forEach(value => {
                    sourceSettingValue = new SourceSettingValue(
                        {
                            name: value,
                            automatic: 1
                        }
                    );
                    if (sourceName === 'sendinblue' && value === 'date_format') {
                        sourceSettingValue.value = 'MM-DD-YYYY';
                    }
                    if (sourceName === 'mailchimp' && value === 'permission_reminder') {
                        sourceSettingValue.value = 'You have subscribed';
                    }

                    sourceSetting.values.push(sourceSettingValue);
                });
                this.httpService.saveEntity('source-setting', sourceSetting)
                    .subscribe((data: Response) => {
                        this.errorsSubject.next([]);
                        this.getCurrentDescriptions();
                        this.sourceSavedSubject.next(true);
                    }, (errors) => {
                        this.errorsSubject.next(errors);
                    });
            }
        });
    }

    public registerNavigationService(fuseNavigationService): void {
        this._fuseNavigationService = fuseNavigationService;
    }

    public setIntegrations(navigation): void {
        // turn on/off menu items as appropriate for permissions
        if (this.httpService.loggedIn) {
            navigation.forEach((navItem) => {
                if (navItem.children) {
                    navItem.children.forEach((childItem) => {
                        if (childItem.id === 'marketing.segmentation') {
                            childItem.disabled = !this.httpService.hasPermission('selections');
                        }
                        if (childItem.id === 'marketing.campaigns') {
                            childItem.disabled = !this.httpService.hasPermission('esp_integration');
                        }
                        if (childItem.id === 'data.import') {
                            childItem.disabled = !this.httpService.hasPermission('import');
                        }
                        if (childItem.id === 'data.layout') {
                            childItem.disabled = !this.httpService.hasPermission('layout_management');
                        }
                        if (childItem.id === 'data.custom-fields') {
                            childItem.disabled = !this.httpService.hasPermission('custom_management');
                        }
                        if (childItem.id === 'data.sales-categories') {
                            childItem.disabled = !this.httpService.hasPermission('sales');
                        }
                        if (childItem.id === 'data.event-categories') {
                            childItem.disabled = !this.httpService.hasPermission('event');
                        }
                        if (childItem.id === 'data.events') {
                            childItem.disabled = !this.httpService.hasPermission('event');
                        }
                        if (childItem.id === 'data.preferences') {
                            childItem.disabled = !this.httpService.hasPermission('settings');
                        }
                        if (childItem.id === 'data.download') {
                            childItem.disabled = !this.httpService.hasPermission('export');
                        }
                        if (childItem.id === 'data.compliance') {
                            childItem.disabled = !this.httpService.hasPermission('compliance');
                        }
                        if (navItem.id === 'integrations') {
                            childItem.disabled = !this.httpService.hasPermission('client_admin');
                        }
                    });
                }
            });
        }

        const item = this._fuseNavigationService.getItem('integrations', navigation);
        this.setIntegrationsSettingsNavigation(item);
    }

    private setIntegrationsSettingsNavigation(integrationsItem): void {
        integrationsItem.children = [];
        if (this.isLoggedIn) {
            const integrationsSettingsItem = ({
                id: 'integrations.settings',
                title: 'Integration Settings',
                type: 'basic',
                disabled: !this.canClientAdmin,
                icon: 'heroicons_outline:cog',
                link: '/integrations/source-settings'
            } as FuseNavigationItem);
            integrationsItem.children.push(integrationsSettingsItem);
            this.setIntegrationsNavigation(integrationsItem);
        }
    }

    public setIntegrationsNavigation(integrationsItem: FuseNavigationItem): void {
        if (this.isLoggedIn) {
            const mailchimpItem = ({
                id: 'integrations.mailchimp',
                title: 'Mailchimp',
                type: 'basic',
                disabled: !this.canClientAdmin,
                icon: 'heroicons_outline:mail',
                link: '/integrations/mailchimp'
            } as FuseNavigationItem);

            const sendinblueItem = ({
                id: 'integrations.sendinblue',
                title: 'Sendinblue',
                type: 'basic',
                disabled: !this.canClientAdmin,
                icon: 'heroicons_outline:mail',
                link: '/integrations/sendinblue'
            } as FuseNavigationItem);

            const shopifyItem = ({
                id: 'integrations.shopify',
                title: 'Shopify',
                type: 'basic',
                disabled: !this.canClientAdmin,
                icon: 'heroicons_outline:shopping-cart',
                link: '/integrations/shopify'
            } as FuseNavigationItem);

            const woocommerceItem = ({
                id: 'integrations.woocommerce',
                title: 'WooCommerce',
                type: 'basic',
                disabled: !this.canClientAdmin,
                icon: 'heroicons_outline:shopping-cart',
                link: '/integrations/woocommerce'
            } as FuseNavigationItem);

            const eventbriteItem = ({
                id: 'integrations.eventbrite',
                title: 'Eventbrite',
                type: 'basic',
                disabled: !this.canClientAdmin,
                icon: 'heroicons_outline:calendar',
                link: '/integrations/eventbrite'
            } as FuseNavigationItem);

            const zapierItem = ({
                id: 'integrations.zapier',
                title: 'Zapier',
                type: 'basic',
                disabled: !this.canClientAdmin,
                icon: 'heroicons_outline:lightning-bolt',
                link: '/integrations/zapier'
            } as FuseNavigationItem);

            const dymazooapiItem = ({
                id: 'integrations.dymazooapi',
                title: 'Dymazoo Api',
                type: 'basic',
                disabled: !this.canClientAdmin,
                icon: 'heroicons_outline:link',
                link: '/integrations/dymazoo-api'
            } as FuseNavigationItem);

            this.activeDescriptions.forEach(activeDescription => {
                if (activeDescription.name === 'mailchimp') {
                    this.addIntegrationChild(integrationsItem, mailchimpItem);
                }
                if (activeDescription.name === 'sendinblue') {
                    this.addIntegrationChild(integrationsItem, sendinblueItem);
                }
                if (activeDescription.name === 'shopify') {
                    this.addIntegrationChild(integrationsItem, shopifyItem);
                }
                if (activeDescription.name === 'woocommerce') {
                    this.addIntegrationChild(integrationsItem, woocommerceItem);
                }
                if (activeDescription.name === 'eventbrite') {
                    this.addIntegrationChild(integrationsItem, eventbriteItem);
                }
                if (activeDescription.name === 'zapier') {
                    this.addIntegrationChild(integrationsItem, zapierItem);
                }
                if (activeDescription.name === 'dymazooapi') {
                    this.addIntegrationChild(integrationsItem, dymazooapiItem);
                }
            });
        }
    }

    private addIntegrationChild(integrationsItem: FuseNavigationItem, item: FuseNavigationItem): void {
        let exists = false;
        integrationsItem.children.forEach(child => {
            if (child.id === item.id) {
                exists = true;
            }
        });
        if (!exists) {
            integrationsItem.children.push(item);
        }
    }
}
