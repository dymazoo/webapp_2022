import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import {AccountRoutingModule} from './account-routing.module';
import {ProfileComponent, ProfilePasswordDialogComponent, ProfileEmailDialogComponent } from './profile.component';
import {UserManagementComponent, UserManagementAdminDialogComponent, UserManagementDialogComponent } from './usermanagement.component';
import {AccountManagementComponent} from './accountmanagement.component';
import {SharedModule} from '../../shared/shared.module';
import {PaymentDetailsComponent} from './payment_details.component';

@NgModule({
    declarations: [
        ProfileComponent,
        ProfilePasswordDialogComponent,
        ProfileEmailDialogComponent,
        UserManagementComponent,
        UserManagementAdminDialogComponent,
        UserManagementDialogComponent,
        AccountManagementComponent,
        PaymentDetailsComponent
    ],
    imports     : [
        AccountRoutingModule,
        SharedModule,
    ],
    exports     : [
        ProfileComponent,
        UserManagementComponent,
        AccountManagementComponent,
        PaymentDetailsComponent
    ],
    entryComponents: [
        ProfilePasswordDialogComponent,
        ProfileEmailDialogComponent,
        UserManagementAdminDialogComponent,
        UserManagementDialogComponent,
    ],
})

export class AccountModule
{
}
