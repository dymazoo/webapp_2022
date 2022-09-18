import {
    Component,
    OnDestroy,
    OnInit,
    Inject,
    EventEmitter,
    Output,
    ViewChild,
    ViewEncapsulation,
    ElementRef
} from '@angular/core';
import {Location} from '@angular/common';
import {FormBuilder, FormGroup, FormArray, FormControl, Validators} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable, Subject, Subscription} from 'rxjs';

import {HttpService} from '../../shared/services/http.service';
import {AbandonDialogService} from '../../shared/services/abandon-dialog.service';
import {fuseAnimations} from '@fuse/animations';
import {Clipboard} from '@angular/cdk/clipboard';

@Component({
    selector: 'dymazoo-api',
    templateUrl: './dymazoo-api.component.html',
    animations: fuseAnimations
})

export class DymazooApiComponent implements OnInit, OnDestroy {

    public doRefresh: boolean = false;
    public getRefreshToken: string;
    public secret: string;
    public token: string;
    public tokenType: string;
    public expiresIn: string;
    public refreshToken: string;
    public hasToken: boolean = false;

    public refreshForm: FormGroup;

    canClientAdmin = false;
    userSubscription: Subscription;

    public errors = [];

    private _unsubscribeAll: Subject<any>;
    private touchStart = 0;

    @ViewChild('getRefreshToken') getRefreshElement: ElementRef;

    constructor(
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        private abandonDialogService: AbandonDialogService,
        private _translocoService: TranslocoService,
        private _snackBar: MatSnackBar,
        private router: Router,
        private location: Location,
        private clipboard: Clipboard,
    ) {
        this._translocoService.setActiveLang('en');
        this._unsubscribeAll = new Subject();

        // Check permissions
        this.canClientAdmin = this.httpService.hasPermission('client_admin');

        this.refreshForm = this._formBuilder.group({
            getRefreshToken: [this.getRefreshToken, Validators.required]
        });

    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    onBack(): void {
        this.location.back();
    }

    startRefresh(): void {
        this.doRefresh = true;
        setTimeout(() => {
            this.getRefreshElement.nativeElement.focus();
        }, 100);
    }

    onRefresh(): void {
        this.doRefresh = false;
        this.getRefreshToken = this.refreshForm.controls['getRefreshToken'].value;
        this.httpService.saveEntity('dymazoo-oauth-secret', {})
            .subscribe(data => {
                this.secret = data.secret;
                const tokenData = {
                    'refresh_token': this.getRefreshToken,
                    'client_id': 1,
                    'client_secret': this.secret,
                    'grant_type': 'refresh_token'
                };
                this.httpService.getOAuthToken(tokenData)
                    .subscribe(data => {
                        this.hasToken = true;
                        this.tokenType = data.token_type;
                        this.token = data.access_token;
                        this.expiresIn = data.expires_in;
                        this.refreshToken = data.refresh_token;
                    }, (errors) => {
                        this.errors = errors;
                    });


            }, (errors) => {
                this.errors = errors;
            });

    }

    copyText(text: string): void {
        this.clipboard.copy(text);
    }

    clearErrors(): void {
        this.errors = [];
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        return returnVal;
    }

}

