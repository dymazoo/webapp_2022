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
    }

    ngOnInit(): void {
        this.activatedRoute.queryParams.subscribe((param: any) => {
            if (param['plan'] !== undefined) {
                this.plan = param['plan'];
            }
        });

        this.client.plan = this.plan;
        this.registerForm = this._formBuilder.group({
            name: [this.user.name, [Validators.required]],
            email: [this.user.email, [Validators.required, Validators.email]],
            password: [this.user.password, [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.compose([Validators.required])],
            clientName: ['', Validators.required],
            clientPlan: [this.client.plan, Validators.required],
        }, {
            validator: GlobalValidator.equals('password', 'confirmPassword', 'misMatchedPasswords')
        });

    }

    ngOnDestroy(): void {
    }

    getDetails(): void {
        setTimeout(() => {
            this.nameElement.nativeElement.focus();
        }, 100);
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
        this.errors = [];

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

    async handlePayment() {
        const stripe = await this.stripePromise;

        this.action = 'payment';
        this.httpService.saveEntity('register-payment-intent', {})
            .subscribe((data) => {
                const options = {
                    clientSecret: data.client_secret,
                    // Fully customizable with appearance API.
                    appearance: {/*...*/},
                };
                const elements = stripe.elements(options);

                // Create and mount the Payment Element
                const paymentElement = elements.create('payment');
                paymentElement.mount('#payment-element');
            }, (errors) => {
                this.errors = errors;
            });
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

