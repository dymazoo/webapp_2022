import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

// Guards
import {AuthGuard} from '../../_guards/index';

// Module Components
import {SourceSettingsComponent} from '../integrations/source-settings.component';
import {MailchimpComponent} from '../integrations/mailchimp.component';
import {SendinblueComponent} from '../integrations/sendinblue.component';
import {ShopifyComponent} from '../integrations/shopify.component';
import {EventbriteComponent} from '../integrations/eventbrite.component';
import {EventbriteApproveApiComponent} from './eventbrite_approve_api.component';
import {ZapierComponent} from '../integrations/zapier.component';
import {DymazooApiComponent} from '../integrations/dymazoo-api.component';

const routes: Routes = [
    {
        path: 'source-settings',
        component: SourceSettingsComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    },
    {
        path: 'mailchimp',
        component: MailchimpComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    },
    {
        path: 'sendinblue',
        component: SendinblueComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    },
    {
        path: 'shopify',
        component: ShopifyComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    },
    {
        path: 'eventbrite',
        component: EventbriteComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    },
    {
        path: 'eventbrite-approve-api',
        component: EventbriteApproveApiComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    },
    {
        path: 'zapier',
        component: ZapierComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    },
    {
        path: 'dymazoo-api',
        component: DymazooApiComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class IntegrationsRoutingModule {
}
