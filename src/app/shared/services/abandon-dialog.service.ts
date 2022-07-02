import {Observable, Subject} from 'rxjs';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';

import {AbandonDialogComponent} from '../components/abandon-dialog.component';
import {Injectable} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';

@Injectable()
export class AbandonDialogService {
    private abandonSubject = new Subject<any>();

    constructor(
        public dialog: MatDialog,
        private location: Location,
        private router: Router
    ) {
    }

    public showDialog(): Observable<any> {
        const dialogRef = this.dialog.open(AbandonDialogComponent, {
            minWidth: '60%',
            data: {'service': this}
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.abandonSubject.next(true);
            } else {
                this.location.go(this.router.url);
                this.abandonSubject.next(false);
            }
        });
        return this.abandonSubject.asObservable();
    }

}
