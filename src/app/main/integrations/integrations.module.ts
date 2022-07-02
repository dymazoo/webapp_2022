import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import {IntegrationsRoutingModule} from './integrations-routing.module';
import {SharedModule} from '../../shared/shared.module';
import {SourceSettingsComponent, SourceSettingsValuesDialogComponent} from '../integrations/source-settings.component';
import {MailchimpComponent} from '../integrations/mailchimp.component';
import {ShopifyComponent} from '../integrations/shopify.component';
import {EventbriteComponent} from './eventbrite.component';
import {EventbriteApproveApiComponent} from './eventbrite_approve_api.component';

@NgModule({
    declarations: [
        SourceSettingsComponent,
        SourceSettingsValuesDialogComponent,
        MailchimpComponent,
        ShopifyComponent,
        EventbriteComponent,
        EventbriteApproveApiComponent
    ],
    imports     : [
        IntegrationsRoutingModule,
        SharedModule,
    ],
    exports     : [
        SourceSettingsComponent,
        SourceSettingsValuesDialogComponent,
        MailchimpComponent,
        ShopifyComponent,
        EventbriteComponent,
        EventbriteApproveApiComponent
    ],
    entryComponents: [
    ],
})

export class IntegrationsModule
{
}
