import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

// Guards
import {AuthGuard} from '../../_guards/index';

// Module Components
import {ImportComponent} from './import.component';
import {LayoutComponent} from './layout.component';
import {SalesCategoriesComponent} from './sales-categories.component';
import {EventCategoriesComponent} from './event-categories.component';
import {EventsComponent} from './events.component';

const routes: Routes = [
    {
        path: 'import',
        component: ImportComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
    },
    {
        path: 'layouts',
        component: LayoutComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
    },
    {
        path: 'sales-categories',
        component: SalesCategoriesComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
    },
    {
        path: 'event-categories',
        component: EventCategoriesComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
    },
    {
        path: 'events',
        component: EventsComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DataRoutingModule {
}
