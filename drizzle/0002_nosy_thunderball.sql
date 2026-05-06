ALTER TABLE `products` MODIFY COLUMN `image` varchar(512) DEFAULT '';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `tag` varchar(100) DEFAULT '';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `rarity` enum('Essencial','Premium','Elite','Limitado') NOT NULL DEFAULT 'Premium';--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `benefits` json;