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

import {HttpService} from 'app/shared/services/http.service';
import {AbandonDialogService} from 'app/shared/services/abandon-dialog.service';
import {EntityDatasource} from 'app/shared/entity-datasource';
import {GlobalValidator} from 'app/shared/global-validator';
import {User} from 'app/shared/models/user';
import {CrossFieldErrorMatcher} from 'app/shared/cross-field-errormatcher';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {takeUntil} from 'rxjs/operators';
import {MatTableDataSource} from '@angular/material/table';
import {cloneDeep} from "lodash-es";
import {SalesCategoryDialogComponent} from "../data/sales-categories.component";

@Component({
    selector: 'user-management',
    templateUrl: './usermanagement.component.html',
    animations: fuseAnimations
})

export class UserManagementComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;
    @ViewChild('filter') filterElement: ElementRef;

    public errors = [];

    public user: User = new User();
    public currentUser;
    public displayedColumns = ['name', 'email', 'lastLogin', 'admin'];
    public userDataSource: EntityDatasource | null;
    public paginatedDataSource;
    public users: any;
    public selectedUser: User;
    public selectedRow: Record<string, unknown>;
    public selectedIndex: number = -1;
    public newUser = false;
    public canClientAdmin = false;
    public roles= [];

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

        // Check permissions
        this.canClientAdmin = this.httpService.hasPermission('client_admin');
    }

    ngOnInit(): void {
        this.userDataSource = new EntityDatasource(
            this.httpService,
            'users',
            ''
        );

        this.httpService.getEntity('roles', '')
            .subscribe((result) => {
                this.roles = result;
            }, (errors) => {
                this.errors = errors;
            });

        this.userDataSource.onItemsChanged
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((users) => {
                if (users instanceof Array) {
                    this.users = users;
                    if (users.length > 0) {
                        this.paginatedDataSource = new MatTableDataSource<User>(users);
                        this.paginatedDataSource.paginator = this.paginator;
                        this.paginatedDataSource.sort = this.sort;
                        this.paginatedDataSource.sortingDataAccessor =
                            (data, sortHeaderId) => data[sortHeaderId].toLocaleLowerCase();
                        this.paginatedDataSource.filterPredicate =
                            (data: User, filter: string) => this.usersFilterPredicate(data, filter);
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

    usersFilterPredicate(data: User, filter: string): boolean {
        let filterResult = false;
        const filterCompare = filter.toLocaleLowerCase();
        filterResult = filterResult || data.name.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        filterResult = filterResult || data.email.toLocaleLowerCase().indexOf(filterCompare) !== -1;
        return filterResult;
    }

    onSelect(row, index): void {
        const realIndex = (this.paginator.pageIndex * this.paginator.pageSize) + index;
        this.selectedRow = row;
        this.selectedIndex = realIndex;
        this.selectedUser = new User(row);
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
        this.currentUser = cloneDeep(this.selectedUser);
        const dialogRef = this.dialog.open(UserManagementDialogComponent, {
            minWidth: '70%',
            data: {'user': this.currentUser, 'newUser': this.newUser, 'roles': this.roles}
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result.action === 'save') {
                this.errors = [];

                this.httpService.saveEntity('user', result.user)
                    .subscribe((data: Response) => {
                        this._snackBar.open('User saved', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });
                        this.newUser = false;
                        this.userDataSource.refresh();
                    }, (errors) => {
                        this.errors = errors;
                        this.userDataSource.refresh();
                    });
            }
            if (result.action === 'remove') {
                const id = result.id;
                this.errors = [];
                this.httpService.deleteEntity('user', id.value)
                    .subscribe(data => {
                        this._snackBar.open('User removed', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });

                        // refresh the salesCategorys after the delete is confirmed
                        this.httpService.getEntity('users', '')
                            .subscribe(result => {
                                this.users = result;
                            }, (errors) => {
                                this.errors = errors;

                            });
                    }, (errors) => {
                        this.errors = errors;
                    });

            }
        });

        this.newUser = false;
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


    addUser(): void {
        this.selectedUser = new User();
        this.selectedUser.layout = 'modern';
        this.selectedUser.scheme = 'light';
        this.selectedUser.theme = 'theme-brand';
        this.newUser = true;
        this.onConfirm();
    }

    public filterUsers = (value: string) => {
        this.paginatedDataSource.filter = value.trim().toLocaleLowerCase();
    }

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

    openAdminDialog(userId): void {
        this.errors = [];
        const dialogRef = this.dialog.open(UserManagementAdminDialogComponent, {
            minWidth: '50%',
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._snackBar.open('Admin Use change in progress', 'Dismiss', {
                    duration: 3000,
                });
                const setAdmin = {password: result.password, userId: userId};
                this.httpService.saveEntity('set-admin', setAdmin)
                    .subscribe((data: Response) => {
                        this.httpService.logout();
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
    selector: 'usermanagement-admin-dialog',
    templateUrl: 'usermanagement-admin.dialog.html',
})
export class UserManagementAdminDialogComponent implements OnInit {

    public usermanagementForm: FormGroup;
    errorMatcher = new CrossFieldErrorMatcher();

    constructor(
        public dialogRef: MatDialogRef<UserManagementAdminDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    ngOnInit(): void {
        this.usermanagementForm = this._formBuilder.group({
            password: ['', [Validators.required]],
        }, {});
    }

    setAdmin(): void {
        this.data.password = this.usermanagementForm.controls['password'].value;
        this.dialogRef.close(this.data);
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
    selector: 'usermanagement-dialog',
    templateUrl: 'usermanagement.dialog.html',
})
export class UserManagementDialogComponent implements OnInit {

    public usermanagementForm: FormGroup;
    public formErrors: string[] = [];
    public currentUser;
    public newUser;
    public roles;

    errorMatcher = new CrossFieldErrorMatcher();

    constructor(
        public dialogRef: MatDialogRef<UserManagementDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.currentUser = data.user;
        this.roles = data.roles;
        this.newUser = data.newUser;
    }

    ngOnInit(): void {
        this.usermanagementForm = this._formBuilder.group({
            'id': [{value: ''}],
            'name': [{value: '', disabled: true}, Validators.required],
            'email': [{value: '', disabled: true}, Validators.compose([Validators.required, GlobalValidator.mailFormat])],
            'roles': this._formBuilder.array([]),

        }, {});
        this.roles.forEach((role) => {
            (this.usermanagementForm.controls['roles'] as FormArray).push(
                new FormControl({value: ''}));
        });
        this.populateForm();
        if (this.newUser) {
            this.usermanagementForm.controls['name'].enable();
            this.usermanagementForm.controls['email'].enable();
        }

    }

    populateForm(): void {
        this.usermanagementForm.controls['name'].setValue(this.currentUser.name);
        this.usermanagementForm.controls['email'].setValue(this.currentUser.email);
        this.usermanagementForm.controls['name'].disable();
        this.usermanagementForm.controls['email'].disable();

        (this.usermanagementForm.controls['roles'] as FormArray).controls.forEach((roleControl, index) => {
            roleControl.enable();
            roleControl.reset(false);
            this.currentUser.roles.forEach((userRole) => {
                if (this.roles[index].name === userRole) {
                    roleControl.setValue(true);
                }
            });
        });
    }

    save(): void {
        const roles = [];
        (this.usermanagementForm.controls['roles'] as FormArray).controls.forEach((roleControl, index) => {
            if (roleControl.value === true) {
                roles.push(this.roles[index].name);
            }
        });
        this.currentUser.name = this.usermanagementForm.controls['name'].value;
        this.currentUser.email = this.usermanagementForm.controls['email'].value;
        this.currentUser.roles = roles;

        this.dialogRef.close({action: 'save', user: this.currentUser});
    }

    onRemove(): void {
        const id = this.usermanagementForm.controls['id'];
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


