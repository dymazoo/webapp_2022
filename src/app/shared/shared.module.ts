import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatStepperModule} from '@angular/material/stepper';
import {MatCardModule} from '@angular/material/card';
import {MatMomentDateModule} from '@angular/material-moment-adapter';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatTreeModule} from '@angular/material/tree';
import {MatMenuModule} from '@angular/material/menu';

import { FuseScrollbarModule } from '@fuse/directives/scrollbar';
import {TranslocoModule} from '@ngneat/transloco';
import {FuseCardModule} from '@fuse/components/card';

import {GravatarModule} from 'ngx-gravatar';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MaterialFileInputModule } from 'ngx-material-file-input';
import {AbandonDialogComponent} from './components/abandon-dialog.component';
import {ConfirmDialogComponent} from './components/confirm-dialog.component';

@NgModule({
    declarations: [
        AbandonDialogComponent,
        ConfirmDialogComponent,
    ],

    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatStepperModule,
        MatMomentDateModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatCheckboxModule,
        MatTableModule,
        MatTreeModule,
        MatPaginatorModule,
        MatSortModule,
        MatMenuModule,

        FuseScrollbarModule,
        FuseCardModule,
        TranslocoModule,

        GravatarModule,
        DragDropModule,
        MaterialFileInputModule,
    ],
    exports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatStepperModule,
        MatCardModule,
        MatMomentDateModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatCheckboxModule,
        MatTableModule,
        MatTreeModule,
        MatPaginatorModule,
        MatSortModule,
        MatMenuModule,

        FuseScrollbarModule,
        FuseCardModule,
        TranslocoModule,

        GravatarModule,
        DragDropModule,
        MaterialFileInputModule,
        AbandonDialogComponent,
        ConfirmDialogComponent,

    ]
})
export class SharedModule
{
}
