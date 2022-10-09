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
import {Summary} from '../../shared/models/summary';


@Component({
    selector: 'zapier',
    templateUrl: './zapier.component.html',
    animations: fuseAnimations
})

export class ZapierComponent implements OnInit, OnDestroy {
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

    @ViewChild('summaryPaginator', {read: MatPaginator}) summaryPaginator: MatPaginator;

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
    }

    ngOnInit(): void {
        this.summaryDataSource = new EntityDatasource(
            this.httpService,
            'api-summary',
            'zapier'
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

}

