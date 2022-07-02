import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Observable, Subject} from 'rxjs';

@Component({
    selector: 'abandon-dialog',
    templateUrl: 'abandon.dialog.html',
})
export class AbandonDialogComponent implements OnInit {

    public abandonForm: FormGroup;
    abandonService: any;

    constructor(
        public dialogRef: MatDialogRef<AbandonDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {
        this.abandonService = data['service'];
    }

    ngOnInit(): void {
        this.abandonForm = this._formBuilder.group({}
        );
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }

    onCancel(): void {
        this.dialogRef.close();
    }


}
