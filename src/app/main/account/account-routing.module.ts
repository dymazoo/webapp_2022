import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

// Guards
import {AuthGuard} from 'app/_guards/index';

// Module Components
import {ProfileComponent} from './profile.component';
import {UserManagementComponent} from './usermanagement.component';

const routes: Routes = [
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'Profile'
        }
    },
    {
        path: 'user-management',
        component: UserManagementComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'User Management'
        }
    }

];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AccountRoutingModule {
}
