import {
    Component,
    OnDestroy,
    OnInit,
    EventEmitter,
    Output,
    ViewChild,
    ElementRef
} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {HttpService} from '../shared/services/http.service';
import {User} from '../shared/models/user';
import { TranslocoService } from '@ngneat/transloco';
import {Subscription} from 'rxjs';
import {Router} from '@angular/router';

declare const gtag: Function;

@Component({
    selector: 'login',
    templateUrl: './login.component.html'
})

export class LoginComponent implements OnInit, OnDestroy {

    public loginForm: FormGroup;
    public formErrors: string[] = [];
    public errors = [];
    public user: User = new User();

    @Output() loggedIn = new EventEmitter<boolean>();

    @ViewChild('email') emailElement: ElementRef;

    constructor(
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        private _translocoService: TranslocoService,
        private router: Router
    ) {
        this._translocoService.setActiveLang('en');
    }

    ngOnInit(): void {
        gtag('event', 'page_view', {
            'page_title': 'Login',
            'page_location': 'login',
            'page_path': 'login',
            'send_to': 'G-0PP76HTMT0'
        });

        this.loginForm = this._formBuilder.group({
            email: [this.user.email, [Validators.required, Validators.email]],
            password: [this.user.password, Validators.required]
        });
        setTimeout(() => {
            this.emailElement.nativeElement.focus();
        }, 100);
    }

    ngOnDestroy(): void {
    }

    login(): void {
        this.user.email = this.loginForm.controls['email'].value.trim();
        this.user.password = this.loginForm.controls['password'].value.trim();
        this.errors = [];

        this.httpService.login(this.user)
            .subscribe(result => {
                if (result === true) {
                    this.loggedIn.emit(true);
                    const elem = document.querySelector('body');
                    elem.className = 'app header-fixed navbar-fixed';
                    this.router.navigate(['/home']);
                } else {
                    this.errors = ['Error logging in - please contact support'];
                }
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
