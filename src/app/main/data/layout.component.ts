import {AfterViewChecked, Component, Inject, OnDestroy, OnInit, ViewEncapsulation, ViewChild, ElementRef} from '@angular/core';
import {Location} from '@angular/common';
import {CdkDragDrop, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {FormBuilder, FormGroup, FormArray, Validators, Form, ReactiveFormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Observable} from 'rxjs';

import { TranslocoService } from '@ngneat/transloco';
import {fuseAnimations} from '@fuse/animations';
import {FileInputComponent} from 'ngx-material-file-input/lib/file-input/file-input.component';

import {HttpService} from '../../shared/services/http.service';
import {AbandonDialogService} from '../../shared/services/abandon-dialog.service';
import {ConfirmDialogComponent} from 'app/shared/components/confirm-dialog.component';
import {EntityDatasource} from '../../shared/entity-datasource';
import {Layout} from '../../shared/models/layout';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';

@Component({
    selector: 'layout',
    templateUrl: './layout.component.html'
})
export class LayoutComponent implements OnInit, OnDestroy, AfterViewChecked {
    public layoutForm: FormGroup;
    public errors = [];

    public openedLayout: boolean = false;
    public layoutFields;
    public currentLayout: Layout;
    public fields;
    public transforms;
    public file;
    scrollMore = false;
    scrollLess = false;

    public hasHeader = false;

    private _unsubscribeAll: Subject<any>;

    @ViewChild('fileInput') fileInputField: FileInputComponent;

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
                result.forEach((field) => {
                    if (field.scope === 'all' || field.scope === 'import') {
                        field.inLayout = false;
                        this.fields.push(field);
                    }
                });
            }, (errors) => {
                this.errors = errors;
            });
        this.httpService.getEntity('transforms', '')
            .subscribe(result => {
                this.transforms = result;
            }, (errors) => {
                this.errors = errors;
            });

        this.layoutForm = this._formBuilder.group({
            'id': [''],
            'name': [''],
            'description': [''],
            'type': ['EXPORT'],
            'header': [''],
            'layoutFields': this._formBuilder.array([]),
        });
        this.currentLayout = new Layout();
        this.currentLayout.type = 'EXPORT';
        this.layoutFields = [{default: null, fieldDescription: 'Ignore', fieldId: '', fieldName: 'Ignore',
            id: '', sequence: 1, transformDescription: '', transformId: '', transformName: ''}];
        this.populateForm();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    ngAfterViewChecked(): void {
        setTimeout(() => {
            const scrollContainer = document.querySelector('.scroll-fields-container-import');
            const scrollFields = document.querySelector('.scroll-fields');
            if (scrollContainer && scrollFields) {
                this.scrollMore = (scrollContainer.clientWidth - 180) < scrollFields.scrollWidth && scrollFields.scrollLeft < (scrollFields.scrollWidth - scrollFields.clientWidth);
                this.scrollLess = scrollFields.scrollLeft > 0;
            }
        });
    }

    clearErrors(): void {
        this.errors = [];
    }

    populateForm(): void {
        this.layoutForm.controls['id'].reset('');
        this.layoutForm.controls['name'].reset('');
        this.layoutForm.controls['description'].reset('');
        this.layoutForm.controls['type'].reset('EXPORT');
        this.layoutForm.controls['header'].reset('');

        this.layoutForm.controls['id'].setValue(this.currentLayout.id);
        this.layoutForm.controls['name'].setValue(this.currentLayout.name);
        this.layoutForm.controls['description'].setValue(this.currentLayout.description);
        this.layoutForm.controls['type'].setValue(this.currentLayout.type);
        this.layoutForm.controls['header'].setValue(this.currentLayout.header);

        this.setLayoutFields();
    }

    private setLayoutFields(): void {
        const fieldsLength = (this.layoutForm.controls['layoutFields'] as FormArray).length;
        let i = 0;
        while (i < fieldsLength) {
            (this.layoutForm.controls['layoutFields'] as FormArray).removeAt(0);
            i++;
        }
        (this.layoutForm.controls['layoutFields'] as FormArray).reset();

        this.layoutFields.forEach(field => {
            (this.layoutForm.controls['layoutFields'] as FormArray).push(this._formBuilder.group({
                id: [field.id],
                sequence: [field.sequence],
                fieldName: [field.fieldName],
                fieldDescription: [field.fieldDescription],
                fieldId: [field.fieldId],
                transformName: [field.transformName],
                transformDescription: [field.transformDescription],
                transformId: [field.transformId],
                default: [field.default],
            }));
        });
    }

    drop(event: CdkDragDrop<string[]>): void {
        this.storeLayoutFields();
        const sourceContainer = event.previousContainer;
        const targetContainer = event.container;
        const sourceElement = event.item;
        const targetElement = targetContainer.getSortedItems()[0];
        const sourceId = sourceElement.data.id;
        const targetId = targetElement.data.id;
        const sourceIndex = sourceElement.data.index;
        const targetIndex = targetElement.data.index;

        if (sourceContainer.id === 'available-field-container' && targetContainer.id === 'layout-container') {
            if (targetId !== 'blank') {
                this.fields.forEach((field, index) => {
                    if (field.id === targetId) {
                        this.fields[index].inLayout = false;
                    }
                });
            }
            if (sourceId !== 'blank') {
                this.layoutFields[targetIndex].fieldId = sourceId;
                this.fields.forEach((field, index) => {
                    if (field.id === sourceId) {
                        this.layoutFields[targetIndex].fieldName = field.name;
                        this.layoutFields[targetIndex].fieldDescription = field.description;
                        this.fields[index].inLayout = true;
                    }
                });
            } else {
                this.layoutFields[targetIndex].fieldId = 'blank';
                this.layoutFields[targetIndex].fieldName = 'Ignore';
                this.layoutFields[targetIndex].fieldDescription = 'Ignore Column';
            }
            this.layoutFields[targetIndex].transformName = '';
            this.layoutFields[targetIndex].transformDescription = '';
            this.layoutFields[targetIndex].transformId = '';
            this.layoutFields[targetIndex].default = '';
        }

        if (sourceContainer.id === 'layout-container' && targetContainer.id === 'available-field-container') {
            this.fields.forEach((field, index) => {
                if (field.id === sourceId) {
                    this.fields[index].inLayout = false;
                }
            });
            this.layoutFields[sourceIndex].fieldId = 'blank';
            this.layoutFields[sourceIndex].fieldName = 'Ignore';
            this.layoutFields[sourceIndex].fieldDescription = 'Ignore Column';
            this.layoutFields[sourceIndex].transformName = '';
            this.layoutFields[sourceIndex].transformDescription = '';
            this.layoutFields[sourceIndex].transformId = '';
            this.layoutFields[sourceIndex].default = '';
        }

        if (sourceContainer.id === 'layout-container' && targetContainer.id === 'layout-container') {
            const targetFieldName = this.layoutFields[targetIndex].fieldName;
            const targetFieldDescription = this.layoutFields[targetIndex].fieldDescription;
            const targetTransformName = this.layoutFields[targetIndex].transformName;
            const targetTransformDescription = this.layoutFields[targetIndex].transformDescription;
            const targetTransformId = this.layoutFields[targetIndex].transformId;
            const targetDefault = this.layoutFields[targetIndex].default;

            this.layoutFields[targetIndex].fieldId = sourceId;
            this.layoutFields[targetIndex].fieldName = this.layoutFields[sourceIndex].fieldName;
            this.layoutFields[targetIndex].fieldDescription = this.layoutFields[sourceIndex].fieldDescription;
            this.layoutFields[targetIndex].transformName = this.layoutFields[sourceIndex].transformName;
            this.layoutFields[targetIndex].transformDescription = this.layoutFields[sourceIndex].transformDescription;
            this.layoutFields[targetIndex].transformId = this.layoutFields[sourceIndex].transformId;
            this.layoutFields[targetIndex].default = this.layoutFields[sourceIndex].default;

            this.layoutFields[sourceIndex].fieldId = targetId;
            this.layoutFields[sourceIndex].fieldName = targetFieldName;
            this.layoutFields[sourceIndex].fieldDescription = targetFieldDescription;
            this.layoutFields[sourceIndex].transformName = targetTransformName;
            this.layoutFields[sourceIndex].transformDescription = targetTransformDescription;
            this.layoutFields[sourceIndex].transformId = targetTransformId;
            this.layoutFields[sourceIndex].default = targetDefault;
        }
        this.setLayoutFields();
    }

    storeLayoutFields(): void {
        const layoutFieldControls = (this.layoutForm.controls['layoutFields'] as FormArray).controls;
        layoutFieldControls.forEach((layoutFieldControl, index) => {
            this.layoutFields[index].transformId = layoutFieldControl.value.transformId;
            this.layoutFields[index].default = layoutFieldControl.value.default;
        });
    }


    headerChange(header: any): void {
        this.setHeader(header.checked);
    }

    setHeader(hasHeader): void {
        if (hasHeader) {
            this.hasHeader = true;
        } else {
            this.hasHeader = false;
        }

    }

    addColumn(): void {
        this.storeLayoutFields();
        const layoutField = {
            'id': 'blank',
            'sequence': 1,
            'fieldId': 'blank',
            'fieldName': 'Ignore',
            'fieldDescription': 'Ignore Column',
            'transformName': '',
            'transformDescription': '',
            'transformId': '',
            'default': '',
        };
        this.layoutFields.push(layoutField);
        this.setLayoutFields();
    }

    removeColumn(index): void {
        this.storeLayoutFields();
        this.layoutFields.splice(index, 1);
        this.setLayoutFields();
    }

    onCancel(): void {
        this.layoutForm.reset();
        this.layoutForm.markAsPristine();
        this.openedLayout = false;
        this.currentLayout = new Layout();
        this.currentLayout.type = 'EXPORT';
        this.layoutFields = [{default: null, fieldDescription: 'Ignore', fieldId: '', fieldName: 'Ignore',
            id: '', sequence: 1, transformDescription: '', transformId: '', transformName: ''}];
        this.populateForm();
        this.errors = [];
        this.fields.forEach((field, index) => {
            this.fields[index].inLayout = false;
        });
        this.setLayoutFields();
    }

    onBack(): void {
        this.location.back();
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.layoutForm.dirty) {
            return this.abandonDialogService.showDialog();
        } else {
            return true;
        }
    }

    doOpenLayout(): void {
        const dialogRef = this.dialog.open(LayoutOpenLayoutDialogComponent, {
            minWidth: '80%',
            data: {'dialog': this.dialog}
        });

        dialogRef.afterClosed().subscribe(openResult => {
            if (openResult) {
                this.currentLayout = openResult;
                if (this.currentLayout.header === 1){
                    this.hasHeader = true;
                } else {
                    this.hasHeader = false;
                }
                this.openedLayout = true;
                this.httpService.getEntity('layout-fields', this.currentLayout.id)
                    .subscribe(result => {
                        this.layoutFields = result;
                        this.layoutFields.forEach(layoutField => {
                            this.fields.forEach((field, index) => {
                                if (layoutField.fieldId === field.id && field.id !== 'blank') {
                                    this.fields[index].inLayout = true;
                                }
                            });
                        });

                        this.populateForm();
                    }, (errors) => {
                        this.errors = errors;
                    });
            }
        });

    }

    doSaveLayout(saveAs: boolean): void {
        const name = this.layoutForm.controls['name'];
        const description = this.layoutForm.controls['description'];
        const fileName = this.layoutForm.controls['file-name'];
        const type = this.layoutForm.controls['type'];
        const header = this.layoutForm.controls['header'];

        this.storeLayoutFields();

        const data = {
            name: name.value, description: description.value, type: type.value, header: header.value, layoutFields: this.layoutFields
        };
        if (saveAs) {
            // remove the layoutFieldId from all fields so that they are saved as new layoutFields
            this.layoutFields.forEach((layoutField, index) => {
                this.layoutFields[index].id = '';
            });
            data['id'] = '';
            data['saveAs'] = 1;
        } else {
            const id = this.layoutForm.controls['id'].value;
            data['id'] = id;
            if (id.length === 0) {
            }
        }

        this.errors = [];
        this.httpService.saveEntity('layout', data)
            .subscribe((saveResult) => {
                const newId = saveResult['id'];
                const newName = saveResult['name'];
                this.currentLayout.id = newId;
                this.currentLayout.name = newName;
                this.layoutForm.controls['id'].setValue(this.currentLayout.id);
                this.layoutForm.controls['name'].setValue(this.currentLayout.name);
                this.openedLayout = true;
            }, (errors) => {
                this.errors = errors;
            });
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        return returnVal;
    }

}

