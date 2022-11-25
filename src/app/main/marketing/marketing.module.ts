import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {MarketingRoutingModule} from './marketing-routing.module';
import {SharedModule} from '../../shared/shared.module';

import {SegmentationComponent, SegmentationOpenSegmentDialogComponent} from './segmentation.component';
import {ExtractComponent} from './extract.component';

@NgModule({
    declarations: [
        SegmentationComponent,
        SegmentationOpenSegmentDialogComponent,
        ExtractComponent,
    ],
    imports: [
        MarketingRoutingModule,
        SharedModule,
    ],
    exports: [
        SegmentationComponent,
        SegmentationOpenSegmentDialogComponent,
        ExtractComponent,
    ]
})

export class MarketingModule {
}
