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
            {
                path: 'auth',
                loadChildren: () => import('app/auth/auth.module').then(m => m.AuthModule)
            },
        ],
    },
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        runGuardsAndResolvers: 'always',
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
            }
        ]
    },
    // Redirect unknown paths to '/home'
    {
        path: '**',
        redirectTo: 'home'
    }
];
