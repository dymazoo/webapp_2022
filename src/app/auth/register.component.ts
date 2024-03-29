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
    selector: 'signup',
    templateUrl: './register.component.html'
})

export class RegisterComponent implements OnInit, OnDestroy {

    @Output() registered = new EventEmitter<boolean>();

    @ViewChild('name') nameElement: ElementRef;

    public registerForm: FormGroup;
    public formErrors: string[] = [];
    public plan: string = 'consultant';
    public usePackages: boolean = false;
    public errors = [];
    public user: User = new User();
    public client: Client = new Client();
    public action: string = 'details';
    public yearlyBilling: boolean = false;
    public usdCurrency: boolean = false;
    public separateDB: boolean = false;
    public fullHistory: boolean = false;
    public monthlyPlanPrice: number = 0;
    public yearlyPlanPrice: number = 0;
    public profilePrice: number = 0;
    public optionsPrice: number = 0;
    public monthlyPrice: number = 0;
    public yearlyPrice: number = 0;
    public payableToday: number = 0;
    public nextBillingDate: string = '';
    public offer: string = '';
    public couponPlan: string = '';
    public paymentReady: boolean = false;
    private stripe: any;
    private elements: any;
    private clientId: string = '';
    private pricingData: any;

    stripePromise = loadStripe(environment.stripeKey);

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
        this.client.coupon = '';
        this.activatedRoute.queryParams.subscribe((param: any) => {
//            if (param['plan'] !== undefined) {
//                this.plan = param['plan'];
//            }
            if (param['currency'] !== undefined) {
                if (param['currency'] === 'usd') {
                    this.usdCurrency = true;
                }
            }
            if (param['billing'] !== undefined) {
                if (param['billing'] === 'yearly') {
                    this.yearlyBilling = true;
                }
            }
            if (param['coupon'] !== undefined) {
                this.client.coupon = param['coupon'];
            }
        });

