import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Router} from '@angular/router';
import {throwError as observableThrowError, Observable, Subject} from 'rxjs';
import {catchError, map, timeout, delay} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {User} from '../models/user';
import {Client} from '../models/client';
import {FuseSplashScreenService} from '@fuse/services/splash-screen/splash-screen.service';

@Injectable()
export class HttpService {
    public loggedIn = false;
    public homeUrl = '';
    public token: string;
    public crc: string;
    public userData = {userName: '', email: '', permissions: [], 'layout': '', 'scheme': '', 'theme': ''};
    public pendingRoute = '';
    public apiUrl = environment.apiHost;
    protected appHost = window.location.host;
    protected appPort = window.location.port;
    private timeout = 60000;
    private loggedinSubject = new Subject<any>();
    private userSubject = new Subject<any>();

    constructor(private http: HttpClient,
                private router: Router,
                private _fuseSplashScreenService: FuseSplashScreenService) {
        // If token and crc are saved in local storage check if they're still valid
        // and set login status as appropriate
        const dymazooUser = JSON.parse(localStorage.getItem('dymazooUser'));

        const token = dymazooUser && dymazooUser.token;
        const crc = dymazooUser && dymazooUser.crc;

        if (token && crc) {
            const headers = this.getJsonHeader();
            const authHeaders = headers.set('Authorization', 'Bearer ' + token);
            const CRCHeaders = authHeaders.set('CRCValidation', '' + crc);
            const result = this.http.get(this.apiUrl + 'loginCheck', {
                headers: CRCHeaders
            }).pipe(
                timeout(this.timeout),
                map(data => {
                    const status = data['status'];
                    if (status) {
                        this.homeUrl = '/dashboard';
                        this.token = token;
                        this.crc = crc;
                        this.userData.userName = data['userName'];
                        this.userData.email = data['email'];
                        this.userData.permissions = data['permissions'];
                        this.userData.layout = data['layout'];
                        this.userData.scheme = data['scheme'];
                        this.userData.theme = data['theme'];
                        this.setLoggedInState(true);
                        if (this.pendingRoute.length > 0) {
                            const url = this.pendingRoute;
                            this.pendingRoute = '';
                            this.router.navigate([url]);
                        }
                    } else {
                        this.setLoggedInState(false);
                    }
                }),
                catchError((error: any) => {
                    this.setLoggedInState(false);
                    if (error.status === 401) {
                        return observableThrowError(['Login has expired']);
                    }
                    if (error.name === 'TimeoutError') {
                        return observableThrowError(['Server timeout']);
                    }
                    return observableThrowError(['Unknown error - please contact support']);
                }),
                );
            result.subscribe(checkResult => {
                // Make the GET call
            });
        } else {
            this.loggedIn = false;
            this.homeUrl = '';
            this.token = null;
            this.crc = null;
            this.userData.userName = '';
            this.userData.email = '';
            this.userData.permissions = [];
            this.userData.layout = '';
            this.userData.scheme = '';
            this.userData.theme = '';
            localStorage.removeItem('dymazooUser');
        }
    }

    // Helper functions

