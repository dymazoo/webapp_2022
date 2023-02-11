import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MarketingRoutingModule} from './marketing-routing.module';
import {SharedModule} from '../../shared/shared.module';

import {SegmentationComponent, SegmentationOpenSegmentDialogComponent, SegmentationPreviewDialogComponent} from './segmentation.component';
import {ExtractComponent} from './extract.component';

@NgModule({
    declarations: [
        SegmentationComponent,
        SegmentationOpenSegmentDialogComponent,
        SegmentationPreviewDialogComponent,
        ExtractComponent,
    ],
    imports: [
        MarketingRoutingModule,
        SharedModule,
    ],
    exports: [
        SegmentationComponent,
        SegmentationOpenSegmentDialogComponent,
        SegmentationPreviewDialogComponent,
        ExtractComponent,
    ]
})

export class MarketingModule {
}
