import {Injectable, OnDestroy} from '@angular/core';
import {
    Router,
    CanActivate,
    CanActivateChild,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    CanDeactivate,
    UrlTree
} from '@angular/router';
import {HttpService} from 'app/shared/services/http.service';
import {Observable, of, Subscription, switchMap} from 'rxjs';

export interface CanComponentDeactivate {
    canDeactivate: () => Observable<boolean> | Promise<boolean> | boolean;
}

@Injectable()
export class AuthGuard implements OnDestroy, CanActivate, CanActivateChild, CanDeactivate<CanComponentDeactivate> {
    private permissions = [];
    private loginSubscription: Subscription;

    /**
     * Constructor
     * @param router
     * @param httpService
     */
    constructor(private router: Router,
                private httpService: HttpService) {
        this.loginSubscription = this.httpService.getLoggedInState().subscribe(status => {
            if(status.state) {
                this.httpService.getEntity('permissions', '').subscribe(result => {
                    this.permissions = result;
                }, (error) => {
                    this.permissions = [];
                });
            } else {
                this.permissions = [];
            }
        });

    }

    ngOnDestroy(): void {
        this.loginSubscription.unsubscribe();
    }

    /**
     * Whether a route can activate or not
     * @param route
     * @param state
     */
    public canActivate(route: ActivatedRouteSnapshot,
                       state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
    {
        return this._check(state);
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot,
                     state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
    {
        return this._check(state);
    }

    /**
     * Whether a route can be de-activated, such as if it has dirty data
     * @param component
     */
    public canDeactivate(component: CanComponentDeactivate): any {
        return component.canDeactivate ? component.canDeactivate() : true;
    }

    private _check(state: RouterStateSnapshot): Observable<boolean> {
        // no navigation links
        let url = state.url.toString();
        if (url === '/noWhere') {
            return of(false);;
        }

        // permission controlled links
        if (localStorage.getItem('dymazooUser')) {
            let result = true;
            const dymazooUser = JSON.parse(localStorage.getItem('dymazooUser'));
            const plan = dymazooUser.plan;
            // logged in so check permissions
            url = state.url.toString();
            switch (url) {
                case '/account/settings':
                    result = this.httpService.hasRoutePermission('settings', url);
                    break;
                case '/integrations/settings':
                    result = this.httpService.hasRoutePermission('settings', url);
                    break;
                case '/account/management':
                    result = this.httpService.hasRoutePermission('client_admin', url);
                    break;
                case '/account/user-management':
                    result = this.httpService.hasRoutePermission('user_management', url);
                    break;
                case '/account/register-client':
                    result = this.httpService.hasRoutePermission('agency', url);
                    break;
                case '/data/import':
                    result = this.httpService.hasRoutePermission('import', url);
                    break;
                case '/data/layout':
                    result = this.httpService.hasRoutePermission('layout', url);
                    break;
                case '/data/layout':
                    result = this.httpService.hasRoutePermission('import', url);
                    break;
                case '/marketing/segmentation':
                    result = this.httpService.hasRoutePermission('selections', url);
                    break;
                case '/marketing/campaigns':
                    result = this.httpService.hasRoutePermission('esp_integration', url);
                    break;
                case '/data/custom-fields':
                    result = this.httpService.hasRoutePermission('custom_management', url);
                    break;
                case '/data/sales-categories':
                    result = this.httpService.hasRoutePermission('sales', url);
                    break;
                case '/data/event-categories':
                case '/data/events':
                    result = this.httpService.hasRoutePermission('event', url);
                    break;
                case '/data/preferences':
                    result = this.httpService.hasRoutePermission('settings', url);
                    break;
                case '/data/compliance':
                    result = this.httpService.hasRoutePermission('compliance', url);
                    break;
            }
            if (!result) {
               this.router.navigate(['/dashboard']);
            }
            return of(result);;
        } else {
            // not logged in so redirect to login page
            this.router.navigate(['']);
            return of(false);;
        }
    }
}
