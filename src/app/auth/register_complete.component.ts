import {Component, OnDestroy, OnInit, ViewChild, ElementRef} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {HttpService} from '../shared/services/http.service';
import {TranslocoService} from '@ngneat/transloco';

@Component({
    selector: 'registercomplete',
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
    }

    ngOnDestroy(): void {
    }

}
