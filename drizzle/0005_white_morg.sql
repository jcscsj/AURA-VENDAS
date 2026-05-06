CREATE TABLE `siteConfig` (
	`id` int AUTO_INCREMENT NOT NULL,
	`heroTitle` text,
	`heroSubtitle` text,
	`heroDescription` text,
	`welcomeText` text,
	`catalogTitle` varchar(255),
	`benefitsTitle` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `siteConfig_id` PRIMARY KEY(`id`)
);
