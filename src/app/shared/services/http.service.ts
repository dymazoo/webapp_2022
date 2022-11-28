import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Router} from '@angular/router';
import {throwError as observableThrowError, Observable, Subject} from 'rxjs';
import {catchError, map, timeout, delay} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {User} from '../models/user';
import {Client} from '../models/client';
import {FuseSplashScreenService} from '@fuse/services/splash-screen/splash-screen.service';
import * as moment from 'moment';
import {getProjectIndexFiles} from '@angular/cdk/schematics';

@Injectable()
export class HttpService {
    public loggedIn = false;
    public homeUrl = '';
    public token: string;
    public crc: string;
    public impersonateToken: string;
    public impersonateCrc: string;
    public impersonateKey: string;
    public userData = {
        'userName': '',
        'email': '',
        'permissions': [],
        'layout': '',
        'scheme': '',
        'theme': '',
        'plan': '',
        'impersonateUserName': ''
    };
    public impersonateUserData = {
        'userName': '',
        'email': '',
        'permissions': [],
        'layout': '',
        'scheme': '',
        'theme': '',
        'plan': '',
        'impersonateUserName': ''
    };
    public dashboardRecency: any;
    public dashboardData: any;
    public storedDashboard: any = {};
    public dashboardLoggedInConfirmed = false;
    public pendingRoute = '';
    public apiUrl = environment.apiHost;
    protected appHost = window.location.host;
    protected appPort = window.location.port;
    private timeout = 60000;
    private loggedinSubject = new Subject<any>();
    private userSubject = new Subject<any>();
    private dashboardSubject = new Subject<any>();

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
            let CRCHeaders;
            let impersonateUsername = '';
            // check Impersonation
            const dymazooImpersonate = JSON.parse(localStorage.getItem('dymazooImpersonate'));
            const impersonateToken = dymazooImpersonate && dymazooImpersonate.token;
            const impersonateCrc = dymazooImpersonate && dymazooImpersonate.crc;
            const impersonateKey = dymazooImpersonate && dymazooImpersonate.key;
            if (impersonateToken && impersonateCrc && impersonateKey) {
                impersonateUsername = dymazooImpersonate.userName;
                const impersonateHeaders = authHeaders.set('CRCImpersonate', '' + impersonateKey);
                CRCHeaders = impersonateHeaders.set('CRCValidation', '' + impersonateCrc);
            } else {
                CRCHeaders = authHeaders.set('CRCValidation', '' + crc);
            }
            const result = this.http.get(this.apiUrl + 'loginCheck', {
                headers: CRCHeaders
            }).pipe(
                timeout(this.timeout),
                map(data => {
                    const status = data['status'];
                    if (status) {
                        const dymazooDashboard = JSON.parse(localStorage.getItem('dymazooDashboard'));
                        this.dashboardRecency = dymazooDashboard && dymazooDashboard.recency;
                        this.dashboardData = dymazooDashboard && dymazooDashboard.data;
                        this.storedDashboard = dymazooDashboard && dymazooDashboard.stored;

                        this.homeUrl = '/dashboard';
                        this.token = token;
                        this.crc = crc;
                        this.userData.userName = data['userName'];
                        this.userData.email = data['email'];
                        this.userData.permissions = data['permissions'];
                        this.userData.layout = data['layout'];
                        this.userData.scheme = data['scheme'];
                        this.userData.theme = data['theme'];
                        this.userData.plan = data['plan'];
                        this.userData.impersonateUserName = impersonateUsername;
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
            this.dashboardLoggedInConfirmed = false;
            this.homeUrl = '';
            this.token = null;
            this.crc = null;
            this.userData.userName = '';
            this.userData.email = '';
            this.userData.permissions = [];
            this.userData.layout = '';
            this.userData.scheme = '';
            this.userData.theme = '';
            this.userData.plan = '';
            localStorage.removeItem('dymazooUser');
            localStorage.removeItem('dymazooDashboard');
            localStorage.removeItem('dymazooImpersonate');
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
                this.dashboardLoggedInConfirmed = true;
                this.userData.userName = '';
                this.userData.email = '';
                this.userData.layout = '';
                this.userData.scheme = '';
                this.userData.theme = '';
                this.userData.plan = '';
                this.homeUrl = '/dashboard';
                this.userData.permissions = [];
                this.token = token;
                this.crc = crc;
            }
            // check Impersonation
            const dymazooImpersonate = JSON.parse(localStorage.getItem('dymazooImpersonate'));
            const impersonateToken = dymazooImpersonate && dymazooImpersonate.token;
            const impersonateCrc = dymazooImpersonate && dymazooImpersonate.crc;
            const impersonateKey = dymazooImpersonate && dymazooImpersonate.key;
            if (impersonateToken && impersonateCrc && impersonateKey) {
                this.impersonateToken = impersonateToken;
                this.impersonateCrc = impersonateCrc;
                this.impersonateKey = impersonateKey;
            }
        }
        if (this.token && this.crc) {
            const authHeaders = resultHeaders.set('Authorization', 'Bearer ' + this.token.toString());
            if (this.impersonateKey) {
                const impersonateHeaders = authHeaders.set('CRCImpersonate', this.impersonateKey.toString());
                const CRCHeaders = impersonateHeaders.set('CRCValidation', this.crc.toString());
                return CRCHeaders;
            } else {
                const CRCHeaders = authHeaders.set('CRCValidation', this.crc.toString());
                return CRCHeaders;
            }
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
            this.dashboardLoggedInConfirmed = true;
            this.userSubject.next(this.userData);
            setTimeout(() => {
                this._fuseSplashScreenService.hide();
            }, 1);
        } else {
            this.loggedIn = false;
            this.dashboardLoggedInConfirmed = false;
            this.homeUrl = '';
            this.token = null;
            this.crc = null;
            this.userData.userName = '';
            this.userData.email = '';
            this.userData.permissions = [];
            this.userData.layout = '';
            this.userData.scheme = '';
            this.userData.theme = '';
            this.userData.plan = '';
            localStorage.removeItem('dymazooUser');
            localStorage.removeItem('dymazooDashboard');
            localStorage.removeItem('dymazooImpersonate');
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
                    this.userData.plan = data['plan'];
                    this.setLoggedInState(true);
                    // store email, oauth token and crc in local storage to keep user logged in between page refreshes
                    localStorage.setItem('dymazooUser', JSON.stringify({
                        emailAddress: this.userData.email,
                        token: token,
                        crc: crc,
                        plan: this.userData.plan
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
            }),);
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
                localStorage.removeItem('dymazooDashboard');
                localStorage.removeItem('dymazooImpersonate');
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }),);
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
        this.dashboardLoggedInConfirmed = false;

