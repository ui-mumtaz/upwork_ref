import { createActionGroup, props } from '@ngrx/store';

import { BillingResponseV1 } from 'src/api/models/billing-response-v-1';
import { BillingConfig } from '../../models/billing-config.type';

export const BillingActions = createActionGroup({
  source: 'Billing',
  events: {
    'Load Billing Records': props<{ billingMonth: number; billingYear: number }>(),
    'Load Billing Records Success': props<{ data: BillingResponseV1 }>(),
    'Load Billing Records Failure': props<{ error: unknown }>(),

    'Filter Billing Records': props<{ config?: BillingConfig }>()
  }
});
