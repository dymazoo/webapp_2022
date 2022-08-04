import {
    Component,
    OnDestroy,
    OnInit,
    Inject,
    EventEmitter,
    Output,
    ViewChildren,
    QueryList,
    ElementRef,
    AfterViewInit, ViewChild
} from '@angular/core';
import {Location} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, FormControl, Validators} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {TranslocoService} from '@ngneat/transloco';
import {fuseAnimations} from '@fuse/animations';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable, Subject} from 'rxjs';
import { assign, cloneDeep } from 'lodash-es';

import {HttpService} from 'app/shared/services/http.service';
import {AbandonDialogService} from 'app/shared/services/abandon-dialog.service';
import {EntityDatasource} from 'app/shared/entity-datasource';
import {Preference} from 'app/shared/models/preference';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {takeUntil} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';

@Component({
    selector: 'preferences',
    templateUrl: './preferences.component.html',
    animations: fuseAnimations
})

export class PreferencesComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filterElement: ElementRef;

    public displayedColumns = ['label',  'value', 'sequence','type'];
    public preferenceDataSource: EntityDatasource | null;
    public paginatedDataSource;
    public preferences: any;
    public currentPreference: Preference;
    public selectedPreference: Preference;
    public selectedRow: Record<string, unknown>;
    public selectedIndex: number = -1;
    public errors = [];

    private touchStart = 0;
    private _unsubscribeAll: Subject<any>;

    constructor(
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        private abandonDialogService: AbandonDialogService,
        private _translocoService: TranslocoService,
        public dialog: MatDialog,
        private _snackBar: MatSnackBar,
        private router: Router,
        private location: Location
    ) {
        this._translocoService.setActiveLang('en');
        this._unsubscribeAll = new Subject();

    }

    ngOnInit(): void {
        this.preferenceDataSource = new EntityDatasource(
            this.httpService,
            'settings',
            ''
        );

        this.preferenceDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((preferences) => {
                if (preferences instanceof Array) {
                    this.preferences = preferences;
                    if (preferences.length > 0) {
                        this.paginatedDataSource = new MatTableDataSource<Preference>(preferences);
                        this.paginatedDataSource.paginator = this.paginator;
                        this.paginatedDataSource.sort = this.sort;
                        this.paginatedDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toString().toLocaleLowerCase();
                        this.paginatedDataSource.filterPredicate =
                            (data: Preference, filter: string) => this.preferencesFilterPredicate(data, filter);
                        this.filterElement.nativeElement.focus();
                    }
                }
            });
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    preferencesFilterPredicate(data: Preference, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.label.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onChangeShow(row, index): void {
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedPreference = new Preference(row);
        if (this.selectedPreference.value === '1') {
            this.selectedPreference.value = '0';
        } else {
            this.selectedPreference.value = '1';
        }
        this.updatePreference(this.selectedPreference);
    }

    onSequenceUp(row, index, jump): void {
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedPreference = new Preference(row);
        this.selectedPreference.sequence -= jump;
        if (this.selectedPreference.sequence < 1) {
            this.selectedPreference.sequence = 1;
        }
        this.updatePreference(this.selectedPreference);
    }

    onSequenceDown(row, index, jump): void {
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedPreference = new Preference(row);
        this.selectedPreference.sequence += jump;
        if (this.selectedPreference.sequence > 99) {
            this.selectedPreference.sequence = 99;
        }
        this.updatePreference(this.selectedPreference);
    }

    onTypeChange(row, index): void {
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedPreference = new Preference(row);
        if (this.selectedPreference.type === 'donut') {
            this.selectedPreference.type = 'bar';
        } else if (this.selectedPreference.type === 'bar') {
            this.selectedPreference.type = 'line';
        } else {
            this.selectedPreference.type = 'donut';
        }

        this.updatePreference(this.selectedPreference);
    }

    updatePreference(preference): void {
        this.errors = [];
        this.httpService.saveEntity('setting', preference)
            .subscribe((data: Response) => {
                this.preferenceDataSource.refresh();
            }, (errors) => {
                this.errors = errors;
                this.preferenceDataSource.refresh();
            });

    }

    onSelect(row, index): void {
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedPreference = new Preference(row);

    }

    onConfirm(): void {
        this.currentPreference = cloneDeep(this.selectedPreference);
        const dialogRef = this.dialog.open(PreferenceDialogComponent, {
            minWidth: '50%',
            data: {'preference': this.currentPreference}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result.action === 'save') {
                this.errors = [];
                this.httpService.saveEntity('setting', result.preference)
                    .subscribe((data: Response) => {
                        this._snackBar.open('Preference saved', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });
                        this.preferenceDataSource.refresh();
                    }, (errors) => {
                        this.errors = errors;
                        this.preferenceDataSource.refresh();
                    });

            }
        });

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

    public filterPreferences = (value: string) => {
        this.paginatedDataSource.filter = value.trim().toLocaleLowerCase();
    };

    onBack(): void {
        this.location.back();
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        return true;
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        if (control.hasError('email')) {
            returnVal = name + ' is invalid!';
        }
        return returnVal;
    }
}

@Component({
    selector: 'preference-dialog',
    templateUrl: 'preference.dialog.html',
})
export class PreferenceDialogComponent implements OnInit {

    public preferenceForm: FormGroup;
    public formErrors: string[] = [];
    public errors = [];
    public currentPreference;

    constructor(
        public dialogRef: MatDialogRef<PreferenceDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.currentPreference = data.preference;
    }

    ngOnInit(): void {
        this.preferenceForm = this._formBuilder.group({
            'label': [{value: '', disabled: true}, Validators.required],
            'value': [{value: 0}],
            'sequence': [{value: 0}, Validators.required],
            'type': [{value: 'bar'}, Validators.required],
        }, {});
        this.populateForm();
    }

    populateForm(): void {
        this.preferenceForm.controls['label'].setValue(this.currentPreference.label);
        this.preferenceForm.controls['value'].setValue(this.currentPreference.value);
        this.preferenceForm.controls['sequence'].setValue(this.currentPreference.sequence);
        this.preferenceForm.controls['type'].setValue(this.currentPreference.type);
    }

    onSave(): void {
        this.currentPreference.label = this.preferenceForm.controls['label'].value;
        this.currentPreference.value = this.preferenceForm.controls['value'].value;
        this.currentPreference.sequence = this.preferenceForm.controls['sequence'].value;
        this.currentPreference.type = this.preferenceForm.controls['type'].value;
        this.dialogRef.close({action: 'save', preference: this.currentPreference});
    }

    onCancel(): void {
        this.dialogRef.close({action: 'cancel'});
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        return returnVal;
    }
}

