import { cards, type Card } from "../configs/db/schema.js";
import { and, inArray, sql } from "drizzle-orm";
import type { MySql2Database } from "drizzle-orm/mysql2";
import type { ICardsRepository } from "../abstractions/icards-repository.js";

export class CardsRepository implements ICardsRepository {
  constructor(private db: MySql2Database) {}

  async upsert(newCard: Card): Promise<void> {
    await this.db
      .insert(cards)
      .values(newCard)
      .onDuplicateKeyUpdate({
        set: {
          altMarketValue: newCard.altMarketValue,
        },
      });
  }

  async upsertMany(newCards: Card[]): Promise<void> {
    if (newCards.length === 0) {
      return;
    }

    for (const newCard of newCards) {
      await this.db
        .insert(cards)
        .values(newCard)
        .onDuplicateKeyUpdate({
          set: {
            altMarketValue: newCard.altMarketValue,
          },
        });
    }
  }

  async getAllInValueRange(minValue: number | null, maxValue: number | null): Promise<Card[]> {
    let condition;

    if (minValue !== null && maxValue !== null) {
      condition = and(
        sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) >= ${minValue}`,
        sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) < ${maxValue}`
      );
    } else if (minValue !== null) {
      condition = sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) >= ${minValue}`;
    } else if (maxValue !== null) {
      condition = sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) < ${maxValue}`;
    }

    const result = await this.db
      .select({ beezieTokenId: cards.beezieTokenId, altAssetId: cards.altAssetId, altMarketValue: cards.altMarketValue })
      .from(cards)
      .where(condition);

    return result;
  }

  async getAllByIds(altAssetIds: string[]): Promise<Card[]> {
    const result = await this.db
      .select({ altAssetId: cards.altAssetId, altMarketValue: cards.altMarketValue, beezieTokenId: cards.beezieTokenId })
      .from(cards)
      .where(inArray(cards.altAssetId, altAssetIds));

    return result;
  }

  async isEmpty(): Promise<boolean> {
    const result = await this.db.select({ count: sql<number>`COUNT(*)` }).from(cards);
    return result[0].count === 0;
  }

  async getAllByLimit(limit: number, offset: number): Promise<Card[]> {
    const result = await this.db
      .select({ beezieTokenId: cards.beezieTokenId, altAssetId: cards.altAssetId, altMarketValue: cards.altMarketValue })
      .from(cards)
      .limit(limit)
      .offset(offset);

    return result;
  }

  async getAllWithFilters(minValue: number | null, maxValue: number | null, limit: number, offset: number): Promise<Card[]> {
    let condition;

    if (minValue !== null && maxValue !== null) {
      condition = and(
        sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) >= ${minValue}`,
        sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) <= ${maxValue}`
      );
    } else if (minValue !== null) {
      condition = sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) >= ${minValue}`;
    } else if (maxValue !== null) {
      condition = sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) <= ${maxValue}`;
    }

    const result = await this.db
      .select({ beezieTokenId: cards.beezieTokenId, altAssetId: cards.altAssetId, altMarketValue: cards.altMarketValue })
      .from(cards)
      .where(condition)
      .limit(limit)
      .offset(offset);

    return result;
  }

  async getCount(): Promise<number> {
    const result = await this.db.select({ count: sql<number>`COUNT(*)` }).from(cards);
    return result[0].count;
  }

  async getAllByBeezieTokenId(beezieTokenId: number): Promise<Card[]> {
    const result = await this.db
      .select({ altAssetId: cards.altAssetId, altMarketValue: cards.altMarketValue, beezieTokenId: cards.beezieTokenId })
      .from(cards)
      .where(sql`${cards.beezieTokenId} = ${beezieTokenId}`);

    return result;
  }

  async getCountByValueTier(): Promise<{
    lowValue: number;
    mediumValue: number;
    highValue: number;
  }> {
    const lowValuePromise = this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cards)
      .where(sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) < 100`);

    const mediumValuePromise = this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cards)
      .where(and(sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) >= 100`, sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) <= 200`));

    const highValuePromise = this.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(cards)
      .where(sql`CAST(${cards.altMarketValue} AS DECIMAL(10,2)) > 200`);

    const [lowValueResult, mediumValueResult, highValueResult] = await Promise.all([lowValuePromise, mediumValuePromise, highValuePromise]);

    return {
      lowValue: lowValueResult[0].count,
      mediumValue: mediumValueResult[0].count,
      highValue: highValueResult[0].count,
    };
  }
}
