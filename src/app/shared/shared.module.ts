import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {RouterModule} from '@angular/router';

import {MatButtonModule} from '@angular/material/button';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatStepperModule} from '@angular/material/stepper';
import {MatCardModule} from '@angular/material/card';
import {MatDialogModule} from '@angular/material/dialog';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatTableModule} from '@angular/material/table';
import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import {MatTreeModule} from '@angular/material/tree';
import {MatMenuModule} from '@angular/material/menu';
import {MatRadioModule} from '@angular/material/radio';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatMomentDateModule} from '@angular/material-moment-adapter';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';

import { FuseScrollbarModule } from '@fuse/directives/scrollbar';
import {TranslocoModule} from '@ngneat/transloco';
import {FuseCardModule} from '@fuse/components/card';

import {GravatarModule} from 'ngx-gravatar';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {MaterialFileInputModule } from 'ngx-material-file-input';
import {AbandonDialogComponent} from './components/abandon-dialog.component';
import {ConfirmDialogComponent} from './components/confirm-dialog.component';
import {LoginComponent} from 'app/auth/login.component';

@NgModule({
    declarations: [
        AbandonDialogComponent,
        ConfirmDialogComponent,
        LoginComponent,
    ],

    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RouterModule,

        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatStepperModule,
        MatDialogModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatCheckboxModule,
        MatTableModule,
        MatTreeModule,
        MatPaginatorModule,
        MatSortModule,
        MatMenuModule,
        MatRadioModule,
        MatDatepickerModule,
        MatMomentDateModule,
        MatProgressSpinnerModule,

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
        MatDialogModule,
        MatSnackBarModule,
        MatTooltipModule,
        MatCheckboxModule,
        MatTableModule,
        MatTreeModule,
        MatPaginatorModule,
        MatSortModule,
        MatMenuModule,
        MatRadioModule,
        MatDatepickerModule,
        MatMomentDateModule,
        MatProgressSpinnerModule,

        FuseScrollbarModule,
        FuseCardModule,
        TranslocoModule,

        GravatarModule,
        DragDropModule,
        MaterialFileInputModule,
        AbandonDialogComponent,
        ConfirmDialogComponent,
        LoginComponent,

    ],
})
export class SharedModule
{
}
