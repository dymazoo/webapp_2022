import {
    Component,
    OnDestroy,
    OnInit,
    EventEmitter,
    Output,
    Input,
    ViewChild,
    ElementRef,
    ViewEncapsulation
} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {HttpService} from 'app/shared/services/http.service';
import {GlobalValidator} from 'app/shared/global-validator';
import {CrossFieldErrorMatcher} from 'app/shared/cross-field-errormatcher';
import {User} from 'app/shared/models/user';
import {Client} from 'app/shared/models/client';
import {TranslocoService} from '@ngneat/transloco';
import {loadStripe} from '@stripe/stripe-js';
import {environment} from '../../environments/environment';
import * as moment from 'moment';

@Component({
    selector: 'pricing',
    templateUrl: './pricing.component.html'
})

export class PricingComponent implements OnInit, OnDestroy {


    public plan: string = 'analyst';
    public user: User = new User();
    public client: Client = new Client();
    public yearlyBilling: boolean = true;
    public usdCurrency: boolean = true;
    public offer: string = '';
    public couponPlan: string = '';
    private clientId: string = '';
    private pricingData: any;

    errorMatcher = new CrossFieldErrorMatcher();

    constructor(
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private _translocoService: TranslocoService,
    ) {
        this._translocoService.setActiveLang('en');
        this.pricingData = this.httpService.getPricingData();
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((param: any) => {
            if (param['plan'] !== undefined) {
                this.plan = param['plan'];
            }
        });

        this.client.plan = this.plan;
    }

    ngOnDestroy(): void {
    }

    public gotoRegister(plan): void {
        let currency = 'usd';
        let billing = 'monthly';
        if (this.usdCurrency) {
            currency ='usd';
        }
        if (this.yearlyBilling) {
            billing ='yearly';
        }
        this.router.navigate(['/signup'], { queryParams: { plan: plan, currency: currency, billing: billing }});
    }

    public gotoLogin(event): void {
        this.router.navigate(['/home']);
    }

}

