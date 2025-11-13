import type { IWalletService } from "../abstractions/iwallet-service.js";
import type { ICardsChangesListener } from "../abstractions/icards-changes-listener.js";
import type { ICronService } from "../abstractions/icron-service.js";
import type { Card } from "../configs/db/schema.js";
import { walletInfo } from "../configs/mockWalletInfo.js";
import type { ICardsService } from "../abstractions/icards-service.js";

const ORDER_MAX_VALUE = 200;
const THRESHOLD_TO_STOP_ORDERING = 100;

export class OrdersService implements ICardsChangesListener {
  constructor(
    private readonly walletService: IWalletService,
    private readonly cronService: ICronService,
    private readonly cardsService: ICardsService,
    private readonly placeOrdersDuringSync: boolean
  ) {
    this.cardsService.subscribeToChanges(this);
  }

  public async onCardsChanged(cards: Card[]): Promise<void> {
    const isSyncing = this.cronService.isSyncing();
    if (isSyncing && !this.placeOrdersDuringSync) {
      return;
    }

    for (const card of cards) {
      const orderValue = Number(card.altMarketValue);
      const balance = await this.walletService.balanceOf(walletInfo.address);

      if (balance <= THRESHOLD_TO_STOP_ORDERING) {
        return;
      }

      if (orderValue > ORDER_MAX_VALUE) {
        continue;
      }

      if (balance < orderValue) {
        continue;
      }

      await this.placeOrder(card);
    }
  }

  private placeOrder(card: Card): Promise<void> {
    const order = {
      value: Number(card.altMarketValue),
      assetId: card.altAssetId,
    };

    console.log(`Placing order for card ${order.assetId} with value ${order.value}`);
    this.walletService.withdraw(walletInfo.address, order.value);
    return Promise.resolve();
  }
}
