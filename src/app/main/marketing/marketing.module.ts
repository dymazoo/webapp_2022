import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MarketingRoutingModule} from './marketing-routing.module';
import {SharedModule} from '../../shared/shared.module';

import {SegmentationComponent, SegmentationOpenSegmentDialogComponent} from './segmentation.component';

@NgModule({
    declarations: [
        SegmentationComponent,
        SegmentationOpenSegmentDialogComponent,
    ],
    imports: [
        MarketingRoutingModule,
        SharedModule,
    ],
    exports: [
        SegmentationComponent,
        SegmentationOpenSegmentDialogComponent,
    ]
})

export class MarketingModule {
}
