import {Component, OnDestroy, OnInit, ViewChild, ElementRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {HttpService} from '../shared/services/http.service';
import {TranslocoService} from '@ngneat/transloco';

declare const gtag: Function;

@Component({
    selector: 'home',
    templateUrl: './register_complete.component.html'
})

export class RegisterCompleteComponent implements OnInit, OnDestroy {

    constructor(
        private httpService: HttpService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private _translocoService: TranslocoService
    ) {
        this._translocoService.setActiveLang('en');
    }

    ngOnInit(): void {
        gtag('event', 'page_view', {
            'page_title': 'Sign up Complete',
            'page_location': 'register-complete',
            'page_path': 'register-complete',
            'send_to': 'AW-11075928554'
        });

    }

    ngOnDestroy(): void {
    }

}
