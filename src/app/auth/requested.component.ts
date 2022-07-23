import {Component} from '@angular/core';
import {HttpService} from '../shared/services/http.service';
import {Router, ActivatedRoute} from '@angular/router';
import {FuseConfigService} from '@fuse/services/config';
import {TranslocoService} from '@ngneat/transloco';

@Component({
    selector: 'home',
    templateUrl: 'requested.component.html'
})
export class RequestedComponent {

    clientId: string;
    errors = [];

    constructor(private _fuseConfigService: FuseConfigService,
                private router: Router,
                private activatedRoute: ActivatedRoute,
                private httpService: HttpService,
                private _translocoService: TranslocoService
    ) {
        this._translocoService.setActiveLang('en');

    }
}

