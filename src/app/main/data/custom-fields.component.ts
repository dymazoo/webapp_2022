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
import {CustomField} from 'app/shared/models/customField';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {takeUntil} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';
import {ConfirmDialogComponent} from '../../shared/components/confirm-dialog.component';

@Component({
    selector: 'custom-fields',
    templateUrl: './custom-fields.component.html',
    animations: fuseAnimations
})

export class CustomFieldsComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filterElement: ElementRef;

    public customField: CustomField = new CustomField();
    public displayedColumns = ['name', 'description', 'type', 'action', 'dataType', 'fieldName', 'sourceDescription'];
    public customFieldDataSource: EntityDatasource | null;
    public paginatedDataSource;
    public customFields: any;
    public fields;
    public currentCustomField: CustomField;
    public selectedCustomField: CustomField;
    public selectedRow: Record<string, unknown>;
    public selectedIndex: number = -1;
    public newCustomField = false;
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
        this.httpService.getEntity('fields', '')
            .subscribe(result => {
                this.fields = [];
                this.fields.push({'id': 'new', 'name': 'New field', 'description' : 'Create new field', 'custom': 1});
                result.forEach((field) => {
                    if (field.id !== 'blank') {
                        this.fields.push(field);
                    }
                });
            }, (errors) => {
                this.errors = errors;
            });

        this.customFieldDataSource = new EntityDatasource(
            this.httpService,
            'custom-fields',
            ''
        );

        this.customFieldDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((customFields) => {
                if (customFields instanceof Array) {
                    this.customFields = customFields;
                    if (customFields.length > 0) {
                        this.paginatedDataSource = new MatTableDataSource<CustomField>(customFields);
                        this.paginatedDataSource.paginator = this.paginator;
                        this.paginatedDataSource.sort = this.sort;
                        this.paginatedDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedDataSource.filterPredicate =
                            (data: CustomField, filter: string) => this.customFieldsFilterPredicate(data, filter);
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

    customFieldsFilterPredicate(data: CustomField, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.description.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onSelect(row, index): void {
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedCustomField = new CustomField(row);
        if (this.touchStart === 0) {
            this.touchStart = new Date().getTime();
        } else {
            if (new Date().getTime() - this.touchStart < 400) {
                this.touchStart = 0;
                this.onConfirm();
            } else {
                this.touchStart = new Date().getTime();
            }
        }
    }

    onConfirm(): void {
        this.currentCustomField = cloneDeep(this.selectedCustomField);
        const dialogRef = this.dialog.open(CustomFieldDialogComponent, {
            minWidth: '50%',
            data: {'customField': this.currentCustomField, 'newCustomField': this.newCustomField, 'fields': this.fields}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result.action === 'save') {
                this.errors = [];

                this.httpService.saveEntity('custom-field', result.customField)
                    .subscribe((data: Response) => {
                        this._snackBar.open('Custom field  saved', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });
                        this.newCustomField = false;
                        this.customFieldDataSource.refresh();
                    }, (errors) => {
                        this.errors = errors;
                        this.customFieldDataSource.refresh();
                    });

            }
            if (result.action === 'remove') {
                const id = result.id;
                this.errors = [];
                this.httpService.deleteEntity('custom-field', id)
                    .subscribe(data => {
                        this._snackBar.open('Custom field removed', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });

                        this.customFieldDataSource.refresh();
                    }, (errors) => {
                        this.errors = errors;
                        this.customFieldDataSource.refresh();
                    });

            }
        });

        this.newCustomField = false;
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


    addCustomField(): void {
        this.selectedCustomField = new CustomField();
        this.newCustomField = true;
        this.onConfirm();
    }


    public filterCustomFields = (value: string) => {
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

    public deleteCustomField(customField): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '33%',
            width: '300px',
            data: {
                confirmMessage: 'Are you sure you want to delete the custom field: ' + customField.description + ' ?',
                informationMessage: 'Note: A custom field will not be removed if it is in use'
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.httpService.deleteEntity('custom-field', customField.id)
                    .subscribe((deleteResult) => {
                        this.customFieldDataSource.refresh();
                    }, (errors) => {
                        this.errors = errors;
                    });
            }
        });

    }

    clearErrors(): void {
        this.errors = [];
    }

    toCleanCase(value): string {
        return value.toLowerCase().replace(/\.\s*([a-z])|^[a-z]/gm, s => s.toUpperCase());
    }
}

@Component({
    selector: 'custom-field-dialog',
    templateUrl: 'custom-field.dialog.html',
})
export class CustomFieldDialogComponent implements OnInit {

    public customFieldForm: FormGroup;
    public formErrors: string[] = [];
    public errors = [];
    public currentCustomField;
    public newCustomField;
    public fields;

    constructor(
        public dialogRef: MatDialogRef<CustomFieldDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.currentCustomField = data.customField;
        this.newCustomField = data.newCustomField;
        this.fields = data.fields;
    }

    ngOnInit(): void {
        this.customFieldForm = this._formBuilder.group({
            'name': [{value: '', disabled: false}, Validators.required],
            'description': [{value: '', disabled: false}, Validators.required],
            'type': [{value: '', disabled: false}, Validators.required],
            'action': [{value: '', disabled: false}, Validators.required],
            'dataType': [{value: '', disabled: false}, Validators.required],
            'fieldId': [{value: '', disabled: false}, Validators.required],
        }, {});
        this.populateForm();
        if (this.newCustomField) {
            this.customFieldForm.controls['description'].enable();
        }
    }

    populateForm(): void {
        this.customFieldForm.controls['name'].setValue(this.currentCustomField.name);
        this.customFieldForm.controls['description'].setValue(this.currentCustomField.description);
        this.customFieldForm.controls['type'].setValue(this.currentCustomField.type);
        this.customFieldForm.controls['action'].setValue(this.currentCustomField.action);
        this.customFieldForm.controls['dataType'].setValue(this.currentCustomField.dataType);
        this.customFieldForm.controls['fieldId'].setValue(this.currentCustomField.fieldId);
        if (this.currentCustomField.sourceId.length > 0) {
            this.customFieldForm.controls['name'].disable();
            this.customFieldForm.controls['description'].disable();
            this.customFieldForm.controls['type'].disable();
            this.customFieldForm.controls['action'].disable();
            this.customFieldForm.controls['dataType'].disable();
        }
    }

    onSave(): void {
        this.currentCustomField.name = this.customFieldForm.controls['name'].value;
        this.currentCustomField.description = this.customFieldForm.controls['description'].value;
        this.currentCustomField.type = this.customFieldForm.controls['type'].value;
        this.currentCustomField.action = this.customFieldForm.controls['action'].value;
        this.currentCustomField.dataType = this.customFieldForm.controls['dataType'].value;
        this.currentCustomField.fieldId = this.customFieldForm.controls['fieldId'].value;
        this.dialogRef.close({action: 'save', customField: this.currentCustomField});
    }

    onRemove(): void {
        const id = this.currentCustomField.id;
        this.dialogRef.close({action: 'remove', id: id});
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

