import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {FuseCardModule} from '@fuse/components/card';
import {TranslocoModule} from '@ngneat/transloco';
import {AuthRoutingModule} from './auth-routing.module';
import {SharedModule} from '../shared/shared.module';
import {ConfirmComponent} from './confirm.component';
import {ForgotComponent} from './forgot.component';
import {RequestedComponent} from './requested.component';
import {ResetComponent} from './reset.component';
import {ConfirmResetComponent} from './confirm-reset.component';
import {OauthComponent} from './oauth.component';

@NgModule({
    imports: [
        AuthRoutingModule,
        CommonModule,
        SharedModule,
        TranslocoModule,
        FuseCardModule
    ],
    declarations: [
        ConfirmComponent,
        ForgotComponent,
        RequestedComponent,
        ResetComponent,
        ConfirmResetComponent,
        OauthComponent,
    ],
    providers: []
})
export class AuthModule {
}
