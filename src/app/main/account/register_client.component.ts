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
    AfterViewInit, ViewChild
} from '@angular/core';
import {Location} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, FormControl, Validators} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {TranslocoService} from '@ngneat/transloco';
import {fuseAnimations} from '@fuse/animations';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable, Subject} from 'rxjs';

import {HttpService} from 'app/shared/services/http.service';
import {AbandonDialogService} from 'app/shared/services/abandon-dialog.service';
import {ConfirmDialogComponent} from 'app/shared/components/confirm-dialog.component';
import {Client} from 'app/shared/models/client';
import {GlobalValidator} from 'app/shared/global-validator';
import * as moment from 'moment';
import {environment} from '../../../environments/environment';
import {User} from 'app/shared/models/user';
import {CrossFieldErrorMatcher} from 'app/shared/cross-field-errormatcher';

@Component({
    selector: 'register-client',
    templateUrl: './register_client.component.html',
    animations: fuseAnimations
})

export class RegisterClientComponent implements OnInit, OnDestroy, AfterViewInit {

    public errors = [];

    public registerForm: FormGroup;
    public user: User = new User();
    public client: Client = new Client();
    public usePackages: boolean = false;
    public plan: string = 'consultant';

    public monthlyPlanPrice: number = 0;
    public yearlyPlanPrice: number = 0;
    public profilePrice: number = 0;
    public monthlyPrice: number = 0;
    public yearlyPrice: number = 0;
    public optionsPrice: number = 0;

    public currentPlan: string = '';
    public currentProfiles: number = 0;
    public usdCurrency: boolean = false;
    public separateDB: boolean = false;
    public fullHistory: boolean = false;

    public currentCurrency: string = '';
    public currentBilling: string = '';
    public currentNextBillingDate: string = '';
    public payableToday: number = 0;
    public nextBillingDate: string = '';
    public yearlyBilling: boolean = false;
    public countryList;
    public timeZoneList;
    public action: string = 'account';
    public coupon: string = '';
    public offer: string = '';
    public couponPlan: string = '';

    errorMatcher = new CrossFieldErrorMatcher();

