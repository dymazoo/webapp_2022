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
import {EntityDatasource} from '../../shared/entity-datasource';
import {Layout} from '../../shared/models/layout';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';

@Component({
    selector: 'import',
    templateUrl: './import.component.html'
})
export class ImportComponent implements OnInit, OnDestroy, AfterViewChecked {
    public importForm: FormGroup;
    public errors = [];

    public hasLayout: boolean = false;
    public getLayoutName: boolean = false;
    public openedLayout: boolean = false;
    public layoutFields;
    public currentLayout: Layout;
    public fields;
    public transforms;
    public file;
    scrollMore = false;
    scrollLess = false;

    public fileSample = '';

    public showFields = false;
    public hasData = false;
    public hasFile = false;
    public fileName = '';
    public hasHeader = false;
    public sample1 = 1;
    public sample2 = 2;
    public sample3 = 3;
    public sample4 = 4;

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
                this.hasData = true;
            }, (errors) => {
                this.errors = errors;
            });

        this.importForm = this._formBuilder.group({
            'id': [''],
            'file-input': [''],
            'file-name': [undefined, Validators.required],
            'name': [''],
            'description': [''],
            'header': [''],
            'password': [''],
            'layoutFields': this._formBuilder.array([]),
        });
        this.currentLayout = new Layout();
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

    fileChange(): void {
        const fileInput = this.importForm.controls['file-input'].value;
        const reader = new FileReader();

        this.file = null;
        this.fileName = '';
        if (fileInput && fileInput.files[0]) {
            this.file = fileInput.files[0];
            this.importForm.controls['file-name'].setValue(this.file.name);
        } else {
            this.importForm.controls['file-name'].setValue('');
        }

        this.errors = [];
        reader.onload = (e: any) => {
            this.fileSample = e.target.result;
            let layoutId = '';
            const fileName = this.importForm.controls['file-name'].value;
            this.fileName = fileName;
            if (this.currentLayout.id) {
                layoutId = this.currentLayout.id;
            }
            this.httpService.saveEntity('import-sample', {sample: this.fileSample, id: layoutId, fileName: this.fileName})
                .subscribe(result => {
                    this.fields.forEach((field, index) => {
                        this.fields[index].inLayout = false;
                    });
                    this.hasFile = true;
                    const sampleHasHeader = result.header;
                    this.importForm.controls['header'].setValue(sampleHasHeader);
                    this.setHeader(sampleHasHeader);
                    this.layoutFields = result.layoutFields;
                    this.layoutFields.forEach(layoutField => {
                        this.fields.forEach((field, index) => {
                            if (layoutField.fieldId === field.id && field.id !== 'blank') {
                                this.fields[index].inLayout = true;
                            }
                        });
                    });

                    this.hasLayout = true;
                    this.populateForm();
                }, (errors) => {
                    this.errors = errors;
                });

        };

        if (this.file) {
            const blob = this.file.slice(0, 8092);
            reader.readAsText(blob);
        } else {
            this.layoutFields = [];
            this.setLayoutFields();
        }
    }

    populateForm(): void {
        if (this.currentLayout.id) {
            this.importForm.controls['id'].reset('');
            this.importForm.controls['name'].reset('');
            this.importForm.controls['description'].reset('');
            this.importForm.controls['header'].reset('');

            this.importForm.controls['id'].setValue(this.currentLayout.id);
            this.importForm.controls['name'].setValue(this.currentLayout.name);
            this.importForm.controls['description'].setValue(this.currentLayout.description);
            this.importForm.controls['header'].setValue(this.currentLayout.header);
        }
        this.setLayoutFields();
        this.showFields = true;
    }

    private setLayoutFields(): void {
        const fieldsLength = (this.importForm.controls['layoutFields'] as FormArray).length;
        let i = 0;
        while (i < fieldsLength) {
            (this.importForm.controls['layoutFields'] as FormArray).removeAt(0);

            i++;
        }
        (this.importForm.controls['layoutFields'] as FormArray).reset();

        this.layoutFields.forEach(field => {
            // saved layouts don't have sample data, but a layout created from a file does
            (this.importForm.controls['layoutFields'] as FormArray).push(this._formBuilder.group({
                id: [field.id],
                sequence: [field.sequence],
                fieldName: [field.fieldName],
                fieldDescription: [field.fieldDescription],
                fieldId: [field.fieldId],
                transformName: [field.transformName],
                transformDescription: [field.transformDescription],
                transformId: [field.transformId],
                default: [field.default],
                sample1: [field.sample[1]],
                sample2: [field.sample[2]],
                sample3: [field.sample[3]],
                sample4: [field.sample[4]],
                sample5: [field.sample[5]],
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
            if (this.layoutFields[targetIndex].fieldName === 'DOB' ||
                this.layoutFields[targetIndex].fieldName === 'Initial Date' ||
                this.layoutFields[targetIndex].fieldName === 'Latest Date' ||
                this.layoutFields[targetIndex].fieldName === 'Event Action Date/Time' ||
                this.layoutFields[targetIndex].fieldName === 'Event Date' ||
                this.layoutFields[targetIndex].fieldName === 'Sale Date/Time' ||
                this.layoutFields[targetIndex].fieldName === 'Activity Date/Time' ||
                this.layoutFields[targetIndex].fieldName === 'Campaign Date'
            ) {
                if (this.layoutFields[targetIndex].transformId.substring(0,4) !== 'DATE') {
                    this.layoutFields[targetIndex].transformName = '';
                    this.layoutFields[targetIndex].transformDescription = '';
                    this.layoutFields[targetIndex].transformId = '';
                    this.layoutFields[targetIndex].default = '';
                }
            } else {
                this.layoutFields[targetIndex].transformName = '';
                this.layoutFields[targetIndex].transformDescription = '';
                this.layoutFields[targetIndex].transformId = '';
                this.layoutFields[targetIndex].default = '';
                this.showFields = true;
            }
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
            this.showFields = true;        }

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
        const layoutFieldControls = (this.importForm.controls['layoutFields'] as FormArray).controls;
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
            this.sample1 = 2;
            this.sample2 = 3;
            this.sample3 = 4;
            this.sample4 = 5;
        } else {
            this.hasHeader = false;
            this.sample1 = 1;
            this.sample2 = 2;
            this.sample3 = 3;
            this.sample4 = 4;
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
            'sample': {1: '', 2: '', 3: '', 4: '', 5: ''}
        };
        this.layoutFields.push(layoutField);
        this.setLayoutFields();
    }

    onCancel(): void {
        this.hasLayout = false;
        this.hasFile = false;
        this.openedLayout = false;
        this.fileSample = '';
        this.file = null;
        this.fileInputField.clear();
        this.currentLayout = new Layout();
        this.layoutFields = [];
        this.showFields = false;
        this.errors = [];
        this.fields.forEach((field, index) => {
            this.fields[index].inLayout = false;
        });
        this.setLayoutFields();
        this.importForm.reset();
        this.importForm.markAsPristine();
        this.importForm.markAsUntouched();
    }

    onBack(): void {
        this.location.back();
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.httpService.syncCheckLoggedIn() && this.importForm.dirty) {
            return this.abandonDialogService.showDialog();
        } else {
            return true;
        }
    }

    doImport(): void {
        this.errors = [];
        this.storeLayoutFields();

        const id = this.importForm.controls['id'].value;
        let hasIgnore = false;
        let hasOrigin = false;
        let hasErrors = false;
        if (id === null || id.length === 0) {
            let hasSales = false;
            let hasSaleDescription = false;
            let hasSaleTime = false;
            let hasSaleValue = false;
            let hasActivity = false;
            let hasActivityAction = false;
            let hasActivityTime = false;
            let hasEvents = false;
            let hasEventAction = false;
            let hasEventTime = false;
            this.layoutFields.forEach(field => {
                if (field.fieldId === 'blank') {
                    hasIgnore = true;
                }
                if (field.fieldName === 'Origin') {
                    hasOrigin = true;
                }
                if (field.fieldName === 'Sale Description') {
                    hasSales = true;
                    hasSaleDescription = true;
                }
                if (field.fieldName === 'Sale Date/Time') {
                    hasSales = true;
                    hasSaleTime = true;
                }
                if (field.fieldName === 'Total Sale Value') {
                    hasSales = true;
                    hasSaleValue = true;
                }
                if (field.fieldName === 'Activity Action') {
                    hasActivity = true;
                    hasActivityAction = true;
                }
                if (field.fieldName === 'Activity Date/Time') {
                    hasActivity = true;
                    hasActivityTime = true;
                }
                if (field.fieldName === 'Event Action') {
                    hasEvents = true;
                    hasEventAction = true;
                }
                if (field.fieldName === 'Event Action Date/Time') {
                    hasEvents = true;
                    hasEventTime = true;
                }
            });
            if (hasSales && (!hasSaleDescription || !hasSaleTime || !hasSaleValue)) {
                hasErrors = true;
                this.errors.push('Sales must have at least description, time and value');
            }
            if (hasActivity && (!hasActivityAction || !hasActivityTime)) {
                hasErrors = true;
                this.errors.push('Activity must have at least action and time');
            }
            if (hasEvents && (!hasEventAction || !hasEventTime)) {
                hasErrors = true;
                this.errors.push('Events must have at least action and time');
            }
        } else {
            hasOrigin = true;
        }
        if (!hasErrors) {
            const dialogRef = this.dialog.open(ImportConfirmDialogComponent, {
                minWidth: '50%',
                data: {'hasIgnore': hasIgnore, 'hasOrigin': hasOrigin}
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    const header = this.importForm.controls['header'];
                    const password = this.importForm.controls['password'];
                    const formData = new FormData();
                    formData.append('inputFile', this.file, this.file.name);
                    formData.append('header', JSON.stringify(header.value));
                    formData.append('password', password.value);
                    formData.append('layoutFields', JSON.stringify(this.layoutFields));
                    formData.append('sample', this.fileSample);

                    this.httpService.saveEntityFormData('import-file', formData)
                        .subscribe((data: Response) => {
                            this.onCancel();
                            this._snackBar.open('Import successfully scheduled', 'Dismiss', {
                                duration: 5000,
                                panelClass: ['snackbar-teal']
                            });
                        }, (errors) => {
                            this.errors = errors;
                            if (!this.hasHeader) {
                                this.errors.push('Please check if your file has a header row, and if so, set the "Has header row" checkbox');
                            }
                        });

                }
            });
        }
    }

    doOpenLayout(): void {
        const dialogRef = this.dialog.open(ImportOpenLayoutDialogComponent, {
            minWidth: '80%',
            data: {}
        });

        dialogRef.afterClosed().subscribe(openResult => {
            if (openResult) {
                this.currentLayout = openResult;
                if (this.currentLayout.header === 1){
                    this.hasHeader = true;
                    this.sample1 = 2;
                    this.sample2 = 3;
                    this.sample3 = 4;
                    this.sample4 = 5;
                } else {
                    this.hasHeader = false;
                    this.sample1 = 1;
                    this.sample2 = 2;
                    this.sample3 = 3;
                    this.sample4 = 4;
                }
                this.openedLayout = true;
                this.getLayoutName = true;
                if (this.fileSample.length > 0) {
                    const layoutId = this.currentLayout.id;
                    this.httpService.saveEntity('import-sample', {sample: this.fileSample, id: layoutId, fileName: this.fileName})
                        .subscribe(result => {
                            this.fields.forEach((field, index) => {
                                this.fields[index].inLayout = false;
                            });
                            const sampleHasHeader = result.header;
                            this.importForm.controls['header'].setValue(sampleHasHeader);
                            this.setHeader(sampleHasHeader);
                            this.layoutFields = result.layoutFields;
                            this.layoutFields.forEach(layoutField => {
                                this.fields.forEach((field, index) => {
                                    if (layoutField.fieldId === field.id && field.id !== 'blank') {
                                        this.fields[index].inLayout = true;
                                    }
                                });
                            });

                            this.hasLayout = true;
                            this.populateForm();
                        }, (errors) => {
                            this.errors = errors;
                        });
                } else {
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

                            this.hasLayout = true;
                            this.populateForm();
                        }, (errors) => {
                            this.errors = errors;
                        });
                }
            }
        });

    }

    doGetLayoutName(): void {
        this.getLayoutName = true;
    }

    doSaveLayout(saveAs: boolean): void {
        const name = this.importForm.controls['name'];
        const description = this.importForm.controls['description'];
        const fileName = this.importForm.controls['file-name'];
        const header = this.importForm.controls['header'];

        this.storeLayoutFields();

        const data = {
            name: name.value, description: description.value, type: 'IMPORT', header: header.value, layoutFields: this.layoutFields
        };
        if (saveAs) {
            // remove the layoutFieldId from all fields so that they are saved as new layoutFields
            this.layoutFields.forEach((layoutField, index) => {
                this.layoutFields[index].id = '';
            });
            data['id'] = '';
            data['saveAs'] = 1;
        } else {
            const id = this.importForm.controls['id'].value;
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
                this.importForm.controls['id'].setValue(this.currentLayout.id);
                this.importForm.controls['name'].setValue(this.currentLayout.name);
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
    selector: 'import-confirm-dialog',
    templateUrl: 'import-confirm.dialog.html',
})
export class ImportConfirmDialogComponent implements OnInit {

