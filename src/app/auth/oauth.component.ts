import {Component, OnDestroy, OnInit} from '@angular/core';
import {HttpService} from '../shared/services/http.service';
import {Router, ActivatedRoute} from '@angular/router';
import {FuseConfigService} from '@fuse/services/config';
import {TranslocoService} from '@ngneat/transloco';
import {Clipboard} from '@angular/cdk/clipboard';

@Component({
    selector: 'home',
    templateUrl: 'oauth.component.html'
})
export class OauthComponent implements OnInit, OnDestroy {

    public code: string;
    public secret: string;
    public token: string;
    public tokenType: string;
    public expiresIn: string;
    public refreshToken: string;
    public hasCode: boolean = false;
    public hasToken: boolean = false;

    errors = [];

    constructor(private _fuseConfigService: FuseConfigService,
                private router: Router,
                private activatedRoute: ActivatedRoute,
                private httpService: HttpService,
                private _translocoService: TranslocoService,
                private clipboard: Clipboard,
    ) {
        this._translocoService.setActiveLang('en');

        activatedRoute.queryParams.subscribe((param: any) => {
            this.code = param['code'];
            if (this.code) {
                this.hasCode = true;
            }
            this.errors = [];
        });
    }

    ngOnInit(): void {
        if (this.hasCode) {
            this.httpService.saveEntity('dymazoo-oauth-secret', {})
                .subscribe(data => {
                    this.secret = data.secret;
                    const tokenData = {
                        'code': this.code,
                        'client_id': 1,
                        'client_secret': this.secret,
                        'grant_type': 'authorization_code',
                        'redirect_uri' : 'https://app.dymazoo.com/auth/oauth/'
                    };
                    this.httpService.getOAuthToken(tokenData)
                        .subscribe(data => {
                            this.hasToken = true;
                            this.tokenType = data.token_type;
                            this.expiresIn = data.expires_in;
                            this.token = data.access_token;
                            this.refreshToken = data.refresh_token;
                        }, (errors) => {
                            this.errors = errors;
                        });


                }, (errors) => {
                    this.errors = errors;
                });
        }
    }

    copyText(text: string): void {
        this.clipboard.copy(text);
    }

    ngOnDestroy(): void {
    }

}

