import {Component, Inject, OnInit, Pipe} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {Observable, Subject} from 'rxjs';
import {DomSanitizer} from '@angular/platform-browser';

@Component({
    selector: 'confirm-dialog',
    templateUrl: 'confirm.dialog.html',
})

export class ConfirmDialogComponent implements OnInit {

    public confirmForm: FormGroup;
    public title: string;
    public confirmMessage: string;
    public informationMessage: string = '';
    public rawHtml: string = '';
    public buttons: string;

    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        private _formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: any) {

        this.confirmMessage = data['confirmMessage'];
        this.informationMessage = '';
        if (data['informationMessage'] !== undefined) {
            this.informationMessage = data['informationMessage'];
        }
        if (data['rawHtml'] !== undefined) {
            this.rawHtml = data['rawHtml'];
        }
        if (data['buttons'] !== undefined) {
            this.buttons = data['buttons'];
        } else {
            this.buttons = 'yesno';
        }
        if (data['title'] !== undefined) {
            this.title = data['title'];
        } else {
            this.title = 'Confirm';
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
