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
    AfterViewInit
} from '@angular/core';
import {Location} from '@angular/common';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {TranslocoService} from '@ngneat/transloco';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable} from 'rxjs';

import {HttpService} from 'app/shared/services/http.service';
import {AbandonDialogService} from 'app/shared/services/abandon-dialog.service';
import {GlobalValidator} from 'app/shared/global-validator';
import {User} from 'app/shared/models/user';
import {Contact} from 'app/shared/models/contact';
import {CrossFieldErrorMatcher} from 'app/shared/cross-field-errormatcher';

@Component({
    selector: 'profile',
    templateUrl: './profile.component.html',
})

export class ProfileComponent implements OnInit, OnDestroy, AfterViewInit {
    public profileForm: FormGroup;
    public formErrors: string[] = [];
    public errors = [];
    public user: User = new User();
    public contact: Contact = new Contact();
    public currentUser;
    public hasData = false;

    @ViewChildren('profileName') public Names: QueryList<ElementRef>;
    private nameElement: ElementRef;

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
    }

    ngOnInit(): void {
        this.httpService.getEntity('profile', '')
            .subscribe(result => {
                this.hasData = true;
                this.currentUser = result;
                this.populateForm();
            }, (errors) => {
                this.errors = errors;
            });

        this.profileForm = this._formBuilder.group({
            name: ['', [Validators.required]],
            email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
            telephone: [''],
        }, {});
    }

    ngAfterViewInit(): void {
        this.Names.changes.subscribe((comps: QueryList<ElementRef>) => {
            this.nameElement = comps.first;
            setTimeout(() => {
                this.nameElement.nativeElement.focus();
            }, 1);
        });
    }

    ngOnDestroy(): void {
    }

    populateForm(): void {
        this.profileForm.controls['name'].setValue(this.currentUser.name);
        this.profileForm.controls['email'].setValue(this.currentUser.email);
        this.profileForm.controls['telephone'].setValue(this.currentUser.telephone);
    }

    save(): void {
        this.errors = [];
        let userName = this.profileForm.controls['name'].value;
        this.contact.name = userName;
        this.contact.telephone = this.profileForm.controls['telephone'].value;
        this.contact.layout = this.currentUser.layout;
        this.contact.scheme = this.currentUser.scheme;
        this.contact.theme = this.currentUser.theme;

        this.httpService.saveEntity('profile', this.contact)
            .subscribe((data: Response) => {
                this._snackBar.open('Profile saved', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
                this.profileForm.markAsPristine();
                this.httpService.setCurrentUserName(userName);
            }, (errors) => {
                this.errors = errors;
            });
    }

    onCancel(): void {
        this.httpService.getEntity('profile', '')
            .subscribe(result => {
                this.hasData = true;
                this.currentUser = result;
                this.populateForm();
            }, (errors) => {
                this.errors = errors;
            });
    }

    onBack(): void {
        this.location.back();
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.profileForm.dirty) {
            return this.abandonDialogService.showDialog();
        } else {
            return true;
        }
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

    openPasswordDialog(): void {
        this.errors = [];
        const dialogRef = this.dialog.open(ProfilePasswordDialogComponent, {
            minWidth: '50%',
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.httpService.saveEntity('password', result)
                    .subscribe((data: Response) => {
                        this._snackBar.open('Password changed', 'Dismiss', {
                            duration: 3000,
                        });
                    }, (errors) => {
                        this.errors = errors;
                    });
            }
        });
    }

    openEmailDialog(): void {
        this.errors = [];
        const dialogRef = this.dialog.open(ProfileEmailDialogComponent, {
            minWidth: '50%',
            data: {}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.httpService.saveEntity('email', result)
                    .subscribe((data: Response) => {
                        this._snackBar.open('Email changed', 'Dismiss', {
                            duration: 3000,
                        });
                        this.currentUser.email = result.email;
                        this.populateForm();
                    }, (errors) => {
                        this.errors = errors;
                    });
            }
        });
    }
}

@Component({
    selector: 'profile-password-dialog',
    templateUrl: 'profile-password.dialog.html',
})
export class ProfilePasswordDialogComponent implements OnInit {

    public passwordForm: FormGroup;
    errorMatcher = new CrossFieldErrorMatcher();

    constructor(
        public dialogRef: MatDialogRef<ProfilePasswordDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    ngOnInit(): void {
        this.passwordForm = this._formBuilder.group({
            oldPassword: ['', [Validators.required]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', [Validators.required]],
        }, {
            validator: GlobalValidator.equals('password', 'confirmPassword', 'misMatchedPasswords')
        });
    }

    savePassword(): void {
        this.data.current_password = this.passwordForm.controls['oldPassword'].value;
        this.data.password = this.passwordForm.controls['password'].value;
        this.data.password_confirmation = this.passwordForm.controls['confirmPassword'].value;
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
        if (control.hasError('minlength')) {
            returnVal = name + ' must be at least 8 characters long!';
        }
        if (control.hasError('misMatchedPasswords')) {
            returnVal = 'Passwords do not match!';
        }
        return returnVal;
    }
}

@Component({
    selector: 'profile-email-dialog',
    templateUrl: 'profile-email.dialog.html',
})
export class ProfileEmailDialogComponent implements OnInit {

    public emailForm: FormGroup;
    errorMatcher = new CrossFieldErrorMatcher();

    constructor(
        public dialogRef: MatDialogRef<ProfileEmailDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {
    }

    ngOnInit(): void {
        this.emailForm = this._formBuilder.group({
            password: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            confirmEmail: ['', [Validators.required]],
        }, {
            validator: GlobalValidator.equals('email', 'confirmEmail', 'misMatchedEmails')
        });
    }

    saveEmail(): void {
        this.data.current_password = this.emailForm.controls['password'].value;
        this.data.email = this.emailForm.controls['email'].value;
        this.data.email_confirmation = this.emailForm.controls['confirmEmail'].value;
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
        if (control.hasError('email')) {
            returnVal = name + ' is not a valid email!';
        }
        if (control.hasError('misMatchedEmails')) {
            returnVal = 'Emails do not match!';
        }
        return returnVal;
    }
}
