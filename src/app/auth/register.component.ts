import {Component, OnDestroy, OnInit, EventEmitter, Output, Input, ViewChild, ElementRef} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {HttpService} from '../shared/services/http.service';
import {GlobalValidator} from '../shared/global-validator';
import {CrossFieldErrorMatcher} from '../shared/cross-field-errormatcher';
import {User} from '../shared/models/user';
import {Client} from '../shared/models/client';
//import {StripeService, StripeCardComponent } from 'ngx-stripe';
//import {StripeCardElementOptions, StripeElementsOptions} from '@stripe/stripe-js';
import { TranslocoService } from '@ngneat/transloco';

@Component({
    selector: 'register',
    templateUrl: './register.component.html'
})

export class RegisterComponent implements OnInit, OnDestroy {

    @Input() public plan: string;
    @Output() registered = new EventEmitter<boolean>();

    @ViewChild('name') nameElement: ElementRef;


    public registerForm: FormGroup;
    public formErrors: string[] = [];
    public errors = [];
    public user: User = new User();
    public client: Client = new Client();
    public needStripe: boolean = false;
    errorMatcher = new CrossFieldErrorMatcher();

/*
    cardOptions: StripeCardElementOptions = {
        style: {
            base: {
                iconColor: '#666EE8',
                color: '#31325F',
                fontWeight: '300',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSize: '18px',
                '::placeholder': {
                    color: '#CFD7E0'
                }
            }
        }
    };

    elementsOptions: StripeElementsOptions = {
        locale: 'es'
    };
*/

    constructor(
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private _translocoService: TranslocoService
//        private stripeService: StripeService
    ) {
        this._translocoService.setActiveLang('en');
    }

    ngOnInit(): void {
        this.client.plan = this.plan;
        this.client.billingType = 'annual';
        if (this.client.plan === 'standard' || this.client.plan === 'professional') {
            this.needStripe = true;
        }
        this.registerForm = this._formBuilder.group({
            name: [this.user.name, [Validators.required]],
            email: [this.user.email, [Validators.required, Validators.email]],
            password: [this.user.password, [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.compose([Validators.required])],
            clientName: ['', Validators.required],
            clientPlan: [this.client.plan, Validators.required],
            clientBillingType: [this.client.billingType, Validators.required]
        }, {
            validator: GlobalValidator.equals('password', 'confirmPassword', 'misMatchedPasswords')
        });
        /*
        this.stripeService.elements(this.elementsOptions)
            .subscribe(elements => {
                this.elements = elements;
                // Only mount the element the first time
                if (!this.card) {
                    this.card = this.elements.create('card', {
                        style: {
                            base: {
                                'iconColor': '#666EE8',
                                'color': '#31325F',
                                'lineHeight': '40px',
                                'fontWeight': 300,
                                'fontFamily': '"Helvetica Neue", Helvetica, sans-serif',
                                'fontSize': '18px',
                                '::placeholder': {
                                    color: '#CFD7E0'
                                }
                            }
                        }
                    });
                    this.card.mount('#card-element');
                }
            });

         */
        setTimeout(() => {
            this.nameElement.nativeElement.focus();
        }, 100);
    }

    ngOnDestroy(): void {
    }

    setPlan(event): void {
        const plan = this.registerForm.controls['clientPlan'].value;
        if (plan === 'standard' || plan === 'professional'){
            this.needStripe = true;
        } else {
            this.needStripe = false;
        }
    }

    register(): void {
        this.user.name = this.registerForm.controls['name'].value;
        this.user.email = this.registerForm.controls['email'].value;
        this.user.password = this.registerForm.controls['password'].value;
        this.user.confirmPassword = this.registerForm.controls['confirmPassword'].value;
        this.client.name = this.registerForm.controls['clientName'].value;
        this.client.plan = this.registerForm.controls['clientPlan'].value;
        this.client.billingType = this.registerForm.controls['clientBillingType'].value;
        this.errors = [];

        if (this.client.plan === 'standard' || this.client.plan === 'professional') {
            /*
            this.stripeService
                .createToken(this.card.element, { name: this.user.name })
                .subscribe((result) => {
                    if (result.token) {
                        // Use the token
                        console.log(result.token.id);
                    } else if (result.error) {
                        // Error creating the token
                        console.log(result.error.message);
                    }
                });

             */
        } else {
            this.httpService.register(this.user, this.client)
                .subscribe(result => {
                    if (result === true) {
                        this.registered.emit(true);

                    } else {
                        this.errors = ['Error registering - please contact support'];
                    }
                }, (error) => {
                    this.errors = error;
                });
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
}
