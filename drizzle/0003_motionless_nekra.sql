ALTER TABLE `categories` DROP INDEX `categories_name_unique`;--> statement-breakpoint
ALTER TABLE `banners` MODIFY COLUMN `title` varchar(255);--> statement-breakpoint
ALTER TABLE `banners` MODIFY COLUMN `imageUrl` varchar(512);--> statement-breakpoint
ALTER TABLE `banners` MODIFY COLUMN `createdAt` timestamp;--> statement-breakpoint
ALTER TABLE `banners` MODIFY COLUMN `updatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `name` varchar(255);--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `createdAt` timestamp;--> statement-breakpoint
ALTER TABLE `categories` MODIFY COLUMN `updatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `playerNick` varchar(255);--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `items` json;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `subtotal` int;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `discount` int;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `total` int;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `status` varchar(50);--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `createdAt` timestamp;--> statement-breakpoint
ALTER TABLE `orders` MODIFY COLUMN `updatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `name` varchar(255);--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `categoryId` int;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `price` int;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `image` varchar(512);--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `tag` varchar(100);--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `rarity` varchar(50);--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `createdAt` timestamp;--> statement-breakpoint
ALTER TABLE `products` MODIFY COLUMN `updatedAt` timestamp;