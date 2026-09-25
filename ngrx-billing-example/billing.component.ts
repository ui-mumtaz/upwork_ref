import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { FormControl } from '@angular/forms';
import { CurrencyPipe } from '@angular/common';

import { MatDatepicker } from '@angular/material/datepicker';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

import { TranslateService } from '@ngx-translate/core';

import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

import { BillingActions } from './store/actions/billing.actions';
import { BillingState, getFilteredBillingRecords, isLoading } from './store/reducers/billing.reducer';

import { ThemeService } from '../../shared/services/theme.service';

import { BillingChargeV1, BillingProductV1, BillingResponseV1, ProductTypeV1 } from 'src/api/models';

import { Observable } from 'rxjs';

import * as moment from 'moment';
import * as _ from 'lodash';

@UntilDestroy()
@Component({
  selector: 'app-billing',
  templateUrl: './billing.component.html',
  styleUrls: ['./billing.component.scss']
})
export class BillingComponent implements OnInit {
  readonly billingTranslateKey = 'pages.billing.table.columns.';
  readonly maxBillingDate = moment().startOf('month').subtract(1, 'day');

  billingColumns: string[] = ['name', 'id', 'circuitId', 'chargeType', 'amount', 'date', 'totalAmount'];

  billingRecords$: Observable<BillingResponseV1 | null>;
  billingRecordsLoading$: Observable<boolean>;

  billingTableData: any[] = [];

  billingDateControl = new FormControl(moment(this.maxBillingDate));

  constructor(private store: Store<BillingState>, private themeService: ThemeService,
              private translateService: TranslateService, private cp: CurrencyPipe) {
    this.billingRecords$ = this.store.pipe(select(getFilteredBillingRecords));
    this.billingRecordsLoading$ = this.store.pipe(select(isLoading));
  }

  ngOnInit() {
    this.loadBillingRecords();

    this.billingRecords$.pipe(untilDestroyed(this))
      .subscribe((billingRecords) => {
        this.populateBillingTable(billingRecords);
      });
  }

  private loadBillingRecords() {
    const billingDate = this.billingDateControl.value || moment(this.maxBillingDate);
    this.store.dispatch(BillingActions.loadBillingRecords({
        billingMonth: billingDate.month() + 1, billingYear: billingDate.year()
      })
    );
  }

  private populateBillingTable(billingRecords: BillingResponseV1 | null) {
    const billingTableData: any[] = [];
    billingRecords?.product?.forEach((billingProduct: BillingProductV1) => {
      billingProduct.charges?.forEach((charge: BillingChargeV1, index: number) => {
        billingTableData.push({
          ...index === 0 ? {
            ...billingProduct,
            circuitId: billingProduct.circuitId || 'N/A'
          } : {},
          ...charge,
          amount: charge.chargeType === 'RENTAL' || charge.chargeType === 'BOOST' ?
            `${this.cp.transform(charge.amount, billingRecords?.currency)} /
            ${this.translateService.instant('general.frequency.' + charge.frequency)}` : 'N/A',
          chargeType: `pages.billing.chargeType.${charge.chargeType}`,
          date: charge.chargeType === 'RENTAL' || charge.chargeType === 'BOOST' ?
            `${this.formatBillingDate(charge.from, charge.frequency)} to
            ${this.formatBillingDate(charge.to, charge.frequency)}` :
            this.formatBillingDate(charge.date, charge.frequency),
          localDate: charge.chargeType === 'RENTAL' || charge.chargeType === 'BOOST' ?
            `${this.formatBillingDate(charge.from, charge.frequency, true)} to
            ${this.formatBillingDate(charge.to, charge.frequency, true)}` :
            this.formatBillingDate(charge.date, charge.frequency, true),
          totalAmount: this.cp.transform(charge.totalAmount, billingRecords?.currency)
        });
      });
    });
    this.billingTableData = billingTableData;
  }

  onTimezoneChange(event: MatSlideToggleChange) {
    const columns = _.cloneDeep(this.billingColumns);
    columns[5] = event.checked ? 'localDate' : 'date';
    this.billingColumns = columns;
  }

  onBillingDateSelected(monthAndYear: Date, datepicker: MatDatepicker<moment.Moment>) {
    const ctrlValue = this.billingDateControl.value ?? moment(this.maxBillingDate);
    ctrlValue.month(moment(monthAndYear).month());
    ctrlValue.year(moment(monthAndYear).year());
    this.billingDateControl.setValue(ctrlValue);
    this.loadBillingRecords();
    datepicker.close();
  }

  billingIconFn = (billingProduct: any): { name: string; svgIcon: boolean } => {
    switch (billingProduct.productType) {
      case ProductTypeV1.EthernetPort:
      case ProductTypeV1.OffnetPort:
        return {name: 'ethernet-port', svgIcon: true};
      case ProductTypeV1.CrossConnect:
        return {name: 'cross-connect', svgIcon: true};
      case ProductTypeV1.EthernetConnection:
        return {name: 'connection', svgIcon: true};
      case ProductTypeV1.IpaccessCircuit:
      case ProductTypeV1.ManagedIpaccess:
        return {name: 'ip-access', svgIcon: true};
      case ProductTypeV1.AzureExpress:
        return {name: 'azure-logo', svgIcon: false};
      case ProductTypeV1.AwsHosted:
      case ProductTypeV1.AwsDedicated:
        return {name: this.isDarkTheme ? 'aws-logo' : 'aws-logo-white', svgIcon: false};
      case ProductTypeV1.GooglePort:
        return {name: 'google-logo', svgIcon: false};
      case ProductTypeV1.IbmPort:
        return {name: this.isDarkTheme ? 'ibm-logo' : 'ibm-logo-white', svgIcon: false};
      case ProductTypeV1.OraclePort:
        return {name: 'oracle-logo', svgIcon: false};
      case ProductTypeV1.EquinixPort:
        return {name: 'equinix-logo', svgIcon: false};
      default:
        return {name: '', svgIcon: true};
    }
  };

  private formatBillingDate(date: string | undefined, frequency: 'HOURLY' | 'MONTHLY' | 'NONE' | undefined, localDate = false): string {
    const format = 'YYYY/MM/DD' + (frequency === 'HOURLY' ? ', HH:mm' : '');
    if (localDate) {
      return moment.utc(date).local().format(format);
    }
    return moment(date).format(format);
  }

  private get isDarkTheme(): boolean {
    return this.themeService.preferredTheme === 'dark';
  }
}
