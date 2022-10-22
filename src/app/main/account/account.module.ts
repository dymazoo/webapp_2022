import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import {AccountRoutingModule} from './account-routing.module';
import {ProfileComponent, ProfilePasswordDialogComponent, ProfileEmailDialogComponent } from './profile.component';
import {UserManagementComponent, UserManagementAdminDialogComponent, UserManagementDialogComponent } from './usermanagement.component';
import {AccountManagementComponent} from './accountmanagement.component';
import {SharedModule} from '../../shared/shared.module';

@NgModule({
    declarations: [
        ProfileComponent,
        ProfilePasswordDialogComponent,
        ProfileEmailDialogComponent,
        UserManagementComponent,
        UserManagementAdminDialogComponent,
        UserManagementDialogComponent,
        AccountManagementComponent,
    ],
    imports     : [
        AccountRoutingModule,
        SharedModule,
    ],
    exports     : [
        ProfileComponent,
        UserManagementComponent
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
