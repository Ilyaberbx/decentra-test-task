import cron from "node-cron";
import { categoriesToFetch } from "../configs/categoriesToFetch.js";
import type { ICardsService } from "../abstractions/icards-service.js";
import type { ICronService } from "../abstractions/icron-service.js";
import type { IBeezieService } from "../abstractions/ibeezie-service.js";
import type { IAltService } from "../abstractions/ialt-service.js";
import type { TransformedDetailedTokenData } from "../dto/transformedDetailedTokenData.js";
import { processBatched } from "../utils/batchProcessor.js";

const PER_DAY = "0 0 * * *";
const PER_TWO_DAYS = "0 0 */2 * *";
const PER_THREE_DAYS = "0 0 */3 * *";

export class CronService implements ICronService {
  private syncInProgress: boolean = false;

  public constructor(
    private readonly cardsService: ICardsService,
    private readonly beezieService: IBeezieService,
    private readonly altService: IAltService
  ) {}

  public startJobs(): void {
    console.log("Initializing cron jobs for card market value updates");

    cron.schedule(PER_DAY, async () => {
      await this.updateHighValueCards();
    });

    cron.schedule(PER_TWO_DAYS, async () => {
      await this.updateMediumValueCards();
    });

    cron.schedule(PER_THREE_DAYS, async () => {
      await this.updateLowValueCards();
    });

    console.log("Cron jobs initialized successfully");
  }

  public async syncCards(): Promise<void> {
    if (this.syncInProgress) {
      console.log("Sync already in progress, skipping");
      return;
    }

    this.syncInProgress = true;
    console.log("Starting initial fetch and store of all cards");

    try {
      for (const category of categoriesToFetch) {
        const tokenDetails = await this.beezieService.fetchTokenDetailsByCategory(category);
        await this.processTransformedTokenDetails(tokenDetails);
      }
    } catch (error) {
      console.error("Error during initial fetch and store:", error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  public isSyncing(): boolean {
    return this.syncInProgress;
  }
  private async updateCardsInValueRange(minValue: number | null, maxValue: number | null, label: string): Promise<void> {
    try {
      const cards = await this.cardsService.getAllInValueRange(minValue, maxValue);

      if (cards.length === 0) {
        console.log(`No ${label} cards to update`);
        return;
      }

      const tokenDetails = await processBatched(cards, (card) => this.beezieService.fetchTokenDetailsById(card.beezieTokenId), {
        batchSize: 50,
        delayBetweenBatchesMs: 500,
      });

      await this.processTransformedTokenDetails(tokenDetails);
      console.log(`${label} cards update completed`);
    } catch (error) {
      console.error(`Error during ${label} cards update:`, error);
    }
  }

  private async processTransformedTokenDetails(tokenDetails: TransformedDetailedTokenData[]): Promise<void> {
    console.log(`Processing ${tokenDetails.length} token details`);

    const rawEnrichedAltDataCollection = await processBatched(tokenDetails, (tokenDetail) => this.altService.enrichWithAltData(tokenDetail), {
      batchSize: 50,
      delayBetweenBatchesMs: 500,
    });

    const enrichedAltDataCollection = rawEnrichedAltDataCollection.filter((enrichedAltData) => enrichedAltData !== null);

    const cards = enrichedAltDataCollection.map((enrichedAltData) => ({
      beezieTokenId: enrichedAltData.beezieTokenId,
      altAssetId: enrichedAltData.altAssetId,
      altMarketValue: enrichedAltData.altMarketValue.toString(),
    }));

    try {
      console.log(`Upserting ${cards.length} cards in bulk`);
      await this.cardsService.upsertMany(cards);
    } catch (error) {
      console.error(`Error during enriched alt data collection processing:`, error);
    }
  }

  private async updateHighValueCards(): Promise<void> {
    return this.updateCardsInValueRange(200, null, "high value");
  }

  private async updateMediumValueCards(): Promise<void> {
    return this.updateCardsInValueRange(100, 200, "medium value");
  }

  private async updateLowValueCards(): Promise<void> {
    return this.updateCardsInValueRange(null, 100, "low value");
  }
}
