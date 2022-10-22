import {
    Component,
    OnDestroy,
    OnInit,
    Inject,
    EventEmitter,
    Output,
    ViewChildren,
    QueryList,
    ElementRef,
    AfterViewInit, ViewChild
} from '@angular/core';
import {Location} from '@angular/common';
import {FormArray, FormBuilder, FormGroup, FormControl, Validators} from '@angular/forms';
import {Router, ActivatedRoute} from '@angular/router';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';
import {TranslocoService} from '@ngneat/transloco';
import {fuseAnimations} from '@fuse/animations';
import {MatSnackBar} from '@angular/material/snack-bar';
import {Observable, Subject} from 'rxjs';

import {HttpService} from 'app/shared/services/http.service';
import {AbandonDialogService} from 'app/shared/services/abandon-dialog.service';
import {ConfirmDialogComponent} from '../../shared/components/confirm-dialog.component';
import {Client} from 'app/shared/models/client';
import {GlobalValidator} from '../../shared/global-validator';
import * as moment from 'moment';

@Component({
    selector: 'account-management',
    templateUrl: './accountmanagement.component.html',
    animations: fuseAnimations
})

export class AccountManagementComponent implements OnInit, OnDestroy, AfterViewInit {

    public errors = [];

    public accountForm: FormGroup;
    public canClientAdmin = false;
    public client: Client;
    public hasData = false;

    public monthlyPlanPrice: number = 0;
    public yearlyPlanPrice: number = 0;
    public monthlyProfilePrice: number = 0;
    public yearlyProfilePrice: number = 0;
    public monthlyPrice: number = 0;
    public yearlyPrice: number = 0;
    public nextBillingDate: string = '';
    public yearlyBilling: boolean = true;
    public countryList;
    public timeZoneList;
    public leaving: boolean = false;

    private touchStart = 0;
    private _unsubscribeAll: Subject<any>;


    constructor(
        private _formBuilder: FormBuilder,
        private httpService: HttpService,
        private abandonDialogService: AbandonDialogService,
        private _translocoService: TranslocoService,
        public dialog: MatDialog,
        private _snackBar: MatSnackBar,
        private router: Router,
        private location: Location
    ) {
        this._translocoService.setActiveLang('en');
        this._unsubscribeAll = new Subject();

        // Check permissions
        this.canClientAdmin = this.httpService.hasPermission('client_admin');
    }

    ngOnInit(): void {
        this.httpService.getEntity('client', '')
            .subscribe((result) => {
                this.client = result;
                this.hasData = true;
                if (this.client.billing === 'monthly') {
                    this.yearlyBilling = false;
                } else {
                    this.yearlyBilling = true;
                }
                if (this.client.nextBillingDate === 'never') {
                    this.nextBillingDate = 'Never';
                } else {
                    this.nextBillingDate = moment(this.client.nextBillingDate, 'YYYY-MM-DD').format('LL');
                }
                this.countryList = result.countryList;
                this.timeZoneList = result.timeZoneList;
                if (this.client.leftDate.length > 0) {
                    this.leaving = true;
                    this.nextBillingDate = 'Subscription Ended';
                } else {
                    this.leaving = false;
                }
                this.populateForm();
            }, (errors) => {
                this.errors = errors;
            });
        this.accountForm = this._formBuilder.group({
            name: ['', [Validators.required]],
            address1: [''],
            address2: [''],
            city: [''],
            postcode: [''],
            country: [''],
            timezone: [''],
            telephone: ['',  [Validators.compose([GlobalValidator.telephoneFormat])]],
            billing: ['', [Validators.required]],
            plan: ['', [Validators.required]],
            profiles: [''],
        }, {});

    }

    populateForm(): void {
        this.accountForm.controls['name'].setValue(this.client.name);
        this.accountForm.controls['address1'].setValue(this.client.address1);
        this.accountForm.controls['address2'].setValue(this.client.address2);
        this.accountForm.controls['city'].setValue(this.client.city);
        this.accountForm.controls['postcode'].setValue(this.client.postcode);
        this.accountForm.controls['country'].setValue(this.client.country);
        this.accountForm.controls['timezone'].setValue(this.client.timeZone);
        this.accountForm.controls['billing'].setValue(this.client.billing);
        this.accountForm.controls['plan'].setValue(this.client.plan);
        this.accountForm.controls['profiles'].setValue(this.client.profiles);
        this.accountForm.controls['telephone'].setValue(this.client.telephone);
        this.doCalculate();
    }

