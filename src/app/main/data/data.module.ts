import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {DataRoutingModule} from './data-routing.module';
import {SharedModule} from 'app/shared/shared.module';

import {ImportComponent, ImportConfirmDialogComponent, ImportOpenLayoutDialogComponent} from './import.component';
import {LayoutComponent, LayoutOpenLayoutDialogComponent} from './layout.component';
import {SalesCategoriesComponent, SalesCategoryDialogComponent} from './sales-categories.component';
import {EventCategoriesComponent, EventCategoryDialogComponent} from './event-categories.component';
import {EventsComponent, EventDialogComponent} from './events.component';
import {PreferencesComponent, PreferenceDialogComponent} from './preferences.component';
import {ComplianceComponent,ComplianceDialogComponent} from './compliance.component';
import {CustomFieldsComponent, CustomFieldDialogComponent} from './custom-fields.component';

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
        EventsComponent,
        EventDialogComponent,
        PreferencesComponent,
        PreferenceDialogComponent,
        ComplianceComponent,
        ComplianceDialogComponent,
        CustomFieldsComponent,
        CustomFieldDialogComponent,
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
        EventsComponent,
        EventDialogComponent,
        PreferencesComponent,
        PreferenceDialogComponent,
        ComplianceComponent,
        ComplianceDialogComponent,
        CustomFieldsComponent,
        CustomFieldDialogComponent,
    ]
})

export class DataModule {
}
