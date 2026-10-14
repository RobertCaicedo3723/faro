CREATE TABLE `faro_budget` (
	`id` text PRIMARY KEY NOT NULL,
	`spent` integer DEFAULT 0 NOT NULL,
	`reserved` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `faro_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`created` text NOT NULL,
	`charge` integer DEFAULT 0 NOT NULL,
	`status` text NOT NULL
);
