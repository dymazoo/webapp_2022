import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

// Guards
import {AuthGuard} from '../../_guards/index';

// Module Components
import {ImportComponent} from './import.component';
import {LayoutComponent} from './layout.component';
import {EntityDataService} from '../../shared/services/entity-data.service';

const routes: Routes = [
    {
        path: 'import',
        component: ImportComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'File Import'
        }
    },
    {
        path: 'layouts',
        component: LayoutComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'File Layouts'
        }
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DataRoutingModule {
}
