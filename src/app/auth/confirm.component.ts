import {Component} from '@angular/core';
import {HttpService} from '../shared/services/http.service';
import {Router, ActivatedRoute} from '@angular/router';
import {FuseConfigService} from '@fuse/services/config';
import {TranslocoService} from '@ngneat/transloco';

@Component({
    selector: 'home',
    templateUrl: 'confirm.component.html'
})
export class ConfirmComponent {

    clientId: string;
    errors = [];

    constructor(private _fuseConfigService: FuseConfigService,
                private router: Router,
                private activatedRoute: ActivatedRoute,
                private httpService: HttpService,
                private _translocoService: TranslocoService
    ) {
        this._translocoService.setActiveLang('en');

        activatedRoute.params.subscribe((param: any) => {
            this.clientId = param['clientId'];
            this.errors = [];

            this.httpService.confirmRegistration({clientId: this.clientId})
                .subscribe(data => {

                }, (errors) => {
                    this.errors = errors;
                });
        });
    }
}

