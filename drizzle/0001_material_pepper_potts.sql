CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`clientId` int,
	`serviceId` int,
	`providerId` int,
	`clientName` varchar(255),
	`clientPhone` varchar(32),
	`serviceName` varchar(255),
	`providerName` varchar(255),
	`startTime` timestamp NOT NULL,
	`status` enum('booked','rescheduled','cancelled','no_show') NOT NULL DEFAULT 'booked',
	`gcalEventId` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `call_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`callerPhone` varchar(32),
	`callerName` varchar(255),
	`intent` varchar(128),
	`outcome` varchar(128),
	`durationSeconds` int,
	`transcript` text,
	`notes` text,
	`isAfterHours` boolean DEFAULT false,
	`wasEscalated` boolean DEFAULT false,
	`callStart` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `call_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`phone` varchar(32) NOT NULL,
	`firstName` varchar(128),
	`lastName` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_base` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`type` enum('faq','policy','medical','document') NOT NULL,
	`question` text,
	`content` text NOT NULL,
	`embeddingStatus` enum('pending','processing','complete','failed') DEFAULT 'pending',
	`sourceFileName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_base_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`date` varchar(16) NOT NULL,
	`totalCalls` int NOT NULL DEFAULT 0,
	`appointmentsBooked` int NOT NULL DEFAULT 0,
	`afterHoursCalls` int NOT NULL DEFAULT 0,
	`escalations` int NOT NULL DEFAULT 0,
	`missedCallsPrevented` int NOT NULL DEFAULT 0,
	CONSTRAINT `metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `providers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`providerType` varchar(64) NOT NULL,
	`skills` json,
	`schedule` json,
	`gcalCalendarId` varchar(255),
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `providers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`durationMinutes` int NOT NULL,
	`providerType` varchar(128),
	`dependencies` json,
	`active` boolean NOT NULL DEFAULT true,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int,
	`email` varchar(320) NOT NULL,
	`name` varchar(255),
	`role` enum('admin','staff') NOT NULL DEFAULT 'staff',
	`status` enum('active','invited','revoked') NOT NULL DEFAULT 'invited',
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`phone` varchar(32),
	`address` text,
	`businessHours` json,
	`twilioNumber` varchar(32),
	`novaStatus` enum('active','inactive','setup') NOT NULL DEFAULT 'setup',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `tenantId` int;