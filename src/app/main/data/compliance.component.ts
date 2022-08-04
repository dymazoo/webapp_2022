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
    AfterViewInit,
    ViewChild
} from '@angular/core';
import {Location} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, FormControl, Validators} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {TranslocoService} from '@ngneat/transloco';
import {fuseAnimations} from '@fuse/animations';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable, Subject} from 'rxjs';
import {ConfirmDialogComponent} from 'app/shared/components/confirm-dialog.component';

import {HttpService} from 'app/shared/services/http.service';
import {GlobalValidator} from 'app/shared/global-validator';
import {CrossFieldErrorMatcher} from 'app/shared/cross-field-errormatcher';
import {takeUntil} from 'rxjs/operators';
import {EntityDatasource} from 'app/shared/entity-datasource';
import {MatTableDataSource} from '@angular/material/table';
import {Person} from 'app/shared/models/person';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {EventDialogComponent} from './events.component';

@Component({
    selector: 'compliance',
    templateUrl: './compliance.component.html',
    styleUrls: ['./compliance.component.scss'],
    animations: fuseAnimations
})

export class ComplianceComponent implements OnInit, OnDestroy, AfterViewInit {

    public errors = [];
    public complianceForm: FormGroup;

    errorMatcher = new CrossFieldErrorMatcher();

    private _unsubscribeAll: Subject<any>;

    constructor(
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        public dialog: MatDialog,
        private _translocoService: TranslocoService,
        private _snackBar: MatSnackBar,
        private router: Router,
        private location: Location
    ) {
        this._translocoService.setActiveLang('en');
        this._unsubscribeAll = new Subject();

    }

    ngOnInit(): void {
        this.complianceForm = this._formBuilder.group({
            email: ['', [Validators.email]],
            mobile: ['',  [Validators.compose([GlobalValidator.telephoneFormat])]]
        }, {
            validator: GlobalValidator.oneHasValue('email', 'mobile', 'bothEmpty')
        });
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    onBack(): void {
        this.location.back();
    }

    onSubmit(): void {
        const email = this.complianceForm.controls['email'].value;
        const mobile = this.complianceForm.controls['mobile'].value;
        this.complianceForm.controls['email'].setValue('');
        this.complianceForm.controls['mobile'].setValue('');

        const dialogRef = this.dialog.open(ComplianceDialogComponent, {
            minWidth: '70%',
            data: {'email': email, 'mobile': mobile}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result.action === 'remove') {
                const id = result.id;
                this.errors = [];
                this.httpService.deleteEntity('compliance-person', id)
                    .subscribe(data => {
                        this._snackBar.open('Person data removed', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });
                    }, (errors) => {
                        this.errors = errors;
                    });
            }
            if (result.action === 'export') {
                const id = result.id;
                const password = result.password;
                this.errors = [];
                this.httpService.saveEntity('compliance-person-export', {'id': id, 'password': password})
                    .subscribe(data => {
                        this._snackBar.open('Person data export scheduled', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });
                    }, (errors) => {
                        this.errors = errors;
                    });
            }
        });
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
        if (control.hasError('incorrectTelephoneFormat')) {
            returnVal = name + ' is invalid!';
        }
        if (control.hasError('bothEmpty')) {
            returnVal = 'Email or Mobile is required';
        }
        return returnVal;
    }
}

@Component({
    selector: 'compliance-dialog',
    templateUrl: 'compliance.dialog.html',
    animations: fuseAnimations,
})
export class ComplianceDialogComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filterElement: ElementRef;

    public complianceForm: FormGroup;

    public errors = [];
    public email;
    public mobile;
    public persons;
    public displayedColumns = ['first_name', 'last_name', 'emails', 'mobiles', 'postcode', 'action'];
    public paginatedDataSource;
    public personDataSource: EntityDatasource | null;
    public hasPerson: boolean = false;
    public currentPerson: any;
    public personId: string = '';

    private _unsubscribeAll: Subject<any>;

    constructor(
        public dialogRef: MatDialogRef<EventDialogComponent>,
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        public dialog: MatDialog,
        @Inject(MAT_DIALOG_DATA) public data: any) {

        this._unsubscribeAll = new Subject();
        this.email = data.email;
        this.mobile = data.mobile;
    }

    ngOnInit(): void {
        this.complianceForm = this._formBuilder.group({
            'password': [{value: ''}, Validators.required],
        }, {});
    }

    ngAfterViewInit(): void {
        this.complianceForm.controls['password'].setValue('');
        this.personDataSource = new EntityDatasource(
            this.httpService,
            'compliance-person',
            {'type' : 'POST', 'email': this.email, 'mobile': this.mobile}
        );
        this.personDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(persons => {
                if(persons instanceof Array) {
                    this.persons = persons;
                    this.persons.forEach(person => {
                        person.action = '';
                    });
                    if (persons.length > 0) {
                        this.paginatedDataSource = new MatTableDataSource<Person>(persons);
                        this.paginatedDataSource.paginator = this.paginator;
                        this.paginatedDataSource.sort = this.sort;
                        this.paginatedDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedDataSource.filterPredicate =
                            (data: Person, filter: string) => this.personsFilterPredicate(data, filter);
                        this.filterElement.nativeElement.focus();
                    }
                }
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    public filterPersons = (value: string) => {
        this.paginatedDataSource.filter = value.trim().toLocaleLowerCase();
    };

    personsFilterPredicate (data: Person, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.firstName.toLocaleLowerCase().indexOf(filterCompare) !== -1 ||
            data.lastName.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onGetPersonData(row): void {
        this.personId = row.personId;
        this.httpService.getEntity('compliance-person', this.personId)
            .subscribe((data: Response) => {
                this.currentPerson = data;
                this.hasPerson = true;
            }, (errors) => {
                this.errors = errors;
            });
    }

    onRemovePerson(row): void {
        this.personId = row.personId;
        const personName = row.first_name + ' ' + row.last_name;
        const confirmDialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '33%',
            width: '300px',
            data: {
                confirmMessage: 'Are you sure you want to delete the person data for ' + personName + ' ?',
                informationMessage: 'Note: This action only removes data from Dymazoo, and not from source systems. The action cannot be undone.'
            }
        });
        confirmDialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.dialogRef.close({action: 'remove', id: this.personId});
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close({action: 'cancel'});
    }

    onCloseData(): void {
        this.hasPerson = false;
    }

    onExportData(): void {
        const password = this.complianceForm.controls['password'].value;
        this.dialogRef.close({'action': 'export', 'id': this.personId, 'password': password});
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        return returnVal;
    }

    objectKeys(obj):any {
        return Object.keys(obj);
    }

}
