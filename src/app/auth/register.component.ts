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
    selector: 'register',
    templateUrl: './register.component.html'
})

export class RegisterComponent implements OnInit, OnDestroy {

    @Output() registered = new EventEmitter<boolean>();

    @ViewChild('name') nameElement: ElementRef;

    public registerForm: FormGroup;
    public formErrors: string[] = [];
    public plan: string = 'analyst';
    public errors = [];
    public user: User = new User();
    public client: Client = new Client();
    public action: string = 'select';
    public yearlyBilling: boolean = true;
    public monthlyPlanPrice: number = 0;
    public yearlyPlanPrice: number = 0;
    public monthlyProfilePrice: number = 0;
    public yearlyProfilePrice: number = 0;
    public monthlyPrice: number = 0;
    public yearlyPrice: number = 0;
    public payableToday: number = 0;
    public nextBillingDate: string = '';
    public offer: string = '';
    public stripeKey: string = '';
    public paymentReady: boolean = false;
    private stripe: any;
    private elements: any;
    private clientId: string = '';

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
        this.stripeKey = moment().toISOString();
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

    onSelect(): void {
        this.action = 'select';
    }

    formatSliderLabel(value: number): string {
        if (value >= 1000) {
            return Math.round(value / 1000) + 'k';
        }

        return '0';
    }

    getDetails(plan): void {
        this.action = 'details';
        this.plan = plan;
        this.client.plan = plan;
        if (plan === 'analyst') {
            this.client.profiles = 5000;
        }
        if (plan === 'specialist') {
            this.client.profiles = 15000;
        }
        if (plan === 'consultant') {
            this.client.profiles = 50000;
        }
        if (this.yearlyBilling) {
            this.client.billing = 'yearly';
        } else {
            this.client.billing = 'monthly';
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
        if (plan === 'analyst') {
            this.client.profiles = 5000;
        }
        if (plan === 'specialist') {
            this.client.profiles = 15000;
        }
        if (plan === 'consultant') {
            this.client.profiles = 50000;
        }
        this.registerForm.controls['clientProfiles'].setValue(this.client.profiles);
        this.doCalculate();
    }

    setBilling(event): void {
        const billing = this.registerForm.controls['clientBilling'].value;
        this.client.billing = billing;
        if (billing === 'monthly') {
            this.yearlyBilling = false;
        } else {
            this.yearlyBilling = true;
        }
        this.doCalculate();
    }

    onSliderChange(event): void {
        const profiles = this.registerForm.controls['clientProfiles'].value;
        this.client.profiles = profiles;
        this.doCalculate();
    }

    couponChange(event): void {
        this.offer = '';
        const coupon = this.registerForm.controls['clientCoupon'].value;
        if (coupon.length > 0) {
            this.httpService.getEntity('coupon', coupon).subscribe(result => {
                this.offer = result;
                if (result.length === 0) {
                    this.errors = ['Coupon is not valid, or no longer active'];
                }
                this.client.offer = this.offer;
                this.client.coupon = coupon;
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
        const profiles = this.client.profiles;
        let freeProfiles = 5000;
        let paidProfiles = 0;
        let monthlyProfilePrice = 0;
        let yearlyProfilePrice = 0;
        let monthlyPlanPrice = 0;
        let yearlyPlanPrice = 0;
        let monthlyPrice = 0;
        let yearlyPrice = 0;
        if (billing === 'monthly') {
            if (plan === 'analyst') {
                freeProfiles = 5000;
                monthlyPlanPrice = 25;

            }
            if (plan === 'specialist') {
                freeProfiles = 15000;
                monthlyPlanPrice = 35;
            }
            if (plan === 'consultant') {
                freeProfiles = 50000;
                monthlyPlanPrice = 50;
            }
            if (profiles > freeProfiles) {
                paidProfiles = profiles - freeProfiles;
                monthlyProfilePrice = paidProfiles / 10000 * 5;
            }
            monthlyPrice = monthlyPlanPrice + monthlyProfilePrice;
        } else {
            if (plan === 'analyst') {
                freeProfiles = 5000;
                monthlyPlanPrice = 19.95;

            }
            if (plan === 'specialist') {
                freeProfiles = 15000;
                monthlyPlanPrice = 27.95;
            }
            if (plan === 'consultant') {
                freeProfiles = 50000;
                monthlyPlanPrice = 39.95;
            }
            if (profiles > freeProfiles) {
                paidProfiles = profiles - freeProfiles;
                monthlyProfilePrice = paidProfiles / 5000 * 2.5;
            }
            monthlyPrice = monthlyPlanPrice + monthlyProfilePrice;
        }
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

        yearlyPlanPrice = monthlyPlanPrice * 12;
        yearlyProfilePrice = monthlyProfilePrice * 12;
        yearlyPrice = yearlyPlanPrice + yearlyProfilePrice;
        this.monthlyPlanPrice = monthlyPlanPrice;
        this.yearlyPlanPrice = yearlyPlanPrice;
        this.monthlyProfilePrice = monthlyProfilePrice;
        this.yearlyProfilePrice = yearlyProfilePrice;
        this.monthlyPrice = monthlyPrice;
        this.yearlyPrice = yearlyPrice;

        if (billing === 'monthly') {
            if (freeMonths === -1) {
                this.payableToday = 0;
                this.nextBillingDate = 'Never';
                this.client.nextBillingDate = 'never';
            } else {
                if (freeMonths === 0) {
                    this.payableToday = this.monthlyPrice * ((100 - discount) / 100);
                } else {
                    this.payableToday = 1;
                }
                this.nextBillingDate = moment().add(1 + freeMonths, 'month').format('LL');
                this.client.nextBillingDate = moment().add(1 + freeMonths, 'month').format('YYYY-MM-DD');
                ;
            }
        } else {
            if (freeMonths === -1) {
                this.payableToday = 0;
                this.nextBillingDate = 'Never';
                this.client.nextBillingDate = 'never';
            } else {
                this.payableToday = this.monthlyPrice * (12 - freeMonths) * ((100 - discount) / 100);
                this.nextBillingDate = moment().add(1, 'year').format('LL');
                this.client.nextBillingDate = moment().add(1, 'year').format('YYYY-MM-DD');
                ;
            }
        }
    }

    register(): void {
        this.user.name = this.registerForm.controls['name'].value;
        this.user.email = this.registerForm.controls['email'].value;
        this.user.password = this.registerForm.controls['password'].value;
        this.user.confirmPassword = this.registerForm.controls['confirmPassword'].value;
        this.user.layout = 'modern';
        this.user.scheme = 'light';
        this.user.theme = 'theme-brand';
        this.client.name = this.registerForm.controls['clientName'].value;
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
        const paymentData = {'stripeKey': this.stripeKey, 'clientId': this.clientId, 'amount': this.payableToday};
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
                paymentElement.mount('#payment-element');
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
                return_url: 'https://www.dymazoo.com/register-payment/' + this.clientId,
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
}

