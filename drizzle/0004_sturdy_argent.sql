CREATE TABLE `discordUsers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`discordId` varchar(64) NOT NULL,
	`discordUsername` varchar(255),
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `discordUsers_id` PRIMARY KEY(`id`),
	CONSTRAINT `discordUsers_discordId_unique` UNIQUE(`discordId`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `gameId` varchar(50);--> statement-breakpoint
ALTER TABLE `orders` ADD `discordId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `discordId` varchar(64);--> statement-breakpoint
ALTER TABLE `users` ADD `gameId` varchar(50);