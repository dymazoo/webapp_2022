import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Subscription, takeUntil } from 'rxjs';
//import { User } from 'app/core/user/user.types';
//import { UserService } from 'app/core/user/user.service';
import {HttpService} from 'app/shared/services/http.service';

@Component({
    selector       : 'user',
    templateUrl    : './user.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    exportAs       : 'user'
})
export class UserComponent implements OnInit, OnDestroy
{
    userData: any;
    userSubscription: Subscription;

    canClientAdmin: boolean = false;
    canImpersonate: boolean = false;
    isImpersonating: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private httpService: HttpService,
        private _router: Router
    ){
        this.userData = this.httpService.userData;
        if (this.userData.impersonateUserName.length > 0) {
            this.isImpersonating = true;
        }

        this.userSubscription = this.httpService.getCurrentUser().subscribe(userData => {
            this.userData = userData;
            // Check permissions
            this.canClientAdmin = this.httpService.hasPermission('client_admin');
            this.canImpersonate = this.httpService.hasPermission('impersonate');
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

    public impersonate(value): void {
        let user = {'userId': '208657fa-e3ac-11eb-87c4-000c29fe2526'};
        this.httpService.impersonate(user)
            .subscribe((data: Response) => {
                this.isImpersonating = true;
        }, (errors) => {
                this.isImpersonating = false;
        });
    }

    public leaveImpersonate(): void {
        this.httpService.leaveImpersonate()
            .subscribe((data: Response) => {
                this.isImpersonating = false;
            }, (errors) => {
            });
    }


    signOut(): void
    {
        this.httpService.logout();
    }
}
