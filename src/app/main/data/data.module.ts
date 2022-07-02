import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {DataRoutingModule} from './data-routing.module';
import {SharedModule} from '../../shared/shared.module';

import {ImportComponent, ImportConfirmDialogComponent, ImportOpenLayoutDialogComponent} from './import.component';

@NgModule({
    declarations: [
        ImportComponent,
        ImportConfirmDialogComponent,
        ImportOpenLayoutDialogComponent,
    ],
    imports: [
        DataRoutingModule,
        SharedModule,
    ],
    exports: [
        ImportComponent,
        ImportConfirmDialogComponent,
        ImportOpenLayoutDialogComponent,
    ]
})

export class DataModule {
}
