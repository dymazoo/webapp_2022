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
        canDeactivate: [AuthGuard]
    },
    {
        path: 'user-management',
        component: UserManagementComponent,
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
