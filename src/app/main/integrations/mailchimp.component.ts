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
import {List} from '../../shared/models/list';
import {Campaign} from '../../shared/models/campaign';
import {takeUntil} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';
import {SourceSetting} from '../../shared/models/sourceSetting';

@Component({
    selector: 'mailchimp',
    templateUrl: './mailchimp.component.html',
    animations: fuseAnimations
})

export class MailchimpComponent implements OnInit, OnDestroy {
    public displayedListColumns = ['description', 'count'];
    public listsDataSource: EntityDatasource | null;
    public paginatedListsDataSource;
    public selectedListsRow: {};
    public selectedListsIndex: number = -1;

    public displayedCampaignColumns = ['description', 'campaignDate', 'sent'];
    public campaignDataSource: EntityDatasource | null;
    public paginatedCampaignsDataSource;
    public selectedCampaignsRow: {};
    public selectedCampaignsIndex: number = -1;

    public campaigns: any[];
    public lists: any[];
    canClientAdmin = false;
    userSubscription: Subscription;
    syncListsTitle = 'Sync Lists';
    syncCampaignsTitle = 'Sync Campaigns';

    public errors = [];

    private _unsubscribeAll: Subject<any>;
    private touchStart = 0;

    @ViewChild('listPaginator', { read: MatPaginator }) listPaginator: MatPaginator;
    @ViewChild('listTable', { read: MatSort, static: true }) listSort: MatSort;
    @ViewChild('listFilter') listFilterElement: ElementRef;

    @ViewChild('campaignPaginator', { read: MatPaginator }) campaignPaginator: MatPaginator;
    @ViewChild('campaignTable', { read: MatSort, static: true }) campaignSort: MatSort;
    @ViewChild('campaignFilter') campaignFilterElement: ElementRef;

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
        this.listsDataSource = new EntityDatasource(
            this.httpService,
            'lists',
            ''
        );

        this.listsDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(lists => {
                if (lists instanceof Array) {
                    this.lists = lists;
                    if (lists.length > 0) {
                        this.paginatedListsDataSource = new MatTableDataSource<SourceSetting>(lists);
                        this.paginatedListsDataSource.paginator = this.listPaginator;
                        this.paginatedListsDataSource.sort = this.listSort;
                        this.paginatedListsDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedListsDataSource.filterPredicate =
                            (data: List, filter: string) => this.listsFilterPredicate(data, filter);
                        this.listFilterElement.nativeElement.focus();
                    }
                }
            });

        this.campaignDataSource = new EntityDatasource(
            this.httpService,
            'campaigns',
            ''
        );

