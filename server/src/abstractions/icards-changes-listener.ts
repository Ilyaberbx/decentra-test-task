import type { Card } from "../configs/db/schema.js";

export interface ICardsChangesListener {
  onCardsChanged(cards: Card[]): Promise<void>;
}