    public confirmForm: FormGroup;

    constructor(
        public dialogRef: MatDialogRef<ImportConfirmDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    ngOnInit(): void {
        this.confirmForm = this._formBuilder.group({}
        );
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }

    onCancel(): void {
        this.dialogRef.close();
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
    selector: 'import-open-layout-dialog',
    templateUrl: 'import-open-layout.dialog.html',
    styleUrls: ['import-open-layout.dialog.scss'],
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class ImportOpenLayoutDialogComponent implements OnInit, OnDestroy {

    public openLayoutForm: FormGroup;
    displayedColumns = ['name', 'description'];
    layoutDataSource: EntityDatasource | null;
    public paginatedDataSource;
    layouts: any;
    selectedLayout: Layout;
    selectedRow: {};
    selectedIndex: number = -1;
    private _unsubscribeAll: Subject<any>;
    private touchStart = 0;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filterElement: ElementRef;

    constructor(
        public dialogRef: MatDialogRef<ImportOpenLayoutDialogComponent>,
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this._unsubscribeAll = new Subject();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    ngOnInit(): void {
        this.layoutDataSource = new EntityDatasource(
            this.httpService,
            'layouts',
            'import'
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
                } else {
                    this.paginatedDataSource = undefined;
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
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        return returnVal;
    }
}