        const registrationUser = {
            name: user.name, email: user.email, password: user.password,
            password_confirmation: user.confirmPassword, client_name: client.name, client_plan: client.plan,
            client_currency: client.currency, client_billing: client.billing, client_profiles: client.profiles,
            client_options: client.options, client_coupon: client.coupon,
            client_billing_start_date: client.nextBillingDate,
            token: user.token, layout: user.layout, scheme: user.scheme, theme: user.theme
        };
        const result = this.http.post(this.apiUrl + 'register', registrationUser, {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map(pipeResult => {
                return pipeResult['data'];
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
            }),);
        return result;
    }

    /**
     * Process the confirmation of payment details
     * @param payload
     */
    public confirmPaymentDetails(payload: any): any {
        const headers = this.createAuthorizationHeader();
        const result = this.http.post(this.apiUrl + 'payment-details-complete', payload, {
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
            }),);

        return result;
    }

    /**
     * Record that payment details failed
     * @param payload
     */
    public paymentDetailsFailed(payload: any): any {
        const headers = this.createAuthorizationHeader();
        const result = this.http.post(this.apiUrl + 'payment-details-failed', payload, {
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
            }),);

        return result;
    }

    /**
     * Process the confirmation of payment during registration
     * @param payload
     */
    public confirmPayment(payload: any): any {
        const headers = this.getJsonHeader();
        const result = this.http.post(this.apiUrl + 'register-payment-complete', payload, {
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
            }),);

        return result;
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
                if (error.status === 406) {
                    const body = error.error;
                    return observableThrowError(body.errors);
                }
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }),);

        return result;
    }

    /*
     * Begin impersonation
     */
    public impersonate(userId: any): any {
        const headers = this.createAuthorizationHeader();
        const result = this.http.post(this.apiUrl + 'impersonate', userId, {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map(data => {
                const response = data['response'];
                let token = null;
                if (response['token']) {
                    token = response['token'];
                }
                let impersonateKey = null;
                if (response['impersonateKey']) {
                    impersonateKey = response['impersonateKey'];
                }
                if (token && impersonateKey) {
                    localStorage.setItem('dymazooImpersonate', JSON.stringify({
                        token: this.token,
                        crc: this.crc,
                        userName: this.userData.userName,
                        key: impersonateKey
                    }));
                    // set various impersonation properties
                    this.impersonateToken = this.token;
                    this.impersonateCrc = this.crc;
                    this.impersonateKey = impersonateKey;
                    this.impersonateUserData = {...this.userData};

                    this.token = token;
                    this.crc = this.impersonateCrc;
                    this.userData.userName = response['userName'];
                    this.userData.email = response['email'];
                    this.userData.permissions = response['permissions'];
                    this.userData.layout = response['layout'];
                    this.userData.scheme = response['scheme'];
                    this.userData.theme = response['theme'];
                    this.userData.plan = response['plan'];
                    this.userData.impersonateUserName = this.impersonateUserData.userName;
                    // store email, oauth token and crc in local storage to keep user logged in between page refreshes
                    localStorage.setItem('dymazooUser', JSON.stringify({
                        emailAddress: this.userData.email,
                        token: token,
                        crc: this.impersonateCrc,
                        plan: this.userData.plan
                    }));
                    this.userSubject.next(this.userData);

                    // return true to indicate successful impersonation
                    return true;
                } else {
                    return false;
                }
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
            }),);

        return result;
    }

    /*
     * Get OAuthToken
     */
    public getOAuthToken(tokenData: any): any {
        const headers = this.getJsonHeader();
        const baseUrl = this.apiUrl.substring(0, this.apiUrl.length - 4);
        const result = this.http.post(baseUrl + 'oauth/token', tokenData, {
            headers: headers
        }).pipe(
            timeout(this.timeout),
            map(pipeResult => {
                return pipeResult;
            }),
            catchError((error: any) => {
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unable to process Authorisation code']);
            }),);
        return result;
    }


    /*
     * Leave impersonation
    */
    public leaveImpersonate(): any {
        const dymazooImpersonate = JSON.parse(localStorage.getItem('dymazooImpersonate'));
        const impersonateToken = dymazooImpersonate && dymazooImpersonate.token;
        const impersonateKey = dymazooImpersonate && dymazooImpersonate.key;
        const impersonateCrc = dymazooImpersonate && dymazooImpersonate.crc;
        if (impersonateToken && impersonateCrc && impersonateKey) {
            this.token = this.impersonateToken;
            this.crc = this.impersonateCrc;
            this.userData = {...this.impersonateUserData};

            // store email, oauth token and crc in local storage to keep user logged in between page refreshes
            localStorage.setItem('dymazooUser', JSON.stringify({
                token: this.token,
                crc: this.crc,
                plan: this.userData.plan
            }));

            const headers = this.createAuthorizationHeader();
            // only remove the impersonate data after getting the autorization headers one last time with the
            // impersonate key
            localStorage.removeItem('dymazooImpersonate');
            this.impersonateKey = null;
            this.impersonateUserData = {
                userName: '',
                email: '',
                permissions: [],
                'layout': '',
                'scheme': '',
                'theme': '',
                'plan': '',
                impersonateUserName: ''
            };
            this.impersonateToken = null;
            this.impersonateCrc = null;

            const result = this.http.post(this.apiUrl + 'leaveImpersonate', {}, {
                headers: headers
            }).pipe(
                timeout(this.timeout),
                map(data => {
                    // set various normal user properties
                    this.userData.permissions = data['permissions'];
                    this.userData.layout = data['layout'];
                    this.userData.scheme = data['scheme'];
                    this.userData.theme = data['theme'];
                    this.userData.plan = data['plan'];

                    this.userSubject.next(this.userData);

                    // return true to indicate successful impersonation
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
                }),);
            return result;
        }
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
                if (error.status === 406) {
                    const body = error.error;
                    return observableThrowError(body.errors);
                }
                if (error.name === 'TimeoutError') {
                    return observableThrowError(['Server timeout']);
                }
                return observableThrowError(['Unknown error - please contact support']);
            }),);

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
            }),);
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
            map(pipeResult => {
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
            }),);
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
            }),);
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
            }),);
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
            }),);
    }

    public getDymazooDates(): any {
        return {
            parse: {
                dateInput: 'LL',
            },
            display: {
                dateInput: 'LL',
                monthYearLabel: 'MMM YYYY',
                dateA11yLabel: 'LL',
                monthYearA11yLabel: 'MMMM YYYY',
            },
        };
    }

    public fetchDashboardData(force: boolean): any {
        const now = moment();
        let refreshDashboard = true;
        if (this.dashboardRecency !== undefined) {
            if (now.diff(this.dashboardRecency, 'hours') < 2) {
                refreshDashboard = false;
            }
        }
        if (this.dashboardLoggedInConfirmed && (refreshDashboard || force)) {
            this.dashboardData = undefined;
            this.getEntity('dashboard', '')
                .subscribe(result => {
                    this.dashboardData = result;
                    this.dashboardRecency = now;
                    localStorage.setItem('dymazooDashboard', JSON.stringify({
                        data: this.dashboardData,
                        recency: this.dashboardRecency
                    }));

                    this.dashboardSubject.next(this.dashboardData);
                }, (errors) => {
                });
        }
        return this.dashboardData;
    }

    public storeDashboard(storedDashboard): void {
        this.storedDashboard = storedDashboard;
        const dymazooDashboard = JSON.parse(localStorage.getItem('dymazooDashboard'));
        localStorage.setItem('dymazooDashboard', JSON.stringify({
            data: this.dashboardData,
            recency: this.dashboardRecency,
            stored: storedDashboard
        }));
    }

    public getStoredDashboard(): any {
        const now = moment();
        let refreshDashboard = true;
        if (this.dashboardRecency !== undefined) {
            if (now.diff(this.dashboardRecency, 'hours') < 2) {
                refreshDashboard = false;
            }
        }
        if (refreshDashboard) {
            return {'hasData': false};
        }
        return this.storedDashboard;
    }

    public getPricingData(): any {
        return {
            'analystProfiles': 2000,
            'specialistProfiles': 5000,
            'consultantProfiles': 10000,
            'profileAddition': 2500,
            'usd': {
                'analystMonthly': 25,
                'analystYearly': 19.95,
                'specialistMonthly': 35,
                'specialistYearly': 27.95,
                'consultantMonthly': 50,
                'consultantYearly': 39.95,
                'profileAdditionCost': 2.5,
                'optionsPrivate': 7.5
            },
            'gbp': {
                'analystMonthly': 20,
                'analystYearly': 15.95,
                'specialistMonthly': 27,
                'specialistYearly': 21.95,
                'consultantMonthly': 40,
                'consultantYearly': 30.95,
                'profileAdditionCost': 2.0,
                'optionsPrivate': 5
            },
        };
    }


    public getLoggedInState(): Observable < any > {
        return this.loggedinSubject.asObservable().pipe(delay(0));
    }

    public getCurrentUser(): Observable < any > {
        return this.userSubject.asObservable().pipe(delay(0));
    }

    public getDashboardData(): Observable < any > {
        return this.dashboardSubject.asObservable().pipe(delay(0));
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
