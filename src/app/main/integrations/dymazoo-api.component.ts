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
import {EntityDatasource} from '../../shared/entity-datasource';
import {MatPaginator} from '@angular/material/paginator';
import {takeUntil} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';
import {Summary} from '../../shared/models/summary';

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

    public displayedSummaryColumns = ['message', 'createdAt'];
    public summaryDataSource: EntityDatasource | null;
    public paginatedSummaryDataSource;
    public selectedSummaryRow: {};
    public selectedSummaryIndex: number = -1;

    public summary: any[];

    canClientAdmin = false;
    userSubscription: Subscription;

    public errors = [];

    private _unsubscribeAll: Subject<any>;
    private touchStart = 0;

    @ViewChild('getRefreshToken') getRefreshElement: ElementRef;
    @ViewChild('summaryPaginator', {read: MatPaginator}) summaryPaginator: MatPaginator;

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
        this.summaryDataSource = new EntityDatasource(
            this.httpService,
            'api-summary',
            'dymazoo-api'
        );

        this.summaryDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(summary => {
                if (summary instanceof Array) {
                    this.summary = summary;
                    if (summary.length > 0) {
                        this.paginatedSummaryDataSource = new MatTableDataSource<Summary>(summary);
                        this.paginatedSummaryDataSource.paginator = this.summaryPaginator;
                    }
                }
            });
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

    onSummarySelect(row, index): void {
        if (this.touchStart === 0) {
            this.touchStart = new Date().getTime();
        } else {
            if (new Date().getTime() - this.touchStart < 400) {
                this.touchStart = 0;
                this.onSelectSummary();
            } else {
                this.touchStart = new Date().getTime();
            }
        }
        const realIndex = index;
        this.selectedSummaryRow = row;
        this.selectedSummaryIndex = realIndex;
    }

    onSummaryArrowDown(): void {
        const data = this.paginatedSummaryDataSource.data;
        if (data[this.selectedSummaryIndex + 1]) {
            this.selectedSummaryRow = data[this.selectedSummaryIndex + 1];
            this.selectedSummaryIndex = this.selectedSummaryIndex + 1;
        }
    }

    onSummaryArrowUp(): void {
        const data = this.paginatedSummaryDataSource.data;
        if (data[this.selectedSummaryIndex - 1]) {
            this.selectedSummaryRow = data[this.selectedSummaryIndex - 1];
            this.selectedSummaryIndex = this.selectedSummaryIndex - 1;
        }
    }

    onSelectSummary(): void {

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

