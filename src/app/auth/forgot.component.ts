import {Component, ElementRef, ViewChild} from '@angular/core';
import {HttpService} from '../shared/services/http.service';
import {Router, ActivatedRoute} from '@angular/router';
import {FuseConfigService} from '@fuse/services/config';
import {TranslocoService} from '@ngneat/transloco';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';

@Component({
    selector: 'home',
    templateUrl: 'forgot.component.html'
})
export class ForgotComponent {

    public forgotForm: FormGroup;
    public formErrors: string[] = [];
    public email: string='';
    public errors = [];

    @ViewChild('email') emailElement: ElementRef;

    constructor(
        private router: Router,
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        private _translocoService: TranslocoService
    ) {
        this._translocoService.setActiveLang('en');
    }

    ngOnInit(): void {
        this.forgotForm = this._formBuilder.group({
            email: [this.email, [Validators.required, Validators.email]],
        });
        setTimeout(() => {
            this.emailElement.nativeElement.focus();
        }, 100);
    }

    reset(): void {
        this.email = this.forgotForm.controls['email'].value;
        this.errors = [];

        this.httpService.forgotPassword({email: this.email})
            .subscribe(data => {
                this.router.navigate(['/auth/requested']);
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
        return returnVal;
    }
}

