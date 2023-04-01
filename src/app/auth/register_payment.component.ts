import {Component, OnDestroy, OnInit, ViewChild, ElementRef, Output, EventEmitter} from '@angular/core';
import {Router, ActivatedRoute} from '@angular/router';
import {HttpService} from '../shared/services/http.service';
import {TranslocoService} from '@ngneat/transloco';
import {loadStripe} from '@stripe/stripe-js';
import {environment} from '../../environments/environment';
import * as moment from 'moment';

@Component({
    selector: 'home',
    templateUrl: './register_payment.component.html'
})

export class RegisterPaymentComponent implements OnInit, OnDestroy {

    @Output() registered = new EventEmitter<boolean>();

    clientId: string;
    paymentIntent: string;
    paymentIntentClientSecret: string;
    redirectStatus: string;
    stripeMessage: string = '';
    stripeSuccess: boolean = false;
    public paymentReady: boolean = false;
    public action: string = 'result';
    public stripeKey: string = '';

    private stripe: any;
    private elements: any;

    errors = [];

    stripePromise = loadStripe(environment.stripeKey);

    constructor(
        private httpService: HttpService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private _translocoService: TranslocoService
    ) {
        this._translocoService.setActiveLang('en');
        this.stripeKey = moment().toISOString();
        this.errors = [];
        activatedRoute.params.subscribe((param: any) => {
            this.clientId = param['clientId'];
        });
        this.activatedRoute.queryParams.subscribe((param: any) => {
            if (param['payment_intent'] !== undefined) {
                this.paymentIntent = param['payment_intent'];
            }
            if (param['payment_intent_client_secret'] !== undefined) {
                this.paymentIntentClientSecret = param['payment_intent_client_secret'];
            }
            if (param['redirect_status'] !== undefined) {
                this.redirectStatus = param['redirect_status'];
            }
        });

    }

    ngOnInit(): void {
        if (this.paymentIntentClientSecret !== undefined) {
            this.paymentResult();
        } else {
            this.errors = ['Error processing payment'];
        }
    }

    ngOnDestroy(): void {
    }

    async paymentResult() {
        const stripe = await this.stripePromise;
        this.stripe = stripe;
        this.stripe.retrievePaymentIntent(this.paymentIntentClientSecret).then(({paymentIntent}) => {

            // Inspect the PaymentIntent `status` to indicate the status of the payment
            // to your customer.
            //
            // Some payment methods will [immediately succeed or fail][0] upon
            // confirmation, while others will first enter a `processing` state.
            //
            // [0]: https://stripe.com/docs/payments/payment-methods#payment-notification
            switch (paymentIntent.status) {
                case 'succeeded':
                    this.stripeMessage = 'Success! Payment received.';
                    this.stripeSuccess = true;
                    this.httpService.confirmPayment({'clientId': this.clientId, 'reference': this.paymentIntent})
                        .subscribe(data => {
                        }, (errors) => {
                            this.errors = errors;
                        });
                    break;

                case 'processing':
                    this.stripeMessage = "Payment processing. We'll update you when payment is received.";
                    break;

                case 'requires_payment_method':
                    this.stripeMessage = 'Payment failed. Please try another payment method.';
                    this.handlePayment();
                    break;

                default:
                    this.stripeMessage = 'Something went wrong.';
                    break;
            }
        });

    }

    confirmResult(): void {
        if (this.stripeSuccess) {
            this.registered.emit(true);
            this.router.navigate(['/register-complete']);
        } else {

        }
    }

    handlePayment() {
        const paymentData = {'clientId': this.clientId, 'reference': this.paymentIntent};
        this.httpService.saveEntity('register-retry-payment', paymentData)
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
                this.elements = this.stripe.elements(options);

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

    clearErrors(): void {
        this.errors = [];
    }

}
