import { Action, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';

import { BillingActions } from '../actions/billing.actions';

import { BillingResponseV1 } from 'src/api/models/billing-response-v-1';
import { ServiceTypeV1 } from 'src/api/models/service-type-v-1';
import { ChargeType } from '../../models/charge-type.enum';

import { BillingConfig } from '../../models/billing-config.type';

import { BillingSortColumn } from 'src/app/shared/models/sort-column.enum';

import * as _ from 'lodash';

export const billingFeatureKey = 'billing';

export interface BillingState {
  billingRecords: BillingResponseV1 | null;
  billingConfig: BillingConfig | undefined;
  filteredBillingRecords: BillingResponseV1 | null;
  isLoading: boolean;
  error: unknown;
}

export const initialBillingState: BillingState = {
  billingRecords: null,
  billingConfig: undefined,
  filteredBillingRecords: null,
  isLoading: false,
  error: null
};

export const reducer = createReducer(
  initialBillingState,

  on(BillingActions.loadBillingRecords, (state) => ({
    ...state,
    billingRecords: null,
    filteredBillingRecords: null,
    isLoading: true
  })),
  on(BillingActions.loadBillingRecordsSuccess, (state, {data}) => ({
    ...state,
    billingRecords: data,
    filteredBillingRecords: filterBillingRecords(data, state.billingConfig),
    isLoading: false
  })),
  on(BillingActions.loadBillingRecordsFailure, (state, {error}) => ({
    ...state,
    isLoading: false,
    error
  })),

  on(BillingActions.filterBillingRecords, (state, {config}) => ({
    ...state,
    billingConfig: config,
    filteredBillingRecords: filterBillingRecords(state.billingRecords, config)
  }))
);

const filterBillingRecords = (billingRecords: BillingResponseV1 | null, config?: BillingConfig) => {
  let filteredBillingRecords = billingRecords?.product;
  if (config?.sortBy && config.sortBy !== BillingSortColumn.Period) {
    filteredBillingRecords = _.orderBy(
      filteredBillingRecords,
      (billingProduct) => _.get(billingProduct, config.sortBy)?.toString()?.toLowerCase(),
      config.sortOrder === 'DESC' ? 'desc' : 'asc'
    );
  }
  if (config?.textFilter) {
    const textFilterKeys = ['name', 'id', 'circuitId'];
    filteredBillingRecords = _.filter(filteredBillingRecords, (billingProduct) =>
      _.some(billingProduct, (value, key) =>
          textFilterKeys.includes(key) ? _.toLower(value?.toString()).includes(_.toLower(config.textFilter)) : false)
      // TODO: Just in case we'll need to filter through 'charges' also
      // _.some(billingProduct, value => {
      //   if (value instanceof Array) {
      //     return _.some(value, v =>
      //       _.some(v, t => _.toLower(t?.toString()).includes(_.toLower(config.textFilter)))
      //     );
      //   }
      //   return _.toLower(value).includes(_.toLower(config.textFilter));
      // })
    );
  }
  if (config?.serviceType?.length && config.serviceType.length > 0) {
    filteredBillingRecords = _.filter(filteredBillingRecords, (billingProduct) =>
      billingProduct.serviceType ? (config.serviceType as ServiceTypeV1[])?.includes(billingProduct.serviceType) : false);
  }
  if (config?.chargeType?.length && config.chargeType.length > 0) {
    filteredBillingRecords = _.filter(filteredBillingRecords, (billingProduct) =>
      _.some(billingProduct.charges, (charge) => charge.chargeType ?
        (config.chargeType as ChargeType[])?.includes(charge.chargeType as ChargeType) : false)
    );
  }
  return {...billingRecords, product: filteredBillingRecords};
};

export const billingReducer = (state: BillingState | undefined, action: Action) => reducer(state, action);

export const getBillingState = createFeatureSelector<BillingState>(billingFeatureKey);
export const getBillingRecords = createSelector(getBillingState, (state: BillingState) => state.billingRecords);
export const getFilteredBillingRecords = createSelector(getBillingState, (state: BillingState) => state.filteredBillingRecords);
export const isLoading = createSelector(getBillingState, (state: BillingState) => state.isLoading);
export const getError = createSelector(getBillingState, (state: BillingState) => state.error);
