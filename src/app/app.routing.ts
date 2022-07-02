import {Route} from '@angular/router';
//import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import {NoAuthGuard} from 'app/core/auth/guards/noAuth.guard';
import {LayoutComponent} from 'app/layout/layout.component';
import {InitialDataResolver} from 'app/app.resolvers';

// Guards
import {AuthGuard} from './_guards/index';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [
    // Redirect empty path to '/home'
    {path: '', pathMatch : 'full', redirectTo: 'home'},
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
        },
        children: [
            {path: 'pricing', children: [
                {path: 'modern', loadChildren: () => import('app/modules/admin/pages/pricing/modern/modern.module').then(m => m.PricingModernModule)},
                {path: 'simple', loadChildren: () => import('app/modules/admin/pages/pricing/simple/simple.module').then(m => m.PricingSimpleModule)},
                {path: 'single', loadChildren: () => import('app/modules/admin/pages/pricing/single/single.module').then(m => m.PricingSingleModule)},
                {path: 'table', loadChildren: () => import('app/modules/admin/pages/pricing/table/table.module').then(m => m.PricingTableModule)}
            ]},
        ],
    },
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
        },
        children: [
            {
                path: 'dashboard',
                loadChildren: () => import('app/main/dashboard/dashboard.module').then(m => m.DashboardModule)
            },
            {
                path: 'account',
                loadChildren: () => import('app/main/account/account.module').then(m => m.AccountModule)
            },
            {
                path: 'marketing',
                loadChildren: () => import('app/main/marketing/marketing.module').then(m => m.MarketingModule)
            },
            {
                path: 'data',
                loadChildren: () => import('app/main/data/data.module').then(m => m.DataModule)
            },
            {
                path: 'integrations',
                loadChildren: () => import('app/main/integrations/integrations.module').then(m => m.IntegrationsModule)
            },
            {
                path: 'auth',
                loadChildren: () => import('app/auth/auth.module').then(m => m.AuthModule)
            },
        ]
    },
    // Redirect unknown paths to '/home'
    {
        path: '**',
        redirectTo: 'home'
    }
];
