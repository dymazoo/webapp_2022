import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

// Guards
import {AuthGuard} from '../../_guards/index';

// Module Components
import {ProfileComponent} from './profile.component';

const routes: Routes = [
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'Profile'
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AccountRoutingModule {
}
