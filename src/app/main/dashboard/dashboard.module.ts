import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {SharedModule} from 'app/shared/shared.module';

import {DashboardComponent} from './dashboard.component';
import { NgApexchartsModule } from 'ng-apexcharts';

const routes = [
    {
        path: '',
        component: DashboardComponent
    }
];

@NgModule({
    declarations: [
        DashboardComponent
    ],
    imports: [
        RouterModule.forChild(routes),
        NgApexchartsModule,
        SharedModule,

    ],
    exports: [
        DashboardComponent
    ]
})

export class DashboardModule {
}
