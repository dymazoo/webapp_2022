import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExtraOptions, PreloadAllModules, RouterModule } from '@angular/router';
import { MarkdownModule } from 'ngx-markdown';
import { FuseModule } from '@fuse';
import { FuseConfigModule } from '@fuse/services/config';
import { FuseMockApiModule } from '@fuse/lib/mock-api';
import { CoreModule } from 'app/core/core.module';
import { appConfig } from 'app/core/config/app.config';
import { mockApiServices } from 'app/mock-api';
import { LayoutModule } from 'app/layout/layout.module';
import { AppComponent } from 'app/app.component';
import { appRoutes } from 'app/app.routing';

// Shared and services
import {HttpService} from 'app/shared/services/http.service';
import {AuthGuard} from 'app/_guards/index';
import {SharedModule} from './shared/shared.module';
import {AbandonDialogService} from 'app/shared/services/abandon-dialog.service';
import {DataSources} from './shared/models/sources/data-sources';

// App modules
import {AccountModule} from 'app/main/account/account.module';
import {MarketingModule} from 'app/main/marketing/marketing.module';
import {DataModule} from 'app/main/data/data.module';
import {IntegrationsModule} from 'app/main/integrations/integrations.module';
import {HomeModule} from 'app/main/home/home.module';
import {DashboardModule} from 'app/main/dashboard/dashboard.module';

const routerConfig: ExtraOptions = {
    preloadingStrategy       : PreloadAllModules,
    scrollPositionRestoration: 'enabled'
};

@NgModule({
    declarations: [
        AppComponent
    ],
    imports     : [
        BrowserModule,
        BrowserAnimationsModule,
        RouterModule.forRoot(appRoutes, routerConfig),

        // Fuse, FuseConfig & FuseMockAPI
        FuseModule,
        FuseConfigModule.forRoot(appConfig),
        FuseMockApiModule.forRoot(mockApiServices),

        // Core module of your application
        CoreModule,

        // Layout module of your application
        LayoutModule,

        // App modules
        SharedModule,
        AccountModule,
        MarketingModule,
        DataModule,
        IntegrationsModule,
        HomeModule,
        DashboardModule,

        // 3rd party modules that require global configuration via forRoot
        MarkdownModule.forRoot({})
    ],
    providers: [
        HttpService,
        AuthGuard,
        AbandonDialogService,
        DataSources,
    ],
    bootstrap   : [
        AppComponent
    ]
})
export class AppModule
{
}
