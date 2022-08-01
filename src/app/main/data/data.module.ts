import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {DataRoutingModule} from './data-routing.module';
import {SharedModule} from '../../shared/shared.module';

import {ImportComponent, ImportConfirmDialogComponent, ImportOpenLayoutDialogComponent} from './import.component';
import {LayoutComponent, LayoutOpenLayoutDialogComponent} from './layout.component';
import {SalesCategoriesComponent, SalesCategoryDialogComponent} from './sales-categories.component';
import {EventCategoriesComponent, EventCategoryDialogComponent} from './event-categories.component';

@NgModule({
    declarations: [
        ImportComponent,
        ImportConfirmDialogComponent,
        ImportOpenLayoutDialogComponent,
        LayoutComponent,
        LayoutOpenLayoutDialogComponent,
        SalesCategoriesComponent,
        SalesCategoryDialogComponent,
        EventCategoriesComponent,
        EventCategoryDialogComponent,
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
        SalesCategoryDialogComponent,
        EventCategoriesComponent,
        EventCategoryDialogComponent,
    ]
})

export class DataModule {
}