        this.campaignDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(campaigns => {
                if (campaigns instanceof Array) {
                    this.campaigns = campaigns;
                    if (campaigns.length > 0) {
                        this.paginatedCampaignsDataSource = new MatTableDataSource<SourceSetting>(campaigns);
                        this.paginatedCampaignsDataSource.paginator = this.campaignPaginator;
                        this.paginatedCampaignsDataSource.sort = this.campaignSort;
                        this.paginatedCampaignsDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedCampaignsDataSource.filterPredicate =
                            (data: List, filter: string) => this.campaignsFilterPredicate(data, filter);
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

    listsFilterPredicate(data: List, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.description.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onListSelect(row, index): void {
        if (this.touchStart === 0) {
            this.touchStart = new Date().getTime();
        } else {
            if (new Date().getTime() - this.touchStart < 400) {
                this.touchStart = 0;
                this.onSelectList();
            } else {
                this.touchStart = new Date().getTime();
            }
        }
        const realIndex = (this.listPaginator.pageIndex * this.listPaginator.pageSize) + index;
        this.selectedListsRow = row;
        this.selectedListsIndex = realIndex;
    }

    onListArrowDown(): void {
        const pageEnd = ((this.listPaginator.pageIndex + 1) * this.listPaginator.pageSize) - 1;
        const sortedData = this.paginatedListsDataSource.sortData(this.paginatedListsDataSource.filteredData, this.paginatedListsDataSource.sort);
        if (this.selectedListsIndex < pageEnd && sortedData[this.selectedListsIndex + 1]) {
            this.selectedListsRow = sortedData[this.selectedListsIndex + 1];
            this.selectedListsIndex = this.selectedListsIndex + 1;
        }
    }

    onListArrowUp(): void {
        const pageStart = (this.listPaginator.pageIndex * this.listPaginator.pageSize);
        const sortedData = this.paginatedListsDataSource.sortData(this.paginatedListsDataSource.filteredData, this.paginatedListsDataSource.sort);
        if (this.selectedListsIndex > pageStart && sortedData[this.selectedListsIndex - 1]) {
            this.selectedListsRow = sortedData[this.selectedListsIndex - 1];
            this.selectedListsIndex = this.selectedListsIndex - 1;
        }
    }

    onSelectList(): void {

    }

    campaignsFilterPredicate(data: Campaign, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.description.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onCampaignSelect(row, index): void {
        if (this.touchStart === 0) {
            this.touchStart = new Date().getTime();
        } else {
            if (new Date().getTime() - this.touchStart < 400) {
                this.touchStart = 0;
                this.onSelectCampaign();
            } else {
                this.touchStart = new Date().getTime();
            }
        }
        const realIndex = (this.campaignPaginator.pageIndex * this.campaignPaginator.pageSize) + index;
        this.selectedCampaignsRow = row;
        this.selectedCampaignsIndex = realIndex;
    }

    onCampaignArrowDown(): void {
        const pageEnd = ((this.campaignPaginator.pageIndex + 1) * this.campaignPaginator.pageSize) - 1;
        const sortedData = this.paginatedCampaignsDataSource.sortData(this.paginatedCampaignsDataSource.filteredData, this.paginatedCampaignsDataSource.sort);
        if (this.selectedCampaignsIndex < pageEnd && sortedData[this.selectedCampaignsIndex + 1]) {
            this.selectedCampaignsRow = sortedData[this.selectedCampaignsIndex + 1];
            this.selectedCampaignsIndex = this.selectedCampaignsIndex + 1;
        }
    }

    onCampaignArrowUp(): void {
        const pageStart = (this.campaignPaginator.pageIndex * this.campaignPaginator.pageSize);
        const sortedData = this.paginatedCampaignsDataSource.sortData(this.paginatedCampaignsDataSource.filteredData, this.paginatedCampaignsDataSource.sort);
        if (this.selectedCampaignsIndex > pageStart && sortedData[this.selectedCampaignsIndex - 1]) {
            this.selectedCampaignsRow = sortedData[this.selectedCampaignsIndex - 1];
            this.selectedCampaignsIndex = this.selectedCampaignsIndex - 1;
        }
    }

    onSelectCampaign(): void {

    }


    clearErrors(): void {
        this.errors = [];
    }

    syncLists(): void {
        this.syncListsTitle = 'Syncing ...';
        this.httpService.getEntity('sync-lists', 'mailchimp')
            .subscribe(result => {
                this.listsDataSource.refresh();
                this.syncListsTitle = 'Sync Lists';
            }, (errors) => {
                this.errors = errors;
            });
    }

    syncMembers(): void {
        this.httpService.getEntity('sync-list-members', 'mailchimp')
            .subscribe(result => {
                this._snackBar.open('Member Synchronisation Scheduled', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
            }, (errors) => {
                this._snackBar.open('Unable to Schedule Member Synchronisation', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-red']
                });
            });
    }

    syncCampaigns(): void {
        this.syncCampaignsTitle = 'Syncing ...';
        this.httpService.getEntity('sync-campaigns', 'mailchimp')
            .subscribe(result => {
                this.campaignDataSource.refresh();
                this.syncCampaignsTitle = 'Sync Campaigns';
            }, (errors) => {
                this.errors = errors;
            });
    }

    syncActivity(): void {
        this.httpService.getEntity('sync-activity', 'mailchimp')
            .subscribe(result => {
                this._snackBar.open('Activity Synchronisation Scheduled', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
            }, (errors) => {
            });
    }

    public filterLists = (value: string) => {
        this.paginatedListsDataSource.filter = value.trim().toLocaleLowerCase();
    }

    public filterCampaigns = (value: string) => {
        this.paginatedCampaignsDataSource.filter = value.trim().toLocaleLowerCase();
    }

}

