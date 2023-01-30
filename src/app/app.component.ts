import {Component} from '@angular/core';
import {DataSources} from 'app/shared/models/sources/data-sources';
import {NavigationEnd, Router} from '@angular/router';
import {FuseNavigationService} from '@fuse/components/navigation/navigation.service';

declare const gtag: Function;

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss']
})
export class AppComponent {

    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _fuseNavigationService: FuseNavigationService,
        private dataSources: DataSources
    ) {
        this._router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                const url = event.url;
                let title = url.substring(1);
                const first = title.substring(0,1).toUpperCase();
                title = first + title.substring(1);
            }
        })
        this.dataSources.registerNavigationService(this._fuseNavigationService);
    }
}
