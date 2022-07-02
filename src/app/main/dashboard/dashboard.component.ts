import {Component, OnInit} from '@angular/core';
import {FuseConfigService} from '@fuse/services/config';

@Component({
    selector: 'dashboard',
    templateUrl: './dashboard.component.html',
})
export class DashboardComponent {

    config: any;

    constructor(private _fuseConfigService: FuseConfigService) {
    }

}
