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
import {EventCategory} from 'app/shared/models/eventCategory';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {takeUntil} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';
import {ConfirmDialogComponent} from '../../shared/components/confirm-dialog.component';

@Component({
    selector: 'event-categories',
    templateUrl: './event-categories.component.html',
    animations: fuseAnimations
})

export class EventCategoriesComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filterElement: ElementRef;

    public eventCategory: EventCategory = new EventCategory();
    public displayedColumns = ['description', 'default'];
    public eventCategoryDataSource: EntityDatasource | null;
    public paginatedDataSource;
    public eventCategories: any;
    public currentEventCategory: EventCategory;
    public selectedEventCategory: EventCategory;
    public selectedRow: Record<string, unknown>;
    public selectedIndex: number = -1;
    public newEventCategory = false;
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
        this.eventCategoryDataSource = new EntityDatasource(
            this.httpService,
            'event-categorys',
            ''
        );

        this.eventCategoryDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((eventCategories) => {
                if (eventCategories instanceof Array) {
                    this.eventCategories = eventCategories;
                    if (eventCategories.length > 0) {
                        this.paginatedDataSource = new MatTableDataSource<EventCategory>(eventCategories);
                        this.paginatedDataSource.paginator = this.paginator;
                        this.paginatedDataSource.sort = this.sort;
                        this.paginatedDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedDataSource.filterPredicate =
                            (data: EventCategory, filter: string) => this.eventCategoriesFilterPredicate(data, filter);
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

    eventCategoriesFilterPredicate(data: EventCategory, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.description.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onSelect(row, index): void {
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedEventCategory = new EventCategory(row);
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
        this.currentEventCategory = cloneDeep(this.selectedEventCategory);
        const dialogRef = this.dialog.open(EventCategoryDialogComponent, {
            minWidth: '50%',
            data: {'eventCategory': this.currentEventCategory, 'newEventCategory': this.newEventCategory}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result.action === 'save') {
                this.errors = [];

                this.httpService.saveEntity('event-category', result.eventCategory)
                    .subscribe((data: Response) => {
                        this._snackBar.open('Event category saved', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });
                        this.newEventCategory = false;
                        this.eventCategoryDataSource.refresh();
                    }, (errors) => {
                        this.errors = errors;
                        this.eventCategoryDataSource.refresh();
                    });

            }
            if (result.action === 'remove') {
                const id = result.id;
                this.errors = [];
                this.httpService.deleteEntity('event-category', id)
                    .subscribe(data => {
                        this._snackBar.open('Event category removed', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });

                        this.eventCategoryDataSource.refresh();
                    }, (errors) => {
                        this.errors = errors;
                        this.eventCategoryDataSource.refresh();
                    });

            }
        });

        this.newEventCategory = false;
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


    addEventCategory(): void {
        this.selectedEventCategory = new EventCategory();
        this.newEventCategory = true;
        this.onConfirm();
    }


    public filterEventCategories = (value: string) => {
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

    public deleteEventCategory(eventCategory): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '33%',
            width: '300px',
            data: {
                confirmMessage: 'Are you sure you want to delete the event category: ' + eventCategory.description + ' ?',
                informationMessage: 'Note: An event category will not be removed if it is in use'
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.httpService.deleteEntity('event-category', eventCategory.id)
                    .subscribe((deleteResult) => {
                        this.eventCategoryDataSource.refresh();
                    }, (errors) => {
                        this.errors = errors;
                    });
            }
        });

    }

    clearErrors(): void {
        this.errors = [];
    }

}

@Component({
    selector: 'event-category-dialog',
    templateUrl: 'event-category.dialog.html',
})
export class EventCategoryDialogComponent implements OnInit {

    public eventCategoryForm: FormGroup;
    public formErrors: string[] = [];
    public errors = [];
    public currentEventCategory;
    public newEventCategory;

    constructor(
        public dialogRef: MatDialogRef<EventCategoryDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.currentEventCategory = data.eventCategory;
        this.newEventCategory = data.newEventCategory;
    }

    ngOnInit(): void {
        this.eventCategoryForm = this._formBuilder.group({
            'description': ['', Validators.required],
            'default': [{value: 0}],
        }, {});
        this.populateForm();
    }

    populateForm(): void {
        this.eventCategoryForm.controls['description'].setValue(this.currentEventCategory.description);
        this.eventCategoryForm.controls['default'].setValue(this.currentEventCategory.default);
    }

    onSave(): void {
        this.currentEventCategory.description = this.eventCategoryForm.controls['description'].value;
        this.currentEventCategory.default = this.eventCategoryForm.controls['default'].value;
        this.dialogRef.close({action: 'save', eventCategory: this.currentEventCategory});
    }

    onRemove(): void {
        const id = this.currentEventCategory.id;
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

