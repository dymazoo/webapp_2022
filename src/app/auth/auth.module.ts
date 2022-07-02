import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {FuseCardModule} from '@fuse/components/card';
import {TranslocoModule} from '@ngneat/transloco';
import {AuthRoutingModule} from './auth-routing.module';
import {SharedModule} from '../shared/shared.module';
import {ConfirmComponent} from './confirm.component';

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
    ],
    providers: []
})
export class AuthModule {
}
