import {
    Component,
    Inject,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
    ViewChild,
    ElementRef,
    AfterViewChecked
} from '@angular/core';
import {Location} from '@angular/common';
import {CdkDragDrop, CdkDragEnter, CdkDragExit, moveItemInArray, transferArrayItem} from '@angular/cdk/drag-drop';
import {NestedTreeControl} from '@angular/cdk/tree';
import {MatTreeNestedDataSource} from '@angular/material/tree';
import {MatMenuTrigger} from '@angular/material/menu';
import {FormBuilder, FormGroup, FormArray, Validators, Form} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Router} from '@angular/router';
import {combineLatest, map, Subject, Subscription} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {Observable} from 'rxjs';

import { TranslocoService } from '@ngneat/transloco';
import {fuseAnimations} from '@fuse/animations';


import {HttpService} from 'app/shared/services/http.service';
import {AbandonDialogService} from 'app/shared/services/abandon-dialog.service';
import {ConfirmDialogComponent} from 'app/shared/components/confirm-dialog.component';
import {EntityDatasource} from 'app/shared/entity-datasource';
import {SelectionCard} from 'app/shared/models/selectionCard';
import {Selection} from 'app/shared/models/selection';
import * as _ from 'lodash';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {MatTableDataSource} from '@angular/material/table';
import {SourceSetting} from 'app/shared/models/sourceSetting';
import {FuseConfigService} from '@fuse/services/config';
import {FuseMediaWatcherService} from '@fuse/services/media-watcher';
import {DataSources} from 'app/shared/models/sources/data-sources';


@Component({
    selector: 'extract',
    templateUrl: './extract.component.html'
})
export class ExtractComponent implements OnInit, OnDestroy, AfterViewChecked {
    public errors = [];

    private _unsubscribeAll: Subject<any>;
    public canClientAdmin: boolean = false;
    public plan: string = '';
    public canExtract: boolean = false;

    constructor(
        private httpService: HttpService,
        private _translocoService: TranslocoService,
        private location: Location,
        public dialog: MatDialog,
        private _snackBar: MatSnackBar,
        private router: Router,
    ) {
        this._translocoService.setActiveLang('en');
        this._unsubscribeAll = new Subject();
        // Check permissions
        this.canClientAdmin = this.httpService.hasPermission('client_admin');
        if (localStorage.getItem('dymazooUser')) {
            const dymazooUser = JSON.parse(localStorage.getItem('dymazooUser'));
            this.plan = dymazooUser.plan;
        }
        if (this.canClientAdmin && this.plan === 'consultant'){
            this.canExtract = true;
        }
    }

    ngOnInit(): void {
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    ngAfterViewChecked(): void {
    }

    clearErrors(): void {
        this.errors = [];
    }


    onBack(): void {
        this.location.back();
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        return true;
    }

    doExtract(): void
    {
        if (this.canExtract) {
            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                minWidth: '75%',
                width: '300px',
                data: {
                    confirmMessage: 'Extract a New Marketing Universe now?',
                    informationMessage: 'This may take some time. Check your updates for information about when it is complete'
                }
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.httpService.saveEntity('extract', {})
                        .subscribe((data: Response) => {
                            this._snackBar.open('Marketing Universe Extract Scheduled', 'Dismiss', {
                                duration: 5000,
                                panelClass: ['snackbar-teal']
                            });
                        }, (errors) => {
                            this.errors = errors;
                        });
                }
            });
        }
    }

    public accountManagement(event): void {
        event.preventDefault();
        this.router.navigate(['/account/management']);
    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        return returnVal;
    }

}
