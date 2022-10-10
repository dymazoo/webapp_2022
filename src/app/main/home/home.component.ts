import {Component, OnInit, OnDestroy} from '@angular/core';
import {FuseConfigService} from '@fuse/services/config';
import {HttpService} from '../../shared/services/http.service';
import {Subscription} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
    selector: 'home',
    templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {

    config: any;
    loginSubscription: Subscription;
    action: string = 'none';
    isLoggedIn: boolean = false;
    plan: string = 'standard';

    constructor(private _fuseConfigService: FuseConfigService,
                private httpService: HttpService,
                private activatedRoute: ActivatedRoute,
                private router: Router
    ) {
        if (!this.httpService.loggedIn) {
            this.setLoggedInView(false);
        } else {
            this.isLoggedIn = true;
        }
    }

    ngOnInit(): void {
        // Subscribe to config change
        this._fuseConfigService.config$
            .subscribe((config) => {
                this.config = config;
            });

        this.loginSubscription = this.httpService.getLoggedInState().subscribe(status => {
            this.setLoggedInView(status.state);
        });
        this.activatedRoute.queryParams.subscribe((param: any) => {
            if (param['login'] !== undefined) {
                this.action = 'login';
            }
        });
        if (this.isLoggedIn) {
            this.router.navigate(['/dashboard']);
        }
    }

    ngOnDestroy(): void {
        this.loginSubscription.unsubscribe();
    }

    protected setLoggedInView(isLoggedIn: boolean): void {
        this.isLoggedIn = isLoggedIn;
        if (isLoggedIn) {
            this.router.navigate(['/dashboard']);
        }
    }

    public gotoRegister(event): void {
        this.router.navigate(['/register']);
    }

    public toggleLogin(event): void {
        if (this.action === 'login') {
            this.action = 'none';
        } else {
            this.action = 'login';
        }
        event.stopPropagation();
    }
}
