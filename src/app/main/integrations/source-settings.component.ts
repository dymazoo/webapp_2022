import {
    Component,
    OnDestroy,
    OnInit,
    AfterViewInit,
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
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';

import {MatSnackBar} from '@angular/material/snack-bar';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {Observable, Subject, Subscription} from 'rxjs';

import {HttpService} from '../../shared/services/http.service';
import {AbandonDialogService} from '../../shared/services/abandon-dialog.service';
import {EntityDatasource} from '../../shared/entity-datasource';
import {SourceSetting} from '../../shared/models/sourceSetting';
import {SourceSettingValue} from '../../shared/models/sourceSettingValue';
import {DataSources} from '../../shared/models/sources/data-sources';
import {takeUntil} from 'rxjs/operators';
import {fuseAnimations} from '@fuse/animations';
import {Layout} from '../../shared/models/layout';

@Component({
    selector: 'sourceSettings',
    templateUrl: './source-settings.component.html',
    styleUrls: ['./source-settings.component.scss'],
    animations: fuseAnimations
})

export class SourceSettingsComponent implements OnInit, OnDestroy, AfterViewInit {
    public displayedColumns = ['description', 'action'];
    public sourceSettingsDataSource: EntityDatasource | null;
    public paginatedDataSource;
    public sourceSettings: any[];
    public selectedRow: {};
    public selectedIndex: number = -1;
    public dataSourcesAvailableDescriptions: any[] = [];
    public addingDataSource: boolean = false;
    public defaultAddDataSource: string = '';
    public errors = [];

    private _unsubscribeAll: Subject<any>;
    private touchStart = 0;
    private dataSourcesAvailableDescriptionsSubscription: Subscription;
    private dataSourcesGetSourceSavedSubscription: Subscription;
    private dataSourcesErrorSubscription: Subscription;
    private appUrl = '';

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filterElement: ElementRef;

    constructor(
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        private abandonDialogService: AbandonDialogService,
        private _translocoService: TranslocoService,
        public dialog: MatDialog,
        private _snackBar: MatSnackBar,
        private router: Router,
        private location: Location,
        private dataSources: DataSources
    ) {
        this._translocoService.setActiveLang('en');
        this._unsubscribeAll = new Subject();

        this.dataSourcesAvailableDescriptionsSubscription = this.dataSources.getAvailableSourceDescriptions().subscribe(dataSourcesAvailableDescriptions => {
            this.dataSourcesAvailableDescriptions = dataSourcesAvailableDescriptions;
            if (this.dataSourcesAvailableDescriptions.length > 0) {
                const defaultActiveDescription = this.dataSourcesAvailableDescriptions[0];
                this.defaultAddDataSource = defaultActiveDescription.name;
            }
        });

        this.dataSourcesErrorSubscription = this.dataSources.getErrors().subscribe(dataSourcesErrors => {
            this.errors = dataSourcesErrors;
        });

        this.dataSourcesGetSourceSavedSubscription = this.dataSources.getSourceSaved().subscribe(refresh => {
            if (this.sourceSettingsDataSource) {
                this._snackBar.open('Data Source added', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
                this.sourceSettingsDataSource.refresh();
            }
        });
    }

    ngOnInit(): void {
        this.sourceSettingsDataSource = new EntityDatasource(
            this.httpService,
            'source-settings',
            ''
        );
        this.dataSources.getCurrentDescriptions();
        this.appUrl = this.httpService.getAppUrl();
    }

    ngAfterViewInit(): void {
        this.sourceSettingsDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(sourceSettings => {
                if(sourceSettings instanceof Array) {
                    this.sourceSettings = sourceSettings;
                    this.sourceSettings.forEach(setting => {
                        setting.action = '';
                    });
                    if (sourceSettings.length > 0) {
                        this.paginatedDataSource = new MatTableDataSource<SourceSetting>(sourceSettings);
                        this.paginatedDataSource.paginator = this.paginator;
                        this.paginatedDataSource.sort = this.sort;
                        this.paginatedDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedDataSource.filterPredicate =
                            (data: SourceSetting, filter: string) => this.sourceSettingsFilterPredicate(data, filter);
                        this.filterElement.nativeElement.focus();
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

    sourceSettingsFilterPredicate (data: SourceSetting, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.description.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onSelect(row, index): void {
        if (this.touchStart === 0) {
            this.touchStart = new Date().getTime();
        } else {
            if (new Date().getTime() - this.touchStart < 400) {
                this.touchStart = 0;
                this.onSelectSourceSetting(this.selectedRow);
            } else {
                this.touchStart = new Date().getTime();
            }
        }
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
    }

    onArrowDown(): void {
        const pageEnd = ((this.paginator.pageIndex + 1) * this.paginator.pageSize) - 1;
        const sortedData = this.paginatedDataSource.sortData(this.paginatedDataSource.filteredData, this.paginatedDataSource.sort);
        if (this.selectedIndex < pageEnd && sortedData[this.selectedIndex + 1]) {
            this.selectedRow = sortedData[this.selectedIndex + 1];
            this.selectedIndex = this.selectedIndex + 1;
        }
    }

    onArrowUp(): void {
        const pageStart = (this.paginator.pageIndex * this.paginator.pageSize);
        const sortedData = this.paginatedDataSource.sortData(this.paginatedDataSource.filteredData, this.paginatedDataSource.sort);
        if (this.selectedIndex > pageStart && sortedData[this.selectedIndex - 1]) {
            this.selectedRow = sortedData[this.selectedIndex - 1];
            this.selectedIndex = this.selectedIndex - 1;
        }
    }

    onSelectSourceSetting(row): void {
        const selectedSourceSetting = new SourceSetting(row);
        const dialogRef = this.dialog.open(SourceSettingsValuesDialogComponent, {
            width: '70%',
            minWidth: '1000px',
            data: {'sourceSetting' : selectedSourceSetting}
        });

        dialogRef.afterClosed().subscribe(settingResult => {
            if (settingResult.refresh) {
                this.sourceSettingsDataSource.refresh();
            }
            if (settingResult.saved) {
                this._snackBar.open('Source settings saved', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
            }
        });
    }

    removeSource(row): void {
        const id = row.id;
        this.httpService.deleteEntity('source-setting', id)
            .subscribe((deleteResult) => {
                this.sourceSettingsDataSource.refresh();
                this.dataSources.getCurrentDescriptions();
                this._snackBar.open('Data Source removed', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
            }, (errors) => {
                this.errors = errors;
            });
    }

    clearErrors(): void {
        this.errors = [];
    }

    addingSource(): void {
        this.addingDataSource = true;
    }

    addSource(newSource): void {
        if (newSource.value) {
            const sourceName = newSource.value;
            this.dataSources.addSourceSetting(sourceName);
            this.addingDataSource = false;
        }
    }

    public filterSources = (value: string) => {
        this.paginatedDataSource.filter = value.trim().toLocaleLowerCase();
    }
}

@Component({
    selector: 'source-settings-values-dialog',
    templateUrl: 'source-settings-values.dialog.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class SourceSettingsValuesDialogComponent implements OnInit, OnDestroy {

    public sourceSettingsForm: FormGroup;
    public errors = [];
    private _unsubscribeAll: Subject<any>;
    private appUrl = '';
    public sourceSetting: SourceSetting;
    public sourceSettingValues: [];
    public oAuthInProgress: boolean = false;

    constructor(
        public dialogRef: MatDialogRef<SourceSettingsValuesDialogComponent>,
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this._unsubscribeAll = new Subject();
        this.sourceSetting = data.sourceSetting;
        this.appUrl = this.httpService.getAppUrl();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    ngOnInit(): void {
        this.sourceSettingsForm = this._formBuilder.group({
            'id': [{value: ''}],
            'description': [{value: '', disabled: true}, Validators.required],
            'enabled': [{value: ''}],
            'default': [{value: ''}],
            'values': this._formBuilder.array([]),
        }, {});

        setTimeout(() => {
            this.populateForm();
        });

    }

    populateForm(): void {
        this.sourceSettingsForm.controls['description'].setValue(this.sourceSetting.description);
        this.sourceSettingsForm.controls['enabled'].setValue(this.sourceSetting.enabled);
        this.sourceSettingsForm.controls['default'].setValue(this.sourceSetting.default);
        this.setValues();
    }

    getValueControls(): any {
        return (this.sourceSettingsForm.controls['values'] as FormArray).controls;
    }

    private setValues(): void {
        const valuesLength = (this.sourceSettingsForm.controls['values'] as FormArray).length;
        let i = 0;
        while (i < valuesLength) {
            (this.sourceSettingsForm.controls['values'] as FormArray).removeAt(0);
            i++;
        }
        (this.sourceSettingsForm.controls['values'] as FormArray).reset();

        this.sourceSetting.values.forEach(value => {
            if (this.sourceSetting.name === 'eventbrite' && value.name === 'access_token') {
                let apiDisplay = 'Access not yet approved';
                let oauthRequired = 1;
                if (value.value.length > 0) {
                    apiDisplay = 'Access approved';
                    oauthRequired = 0;
                }
                this.httpService.getEntity('eventbrite-client-id', '')
                    .subscribe(result => {
                        const eventbriteData = result;
                        const oauthUrl = 'https://' + eventbriteData.url + '/oauth/authorize?response_type=code&client_id=' + eventbriteData.id + '&redirect_uri=' + this.appUrl + '/integrations/eventbrite-approve-api';
                        (this.sourceSettingsForm.controls['values'] as FormArray).push(this._formBuilder.group({
                            id: [value.id],
                            description: [this.prettyName(value.name)],
                            name: [value.name],
                            value: apiDisplay,
                            automatic: [value.automatic],
                            oauth: oauthRequired,
                            oauth_url: oauthUrl
                        }));
                    }, (errors) => {
                        this.errors = errors;
                    });


            } else {
                (this.sourceSettingsForm.controls['values'] as FormArray).push(this._formBuilder.group({
                    id: [value.id],
                    description: [this.prettyName(value.name)],
                    name: [value.name],
                    value: [value.value],
                    automatic: [value.automatic],
                    oauth: 0
                }));
            }
        });
    }

    prettyName(valueName): string {
        valueName = valueName.replace(/_/gi, ' ');
        valueName = valueName.charAt(0).toUpperCase() + valueName.slice(1);
        return valueName;
    }

    addSetting(): void {
        const sourceSettingValue = new SourceSettingValue();
        (this.sourceSettingsForm.controls['values'] as FormArray).push(this._formBuilder.group({
            id: [sourceSettingValue.id],
            description: [this.prettyName(sourceSettingValue.name)],
            name: [sourceSettingValue.name],
            value: [sourceSettingValue.value],
            automatic: [sourceSettingValue.automatic],
        }));
    }

    removeSetting(index): void {
        if ((this.sourceSettingsForm.controls['values'] as FormArray).controls[index]) {
            (this.sourceSettingsForm.controls['values'] as FormArray).removeAt(index);
        }
    }

    doAuth(url): void {
        window.open(url);
        this.dialogRef.close({'saved': true, 'refresh': true});
    }

    save(): void {
        this.errors = [];

        this.sourceSetting.enabled = this.sourceSettingsForm.controls['enabled'].value;
        let actualDefault = 0;
        if (this.sourceSettingsForm.controls['default'].value){
            actualDefault = 1;
        }

        this.sourceSetting.default = actualDefault;

        const sourceSettingValueControls = (this.sourceSettingsForm.controls['values'] as FormArray).controls;
        this.sourceSetting.values = [];
        let sourceSettingValue;
        sourceSettingValueControls.forEach((sourceSettingValueControl, index) => {
            if (this.sourceSetting.name !== 'eventbrite' || sourceSettingValueControl.value.name !== 'api_key') {
                sourceSettingValue = new SourceSettingValue({
                    id: sourceSettingValueControl.value.id, name: sourceSettingValueControl.value.name,
                    value: sourceSettingValueControl.value.value, automatic: sourceSettingValueControl.value.automatic
                });
                this.sourceSetting.values.push(sourceSettingValue);
            }
        });

        this.httpService.saveEntity('source-setting', this.sourceSetting)
            .subscribe((data: Response) => {
                this.sourceSettingsForm.markAsPristine();
                this.dialogRef.close({'saved': true, 'refresh': true});
            }, (errors) => {
                this.errors = errors;
            });
    }

    onCancel(): void {
        this.dialogRef.close({'saved': false, 'refresh': false});
    }

    onClose(): void {
        this.dialogRef.close({'saved': false, 'refresh': true});
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        return returnVal;
    }
}