    save(): void {
        this.errors = [];
        this.client.name = this.accountForm.controls['name'].value;
        this.client.address1 = this.accountForm.controls['address1'].value;
        this.client.address2 = this.accountForm.controls['address2'].value;
        this.client.city = this.accountForm.controls['city'].value;
        this.client.postcode = this.accountForm.controls['postcode'].value;
        this.client.country = this.accountForm.controls['country'].value;
        this.client.timeZone = this.accountForm.controls['timezone'].value;
        this.client.billing = this.accountForm.controls['billing'].value;
        this.client.plan = this.accountForm.controls['plan'].value;
        this.client.profiles = this.accountForm.controls['profiles'].value;
        this.client.telephone = this.accountForm.controls['telephone'].value;

        this.httpService.saveEntity('client', this.client)
            .subscribe((data: Response) => {
                this._snackBar.open('Account saved', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
                this.accountForm.markAsPristine();
            }, (errors) => {
                this.errors = errors;
            });
    }

    endSubscription(): void {
        this.errors = [];
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            minWidth: '75%',
            width: '300px',
            data: {
                confirmMessage: 'Are you sure you want to end your subscription? ALL YOUR DATA WILL BE LOST!',
                informationMessage: 'Your account will stay active until the end of the current period. You can change your mind at any time'
            }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.httpService.saveEntity('end-subscription', this.client)
                    .subscribe((data: Response) => {
                        this.leaving = true;
                        this.nextBillingDate = 'Subscription Ended';
                        this._snackBar.open('Subscription Ended', 'Dismiss', {
                            duration: 5000,
                            panelClass: ['snackbar-teal']
                        });
                        this.onCancel();
                    }, (errors) => {
                        this.errors = errors;
                    });
            }
        });


    }

    cancelLeaving(): void {
        this.errors = [];

        this.httpService.saveEntity('cancel-leaving', this.client)
            .subscribe((data: Response) => {
                this.leaving = false;
                this._snackBar.open('Subscription Extended', 'Dismiss', {
                    duration: 5000,
                    panelClass: ['snackbar-teal']
                });
                this.onCancel();
            }, (errors) => {
                this.errors = errors;
            });
    }

    onCancel(): void {
        this.httpService.getEntity('client', '')
            .subscribe(result => {
                this.hasData = true;
                this.client = result;
                if (this.client.billing === 'monthly') {
                    this.yearlyBilling = false;
                } else {
                    this.yearlyBilling = true;
                }
                if (this.client.nextBillingDate === 'never') {
                    this.nextBillingDate = 'Never';
                } else {
                    this.nextBillingDate = moment(this.client.nextBillingDate, 'YYYY-MM-DD').format('LL');
                }
                this.countryList = result.countryList;
                this.timeZoneList = result.timeZoneList;
                if (this.client.leftDate.length > 0) {
                    this.leaving = true;
                    this.nextBillingDate = 'Subscription Ended';
                } else {
                    this.leaving = false;
                }
                this.populateForm();
            }, (errors) => {
                this.errors = errors;
            });
    }


    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    onBack(): void {
        this.location.back();
    }

    canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
        if (this.accountForm.dirty) {
            return this.abandonDialogService.showDialog();
        } else {
            return true;
        }
    }

    formatSliderLabel(value: number): string {
        if (value >= 1000) {
            return Math.round(value / 1000) + 'k';
        }

        return '0';
    }

    setPlan(event): void {
        const plan = this.accountForm.controls['plan'].value;
        const clientPlan = this.client.plan;
        let serviceDowngrade = false;
        if (clientPlan === 'consultant' && plan !== 'consultant') {
            serviceDowngrade = true;
        }
        if (clientPlan === 'specialist' && plan === 'analyst') {
            serviceDowngrade = true;
        }
        if (serviceDowngrade) {
            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                minWidth: '33%',
                width: '300px',
                data: {
                    confirmMessage: 'Changing your plan will reduce the features you are using!',
                    informationMessage: 'Your current features will remain active until the end of the current period'
                }
            });
            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    this.client.plan = plan;
                    this.accountForm.controls['profiles'].setValue(this.client.profiles);
                    this.doCalculate();
                }
            });
        } else {
            this.client.plan = plan;
            if (plan === 'specialist' && this.client.profiles < 15000) {
                this.client.profiles = 15000;
            }
            if (plan === 'consultant' && this.client.profiles < 50000) {
                this.client.profiles = 50000;
            }
            this.accountForm.controls['profiles'].setValue(this.client.profiles);
            this.doCalculate();
        }
    }

    setBilling(event): void {
        const billing = this.accountForm.controls['billing'].value;
        this.client.billing = billing;
        if (billing === 'monthly') {
            this.yearlyBilling = false;
        } else {
            this.yearlyBilling = true;
        }
        this.doCalculate();
    }

    onSliderChange(event): void {
        const profiles = this.accountForm.controls['profiles'].value;
        this.client.profiles = profiles;
        const plan = this.client.plan;
        if (plan === 'analyst' && profiles < 5000) {
            this.client.profiles = 5000;
        }
        if (plan === 'specialist' && profiles < 15000) {
            this.client.profiles = 15000;
        }
        if (plan === 'consultant' && profiles < 50000) {
            this.client.profiles = 50000;
        }
        this.accountForm.controls['profiles'].setValue(this.client.profiles);
        this.doCalculate();
    }

    doCalculate(): void {
        const plan = this.client.plan;
        const billing = this.client.billing;
        const profiles = this.client.profiles;
        let freeProfiles = 5000;
        let paidProfiles = 0;
        let monthlyProfilePrice = 0;
        let yearlyProfilePrice = 0;
        let monthlyPlanPrice = 0;
        let yearlyPlanPrice = 0;
        let monthlyPrice = 0;
        let yearlyPrice = 0;
        if (billing === 'monthly') {
            if (plan === 'analyst') {
                freeProfiles = 5000;
                monthlyPlanPrice = 25;

            }
            if (plan === 'specialist') {
                freeProfiles = 15000;
                monthlyPlanPrice = 35;
            }
            if (plan === 'consultant') {
                freeProfiles = 50000;
                monthlyPlanPrice = 50;
            }
            if (profiles > freeProfiles) {
                paidProfiles = profiles - freeProfiles;
                monthlyProfilePrice = paidProfiles / 10000 * 5;
            }
            monthlyPrice = monthlyPlanPrice + monthlyProfilePrice;
        } else {
            if (plan === 'analyst') {
                freeProfiles = 5000;
                monthlyPlanPrice = 19.95;

            }
            if (plan === 'specialist') {
                freeProfiles = 15000;
                monthlyPlanPrice = 27.95;
            }
            if (plan === 'consultant') {
                freeProfiles = 50000;
                monthlyPlanPrice = 39.95;
            }
            if (profiles > freeProfiles) {
                paidProfiles = profiles - freeProfiles;
                monthlyProfilePrice = paidProfiles / 5000 * 2.5;
            }
            monthlyPrice = monthlyPlanPrice + monthlyProfilePrice;
        }

        yearlyPlanPrice = monthlyPlanPrice * 12;
        yearlyProfilePrice = monthlyProfilePrice * 12;
        yearlyPrice = yearlyPlanPrice + yearlyProfilePrice;
        this.monthlyPlanPrice = monthlyPlanPrice;
        this.yearlyPlanPrice = yearlyPlanPrice;
        this.monthlyProfilePrice= monthlyProfilePrice;
        this.yearlyProfilePrice = yearlyProfilePrice;
        this.monthlyPrice = monthlyPrice;
        this.yearlyPrice = yearlyPrice;

    }

    getErrorMessage(control, name): string {
        let returnVal = '';
        if (control.hasError('required')) {
            returnVal = name + ' is required!';
        }
        if (control.hasError('telephone')) {
            returnVal = name + ' is invalid!';
        }
        return returnVal;
    }

    clearErrors(): void {
        this.errors = [];
    }

}