        this.client.plan = this.plan;
        this.applyCoupon(this.client.coupon);
        this.getDetails(this.plan);
    }

    ngOnDestroy(): void {
    }

    onBack(): void {
        this.router.navigate(['/pricing']);
    }

    formatSliderLabel(value: number): string {
        if (value >= 500) {
            const blocks = Math.round(value / 500);
            return (blocks / 2) + 'k';
        }

        return '0';
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
            clientProfiles: [this.client.profiles],
            clientCoupon: [this.client.coupon],
        }, {
            validator: GlobalValidator.equals('password', 'confirmPassword', 'misMatchedPasswords')
        });

        setTimeout(() => {
            this.nameElement.nativeElement.focus();
        }, 100);
    }

    setPlan(event): void {
        const plan = this.registerForm.controls['clientPlan'].value;
        this.client.plan = plan;
        this.plan = plan;
        if (plan === 'analyst') {
            this.client.profiles = this.pricingData.analystProfiles;
            this.client.options = '';
            this.separateDB = false;
        }
        if (plan === 'specialist') {
            this.client.profiles = this.pricingData.specialistProfiles;
            this.client.options = '';
            this.separateDB = false;
        }
        if (plan === 'consultant') {
            this.client.profiles = this.pricingData.consultantProfiles;
        }
        this.registerForm.controls['clientProfiles'].setValue(this.client.profiles);
        this.offer = '';
        this.client.offer = '';
        this.client.coupon = '';
        this.registerForm.controls['clientCoupon'].setValue(this.client.coupon);
        this.doCalculate();
    }

    setBilling(event, billing): void {
        event.stopPropagation();
        this.client.billing = billing;
        if (billing === 'monthly') {
            this.yearlyBilling = false;
        } else {
            this.yearlyBilling = true;
        }
        this.doCalculate();
    }

    setCurrency(event, currency): void {
        event.stopPropagation();
        this.client.currency = currency;
        if (currency === 'gbp') {
            this.usdCurrency = false;
        } else {
            this.usdCurrency = true;
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

    couponChange(event): void {
        const coupon = this.registerForm.controls['clientCoupon'].value;
        this.applyCoupon(coupon);
    }

    applyCoupon(coupon): void {
        this.offer = '';
        if (coupon.length > 0) {
            this.httpService.getEntity('coupon', coupon).subscribe(result => {
                this.offer = result;
                this.couponPlan = '';
                if (result.length === 0) {
                    this.errors = ['Coupon is not valid, or no longer active'];
                }
                if (this.offer.substring(0, 4) === 'plan') {
                    this.couponPlan = this.offer.substring(4, 5);
                    this.offer = this.offer.substring(6);
                }
                let applyCoupon = true;
                if (this.couponPlan === 'A' && this.client.plan !== 'analyst') {
                    this.errors = ['Coupon is not valid for this plan'];
                    applyCoupon = false;
                }
                if (this.couponPlan === 'S' && this.client.plan !== 'specialist') {
                    this.errors = ['Coupon is not valid for this plan'];
                    applyCoupon = false;
                }
                if (this.couponPlan === 'C' && this.client.plan !== 'consultant') {
                    this.errors = ['Coupon is not valid for this plan'];
                    applyCoupon = false;
                }
                if (applyCoupon) {
                    this.client.offer = this.offer;
                    this.client.coupon = coupon;
                } else {
                    this.offer = '';
                    this.client.offer = '';
                    this.client.coupon = '';
                    this.registerForm.controls['clientCoupon'].setValue(this.client.coupon);
                }
                this.doCalculate();
            }, (error) => {
                this.errors = ['Coupon is not valid, or no longer active'];
                this.doCalculate();
            });
        } else {
            this.doCalculate();
        }
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
        let profileAdditionCost = this.pricingData.usd.profileAdditionCost;
        if (currency === 'gbp') {
            profileAdditionCost = this.pricingData.gbp.profileAdditionCost;
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

        if (billing === 'monthly') {
            if (freeMonths === -1) {
                this.payableToday = 0;
                this.nextBillingDate = 'Never';
                this.client.nextBillingDate = 'never';
            } else {
                if (freeMonths === 0) {
                    this.payableToday = monthlyPrice * ((100 - discount) / 100);
                } else {
                    this.payableToday = 1;
                }
                this.nextBillingDate = moment().add(freeMonths , 'month').format('LL');
                this.client.nextBillingDate = moment().add(freeMonths, 'month').format('YYYY-MM-DD');
            }
        } else {
            monthlyPrice = (monthlyPlanPrice + profilePrice + optionsPrice) * 12;
            yearlyPrice = (yearlyPlanPrice + profilePrice + optionsPrice) * 12;

            if (freeMonths === -1) {
                this.payableToday = 0;
                this.nextBillingDate = 'Never';
                this.client.nextBillingDate = 'never';
            } else {
                this.payableToday = (yearlyPlanPrice + profilePrice + optionsPrice) * (12 - freeMonths) * ((100 - discount) / 100);
                this.nextBillingDate = moment().add(1, 'year').format('LL');
                this.client.nextBillingDate = moment().add(1, 'year').format('YYYY-MM-DD');
            }
        }
        this.monthlyPlanPrice = monthlyPlanPrice;
        this.yearlyPlanPrice = yearlyPlanPrice;
        this.profilePrice = profilePrice;
        this.monthlyPrice = monthlyPrice;
        this.yearlyPrice = yearlyPrice;
        this.optionsPrice = optionsPrice;
    }

    register(): void {
        this.user.name = this.registerForm.controls['name'].value.trim();
        this.user.email = this.registerForm.controls['email'].value.trim();
        this.user.password = this.registerForm.controls['password'].value.trim();
        this.user.confirmPassword = this.registerForm.controls['confirmPassword'].value.trim();
        this.user.layout = 'modern';
        this.user.scheme = 'light';
        this.user.theme = 'theme-brand';
        this.client.name = this.registerForm.controls['clientName'].value.trim();
        this.client.plan = this.registerForm.controls['clientPlan'].value;
        this.errors = [];

        this.httpService.register(this.user, this.client)
            .subscribe(data => {
                if (data.clientId !== undefined) {
                    this.clientId = data.clientId;
                    if (data.requirePayment !== undefined && data.requirePayment === 'yes') {
                        this.action = 'payment';
                        this.handlePayment();
                    } else {
                        this.registered.emit(true);
                        this.router.navigate(['/register-complete']);
                    }
                } else {
                    this.errors = ['Error registering - please contact support'];
                }
            }, (error) => {
                this.errors = error;
            });

    }

    async handlePayment() {
        const stripe = await this.stripePromise;
        this.stripe = stripe;
        const paymentData = {'clientId': this.clientId, 'amount': this.payableToday};
        this.httpService.saveEntity('register-pre-payment', paymentData)
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
                return_url: 'https://app.dymazoo.com/payment/' + this.clientId,
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

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
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

    public gotoLogin(event): void {
        this.router.navigate(['/home']);
    }

    public gotoPricing(event): void {
        this.router.navigate(['/pricing']);
    }

}

