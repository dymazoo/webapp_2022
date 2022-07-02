import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import {AccountRoutingModule} from './account-routing.module';
import {ProfileComponent, ProfilePasswordDialogComponent, ProfileEmailDialogComponent } from './profile.component';
import {SharedModule} from '../../shared/shared.module';

@NgModule({
    declarations: [
        ProfileComponent,
        ProfilePasswordDialogComponent,
        ProfileEmailDialogComponent
    ],
    imports     : [
        AccountRoutingModule,
        SharedModule,
    ],
    exports     : [
        ProfileComponent,
    ],
    entryComponents: [
        ProfilePasswordDialogComponent,
        ProfileEmailDialogComponent
    ],
})

export class AccountModule
{
}
