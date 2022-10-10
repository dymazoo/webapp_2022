import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';
import {ConfirmComponent} from './confirm.component';
import {ForgotComponent} from './forgot.component';
import {RequestedComponent} from './requested.component';
import {ResetComponent} from './reset.component';
import {ConfirmResetComponent} from './confirm-reset.component';
import {OauthComponent} from './oauth.component';
import {RegisterComponent} from './register.component';
import {AuthGuard} from '../_guards';

const routes: Routes = [
    {
        path: 'confirm/:clientId',
        component: ConfirmComponent,
    },
    {
        path: 'forgot',
        component: ForgotComponent,
    },
    {
        path: 'requested',
        component: RequestedComponent,
    },
    {
        path: 'reset/:token',
        component: ResetComponent,
    },
    {
        path: 'confirm-reset',
        component: ConfirmResetComponent,
    },
    {
        path: 'oauth',
        component: OauthComponent,
    }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AuthRoutingModule {
}
