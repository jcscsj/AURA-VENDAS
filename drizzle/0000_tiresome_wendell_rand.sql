CREATE TABLE `banners` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255),
	`imageUrl` varchar(512),
	`createdAt` timestamp,
	`updatedAt` timestamp,
	CONSTRAINT `banners_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`createdAt` timestamp,
	`updatedAt` timestamp,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
CREATE TABLE `localAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`gameId` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp,
	CONSTRAINT `localAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `localAccounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`playerNick` varchar(255),
	`gameId` varchar(50),
	`discordId` varchar(64),
	`discord` varchar(255),
	`items` json,
	`subtotal` int,
	`discount` int,
	`total` int,
	`status` varchar(50),
	`createdAt` timestamp,
	`updatedAt` timestamp,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`categoryId` int,
	`description` text,
	`price` int,
	`oldPrice` int,
	`image` varchar(512),
	`tag` varchar(100),
	`rarity` varchar(50),
	`benefits` json,
	`createdAt` timestamp,
	`updatedAt` timestamp,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`discordId` varchar(64),
	`gameId` varchar(50),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
