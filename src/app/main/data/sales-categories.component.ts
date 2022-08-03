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
import {SalesCategory} from 'app/shared/models/salesCategory';
import {SalesSubCategory} from 'app/shared/models/salesSubCategory';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {takeUntil} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';

@Component({
    selector: 'sales-categories',
    templateUrl: './sales-categories.component.html',
    animations: fuseAnimations
})

export class SalesCategoriesComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filterElement: ElementRef;

    public salesCategory: SalesCategory = new SalesCategory();
    public displayedColumns = ['description', 'default'];
    public salesCategoryDataSource: EntityDatasource | null;
    public paginatedDataSource;
    public salesCategories: any;
    public currentSalesCategory: SalesCategory;
    public selectedSalesCategory: SalesCategory;
    public selectedRow: Record<string, unknown>;
    public selectedIndex: number = -1;
    public newSalesCategory = false;
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
        this.salesCategoryDataSource = new EntityDatasource(
            this.httpService,
            'sales-categorys',
            ''
        );

        this.salesCategoryDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((salesCategories) => {
                if (salesCategories instanceof Array) {
                    this.salesCategories = salesCategories;
                    if (salesCategories.length > 0) {
                        this.paginatedDataSource = new MatTableDataSource<SalesCategory>(salesCategories);
                        this.paginatedDataSource.paginator = this.paginator;
                        this.paginatedDataSource.sort = this.sort;
                        this.paginatedDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedDataSource.filterPredicate =
                            (data: SalesCategory, filter: string) => this.salesCategoriesFilterPredicate(data, filter);
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

    salesCategoriesFilterPredicate(data: SalesCategory, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.description.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onSelect(row, index): void {
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedSalesCategory = new SalesCategory(row);
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
        this.currentSalesCategory = cloneDeep(this.selectedSalesCategory);
        const dialogRef = this.dialog.open(SalesCategoryDialogComponent, {
            minWidth: '50%',
            data: {'salesCategory': this.currentSalesCategory, 'newSalesCategory': this.newSalesCategory}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result.action === 'save') {
                this.errors = [];

                this.httpService.saveEntity('sales-category', result.salesCategory)
                    .subscribe((data: Response) => {
                        this._snackBar.open('Sales category saved', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });
                        this.newSalesCategory = false;
                        this.salesCategoryDataSource.refresh();
                    }, (errors) => {
                        this.errors = errors;
                        this.salesCategoryDataSource.refresh();
                    });

            }
            if (result.action === 'remove') {
                const id = result.id;
                this.errors = [];
                this.httpService.deleteEntity('sales-category', id)
                    .subscribe(data => {
                        this._snackBar.open('Sales category removed', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });

                        this.salesCategoryDataSource.refresh();
                    }, (errors) => {
                        this.errors = errors;
                        this.salesCategoryDataSource.refresh();
                    });

            }
        });

        this.newSalesCategory = false;
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


    addSalesCategory(): void {
        this.selectedSalesCategory = new SalesCategory();
        this.newSalesCategory = true;
        this.onConfirm();
    }


    public filterSalesCategories = (value: string) => {
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
    selector: 'sales-category-dialog',
    templateUrl: 'sales-category.dialog.html',
})
export class SalesCategoryDialogComponent implements OnInit {

    public salescategoryForm: FormGroup;
    public formErrors: string[] = [];
    public errors = [];
    public currentSalesCategory;
    public newSalesCategory;

    constructor(
        public dialogRef: MatDialogRef<SalesCategoryDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.currentSalesCategory = data.salesCategory;
        this.newSalesCategory = data.newSalesCategory;
    }

    ngOnInit(): void {
        this.salescategoryForm = this._formBuilder.group({
            'description': [{value: '', disabled: true}, Validators.required],
            'default': [{value: 0}],
            'subCategories': this._formBuilder.array([]),

        }, {});
        this.populateForm();
        if (this.newSalesCategory) {
            this.salescategoryForm.controls['description'].enable();
        }
    }

    populateForm(): void {
        this.salescategoryForm.controls['description'].setValue(this.currentSalesCategory.description);
        this.salescategoryForm.controls['default'].setValue(this.currentSalesCategory.default);
        this.salescategoryForm.controls['description'].disable();

        const subCategoryLength = (this.salescategoryForm.controls['subCategories'] as FormArray).length;
        let i = 0;
        while (i < subCategoryLength) {
            (this.salescategoryForm.controls['subCategories'] as FormArray).removeAt(0);
            i++;
        }
        (this.salescategoryForm.controls['subCategories'] as FormArray).reset();

        this.currentSalesCategory.subCategories.forEach(subCategory => {
            (this.salescategoryForm.controls['subCategories'] as FormArray).push(this._formBuilder.group({
                id: [subCategory.id],
                description: [{value: subCategory.description, disabled: true}, Validators.required],
                default: [subCategory.default],
            }));
        });
    }

    onSave(): void {
        this.currentSalesCategory.description = this.salescategoryForm.controls['description'].value;
        this.currentSalesCategory.default = this.salescategoryForm.controls['default'].value;

        const subCategoryGroups = (this.salescategoryForm.controls['subCategories'] as FormArray).controls;
        const subCategoryList = [];
        subCategoryGroups.forEach((subCategoryGroup: FormGroup, index) => {
            const idControl = subCategoryGroup.controls['id'];
            const descriptionControl = subCategoryGroup.controls['description'];
            const defaultControl = subCategoryGroup.controls['default'];
            let actualSubDefault = 0;
            if (defaultControl.value){
                actualSubDefault = 1;
            }
            subCategoryList.push(new SalesSubCategory({id: idControl.value, description: descriptionControl.value, default: actualSubDefault}));
        });
        this.currentSalesCategory.subCategories = subCategoryList;

        this.dialogRef.close({action: 'save', salesCategory: this.currentSalesCategory});
    }

    onRemove(): void {
        const id = this.currentSalesCategory.id;
        this.dialogRef.close({action: 'remove', id: id});
    }

    onCancel(): void {
        this.dialogRef.close({action: 'cancel'});
    }

    setDefault(subIndex, subDefault): void {
        if (subDefault.checked) {
            const subCategoryGroups = (this.salescategoryForm.controls['subCategories'] as FormArray).controls;
            subCategoryGroups.forEach((subCategoryGroup: FormGroup, index) => {
                if (index !== subIndex) {
                    const defaultControl = subCategoryGroup.controls['default'];
                    defaultControl.setValue(0);
                }
            });
        }
    }

    addSubCategory(): void {
        this.currentSalesCategory.subCategories.push(new SalesSubCategory({description: '', default: 0}));
        (this.salescategoryForm.controls['subCategories'] as FormArray).push(this._formBuilder.group({
            id: [''],
            description: ['', Validators.required],
            default: [''],
        }));
    }

    removeSubCategory(index): void {
        this.currentSalesCategory.subCategories.splice(index, 1);
        (this.salescategoryForm.controls['subCategories'] as FormArray).removeAt(index);
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        return returnVal;
    }
}

