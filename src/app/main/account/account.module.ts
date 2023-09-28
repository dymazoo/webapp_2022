import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import {AccountRoutingModule} from './account-routing.module';
import {ProfileComponent, ProfilePasswordDialogComponent, ProfileEmailDialogComponent } from './profile.component';
import {UserManagementComponent, UserManagementAdminDialogComponent, UserManagementDialogComponent } from './usermanagement.component';
import {AccountManagementComponent} from './accountmanagement.component';
import {SharedModule} from '../../shared/shared.module';
import {PaymentDetailsComponent} from './payment_details.component';
import {RegisterClientComponent} from './register_client.component';

@NgModule({
    declarations: [
        ProfileComponent,
        ProfilePasswordDialogComponent,
        ProfileEmailDialogComponent,
        UserManagementComponent,
        UserManagementAdminDialogComponent,
        UserManagementDialogComponent,
        AccountManagementComponent,
        PaymentDetailsComponent,
        RegisterClientComponent
    ],
    imports     : [
        AccountRoutingModule,
        SharedModule,
    ],
    exports     : [
        ProfileComponent,
        UserManagementComponent,
        AccountManagementComponent,
        PaymentDetailsComponent,
        RegisterClientComponent
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
