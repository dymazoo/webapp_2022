import {Component, Inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Observable, Subject} from 'rxjs';

@Component({
    selector: 'confirm-dialog',
    templateUrl: 'confirm.dialog.html',
})
export class ConfirmDialogComponent implements OnInit {

    public confirmForm: FormGroup;
    public confirmMessage: string;
    public informationMessage: string;

    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {

        this.confirmMessage = data['confirmMessage'];
        this.informationMessage = '';
        if (data['informationMessage'] !== undefined) {
            this.informationMessage = data['informationMessage'];
        }
    }

    ngOnInit(): void {
        this.confirmForm = this._formBuilder.group({}
        );
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }

    onCancel(): void {
        this.dialogRef.close();
    }


}
