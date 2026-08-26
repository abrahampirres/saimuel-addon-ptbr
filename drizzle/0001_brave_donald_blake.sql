CREATE TABLE `addonMonitorRuns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` varchar(64) NOT NULL,
	`target` varchar(96) NOT NULL,
	`healthy` int NOT NULL,
	`statusCode` int,
	`latencyMs` int NOT NULL,
	`detail` text NOT NULL,
	`checkedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `addonMonitorRuns_id` PRIMARY KEY(`id`)
);
