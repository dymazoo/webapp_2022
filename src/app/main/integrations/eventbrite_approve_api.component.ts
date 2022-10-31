import {
    Component,
    OnDestroy,
    OnInit,
} from '@angular/core';
import {Location} from '@angular/common';
import {Router, ActivatedRoute} from '@angular/router';
import { TranslocoService } from '@ngneat/transloco';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable, Subject, Subscription} from 'rxjs';

import {HttpService} from '../../shared/services/http.service';
import {fuseAnimations} from '@fuse/animations';
import {takeUntil} from 'rxjs/operators';
import {SourceSetting} from '../../shared/models/sourceSetting';
import {SourceSettingValue} from '../../shared/models/sourceSettingValue';
import {FuseConfigService} from '../../../@fuse/services/config';

@Component({
    selector: 'eventbrite-approve-api',
    templateUrl: './eventbrite_approve_api.component.html',
    animations: fuseAnimations
})

export class EventbriteApproveApiComponent implements OnInit, OnDestroy {
    private _unsubscribeAll: Subject<any>;

    public errors = [];
    public sourceSettings: SourceSetting[];
    public sourceSetting: SourceSetting;
    public resultMessage = '';

    constructor(
        private httpService: HttpService,
        private _translocoService: TranslocoService,
        private _snackBar: MatSnackBar,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        private location: Location,
        private _fuseConfigService: FuseConfigService,
    ) {
        this._translocoService.setActiveLang('en');
        this._unsubscribeAll = new Subject();

    }

    ngOnInit(): void {
        this.resultMessage = 'Checking authorisation - one moment please';

        this.activatedRoute.queryParams
            .subscribe(params => {
                this.httpService.saveEntity('eventbrite-oauth', {'oauth_code': params.code})
                    .subscribe((data: Response) => {
                        this.resultMessage = 'Thank you, you have successfully approved secure access to your Eventbrite data';
                        return;
                    }, (errors) => {
                        this.errors = errors;
                        this.resultMessage = 'Oops. There has been a problem accessing your Eventbrite data';
                    });
            }, (errors) => {
                this.errors = errors;
                this.resultMessage = 'Oops. There has been a problem accessing your Eventbrite data';
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    };

    onBack(): void {
        this.location.back();
    };

    onClose(): void {
        close();
    };

    clearErrors(): void {
        this.errors = [];
    };

}

