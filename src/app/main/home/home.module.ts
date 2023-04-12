import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';

import {TranslocoModule} from '@ngneat/transloco';
import {FuseCardModule} from '@fuse/components/card';
import {SharedModule} from '../../shared/shared.module';
import {HomeComponent} from './home.component';
import {RegisterCompleteComponent} from 'app/auth/register_complete.component';
import {RegisterPaymentComponent} from 'app/auth/register_payment.component';
import {NoAuthGuard} from '../../core/auth/guards/noAuth.guard';
import {LayoutComponent} from '../../layout/layout.component';
import {RegisterComponent} from 'app/auth/register.component';
import {PricingComponent} from 'app/auth/pricing.component';

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
            },
//            {
//                path: 'pricing',
//                component: PricingComponent
//            },
            {
                path: 'signup',
                component: RegisterComponent
            },
            {
                path: 'payment/:clientId',
                component: RegisterPaymentComponent
            },
            {
                path: 'register-complete',
                component: RegisterCompleteComponent
            }
        ]
    },
];

@NgModule({
    declarations: [
        HomeComponent,
        RegisterCompleteComponent,
        RegisterPaymentComponent,
        RegisterComponent,
        PricingComponent,
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
