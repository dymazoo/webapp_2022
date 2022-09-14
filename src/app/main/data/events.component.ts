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
import {MatTableDataSource} from '@angular/material/table';
import * as _moment from 'moment';
import {default as _rollupMoment} from 'moment';

import {HttpService} from 'app/shared/services/http.service';
import {AbandonDialogService} from 'app/shared/services/abandon-dialog.service';
import {EntityDatasource} from 'app/shared/entity-datasource';
import {Event} from 'app/shared/models/event';
import {EventCategory} from 'app/shared/models/eventCategory';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {takeUntil} from 'rxjs/operators';
import {DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE} from '@angular/material/core';
import {MAT_MOMENT_DATE_ADAPTER_OPTIONS, MomentDateAdapter} from '@angular/material-moment-adapter';
import {dymazooDates} from 'app/shared/services/dymazoo-date.service';
import {ConfirmDialogComponent} from '../../shared/components/confirm-dialog.component';

const moment = _rollupMoment || _moment;

@Component({
    selector: 'events',
    templateUrl: './events.component.html',
    animations: fuseAnimations,
})

export class EventsComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filterElement: ElementRef;

    public event: Event = new Event();
    public displayedColumns = ['description', 'eventDate', 'eventCategory', 'type', 'action'];
    public eventDataSource: EntityDatasource | null;
    public paginatedDataSource;
    public events: any;
    public currentEvent: Event;
    public selectedEvent: Event;
    public selectedRow: Record<string, unknown>;
    public selectedIndex: number = -1;
    public newEvent = false;
    public errors = [];
    public eventCategories;

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
        this.httpService.getEntity('event-categorys', '')
            .subscribe((result) => {
                this.eventCategories = result;
            }, (errors) => {
                this.errors = errors;
            });

        this.eventDataSource = new EntityDatasource(
            this.httpService,
            'events',
            ''
        );

        this.eventDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((events) => {
                if (events instanceof Array) {
                    this.events = events;
                    if (events.length > 0) {
                        this.paginatedDataSource = new MatTableDataSource<Event>(events);
                        this.paginatedDataSource.paginator = this.paginator;
                        this.paginatedDataSource.sort = this.sort;
                        this.paginatedDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedDataSource.filterPredicate =
                            (data: Event, filter: string) => this.eventsFilterPredicate(data, filter);
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

    getEventDescription(eventCategoryId): string {
        let description = '';
        if (Array.isArray(this.eventCategories)) {
            this.eventCategories.forEach(eventCategory => {
                if (eventCategory.id === eventCategoryId) {
                    description = eventCategory.description;
                }
            });
        }
        return description;
    }

    eventsFilterPredicate(data: Event, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.description.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        filterResult = filterResult || data.type.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onSelect(row, index): void {
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedEvent = new Event(row);
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
        this.currentEvent = cloneDeep(this.selectedEvent);
        const dialogRef = this.dialog.open(EventDialogComponent, {
            minWidth: '50%',
            data: {'event': this.currentEvent, 'newEvent': this.newEvent, 'eventCategories': this.eventCategories}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.action) {
                if (result.action === 'save') {
                    this.errors = [];

                    this.httpService.saveEntity('event', result.event)
                        .subscribe((data: Response) => {
                            this._snackBar.open('Event saved', 'Dismiss', {
                                duration: 5000,
                                panelClass: ['snackbar-teal']
                            });
                            this.newEvent = false;
                            this.eventDataSource.refresh();
                        }, (errors) => {
                            this.errors = errors;
                            this.eventDataSource.refresh();
                        });

                }
                if (result.action === 'remove') {
                    const id = result.id;
                    this.errors = [];
                    this.httpService.deleteEntity('event', id)
                        .subscribe(data => {
                            this._snackBar.open('Event removed', 'Dismiss', {
                                duration: 5000,
                                panelClass: ['snackbar-teal']
                            });

                            this.eventDataSource.refresh();
                        }, (errors) => {
                            this.errors = errors;
                            this.eventDataSource.refresh();
                        });

                }
            }
        });

        this.newEvent = false;
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


    addEvent(): void {
        this.selectedEvent = new Event();
        this.newEvent = true;
        this.onConfirm();
    }


    public filterEvents = (value: string) => {
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

    public deleteEvent(event): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '33%',
            width: '300px',
            data: {
                confirmMessage: 'Are you sure you want to delete the event category: ' + event.description + ' ?',
                informationMessage: 'Note: An event category will not be removed if it is in use'
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.httpService.deleteEntity('event', event.id)
                    .subscribe((deleteResult) => {
                        this.eventDataSource.refresh();
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
    selector: 'event-dialog',
    templateUrl: 'event.dialog.html',
    providers: [
        {
            provide: DateAdapter,
            useClass: MomentDateAdapter,
            deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
        },
        {provide: MAT_DATE_FORMATS,  useFactory: dymazooDates(), deps: [HttpService]},
    ],
})
export class EventDialogComponent implements OnInit {

    public eventForm: FormGroup;
    public formErrors: string[] = [];
    public errors = [];
    public currentEvent;
    public newEvent;
    public eventCategories;

    constructor(
        public dialogRef: MatDialogRef<EventDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.currentEvent = data.event;
        this.newEvent = data.newEvent;
        this.eventCategories = data.eventCategories;
    }

    ngOnInit(): void {
        this.eventForm = this._formBuilder.group({
            'description': [{value: ''}, Validators.required],
            'eventCategoryId': [{value: ''}, Validators.required],
            'eventDate': [moment(), Validators.required],
            'type': [{value: ''}, Validators.required],
        }, {});
        this.populateForm();
        if (this.newEvent) {
            this.eventForm.controls['description'].enable();
        }
    }

    populateForm(): void {
        this.eventForm.controls['description'].setValue(this.currentEvent.description);
        this.eventForm.controls['type'].setValue(this.currentEvent.type);
        this.eventForm.controls['eventDate'].setValue(moment(this.currentEvent.eventDate));
        this.eventForm.controls['eventCategoryId'].setValue(this.currentEvent.eventCategoryId);
    }

    onSave(): void {
        this.currentEvent.description = this.eventForm.controls['description'].value;
        this.currentEvent.type = this.eventForm.controls['type'].value;
        this.currentEvent.eventDate = this.eventForm.controls['eventDate'].value.format('YYYY/MM/DD');
        this.currentEvent.eventCategoryId = this.eventForm.controls['eventCategoryId'].value;
        this.dialogRef.close({action: 'save', event: this.currentEvent});
    }

    onRemove(): void {
        const id = this.currentEvent.id;
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

