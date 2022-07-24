import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import {Subject, Subscription, takeUntil} from 'rxjs';
import { FuseConfigService } from '@fuse/services/config';
import { AppConfig, Scheme, Theme, Themes } from 'app/core/config/app.config';
import { Layout } from 'app/layout/layout.types';
import {HttpService} from 'app/shared/services/http.service';
import {Contact} from 'app/shared/models/contact';

@Component({
    selector     : 'settings',
    templateUrl  : './settings.component.html',
    styles       : [
        `
            settings {
                position: static;
                display: block;
                flex: none;
                width: auto;
            }
        `
    ],
    encapsulation: ViewEncapsulation.None
})
export class SettingsComponent implements OnInit, OnDestroy
{
    config: AppConfig;
    layout: Layout;
    scheme: 'dark' | 'light';
    theme: string;
    themes: Themes;
    contact: Contact = new Contact();
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private userData: any;
    private userSubscription: Subscription;

    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _fuseConfigService: FuseConfigService,
        private httpService: HttpService
    )
    {
        this.userData = this.httpService.userData;

        this.userSubscription = this.httpService.getCurrentUser().subscribe(userData => {
            this.userData = userData;
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: AppConfig) => {

                // Store the config
                this.config = config;
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set the layout on the config
     *
     * @param layout
     */
    setLayout(layout: string): void
    {
        // Clear the 'layout' query param to allow layout changes
        this._router.navigate([], {
            queryParams        : {
                layout: null
            },
            queryParamsHandling: 'merge'
        }).then(() => {
            // Set the config
            this._fuseConfigService.config = {layout};
            this.saveProfile('layout', layout);
        });
    }

    /**
     * Set the scheme on the config
     *
     * @param scheme
     */
    setScheme(scheme: Scheme): void
    {
        this._fuseConfigService.config = {scheme};
        this.saveProfile('scheme', scheme);
    }

    /**
     * Set the theme on the config
     *
     * @param theme
     */
    setTheme(theme: Theme): void
    {
        this._fuseConfigService.config = {theme};
        this.saveProfile('theme', theme);
    }

    private saveProfile(setting: string, value: string): void
    {
        this.contact.name = this.userData.userName;
        this.contact.layout = this.userData.layout;
        this.contact.scheme = this.userData.scheme;
        this.contact.theme = this.userData.theme;
        // prevent loss of telephone on the contact record
        delete this.contact.telephone;

        if (setting === 'layout') {
            this.contact.layout = value;
            this.httpService.setCurrentLayout(value);
        }
        if (setting === 'scheme') {
            this.contact.scheme = value;
            this.httpService.setCurrentScheme(value);
        }
        if (setting === 'theme') {
            this.contact.theme = value;
            this.httpService.setCurrentTheme(value);
        }

        this.httpService.saveEntity('profile', this.contact)
            .subscribe((data: Response) => {
            }, (errors) => {
            });

    }
}
