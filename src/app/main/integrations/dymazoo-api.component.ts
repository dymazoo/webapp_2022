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
import {EntityDatasource} from '../../shared/entity-datasource';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {takeUntil} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';
import {SourceSetting} from '../../shared/models/sourceSetting';
import {Audit} from '../../shared/models/audit';


@Component({
    selector: 'dymazoo-api',
    templateUrl: './dymazoo-api.component.html',
    animations: fuseAnimations
})

export class DymazooApiComponent implements OnInit, OnDestroy {

    @ViewChild('auditPaginator', { read: MatPaginator }) auditPaginator: MatPaginator;
    @ViewChild('auditTable', { read: MatSort, static: true }) auditSort: MatSort;
    @ViewChild('auditFilter') auditFilterElement: ElementRef;

    public displayedAuditColumns = ['description', 'count', 'date'];
    public auditsDataSource: EntityDatasource | null;
    public paginatedAuditsDataSource;
    public selectedAuditsRow: {};
    public selectedAuditsIndex: number = -1;
    public doRefresh: boolean = false;
    public getRefreshToken: string;
    public secret: string;
    public token: string;
    public tokenType: string;
    public expiresIn: string;
    public refreshToken: string;
    public hasToken: boolean = false;

    public refreshForm: FormGroup;

    public audits: any[];
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
        this.auditsDataSource = new EntityDatasource(
            this.httpService,
            'audits',
            ''
        );

        this.auditsDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(audits => {
                if (audits instanceof Array) {
                    this.audits = audits;
                    if (audits.length > 0) {
                        this.paginatedAuditsDataSource = new MatTableDataSource<SourceSetting>(audits);
                        this.paginatedAuditsDataSource.paginator = this.auditPaginator;
                        this.paginatedAuditsDataSource.sort = this.auditSort;
                        this.paginatedAuditsDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedAuditsDataSource.filterPredicate =
                            (data: Audit, filter: string) => this.auditsFilterPredicate(data, filter);
                        this.auditFilterElement.nativeElement.focus();
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

    auditsFilterPredicate(data: Audit, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.description.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onAuditSelect(row, index): void {
        if (this.touchStart === 0) {
            this.touchStart = new Date().getTime();
        } else {
            if (new Date().getTime() - this.touchStart < 400) {
                this.touchStart = 0;
                this.onSelectAudit();
            } else {
                this.touchStart = new Date().getTime();
            }
        }
        const realIndex = (this.auditPaginator.pageIndex * this.auditPaginator.pageSize) + index;
        this.selectedAuditsRow = row;
        this.selectedAuditsIndex = realIndex;
    }

    onAuditArrowDown(): void {
        const pageEnd = ((this.auditPaginator.pageIndex + 1) * this.auditPaginator.pageSize) - 1;
        const sortedData = this.paginatedAuditsDataSource.sortData(this.paginatedAuditsDataSource.filteredData, this.paginatedAuditsDataSource.sort);
        if (this.selectedAuditsIndex < pageEnd && sortedData[this.selectedAuditsIndex + 1]) {
            this.selectedAuditsRow = sortedData[this.selectedAuditsIndex + 1];
            this.selectedAuditsIndex = this.selectedAuditsIndex + 1;
        }
    }

    onAuditArrowUp(): void {
        const pageStart = (this.auditPaginator.pageIndex * this.auditPaginator.pageSize);
        const sortedData = this.paginatedAuditsDataSource.sortData(this.paginatedAuditsDataSource.filteredData, this.paginatedAuditsDataSource.sort);
        if (this.selectedAuditsIndex > pageStart && sortedData[this.selectedAuditsIndex - 1]) {
            this.selectedAuditsRow = sortedData[this.selectedAuditsIndex - 1];
            this.selectedAuditsIndex = this.selectedAuditsIndex - 1;
        }
    }

    onSelectAudit(): void {

    }

    clearErrors(): void {
        this.errors = [];
    }

    public filterAudits = (value: string) => {
        this.paginatedAuditsDataSource.filter = value.trim().toLocaleLowerCase();
    };

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        return returnVal;
    }

}

