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
import {loadStripe} from '@stripe/stripe-js';

import {HttpService} from 'app/shared/services/http.service';
import {AbandonDialogService} from 'app/shared/services/abandon-dialog.service';
import {ConfirmDialogComponent} from 'app/shared/components/confirm-dialog.component';
import {Client} from 'app/shared/models/client';
import {GlobalValidator} from 'app/shared/global-validator';
import * as moment from 'moment';
import {environment} from '../../../environments/environment';

@Component({
    selector: 'account-management',
    templateUrl: './accountmanagement.component.html',
    animations: fuseAnimations
})

export class AccountManagementComponent implements OnInit, OnDestroy, AfterViewInit {

    public errors = [];

    public accountForm: FormGroup;
    public canClientAdmin = false;
    public client: Client;
    public hasData = false;
    public usePackages: boolean = false;

    public monthlyPlanPrice: number = 0;
    public yearlyPlanPrice: number = 0;
    public profilePrice: number = 0;
    public monthlyPrice: number = 0;
    public yearlyPrice: number = 0;

    public currentPlan: string = '';
    public currentProfiles: number = 0;
    public usdCurrency: boolean = true;
    public currentCurrency: string = '';
    public currentBilling: string = '';
    public currentNextBillingDate: string = '';
    public payableToday: number = 0;
    public nextBillingDate: string = '';
    public yearlyBilling: boolean = true;
    public countryList;
    public timeZoneList;
    public leaving: boolean = false;
    public paymentReady: boolean = false;
    public action: string = 'account';

    stripePromise = loadStripe(environment.stripeKey);

    private touchStart = 0;
    private _unsubscribeAll: Subject<any>;
    private pricingData: any;
    private stripe: any;
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

