import {Component, OnInit, OnDestroy} from '@angular/core';
import {DataSources} from 'app/shared/models/sources/data-sources';
import {NavigationEnd, Router} from '@angular/router';
import {FuseNavigationService} from '@fuse/components/navigation/navigation.service';
import {NgcCookieConsentService,
    NgcNoCookieLawEvent,
    NgcInitializingEvent,
    NgcInitializationErrorEvent,
    NgcStatusChangeEvent,
} from 'ngx-cookieconsent';
import { CookieService } from 'ngx-cookie';
import { Subscription } from 'rxjs';
import * as moment from 'moment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    private popupOpenSubscription: Subscription;
    private popupCloseSubscription: Subscription;
    private initializingSubscription: Subscription;
    private initializedSubscription: Subscription;
    private initializationErrorSubscription!: Subscription;
    private statusChangeSubscription: Subscription;
    private revokeChoiceSubscription: Subscription;
    private noCookieLawSubscription: Subscription;

    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _fuseNavigationService: FuseNavigationService,
        private dataSources: DataSources,
        private ccService: NgcCookieConsentService,
        private cookieService: CookieService
    ) {
        this._router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                const url = event.url;
                let title = url.substring(1);
                const first = title.substring(0,1).toUpperCase();
                title = first + title.substring(1);
            }
        })
        this.dataSources.registerNavigationService(this._fuseNavigationService);
    }

    ngOnInit() {
        let optOut = this.getCookie('opt-out');
        if (optOut === undefined) {
            this.ccService.open();
        }


        // subscribe to cookieconsent observables to react to main events
        this.popupOpenSubscription = this.ccService.popupOpen$.subscribe(() => {
            // you can use this.ccService.getConfig() to do stuff...
        });

        this.popupCloseSubscription = this.ccService.popupClose$.subscribe(() => {
            // you can use this.ccService.getConfig() to do stuff...
        });

        this.initializingSubscription = this.ccService.initializing$.subscribe(
            (event: NgcInitializingEvent) => {
                // the cookieconsent is initilializing... Not yet safe to call methods like `NgcCookieConsentService.hasAnswered()`
            });

        this.initializedSubscription = this.ccService.initialized$.subscribe(
            () => {
                // the cookieconsent has been successfully initialized.
                // It's now safe to use methods on NgcCookieConsentService that require it, like `hasAnswered()` for eg...
            });

        this.initializationErrorSubscription = this.ccService.initializationError$.subscribe(
            (event: NgcInitializationErrorEvent) => {
                // the cookieconsent has failed to initialize...
                // console.log(`initializationError: ${JSON.stringify(event.error?.message)}`);
            });

        this.statusChangeSubscription = this.ccService.statusChange$.subscribe(
            (event: NgcStatusChangeEvent) => {
                if (event.status === 'deny') {
                    this.setCookie('opt-out', '1');
                } else {
                    this.setCookie('opt-out', '0');
                }
                // you can use this.ccService.getConfig() to do stuff...
            }
        );

        this.revokeChoiceSubscription = this.ccService.revokeChoice$.subscribe(
            () => {
                // you can use this.ccService.getConfig() to do stuff...
            }
        );

        this.noCookieLawSubscription = this.ccService.noCookieLaw$.subscribe(
            (event: NgcNoCookieLawEvent) => {
                // you can use this.ccService.getConfig() to do stuff...
            }
        );
    }

    ngOnDestroy() {
        // unsubscribe to cookieconsent observables to prevent memory leaks
        this.popupOpenSubscription.unsubscribe();
        this.popupCloseSubscription.unsubscribe();
        this.initializingSubscription.unsubscribe();
        this.initializedSubscription.unsubscribe();
        this.initializationErrorSubscription.unsubscribe();
        this.statusChangeSubscription.unsubscribe();
        this.revokeChoiceSubscription.unsubscribe();
        this.noCookieLawSubscription.unsubscribe();
    }

    getCookie(key: string){
        return this.cookieService.get(key);
    }

    setCookie(key: string, value: string){
        return this.cookieService.put(key, value, {'expires': moment().add(1, 'month').toISOString()});
    }

    removeCookie(key: string){
        return this.cookieService.remove(key);
    }
}
