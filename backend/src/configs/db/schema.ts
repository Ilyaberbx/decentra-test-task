import { mysqlTable, varchar, decimal, int, index } from "drizzle-orm/mysql-core";

export const cards = mysqlTable(
  "cards",
  {
    beezieTokenId: int("beezie_token_id").primaryKey().notNull(),
    altAssetId: varchar("alt_asset_id", { length: 255 }).notNull(),
    altMarketValue: decimal("alt_market_value", { precision: 10, scale: 2 }).notNull(),
  },
  (table) => {
    return {
      marketValueIdx: index("market_value_idx").on(table.altMarketValue),
      altAssetIdIdx: index("alt_asset_id_idx").on(table.altAssetId),
      beezieTokenIdIdx: index("beezie_token_id_idx").on(table.beezieTokenId),
    };
  }
);

export type Card = typeof cards.$inferSelect;
