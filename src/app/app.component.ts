import {Component} from '@angular/core';
import {DataSources} from 'app/shared/models/sources/data-sources';
import {Router} from '@angular/router';
import {FuseNavigationService} from '@fuse/components/navigation/navigation.service';

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
        this.dataSources.registerNavigationService(this._fuseNavigationService);
    }
}
