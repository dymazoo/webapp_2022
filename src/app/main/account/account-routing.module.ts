import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

// Guards
import {AuthGuard} from 'app/_guards/index';

// Module Components
import {ProfileComponent} from './profile.component';
import {UserManagementComponent} from './usermanagement.component';
import {AccountManagementComponent} from './accountmanagement.component';
import {PaymentDetailsComponent} from './payment_details.component';
import {RegisterClientComponent} from './register_client.component';

const routes: Routes = [
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    },
    {
        path: 'user-management',
        component: UserManagementComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    },
    {
        path: 'management',
        component: AccountManagementComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    },
    {
        path: 'payment-details/:clientId',
        component: PaymentDetailsComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    },
    {
        path: 'register-client',
        component: RegisterClientComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AccountRoutingModule {
}
