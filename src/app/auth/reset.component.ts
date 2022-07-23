import {Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {HttpService} from 'app/shared/services/http.service';
import {Router, ActivatedRoute} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {GlobalValidator} from 'app/shared/global-validator';
import {CrossFieldErrorMatcher} from 'app/shared/cross-field-errormatcher';

@Component({
    selector: 'home',
    templateUrl: 'reset.component.html'
})
export class ResetComponent implements OnInit, OnDestroy {

    public resetForm: FormGroup;
    public token: string='';
    public email: string='';
    public password: string='';
    public confirmPassword: string='';
    public errors = [];
    errorMatcher = new CrossFieldErrorMatcher();

    @ViewChild('email') emailElement: ElementRef;

    constructor(
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        private _translocoService: TranslocoService
    ) {
        this._translocoService.setActiveLang('en');

        activatedRoute.params.subscribe((param: any) => {
            this.token = param['token'];
        });

    }

    ngOnInit(): void {
        this.resetForm = this._formBuilder.group({
            email: [this.email, [Validators.required, Validators.email]],
            password: [this.password, [Validators.required, Validators.minLength(8)]],
            confirmPassword: [this.confirmPassword, Validators.compose([Validators.required])],
        }, {
            validator: GlobalValidator.equals('password', 'confirmPassword', 'misMatchedPasswords')
        });
        setTimeout(() => {
            this.emailElement.nativeElement.focus();
        }, 100);
    }

    ngOnDestroy(): void {
    }

    reset(): void {
        this.email = this.resetForm.controls['email'].value;
        this.password = this.resetForm.controls['password'].value;
        this.confirmPassword = this.resetForm.controls['confirmPassword'].value;
        this.errors = [];

        this.httpService.resetPassword(
            {email: this.email, password:this.password, password_confirmation: this.confirmPassword, token: this.token}
        ).subscribe(data => {
                this.router.navigate(['/auth/confirm-reset']);
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

