import type { ICardsService } from "../abstractions/icards-service.js";
import type { ICardsRepository } from "../abstractions/icards-repository.js";
import type { Card } from "../configs/db/schema.js";

export class CardsService implements ICardsService {
  public constructor(private readonly cardsRepository: ICardsRepository) {}

  public async upsert(card: Card): Promise<void> {
    if (card == null) {
      return;
    }

    await this.cardsRepository.upsert(card);
  }

  public async upsertMany(cards: Card[]): Promise<void> {
    if (cards.length === 0) {
      return;
    }

    await this.cardsRepository.upsertMany(cards);
  }

  public async getAllInValueRange(minValue: number | null, maxValue: number | null): Promise<Card[]> {
    return await this.cardsRepository.getAllInValueRange(minValue, maxValue);
  }

  public async getAllByIds(altAssetIds: string[]): Promise<Card[]> {
    return await this.cardsRepository.getAllByIds(altAssetIds);
  }

  public async getAllByBeezieTokenId(beezieTokenId: number): Promise<Card[]> {
    return await this.cardsRepository.getAllByBeezieTokenId(beezieTokenId);
  }

  public async isEmpty(): Promise<boolean> {
    return await this.cardsRepository.isEmpty();
  }

  public async getCountByValueTier(): Promise<{
    lowValue: number;
    mediumValue: number;
    highValue: number;
  }> {
    return await this.cardsRepository.getCountByValueTier();
  }

  public async getAll(limit: number, offset: number): Promise<Card[]> {
    return await this.cardsRepository.getAll(limit, offset);
  }

  public async getAllWithFilters(minValue: number | null, maxValue: number | null, limit: number, offset: number): Promise<Card[]> {
    return await this.cardsRepository.getAllWithFilters(minValue, maxValue, limit, offset);
  }

  public async getCount(): Promise<number> {
    return await this.cardsRepository.getCount();
  }
}