    /**
     * Check if the user has a permission for a route
     * @param permissionName
     */
    public hasRoutePermission(permissionName: string, url: string): boolean {
        function matches(searchPermission): boolean {
            return searchPermission === permissionName;
        }

        if (this.loggedIn) {
            this.pendingRoute = url;
            const foundPermission = this.userData.permissions.filter(matches);
            if (foundPermission.length > 0) {
                this.pendingRoute = '';
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Check if the user has a permission
     * @param permissionName
     */
    public hasPermission(permissionName: string): boolean {
        function matches(searchPermission): boolean {
            return searchPermission === permissionName;
        }

        if (this.loggedIn) {
            const foundPermission = this.userData.permissions.filter(matches);
            if (foundPermission.length > 0) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }

    /**
     * Get the Url of the running webapp for things like callbacks and redirects
     */
    public getAppUrl(): string {
        return window.location.protocol + '//' + window.location.host;
    }

    /**
     * Get a standard application/json header
     * @param headers
     */
    protected getJsonHeader(): any {
        const headers = new HttpHeaders();
        const jsonHeaders = headers.set('Content-Type', 'application/json');
        return jsonHeaders;
    }

    /**
     * Create the header entry that shows the user is logged in
     */
    public createAuthorizationHeader(withJson: boolean = true): any {
        let resultHeaders = null;
        if (withJson) {
            resultHeaders = this.getJsonHeader();
        } else {
            resultHeaders = new HttpHeaders();
        }
        if (!this.token || !this.crc) {
            // if token and/or crc are saved in local storage then set them
            const dymazooUser = JSON.parse(localStorage.getItem('dymazooUser'));
            const token = dymazooUser && dymazooUser.token;
            const crc = dymazooUser && dymazooUser.crc;
            if (token && crc) {
                this.loggedIn = true;
                this.userData.userName = '';
                this.userData.email = '';
                this.userData.layout = '';
                this.userData.scheme = '';
                this.userData.theme = '';
                this.homeUrl = '/dashboard';
                this.userData.permissions = [];
                this.token = token;
                this.crc = crc;
            }
        }
        if (this.token && this.crc) {
            const authHeaders = resultHeaders.set('Authorization', 'Bearer ' + this.token.toString());
            const CRCHeaders = authHeaders.set('CRCValidation', this.crc.toString());
            return CRCHeaders;
        }
        return resultHeaders;
    }



    // Authorisation
    /**
     * set the logged out status
     */
    public setLoggedInState(state: boolean): void {
        this.loggedinSubject.next({state: state});
        if (state) {
            this.loggedIn = true;
            this.userSubject.next(this.userData);
            setTimeout(() => {
                this._fuseSplashScreenService.hide();
            }, 1);
        } else {
            this.loggedIn = false;
            this.homeUrl = '';
            this.token = null;
            this.crc = null;
            this.userData.userName = '';
            this.userData.email = '';
            this.userData.permissions = [];
            this.userData.layout = '';
            this.userData.scheme = '';
            this.userData.theme = '';
            localStorage.removeItem('dymazooUser');
            const elem = document.querySelector('body');
            elem.className = 'app header-fixed navbar-fixed sidebar-hidden';
            this.router.navigate(['']);
            setTimeout(() => {
                this._fuseSplashScreenService.hide();
            }, 1);
        }
    }

    /**
     * Attempt to login with the given credentials
     * @param user
     */
    public login(user: User): any {
        const headers = this.getJsonHeader();
        return this.http.post(this.apiUrl + 'login', {user: user}, {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map(data => {
                // login successful if there's an oauth token and a crc in the response
                let token = null;
                if (data['token']) {
                    token = data['token'];
                }
                let crc = null;
                if (data['crc']) {
                    crc = data['crc'];
                }
                if (token && crc) {
                    // set various logged in properties
                    this.homeUrl = '/dashboard';
                    this.token = token;
                    this.crc = crc;
                    this.userData.userName = data['userName'];
                    this.userData.email = data['email'];
                    this.userData.permissions = data['permissions'];
                    this.userData.layout = data['layout'];
                    this.userData.scheme = data['scheme'];
                    this.userData.theme = data['theme'];
                    this.setLoggedInState(true);
                    // store email, oauth token and crc in local storage to keep user logged in between page refreshes
                    localStorage.setItem('dymazooUser', JSON.stringify({
                        emailAddress: user['emailAddress'],
                        token: token,
                        crc: crc
                    }));

                    // return true to indicate successful login
                    return true;
                } else {
                    this.setLoggedInState(false);
                    // return false to indicate failed login
                    return false;
                }
            }),
            catchError((error: any) => {
                if (error.status === 401) {
                    return observableThrowError(['Username or password is incorrect']);
                }
                if (error.status === 423) {
                    return observableThrowError(['User already logged in']);
                }
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }), );
    }

    /**
     * Log the current user out
     */
    public logout(): any {
        // logout from the api
        const headers = this.createAuthorizationHeader();
        const result = this.http.get(this.apiUrl + 'logout', {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map(data => {
                // return true to indicate successful logout
                return true;
            }),
            catchError((error: any) => {
                // clear token remove user from local storage to log user out
                localStorage.removeItem('dymazooUser');
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }), );
        result.subscribe(checkResult => {
            // Make the GET call
        });
        this.setLoggedInState(false);
    }

    /**
     * Attempt to do a customer registration
     * @param user
     */
    public register(user: User, client: Client): any {
        const headers = this.getJsonHeader();
        this.loggedIn = false;

        const regsitrationUser = {name: user.name, email: user.email, password: user.password,
            password_confirmation: user.confirmPassword, client_name: client.name, client_plan: client.plan,
            client_billing_type: client.billingType, token: user.token};
        return this.http.post(this.apiUrl + 'register', regsitrationUser, {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map(data => {
                return true;
            }),
            catchError((error: any) => {
                if (error.status === 406) {
                    const body = error.error;
                    return observableThrowError(body.errors);
                }
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }), );
    }

    /**
     * Process the confirmation of registration
     * @param clientId
     */
    public confirmRegistration(clientId: any): any {
        const headers = this.getJsonHeader();
        const result = this.http.post(this.apiUrl + 'confirm-registration', clientId, {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map(data => {
                return true;
            }),
            catchError((error: any) => {
                const body = error.error;
                if (body.errors) {
                    return observableThrowError(body.errors);
                }
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }), );

        return result;
    }

    /**
     * Process a forgotten password request
     * @param email
     */
    public forgotPassword(email: any): any {
        const headers = this.getJsonHeader();
        const result = this.http.post(this.apiUrl + 'forgot-password', email, {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map(data => {
                return true;
            }),
            catchError((error: any) => {
                if (error.errors) {
                    return observableThrowError(error.errors);
                }
                if (error['name'] === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }), );

        return result;
    }

    /**
     * Process a reset password request
     * @param input
     */
    public resetPassword(input: any): any {
        const headers = this.getJsonHeader();
        const result = this.http.post(this.apiUrl + 'reset-password', input, {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map (data => {
                return true;
            }),
            catchError((error: any) => {
                const body = error.json();
                if (body.errors) {
                    return observableThrowError(body.errors);
                }
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }), );
        return result;
    }

    // Data Fetching and Saving
    /**
     * Fetch a data entity
     * @param entity
     * @param params
     */
    public getEntity(entity: string, params: any): any {
        const headers = this.createAuthorizationHeader();
        let paramsString = '';
        if (params) {
            if (params instanceof Array) {
                params.forEach((param) => {
                    paramsString = paramsString + '/' + param;
                });
            } else {
                paramsString = '/' + params;
            }
        }
        const result = this.http.get(this.apiUrl + entity + paramsString, {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map (pipeResult => {
                return pipeResult['data'];
            }),
            catchError((error: any) => {
                if (error.status === 401) {
                    this.setLoggedInState(false);
                }
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }), );
        return result;
    }

    /**
     * Save a data entity
     * @param entity
     * @param data
     */
    public saveEntity(entity: string, data: any): any {
        const headers = this.createAuthorizationHeader();
        const result = this.http.post(this.apiUrl + entity, data, {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map(pipeResult => {
                return pipeResult['data'];
            }),
            catchError((error: any) => {
                if (error.status === 401) {
                    this.setLoggedInState(false);
                }
                if (error.status === 403) {
                    return observableThrowError(['Not Authorised']);
                }
                if (error.status === 406) {
                    const body = error.error;
                    return observableThrowError(body.errors);
                }
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }), );
        return result;
    }

    /**
     * Save a data entity from formData
     * @param entity
     * @param formData
     */
    public saveEntityFormData(entity: string, formData: FormData): any {
        const headers = this.createAuthorizationHeader(false);
        const result = this.http.post(this.apiUrl + entity, formData, {
            headers: headers
        }).pipe(
            timeout(600000),
            map(data => {
                return data;
            }),
            catchError((error: any) => {
                if (error.status === 401) {
                    this.setLoggedInState(false);
                }
                if (error.status === 403) {
                    return observableThrowError(['Not Authorised']);
                }
                if (error.status === 406) {
                    const body = error.error;
                    return observableThrowError(body.errors);
                }
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }), );
        return result;
    }

    /**
     * Remove data entity
     * @param entity
     * @param id
     */
    public deleteEntity(entity: string, id: string): any {
        const headers = this.createAuthorizationHeader();
        return this.http.delete(this.apiUrl + entity + '/' + id, {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map(data => {
                return true;
            }),
            catchError((error: any) => {
                if (error.status === 401) {
                    this.setLoggedInState(false);
                }
                if (error.status === 403) {
                    return observableThrowError(['Not Authorised']);
                }
                if (error.status === 406) {
                    const body = error.error;
                    return observableThrowError(body.errors);
                }
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }), );
    }

    public getLoggedInState(): Observable<any> {
        return this.loggedinSubject.asObservable().pipe(delay(0));
    }

    public getCurrentUser(): Observable<any> {
        return this.userSubject.asObservable().pipe(delay(0));
    }

    public setCurrentUserName($userName): void {
        this.userData.userName = $userName;
        this.userSubject.next(this.userData);
    }

    public setCurrentLayout($layout): void {
        this.userData.layout = $layout;
    }

    public setCurrentScheme($scheme): void {
        this.userData.scheme = $scheme;
    }

    public setCurrentTheme($theme): void {
        this.userData.theme = $theme;
    }
}
