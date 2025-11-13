CREATE TABLE `cards` (
	`beezie_token_id` int NOT NULL,
	`alt_asset_id` varchar(255) NOT NULL,
	`alt_market_value` decimal(10,2) NOT NULL,
	CONSTRAINT `cards_beezie_token_id` PRIMARY KEY(`beezie_token_id`)
);
--> statement-breakpoint
CREATE INDEX `market_value_idx` ON `cards` (`alt_market_value`);--> statement-breakpoint
CREATE INDEX `alt_asset_id_idx` ON `cards` (`alt_asset_id`);--> statement-breakpoint
CREATE INDEX `beezie_token_id_idx` ON `cards` (`beezie_token_id`);