@Component({
    selector: 'layout-open-layout-dialog',
    templateUrl: 'layout-open-layout.dialog.html',
    styleUrls: ['layout-open-layout.dialog.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class LayoutOpenLayoutDialogComponent implements OnInit, OnDestroy {

    public openLayoutForm: FormGroup;
    public errors = [];
    displayedColumns = ['name', 'description', 'action'];
    layoutDataSource: EntityDatasource | null;
    public paginatedDataSource;
    layouts: any;
    dialog: MatDialog;
    selectedLayout: Layout;
    selectedRow: {};
    selectedIndex: number = -1;
    private _unsubscribeAll: Subject<any>;
    private touchStart = 0;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filterElement: ElementRef;

    constructor(
        public dialogRef: MatDialogRef<LayoutOpenLayoutDialogComponent>,
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this._unsubscribeAll = new Subject();
        this.dialog = data.dialog;
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    ngOnInit(): void {
        this.layoutDataSource = new EntityDatasource(
            this.httpService,
            'layouts',
            ''
        );

        this.layoutDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(layouts => {
                if (layouts instanceof Array) {
                    this.layouts = layouts;
                    if (layouts.length > 0) {
                        this.paginatedDataSource = new MatTableDataSource<Layout>(layouts);
                        this.paginatedDataSource.paginator = this.paginator;
                        this.paginatedDataSource.sort = this.sort;
                        this.paginatedDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedDataSource.filterPredicate =
                            (data: Layout, filter: string) => this.layoutsFilterPredicate(data, filter);
                        this.filterElement.nativeElement.focus();
                    }
                }
            });

        this.openLayoutForm = this._formBuilder.group({}
        );
    }

    layoutsFilterPredicate (data: Layout, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.name.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        filterResult = filterResult || data.description.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onConfirm(): void {
        this.dialogRef.close(this.selectedLayout);
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSelect(row, index): void {
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
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedLayout = new Layout(row);
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

    public filterLayouts = (value: string) => {
        this.paginatedDataSource.filter = value.trim().toLocaleLowerCase();
    };

    public deleteLayout(layout): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '33%',
            width: '300px',
            data: {
                confirmMessage: 'Are you sure you want to delete the layout: ' + layout.name + ' ?',
                informationMessage: 'Note: This cannot be undone'
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.httpService.deleteEntity('layout', layout.id)
                    .subscribe((deleteResult) => {
                        this.layoutDataSource.refresh();
                    }, (errors) => {
                        this.errors = errors;
                    });
            }
        });

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
