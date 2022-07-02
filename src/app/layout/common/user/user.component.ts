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

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _changeDetectorRef: ChangeDetectorRef,
        private httpService: HttpService,
        private _router: Router
//        private _userService: UserService
    ){
        this.userData = this.httpService.userData;

        this.userSubscription = this.httpService.getCurrentUser().subscribe(userData => {
            this.userData = userData;
            // Check permissions
            this.canClientAdmin = this.httpService.hasPermission('client_admin');
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
        this.userSubscription = this.httpService.getCurrentUser().subscribe(userData => {
            this.userData = userData;
            // Check permissions
            this.canClientAdmin = this.httpService.hasPermission('client_admin');
        });
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

    signOut(): void
    {
        this.httpService.logout();
    }
}
