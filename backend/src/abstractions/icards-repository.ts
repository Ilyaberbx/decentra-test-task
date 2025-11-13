import type { Card } from "../configs/db/schema.js";

export interface ICardsRepository {
  upsert(card: Card): Promise<void>;
  upsertMany(cards: Card[]): Promise<void>;
  getAllInValueRange(minValue: number | null, maxValue: number | null): Promise<Card[]>;
  getAll(limit: number, offset: number): Promise<Card[]>;
  getAllWithFilters(minValue: number | null, maxValue: number | null, limit: number, offset: number): Promise<Card[]>;
  getCount(): Promise<number>;
  getAllByIds(altAssetIds: string[]): Promise<Card[]>;
  getAllByBeezieTokenId(beezieTokenId: number): Promise<Card[]>;
  isEmpty(): Promise<boolean>;
  getCountByValueTier(): Promise<{
    lowValue: number;
    mediumValue: number;
    highValue: number;
  }>;
}
