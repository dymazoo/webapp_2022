import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';

import {TranslocoModule} from '@ngneat/transloco';
import {FuseCardModule} from '@fuse/components/card';
import {SharedModule} from '../../shared/shared.module';
import {HomeComponent} from './home.component';
import {RegisterComponent} from 'app/auth/register.component';
import {RegisterCompleteComponent} from 'app/auth/register_complete.component';
import {NoAuthGuard} from '../../core/auth/guards/noAuth.guard';
import {LayoutComponent} from '../../layout/layout.component';
import {LoginComponent} from "../../auth/login.component";

const routes = [
    // Redirect empty path to '/home'
    {path: '', pathMatch : 'full', redirectTo: 'home'},
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {
                path: 'home',
                component: HomeComponent
            }
        ]
    },
];

@NgModule({
    declarations: [
        HomeComponent,
        RegisterComponent,
        RegisterCompleteComponent,
    ],
    imports: [
        RouterModule.forChild(routes),
        SharedModule,
        TranslocoModule,
        FuseCardModule,
    ],
    exports: [
        HomeComponent
    ]
})

export class HomeModule {
}
