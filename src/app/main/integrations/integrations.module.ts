import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import {IntegrationsRoutingModule} from './integrations-routing.module';
import {SharedModule} from 'app/shared/shared.module';
import {SourceSettingsComponent, SourceSettingsValuesDialogComponent} from '../integrations/source-settings.component';
import {MailchimpComponent} from '../integrations/mailchimp.component';
import {SendinblueComponent} from '../integrations/sendinblue.component';
import {InstillerComponent} from '../integrations/instiller.component';
import {ShopifyComponent} from '../integrations/shopify.component';
import {EventbriteComponent} from './eventbrite.component';
import {EventbriteApproveApiComponent} from './eventbrite_approve_api.component';
import {ZapierComponent} from '../integrations/zapier.component';
import {DymazooApiComponent} from '../integrations/dymazoo-api.component';

@NgModule({
    declarations: [
        SourceSettingsComponent,
        SourceSettingsValuesDialogComponent,
        MailchimpComponent,
        SendinblueComponent,
        InstillerComponent,
        ShopifyComponent,
        EventbriteComponent,
        EventbriteApproveApiComponent,
        ZapierComponent,
        DymazooApiComponent,
    ],
    imports     : [
        IntegrationsRoutingModule,
        SharedModule,
    ],
    exports     : [
        SourceSettingsComponent,
        SourceSettingsValuesDialogComponent,
        MailchimpComponent,
        SendinblueComponent,
        InstillerComponent,
        ShopifyComponent,
        EventbriteComponent,
        EventbriteApproveApiComponent,
        ZapierComponent,
        DymazooApiComponent,
    ],
    entryComponents: [
    ],
})

export class IntegrationsModule
{
}
