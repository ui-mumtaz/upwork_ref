import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import { BillingActions } from '../actions/billing.actions';

import { BillingResponseV1 } from 'src/api/models/billing-response-v-1';

import { BillingService } from 'src/api/services/billing.service';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

import { catchError, map, Observable, of, switchMap } from 'rxjs';

@Injectable()
export class BillingEffects {
  loadBillingRecordsEffect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BillingActions.loadBillingRecords),
      switchMap((action: any) => (this.billingService.v1BillingGet({
          'x-client-user-agent': AuthService.X_CLIENT_USER_AGENT,
          billingMonth: action.billingMonth,
          billingYear: action.billingYear
        }) as Observable<BillingResponseV1>)
          .pipe(
            map((data: BillingResponseV1) => BillingActions.loadBillingRecordsSuccess({data})),
            catchError((error) => of(BillingActions.loadBillingRecordsFailure({error}))))
      ))
  );

  constructor(private actions$: Actions, private billingService: BillingService) {
  }
}