    private touchStart = 0;
    private _unsubscribeAll: Subject<any>;
    private pricingData: any;
    private clientId: string = '';
    private elements: any;


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
        this._unsubscribeAll = new Subject();
        this.pricingData = this.httpService.getPricingData();
        this.httpService.getEntity('agency-coupon', []).subscribe(result => {
            this.coupon = result['coupon'];
            this.offer = result['offer'];
            this.couponPlan = '';
            if (result.length === 0) {
                this.errors = ['Coupon is not valid, or no longer active'];
            }
            if (this.offer.substring(0, 4) === 'plan') {
                this.couponPlan = this.offer.substring(4, 5);
                this.offer = this.offer.substring(6);
            }
            if (this.couponPlan === 'A' && this.client.plan !== 'analyst') {
                this.errors = ['Coupon is not valid for this plan'];
            }
            if (this.couponPlan === 'S' && this.client.plan !== 'specialist') {
                this.errors = ['Coupon is not valid for this plan'];
            }
            if (this.couponPlan === 'C' && this.client.plan !== 'consultant') {
                this.errors = ['Coupon is not valid for this plan'];
            }
            this.doCalculate();
        }, (error) => {
            this.errors = ['Coupon is not valid, or no longer active'];
            this.doCalculate();
        });
    }

    ngOnInit(): void {
        this.getDetails(this.plan);
    }


    getDetails(plan): void {
        this.action = 'details';
        this.plan = plan;
        this.client.plan = plan;
        if (plan === 'analyst') {
            this.client.profiles = this.pricingData.analystProfiles;
        }
        if (plan === 'specialist') {
            this.client.profiles = this.pricingData.specialistProfiles;
        }
        if (plan === 'consultant') {
            this.client.profiles = this.pricingData.consultantProfiles;
        }
        if (this.yearlyBilling) {
            this.client.billing = 'yearly';
        } else {
            this.client.billing = 'monthly';
        }
        if (this.usdCurrency) {
            this.client.currency = 'usd';
        } else {
            this.client.currency = 'gbp';
        }
        if (this.separateDB) {
            this.client.options = 'PRIVATE';
            if (this.fullHistory) {
                this.client.options = 'PRIVATE:FULL';
            }
        } else {
            this.client.options = '';
        }
        this.doCalculate();

        this.registerForm = this._formBuilder.group({
            name: [this.user.name, [Validators.required]],
            email: [this.user.email, [Validators.required, Validators.email]],
            password: [this.user.password, [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.compose([Validators.required])],
            clientName: ['', Validators.required],
            clientPlan: [this.client.plan, Validators.required],
            clientBilling: [this.client.billing, Validators.required],
            clientProfiles: [this.client.profiles]
        }, {
            validator: GlobalValidator.equals('password', 'confirmPassword', 'misMatchedPasswords')
        });
    }

    save(): void {
        this.errors = [];

        let client = {
            user_name: this.registerForm.controls['name'].value.trim(),
            user_email: this.registerForm.controls['email'].value.trim(),
            password: this.registerForm.controls['password'].value.trim(),
            password_confirmation: this.registerForm.controls['confirmPassword'].value.trim(),
            layout: 'modern',
            scheme: 'light',
            theme: 'theme-brand',
            client_name: this.registerForm.controls['clientName'].value.trim(),
            client_plan: this.registerForm.controls['clientPlan'].value,
            client_profiles: this.registerForm.controls['clientProfiles'].value,
            client_options: this.client.options
        };

        this.httpService.saveEntity('register-client', client)
            .subscribe((data) => {
                this._snackBar.open('New client registered', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
                this.registerForm.markAsPristine();
                this.router.navigate(['/dashboard']);
            }, (errors) => {
                this.errors = errors;
            });
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    onBack(): void {
        this.location.back();
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.httpService.syncCheckLoggedIn() && this.registerForm.dirty) {
            return this.abandonDialogService.showDialog();
        } else {
            return true;
        }
    }

    formatSliderLabel(value: number): string {
        if (value >= 500) {
            const blocks = Math.round(value / 500);
            return (blocks / 2) + 'k';
        }

        return '0';
    }

    setPlan(event): void {
        const plan = this.registerForm.controls['plan'].value;
        let serviceDowngrade = false;
        if (this.currentPlan === 'consultant' && plan !== 'consultant') {
            serviceDowngrade = true;
        }
        if (this.currentPlan === 'specialist' && plan === 'analyst') {
            serviceDowngrade = true;
        }
        if (serviceDowngrade) {
            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                minWidth: '33%',
                width: '300px',
                data: {
                    confirmMessage: 'Changing your plan will reduce the features you are using!',
                    informationMessage: 'Your current features will remain active until the end of the current period',
                    buttons: 'ok'
                }
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.client.plan = plan;
                    this.registerForm.controls['profiles'].setValue(this.client.profiles);
                    this.doCalculate();
                }
            });
        } else {
            this.client.plan = plan;
            if (plan === 'specialist' && this.client.profiles < this.pricingData.specialistProfiles) {
                this.client.profiles = this.pricingData.specialistProfiles;
            }
            if (plan === 'consultant' && this.client.profiles < this.pricingData.consultantProfiles) {
                this.client.profiles = this.pricingData.consultantProfiles;
            }
            this.registerForm.controls['profiles'].setValue(this.client.profiles);
            this.doCalculate();
        }
    }

    setBilling(event, billing): void {
        this.client.billing = billing;
        if (billing === 'monthly') {
            this.yearlyBilling = false;
        } else {
            this.yearlyBilling = true;
        }
        this.doCalculate();
    }

    setSeparateDB(event, separate): void {
        event.stopPropagation();
        if (separate === 'no') {
            this.client.options = '';
            this.separateDB = false;
            this.fullHistory = false;
        } else {
            this.client.options = 'PRIVATE';
            this.separateDB = true;
            this.fullHistory = false;
        }
        this.doCalculate();
    }

    setFullHistory(event, history): void {
        event.stopPropagation();
        if (history === 'no') {
            if (!this.separateDB) {
                this.client.options = '';
            } else {
                this.client.options = 'PRIVATE';
            }
            this.fullHistory = false;
        } else {
            this.client.options = 'PRIVATE:FULL';
            this.fullHistory = true;
        }
        this.doCalculate();
    }

    onSliderChange(event): void {
        const profiles = this.registerForm.controls['clientProfiles'].value;
        this.client.profiles = profiles;
        const plan = this.client.plan;
        if (plan === 'analyst' && profiles < this.pricingData.analystProfiles) {
            this.client.profiles = this.pricingData.analystProfiles;
        }
        if (plan === 'specialist' && profiles < this.pricingData.specialistProfiles) {
            this.client.profiles = this.pricingData.specialistProfiles;
        }
        if (plan === 'consultant' && profiles < this.pricingData.consultantProfiles) {
            this.client.profiles = this.pricingData.consultantProfiles;
        }
        this.registerForm.controls['clientProfiles'].setValue(this.client.profiles);
        this.doCalculate();
    }

    doCalculate(): void {
        const plan = this.client.plan;
        const billing = this.client.billing;
        const currency = this.client.currency;
        const profiles = this.client.profiles;
        const options = this.client.options;

        let freeProfiles = this.pricingData.analystProfiles;
        let paidProfiles = 0;
        let profilePrice = 0;
        let monthlyPlanPrice = 0;
        let yearlyPlanPrice = 0;
        let monthlyPrice = 0;
        let yearlyPrice = 0;
        let optionsPrice = 0;

        let profileAdditionCost = this.pricingData.usd.profileAdditionCost;
        if (currency === 'gbp') {
            profileAdditionCost = this.pricingData.gbp.profileAdditionCost;
        }

        if (plan === 'analyst') {
            freeProfiles = this.pricingData.analystProfiles;
            if (currency === 'usd') {
                monthlyPlanPrice = this.pricingData.usd.analystMonthly;
                yearlyPlanPrice = this.pricingData.usd.analystYearly;
            } else {
                monthlyPlanPrice = this.pricingData.gbp.analystMonthly;
                yearlyPlanPrice = this.pricingData.gbp.analystYearly;
            }
        }
        if (plan === 'specialist') {
            freeProfiles = this.pricingData.specialistProfiles;
            if (currency === 'usd') {
                monthlyPlanPrice = this.pricingData.usd.specialistMonthly;
                yearlyPlanPrice = this.pricingData.usd.specialistYearly;
            } else {
                monthlyPlanPrice = this.pricingData.gbp.specialistMonthly;
                yearlyPlanPrice = this.pricingData.gbp.specialistYearly;
            }
        }
        if (plan === 'consultant') {
            freeProfiles = this.pricingData.consultantProfiles;
            if (currency === 'usd') {
                monthlyPlanPrice = this.pricingData.usd.consultantMonthly;
                yearlyPlanPrice = this.pricingData.usd.consultantYearly;
                if (options === 'PRIVATE:FULL') {
                    optionsPrice = this.pricingData.usd.optionsPrivateFull;
                }
                if (options === 'PRIVATE') {
                    optionsPrice = this.pricingData.usd.optionsPrivate;
                }
            } else {
                monthlyPlanPrice = this.pricingData.gbp.consultantMonthly;
                yearlyPlanPrice = this.pricingData.gbp.consultantYearly;
                if (options === 'PRIVATE:FULL') {
                    optionsPrice = this.pricingData.gbp.optionsPrivateFull;
                }
                if (options === 'PRIVATE') {
                    optionsPrice = this.pricingData.gbp.optionsPrivate;
                }
            }
        }
        if (profiles > freeProfiles) {
            paidProfiles = profiles - freeProfiles;
            profilePrice = paidProfiles / this.pricingData.profileAddition * profileAdditionCost;
        }

        monthlyPrice = monthlyPlanPrice + profilePrice + optionsPrice;
        yearlyPrice = yearlyPlanPrice + profilePrice + optionsPrice;

        let freeMonths = 0;
        let discount = 0;
        if (this.offer.substring(0, 4) === 'free') {
            const months = this.offer.substring(5);
            if (months === 'forever') {
                freeMonths = -1;
            } else {
                freeMonths = parseInt(this.offer.substring(5), 10);
            }
        }
        if (this.offer.substring(0, 8) === 'discount') {
            discount = parseInt(this.offer.substring(9), 10);
        }

        if (freeMonths === -1) {
            monthlyPrice = 0;
            yearlyPrice = 0;
        }
        if (discount > 0) {
            monthlyPrice = Math.round((monthlyPrice * ((100 - discount) / 100) * 100) / 100);
            yearlyPrice = Math.round((yearlyPrice * ((100 - discount) / 100) * 100) / 100);
        }
        this.monthlyPlanPrice = monthlyPlanPrice;
        this.yearlyPlanPrice = yearlyPlanPrice;
        this.profilePrice = profilePrice;
        this.monthlyPrice = monthlyPrice;
        this.yearlyPrice = yearlyPrice;
        this.optionsPrice = optionsPrice;
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        if (control.hasError('telephone')) {
            returnVal = name + ' is invalid!';
        }
        if (control.hasError('email')) {
            returnVal = name + ' is invalid!';
        }
        if (control.hasError('minlength')) {
            returnVal = name + ' must be at least 8 characters long!';
        }
        if (control.hasError('misMatchedPasswords')) {
            returnVal = 'Passwords do not match!';
        }
        return returnVal;
    }

    clearErrors(): void {
        this.errors = [];
    }

}