        // Check permissions
        this.canClientAdmin = this.httpService.hasPermission('client_admin');
    }

    ngOnInit(): void {
        this.httpService.getEntity('client', '')
            .subscribe((result) => {
                this.client = result;
                this.currentPlan = this.client.plan;
                this.currentProfiles = this.client.profiles;
                this.currentCurrency = this.client.currency;
                this.currentBilling = this.client.billing;
                this.currentNextBillingDate = this.client.nextBillingDate;
                this.clientId = this.client.clientId;
                this.hasData = true;
                if (this.client.billing === 'monthly') {
                    this.yearlyBilling = false;
                } else {
                    this.yearlyBilling = true;
                }
                if (this.client.currency === 'gbp') {
                    this.usdCurrency = false;
                } else {
                    this.usdCurrency = true;
                }
                if (this.client.nextBillingDate === 'never') {
                    this.nextBillingDate = 'Never';
                } else {
                    this.nextBillingDate = moment(this.client.nextBillingDate, 'YYYY-MM-DD').format('LL');
                }
                this.countryList = result.countryList;
                this.timeZoneList = result.timeZoneList;
                if (this.client.leftDate.length > 0) {
                    this.leaving = true;
                    this.nextBillingDate = 'Subscription Ended';
                } else {
                    this.leaving = false;
                }
                this.populateForm();
            }, (errors) => {
                this.errors = errors;
            });
        this.accountForm = this._formBuilder.group({
            name: ['', [Validators.required]],
            address1: [''],
            address2: [''],
            city: [''],
            postcode: [''],
            country: [''],
            timezone: [''],
            telephone: ['',  [Validators.compose([GlobalValidator.telephoneFormat])]],
            billing: ['', [Validators.required]],
//            plan: ['', [Validators.required]],
            profiles: [''],
        }, {});

    }

    populateForm(): void {
        this.accountForm.controls['name'].setValue(this.client.name);
        this.accountForm.controls['address1'].setValue(this.client.address1);
        this.accountForm.controls['address2'].setValue(this.client.address2);
        this.accountForm.controls['city'].setValue(this.client.city);
        this.accountForm.controls['postcode'].setValue(this.client.postcode);
        this.accountForm.controls['country'].setValue(this.client.country);
        this.accountForm.controls['timezone'].setValue(this.client.timeZone);
        this.accountForm.controls['billing'].setValue(this.client.billing);
//        this.accountForm.controls['plan'].setValue(this.client.plan);
        this.accountForm.controls['profiles'].setValue(this.client.profiles);
        this.accountForm.controls['telephone'].setValue(this.client.telephone);
        this.doCalculate();
    }

    save(): void {
        this.errors = [];
        this.client.name = this.accountForm.controls['name'].value;
        this.client.address1 = this.accountForm.controls['address1'].value;
        this.client.address2 = this.accountForm.controls['address2'].value;
        this.client.city = this.accountForm.controls['city'].value;
        this.client.postcode = this.accountForm.controls['postcode'].value;
        this.client.country = this.accountForm.controls['country'].value;
        this.client.timeZone = this.accountForm.controls['timezone'].value;
        this.client.billing = this.accountForm.controls['billing'].value;
//        this.client.plan = this.accountForm.controls['plan'].value;
        this.client.plan = 'consultant';
        this.client.profiles = this.accountForm.controls['profiles'].value;
        this.client.telephone = this.accountForm.controls['telephone'].value;
        this.client.payableToday = this.payableToday;

        this.httpService.saveEntity('client', this.client)
            .subscribe((data) => {
                this._snackBar.open('Account saved', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
                this.accountForm.markAsPristine();
                this.currentPlan = this.client.plan;
                this.currentProfiles = this.client.profiles;
                this.currentBilling = this.client.billing;
                this.currentNextBillingDate = this.client.nextBillingDate;
                const retryPayable = this.payableToday;
                this.payableToday = 0;
                if (data.result !== undefined && data.result === 'Authorise') {
                    this.authorisePaymentDetails(data.client_secret, data.payment_intent, data.payment_method, retryPayable);
                }
            }, (errors) => {
                this.errors = errors;
            });
    }

    endSubscription(): void {
        this.errors = [];
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '75%',
            width: '300px',
            data: {
                confirmMessage: 'Are you sure you want to end your subscription? ALL YOUR DATA WILL BE LOST!',
                informationMessage: 'Your account will stay active until the end of the current period. You can change your mind at any time'
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.httpService.saveEntity('end-subscription', this.client)
                    .subscribe((data: Response) => {
                        this.leaving = true;
                        this.nextBillingDate = 'Subscription Ended';
                        this._snackBar.open('Subscription Ended', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });
                        this.onCancel();
                    }, (errors) => {
                        this.errors = errors;
                    });
            }
        });


    }

    cancelLeaving(): void {
        this.errors = [];

        this.httpService.saveEntity('cancel-leaving', this.client)
            .subscribe((data: Response) => {
                this.leaving = false;
                this._snackBar.open('Subscription Extended', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
                this.onCancel();
            }, (errors) => {
                this.errors = errors;
            });
    }

    async authorisePaymentDetails(clientSecret: any, paymentIntentId: any, paymentMethodId: any, payableToday) {
        const stripe = await this.stripePromise;
        this.stripe = stripe;
        const {error} = await this.stripe.confirmCardPayment(clientSecret, {
            payment_method: paymentMethodId
        });

        if (error) {
            this.errors = ['Authorisation failed'];
            this.payableToday = payableToday;
            this.httpService.paymentDetailsFailed({'clientId': this.clientId, 'reference': paymentIntentId})
                .subscribe(data => {
                }, (errors) => {
                    this.errors = errors;
                });
        } else {
            this.httpService.confirmPaymentDetails({'clientId': this.clientId, 'reference': paymentIntentId})
                .subscribe(data => {
                }, (errors) => {
                    this.errors = errors;
                });
        }
    }

    async paymentDetails() {
        const stripe = await this.stripePromise;
        this.stripe = stripe;
        const paymentData = {};
        this.httpService.saveEntity('payment-details', paymentData)
            .subscribe((data) => {
                this.action = 'payment';
                const myTheme = 'stripe' as const;
                const stripeAppearance = {
                    theme: myTheme,
                    variables: {
                        colorPrimary: '#0570de',
                        colorBackground: '#ffffff',
                        colorText: '#30313d',
                        colorDanger: '#df1b41',
                        fontFamily: 'Ideal Sans, system-ui, sans-serif',
                        spacingUnit: '2px',
                        borderRadius: '4px',
                    }
                };
                const options = {
                    clientSecret: data.client_secret,
                    appearance: stripeAppearance,
                };
                this.elements = stripe.elements(options);

                // Create and mount the Payment Element
                const paymentElement = this.elements.create('payment');
                paymentElement.on('change', (event) => {
                    if (event.complete) {
                        this.paymentReady = true;
                    }
                });
                setTimeout(() => {
                    paymentElement.mount('#payment-element');
                }, 1);
            }, (errors) => {
                this.errors = errors;
            });
    }

    async processPayment() {
        this.paymentReady = false;
        const {error} = await this.stripe.confirmPayment({
            //`Elements` instance that was used to create the Payment Element
            elements: this.elements,
            confirmParams: {
                return_url: 'https://app.dymazoo.com/account/payment-details/' + this.clientId,
            },
        });

        if (error) {
            // This point will only be reached if there is an immediate error when
            // confirming the payment. Show error to your customer (for example, payment
            // details incomplete)
            const messageContainer = document.querySelector('#error-message');
            messageContainer.textContent = error.message;
            this.paymentReady = true;
        } else {
            // Your customer will be redirected to your `return_url`. For some payment
            // methods like iDEAL, your customer will be redirected to an intermediate
            // site first to authorize the payment, then redirected to the `return_url`.
        }
    }

    onCancel(): void {
        this.httpService.getEntity('client', '')
            .subscribe(result => {
                this.hasData = true;
                this.client = result;

                this.currentPlan = this.client.plan;
                this.currentProfiles = this.client.profiles;
                this.currentBilling = this.client.billing;
                this.currentNextBillingDate = this.client.nextBillingDate;

                if (this.client.billing === 'monthly') {
                    this.yearlyBilling = false;
                } else {
                    this.yearlyBilling = true;
                }
                if (this.client.nextBillingDate === 'never') {
                    this.nextBillingDate = 'Never';
                } else {
                    this.nextBillingDate = moment(this.client.nextBillingDate, 'YYYY-MM-DD').format('LL');
                }
                this.countryList = result.countryList;
                this.timeZoneList = result.timeZoneList;
                if (this.client.leftDate.length > 0) {
                    this.leaving = true;
                    this.nextBillingDate = 'Subscription Ended';
                } else {
                    this.leaving = false;
                }
                this.populateForm();
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
        if (this.httpService.syncCheckLoggedIn() && this.accountForm.dirty) {
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
        const plan = this.accountForm.controls['plan'].value;
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
                    this.accountForm.controls['profiles'].setValue(this.client.profiles);
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
            this.accountForm.controls['profiles'].setValue(this.client.profiles);
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

    onSliderChange(event): void {
        const profiles = this.accountForm.controls['profiles'].value;
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
        this.accountForm.controls['profiles'].setValue(this.client.profiles);
        this.doCalculate();
    }

    doCalculate(): void {
        const plan = this.client.plan;
        const billing = this.client.billing;
        const currency = this.client.currency;
        const profiles = this.client.profiles;

        let currentFreeProfiles = this.pricingData.analystProfiles;
        let currentPaidProfiles = 0;
        let currentProfilePrice = 0;
        let currentMonthlyPlanPrice = 0;
        let currentYearlyPlanPrice = 0;
        let currentMonthlyPrice = 0;
        let currentYearlyPrice = 0;

        let freeProfiles = this.pricingData.analystProfiles;
        let paidProfiles = 0;
        let profilePrice = 0;
        let monthlyPlanPrice = 0;
        let yearlyPlanPrice = 0;
        let monthlyPrice = 0;
        let yearlyPrice = 0;

        if (this.currentPlan === 'analyst') {
            currentFreeProfiles = this.pricingData.analystProfiles;
            if (currency === 'usd') {
                currentMonthlyPlanPrice = this.pricingData.usd.analystMonthly;
                currentYearlyPlanPrice = this.pricingData.usd.analystYearly;
            } else {
                currentMonthlyPlanPrice = this.pricingData.gbp.analystMonthly;
                currentYearlyPlanPrice = this.pricingData.gbp.analystYearly;
            }
        }
        if (this.currentPlan === 'specialist') {
            currentFreeProfiles = this.pricingData.specialistProfiles;
            if (currency === 'usd') {
                currentMonthlyPlanPrice = this.pricingData.usd.specialistMonthly;
                currentYearlyPlanPrice = this.pricingData.usd.specialistYearly;
            } else {
                currentMonthlyPlanPrice = this.pricingData.gbp.specialistMonthly;
                currentYearlyPlanPrice = this.pricingData.gbp.specialistYearly;
            }
        }
        if (this.currentPlan === 'consultant') {
            currentFreeProfiles = this.pricingData.consultantProfiles;
            if (currency === 'usd') {
                currentMonthlyPlanPrice = this.pricingData.usd.consultantMonthly;
                currentYearlyPlanPrice = this.pricingData.usd.consultantYearly;
            } else {
                currentMonthlyPlanPrice = this.pricingData.gbp.consultantMonthly;
                currentYearlyPlanPrice = this.pricingData.gbp.consultantYearly;
            }
        }
        let profileAdditionCost = this.pricingData.usd.profileAdditionCost;
        if (currency === 'gbp') {
            profileAdditionCost = this.pricingData.gbp.profileAdditionCost;
        }
        if (this.currentProfiles > freeProfiles) {
            currentPaidProfiles = this.currentProfiles - currentFreeProfiles;
            currentProfilePrice = currentPaidProfiles / this.pricingData.profileAddition * profileAdditionCost;
        }
        if (this.currentBilling === 'yearly') {
            currentMonthlyPlanPrice = currentMonthlyPlanPrice * 12;
            currentYearlyPlanPrice = currentYearlyPlanPrice * 12;
            currentProfilePrice = currentProfilePrice * 12;
        }

        currentMonthlyPrice = currentMonthlyPlanPrice + currentProfilePrice;
        currentYearlyPrice = currentYearlyPlanPrice + currentProfilePrice;

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
            } else {
                monthlyPlanPrice = this.pricingData.gbp.consultantMonthly;
                yearlyPlanPrice = this.pricingData.gbp.consultantYearly;
            }
        }
        if (profiles > freeProfiles) {
            paidProfiles = profiles - freeProfiles;
            profilePrice = paidProfiles / this.pricingData.profileAddition * profileAdditionCost;
        }

        monthlyPrice = monthlyPlanPrice + profilePrice;
        yearlyPrice = yearlyPlanPrice + profilePrice;

        this.payableToday = 0 ;
        if (this.currentNextBillingDate === 'never') {
            this.nextBillingDate = 'Never';
        } else {
            this.nextBillingDate = moment(this.currentNextBillingDate, 'YYYY-MM-DD').format('LL');
        }
        this.client.nextBillingDate = this.currentNextBillingDate;

        if (billing === 'monthly') {
            if (this.currentBilling === 'monthly' && this.currentNextBillingDate !== 'never') {
                if (currentMonthlyPrice < monthlyPrice) {
                    const daysToPay = moment(this.currentNextBillingDate, 'YYYY-MM-DD').diff(moment(), 'days');
                    if (daysToPay > 0) {
                        this.payableToday = (monthlyPrice - currentMonthlyPrice) / 30 * daysToPay;
                    }
                }
            }
        } else {
            // monthlyPlanPrice = monthlyPlanPrice * 12;
            // yearlyPlanPrice = yearlyPlanPrice * 12;
            // profilePrice = profilePrice * 12;

            monthlyPrice = (monthlyPlanPrice + profilePrice) * 12;
            yearlyPrice = (yearlyPlanPrice + profilePrice) * 12;

            if (this.currentNextBillingDate !== 'never') {
                if (this.currentBilling === 'yearly') {
                    if (currentYearlyPrice < yearlyPrice) {
                        this.payableToday = yearlyPrice - currentYearlyPrice;
                    }
                } else {
                    const daysToDiscount = moment(this.client.nextBillingDate, 'YYYY-MM-DD').diff(moment(), 'days');
                    let amountToDiscount = 0;
                    if (daysToDiscount > 0) {
                        amountToDiscount = currentMonthlyPrice / 30 * daysToDiscount;
                    }
                    this.payableToday = yearlyPrice - amountToDiscount;
                    this.nextBillingDate = moment(this.currentNextBillingDate, 'YYYY-MM-DD').add(1, 'year').format('LL');
                    this.client.nextBillingDate = moment(this.currentNextBillingDate, 'YYYY-MM-DD').add(1, 'year').format('YYYY-MM-DD');
                }
            }
        }
        this.monthlyPlanPrice = monthlyPlanPrice;
        this.yearlyPlanPrice = yearlyPlanPrice;
        this.profilePrice = profilePrice;
        this.monthlyPrice = monthlyPrice;
        this.yearlyPrice = yearlyPrice;
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        if (control.hasError('telephone')) {
            returnVal = name + ' is invalid!';
        }
        return returnVal;
    }

    clearErrors(): void {
        this.errors = [];
    }

}



