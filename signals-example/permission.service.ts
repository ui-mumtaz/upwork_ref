import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { ProcessingJackpotService } from 'app/processing-jackpot/services/processing-jackpot.service';
import { IDetailResult, IResponse } from 'core/models/api-response';
import URLS from 'environments/urls';
import { catchError, firstValueFrom, map } from 'rxjs';

export interface JackpotConfigurations {
  accrualForm: boolean,
  voidTaxForm: boolean,
  voidFill: boolean,
  voidJackpot: boolean,
  unlockPendingTrans: boolean,
  reprintFill: boolean,
  reprintJackpot: boolean,
  reprintTaxForm: boolean,
  processManualW2GTaxForm: boolean,
  processManual1099TaxForm: boolean,
  processManual1042STaxForm: boolean,
  fileWorkstationSetup: boolean,
  searchTicket: boolean,
  searchTaxForm: boolean,
  manualJackpot: boolean,
  manualFill: boolean,
  autoJackpot: boolean,
  autoFill: boolean,
  processPMFill: boolean,
  pmFillEditAmount: boolean,
  voidPMFill: boolean,
  reprintPMFill: boolean,
  viewTXDisplay: boolean,
  allowUnfilteredView: boolean,
  editAmountManualJP: boolean,
  editSplitManualJP: boolean,
  editProgressiveManualJP: boolean,
  editExternalBonusManualJP: boolean,
  editUnclaimedManualJP: boolean,
  editCancelCreditManualJP: boolean,
  editPromoManualJP: boolean,
  editAmountAutoJP: boolean,
  editSplitAutoJP: boolean,
  editProgressiveAutoJP: boolean,
  editExternalBonusAutoJP: boolean,
  editUnclaimedAutoJP: boolean,
  editCancelCreditAutoJP: boolean,
  editPromoAutoJP: boolean,
  editAmountAutoFill: boolean,
  editAmountManualFill: boolean,
  postToPlayerStats: boolean
}
export type PermissionResponse = IResponse<IDetailResult<JackpotConfigurations>>;

@Injectable({
  providedIn: 'root'
})
export class PermissionService {

  private readonly http = inject(HttpClient);
  private readonly processingJackpotService = inject(ProcessingJackpotService)
  private readonly permissionsSignal = signal<any | null>(null);
  readonly permissions = computed(() => this.permissionsSignal() ?? {});
  private readonly permissionURL = URLS.permissionApi.permission;
  readonly isPermissionListLoading: WritableSignal<boolean> = signal(false);
  private readonly error: WritableSignal<string | null> = signal(null);

  async fetchPermission(): Promise<void> {
    this.isPermissionListLoading.set(true);
    this.error.set(null);

    try {
      const data = await firstValueFrom(
        this.http.get<PermissionResponse>(this.permissionURL).pipe(
          map(response => response),
          catchError(error => {
            this.error.set('Failed to load permission list');
            throw error;
          })
        )
      );
      if (data) {
        this.permissionsSignal.set(data.result.single);
      }
    } catch (error) {
      this.error.set('Failed to load permission list');
      console.error('Error fetching permission list:', error);
    } finally {
      this.isPermissionListLoading.set(false);
    }
  }

  get isManual() {
    return this.processingJackpotService.isManual();
  }
  get isUnclaimed() {
    return this.processingJackpotService.isUnclaimed();
  }

  hasPermissionForExtBonus(): boolean {
    return this.isManual
      ? this.permissions().editExternalBonusManualJP
      : this.permissions().editExternalBonusAutoJP;

  }

  hasPermissionForCancleCredit(): boolean {
    return this.isManual
      ? this.permissions().editCancelCreditManualJP
      : this.permissions().editCancelCreditAutoJP;

  }

  hasPermissionForProgressive() {
    return this.isManual
      ? this.permissions().editProgressiveManualJP
      : this.permissions().editProgressiveAutoJP;

  }

  hasPermissionForPromotions() {
    return this.isManual
      ? this.permissions().editPromoManualJP
      : this.permissions().editPromoAutoJP;

  }

  hasPermissionForProcess() {
    //This permission reflect on proccess button on detail Page
    if (this.isUnclaimed) {
      return this.hasPermissionToProcessUnclaim();
    }
    if (this.isManual) {
      return this.permissions().processManualW2GTaxForm;
    }
    return true;
  }

  hasPermissionToProcessUnclaim() {
    return this.isManual
      ? this.permissions().editUnclaimedManualJP : this.permissions().editUnclaimedAutoJP;
  }

  hasPermissionForManualProcess() {
    //This permission reflect on procced button on Manul Jackpot Page
    return !this.permissions().processManualW2GTaxForm;
  }

  hasPermissionToVoid() {
    return this.permissions().voidJackpot && this.permissions().voidTaxForm;
  }

  hasPermissionForSplitPayment() {
    //this permission reflect on slpit payment checkout on details page
    return this.isManual
      ? this.permissions().editSplitManualJP
      : this.permissions().editSplitAutoJP;
  }

  hasPermissionSwitchPlayer(): boolean {
    return this.permissions().postToPlayerStats;
  }

  hasPermissionToEditWinningAmount() {
    return this.isManual
      ? this.permissions().editAmountManualJP
      : this.permissions().editAmountAutoJP;
  }

  hasPermissionForAccrual(): boolean {
    return this.permissions().accrualForm;
  }
}

