import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component, ElementRef, Inject,
    Input,
    OnDestroy,
    OnInit,
    ViewChild,
    ViewEncapsulation
} from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs';
import {HttpService} from 'app/shared/services/http.service';
import {fuseAnimations} from '@fuse/animations';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';
import {ConfirmDialogComponent} from 'app/shared/components/confirm-dialog.component';

@Component({
    selector       : 'user',
    templateUrl    : './user.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'user'
})
export class UserComponent implements OnInit, OnDestroy
{
    public errors = [];

    userData: any;
    userSubscription: Subscription;

    canClientAdmin: boolean = false;
    canImpersonate: boolean = false;
    startImpersonate: boolean = false;
    impersonateEmail: string = '';
    isImpersonating: boolean = false;
    isAgency: number = 0;
    managedClients: any = [];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private httpService: HttpService,
        private _translocoService: TranslocoService,
        public dialog: MatDialog,
        private _router: Router,
    ){
        this.userData = this.httpService.userData;
        this.managedClients = this.userData.managedClients;
        this.isAgency = this.userData.isAgency;
        if (this.userData.impersonateUserName.length > 0) {
            this.isImpersonating = true;
        }

        this.userSubscription = this.httpService.getCurrentUser().subscribe(userData => {
            this.userData = userData;
            // Check permissions
            this.canClientAdmin = this.httpService.hasPermission('client_admin');
            this.canImpersonate = this.httpService.hasPermission('impersonate');
            this.managedClients = this.userData.managedClients;
            this.isAgency = this.userData.isAgency;
        });

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Check permissions
        this.canClientAdmin = this.httpService.hasPermission('client_admin');
        this.canImpersonate = this.httpService.hasPermission('impersonate');
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    profile(): void
    {
        this._router.navigate(['/account/profile']);
    }

    public userManagement(value): void {
        this._router.navigate(['/account/user-management']);
    }

    public accountManagement(value): void {
        this._router.navigate(['/account/management']);
    }

    public startImpersonating(): void {
        const dialogRef = this.dialog.open(UserImpersonateDialogComponent, {
            minWidth: '40%',
            data: {}
        });

        dialogRef.afterClosed().subscribe((impersonateResult) => {
            if (impersonateResult) {
                let user = {'email': impersonateResult};
                this.httpService.impersonate(user)
                    .subscribe((data: Response) => {
                        this.isImpersonating = true;
                        this.httpService.clearDashboardData();
                        this._router.navigate(['/dashboard']);
                    }, (errors) => {
                        this.isImpersonating = false;
                    });
            }
        });
    }

    public leaveImpersonate(): void {
        this.httpService.leaveImpersonate()
            .subscribe((data: Response) => {
                this.isImpersonating = false;
                this.httpService.clearDashboardData();
                this._router.navigate(['/dashboard']);
            }, (errors) => {
                this.isImpersonating = false;
            });
    }

    public registerClient(): void {
        this._router.navigate(['/account/register-client']);
    }

    public manageClient(clientId, clientName): void {
        this.errors = [];
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '75%',
            width: '300px',
            data: {
                confirmMessage: 'Switch to client account : ' + clientName + ' ?',
                informationMessage: 'Any current actions will be lost and you will begin from the Client Dashboard'
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                let user = {'agency-client-id': clientId};
                this.httpService.impersonate(user)
                    .subscribe((data: Response) => {
                        this.isImpersonating = true;
                        this.httpService.clearDashboardData();
                        this._router.navigate(['/dashboard']);
                    }, (errors) => {
                        this.isImpersonating = false;
                    });
            }
        });
    }


    signOut(): void
    {
        this.httpService.logout();
    }
}

@Component({
    selector: 'user-impersonate-dialog',
    templateUrl: 'user-impersonate.dialog.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations
})
export class UserImpersonateDialogComponent implements OnInit, OnDestroy {

    public impersonateForm: FormGroup;
    private _unsubscribeAll: Subject<any>;
    private touchStart = 0;

    constructor(
        public dialogRef: MatDialogRef<UserImpersonateDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this._unsubscribeAll = new Subject();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    ngOnInit(): void {
        this.impersonateForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]]
        }, {});
    }

    onImpersonate(): void {
        this.dialogRef.close(this.impersonateForm.controls['email'].value);
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

