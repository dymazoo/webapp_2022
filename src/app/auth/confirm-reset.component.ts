import {Component, OnDestroy, OnInit} from '@angular/core';
import {HttpService} from '../shared/services/http.service';
import {Router, ActivatedRoute} from '@angular/router';
import {FuseConfigService} from '@fuse/services/config';
import {TranslocoService} from '@ngneat/transloco';
import {Subscription} from "rxjs";

@Component({
    selector: 'home',
    templateUrl: 'confirm-reset.component.html'
})
export class ConfirmResetComponent implements OnInit, OnDestroy {

    loginSubscription: Subscription;
    isLoggedIn: boolean = false;
    errors = [];
    action: string = 'none';

    constructor(private _fuseConfigService: FuseConfigService,
                private router: Router,
                private activatedRoute: ActivatedRoute,
                private httpService: HttpService,
                private _translocoService: TranslocoService
    ) {
        this._translocoService.setActiveLang('en');
    }

    ngOnInit(): void {
        this.loginSubscription = this.httpService.getLoggedInState().subscribe(status => {
            this.setLoggedInView(status.state);
        });
        if (this.isLoggedIn) {
            this.router.navigate(['/dashboard']);
        }
    }

    ngOnDestroy(): void {
        this.loginSubscription.unsubscribe();
    }

    public toggleLogin(event): void {
        if (this.action === 'login') {
            this.action = 'none';
        } else {
            this.action = 'login';
        }
        event.stopPropagation();
    }

    protected setLoggedInView(isLoggedIn: boolean): void {
        this.isLoggedIn = isLoggedIn;
        if (isLoggedIn) {
            this.router.navigate(['/dashboard']);
        }
    }

}

