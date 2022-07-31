import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {DataRoutingModule} from './data-routing.module';
import {SharedModule} from '../../shared/shared.module';

import {ImportComponent, ImportConfirmDialogComponent, ImportOpenLayoutDialogComponent} from './import.component';
import {LayoutComponent, LayoutOpenLayoutDialogComponent} from './layout.component';
import {SalesCategoriesComponent} from './sales-categories.component';

@NgModule({
    declarations: [
        ImportComponent,
        ImportConfirmDialogComponent,
        ImportOpenLayoutDialogComponent,
        LayoutComponent,
        LayoutOpenLayoutDialogComponent,
        SalesCategoriesComponent,
    ],
    imports: [
        DataRoutingModule,
        SharedModule,
    ],
    exports: [
        ImportComponent,
        ImportConfirmDialogComponent,
        ImportOpenLayoutDialogComponent,
        LayoutComponent,
        LayoutOpenLayoutDialogComponent,
        SalesCategoriesComponent,
    ]
})

export class DataModule {
}
