import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

// Guards
import {AuthGuard} from '../../_guards/index';

// Module Components
import {SegmentationComponent} from './segmentation.component';
import {EntityDataService} from '../../shared/services/entity-data.service';
import {ExtractComponent} from './extract.component';

const routes: Routes = [
    {
        path: 'segmentation',
        component: SegmentationComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'Segmentation'
        }
    },
    {
        path: 'extract',
        component: ExtractComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'Extract Marketing Universe'
        }
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MarketingRoutingModule {
}
