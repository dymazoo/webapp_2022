import {NgModule} from '@angular/core';
import {Routes, RouterModule} from '@angular/router';

// Guards
import {AuthGuard} from '../../_guards/index';

// Module Components
import {SourceSettingsComponent} from '../integrations/source-settings.component';
import {MailchimpComponent} from '../integrations/mailchimp.component';
import {ShopifyComponent} from '../integrations/shopify.component';
import {EventbriteComponent} from '../integrations/eventbrite.component';
import {EventbriteApproveApiComponent} from './eventbrite_approve_api.component';

const routes: Routes = [
    {
        path: 'source-settings',
        component: SourceSettingsComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'Source Settings'
        }
    },
    {
        path: 'mailchimp',
        component: MailchimpComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'Mailchimp'
        }
    },
    {
        path: 'shopify',
        component: ShopifyComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'Shopify'
        }
    },
    {
        path: 'eventbrite',
        component: EventbriteComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'Eventbrite'
        }
    },
    {
        path: 'eventbrite-approve-api',
        component: EventbriteApproveApiComponent,
        canActivate: [AuthGuard],
        canDeactivate: [AuthGuard],
        data: {
            title: 'Eventbrite Approve Api'
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class IntegrationsRoutingModule {
}
