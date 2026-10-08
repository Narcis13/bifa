CREATE TABLE `categorii` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`denumire` varchar(255) NOT NULL,
	`idgestiune` int unsigned NOT NULL,
	`tipmaterial` enum('M','OB','MF') NOT NULL DEFAULT 'M',
	`idcont` int,
	`idcontchelt` int,
	`info` varchar(255),
	`lipsa_import` boolean NOT NULL DEFAULT false,
	`stare` enum('activ','inactiv') NOT NULL DEFAULT 'activ',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `categorii_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conturi` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cont` varchar(35) NOT NULL,
	`tip` varchar(1) NOT NULL,
	`denumire` varchar(120) NOT NULL,
	`sintetic` varchar(35),
	`nivel` tinyint NOT NULL,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `conturi_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gestiuni` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`denumire` varchar(255) NOT NULL,
	`userid` int unsigned,
	`gestionar` varchar(70),
	`r_presedinte` varchar(255),
	`r_membru1` varchar(255),
	`r_membru2` varchar(255),
	`r_membru3` varchar(255),
	`i_presedinte` varchar(255),
	`i_membru1` varchar(255),
	`i_membru2` varchar(255),
	`i_membru3` varchar(255),
	`stare` enum('activ','inactiv') NOT NULL DEFAULT 'activ',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `gestiuni_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `locuri` (
	`id` int AUTO_INCREMENT NOT NULL,
	`denumire` varchar(45) NOT NULL,
	`stare` enum('activ','inactiv') NOT NULL DEFAULT 'activ',
	`prioritate` int NOT NULL DEFAULT 1,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `locuri_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `materiale` (
	`id` int AUTO_INCREMENT NOT NULL,
	`denumire` varchar(100) NOT NULL,
	`um` varchar(15) NOT NULL DEFAULT 'buc',
	`pretpredefinit` decimal(14,4) NOT NULL DEFAULT '0.0000',
	`idgestiune` int unsigned NOT NULL,
	`iduser` int unsigned NOT NULL,
	`cod_import` varchar(45),
	`stare` enum('activ','inactiv') NOT NULL DEFAULT 'activ',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `materiale_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operatiuni` (
	`id` int AUTO_INCREMENT NOT NULL,
	`idtipoperatiuni` int NOT NULL,
	`data` date NOT NULL,
	`nrdoc` varchar(25) NOT NULL,
	`idgestiune` int unsigned NOT NULL,
	`stare` enum('activ','inactiv') NOT NULL DEFAULT 'activ',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `operatiuni_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `setari` (
	`id` int NOT NULL,
	`institutie` varchar(255) NOT NULL,
	`grad_dir_fin_con` varchar(100) NOT NULL DEFAULT '',
	`nume_dir_fin_con` varchar(255) NOT NULL DEFAULT '',
	`grad_comandant` varchar(100) NOT NULL DEFAULT '',
	`nume_comandant` varchar(255) NOT NULL DEFAULT '',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `setari_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tipuridocumente` (
	`id` int AUTO_INCREMENT NOT NULL,
	`denumire` varchar(45) NOT NULL,
	`tip` enum('i','e','t') NOT NULL,
	`denumire_scurta` varchar(15) NOT NULL,
	`prioritate` int,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tipuridocumente_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tranzactii` (
	`id` int AUTO_INCREMENT NOT NULL,
	`idAntet` int NOT NULL,
	`id_categ` int unsigned NOT NULL,
	`id_reper` int NOT NULL,
	`id_gestiune` int unsigned NOT NULL,
	`id_locdispunere` int NOT NULL,
	`um` varchar(20) NOT NULL,
	`cantitate_debit` decimal(12,2) NOT NULL DEFAULT '0.00',
	`cantitate_credit` decimal(12,2) NOT NULL DEFAULT '0.00',
	`pret` decimal(14,4) NOT NULL,
	`debit` decimal(14,4) NOT NULL DEFAULT '0.0000',
	`credit` decimal(14,4) NOT NULL DEFAULT '0.0000',
	`stare_material` enum('NOU','FOLOSIT','CASARE') NOT NULL,
	`tip_material` enum('M','OB','MF') NOT NULL DEFAULT 'M',
	`stare` enum('activ','inactiv') NOT NULL DEFAULT 'activ',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `tranzactii_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `utilizatori` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`username` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(255),
	`rol` enum('admin','operator') NOT NULL DEFAULT 'operator',
	`stare` enum('activ','inactiv') NOT NULL DEFAULT 'activ',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `utilizatori_id` PRIMARY KEY(`id`),
	CONSTRAINT `utilizatori_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `categorii` ADD CONSTRAINT `categorii_idgestiune_gestiuni_id_fk` FOREIGN KEY (`idgestiune`) REFERENCES `gestiuni`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categorii` ADD CONSTRAINT `categorii_idcont_conturi_id_fk` FOREIGN KEY (`idcont`) REFERENCES `conturi`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `categorii` ADD CONSTRAINT `categorii_idcontchelt_conturi_id_fk` FOREIGN KEY (`idcontchelt`) REFERENCES `conturi`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `gestiuni` ADD CONSTRAINT `gestiuni_userid_utilizatori_id_fk` FOREIGN KEY (`userid`) REFERENCES `utilizatori`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materiale` ADD CONSTRAINT `materiale_idgestiune_gestiuni_id_fk` FOREIGN KEY (`idgestiune`) REFERENCES `gestiuni`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `materiale` ADD CONSTRAINT `materiale_iduser_utilizatori_id_fk` FOREIGN KEY (`iduser`) REFERENCES `utilizatori`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operatiuni` ADD CONSTRAINT `operatiuni_idtipoperatiuni_tipuridocumente_id_fk` FOREIGN KEY (`idtipoperatiuni`) REFERENCES `tipuridocumente`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `operatiuni` ADD CONSTRAINT `operatiuni_idgestiune_gestiuni_id_fk` FOREIGN KEY (`idgestiune`) REFERENCES `gestiuni`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tranzactii` ADD CONSTRAINT `tranzactii_idAntet_operatiuni_id_fk` FOREIGN KEY (`idAntet`) REFERENCES `operatiuni`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tranzactii` ADD CONSTRAINT `tranzactii_id_categ_categorii_id_fk` FOREIGN KEY (`id_categ`) REFERENCES `categorii`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tranzactii` ADD CONSTRAINT `tranzactii_id_reper_materiale_id_fk` FOREIGN KEY (`id_reper`) REFERENCES `materiale`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tranzactii` ADD CONSTRAINT `tranzactii_id_gestiune_gestiuni_id_fk` FOREIGN KEY (`id_gestiune`) REFERENCES `gestiuni`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `tranzactii` ADD CONSTRAINT `tranzactii_id_locdispunere_locuri_id_fk` FOREIGN KEY (`id_locdispunere`) REFERENCES `locuri`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `categorii_gestiune_idx` ON `categorii` (`idgestiune`,`tipmaterial`);--> statement-breakpoint
CREATE INDEX `conturi_cont_idx` ON `conturi` (`cont`);--> statement-breakpoint
CREATE INDEX `materiale_gestiune_denumire_idx` ON `materiale` (`idgestiune`,`denumire`);--> statement-breakpoint
CREATE INDEX `operatiuni_gestiune_data_idx` ON `operatiuni` (`idgestiune`,`data`);--> statement-breakpoint
CREATE INDEX `operatiuni_nrdoc_idx` ON `operatiuni` (`idgestiune`,`idtipoperatiuni`,`nrdoc`);--> statement-breakpoint
CREATE INDEX `tranzactii_antet_idx` ON `tranzactii` (`idAntet`);--> statement-breakpoint
CREATE INDEX `tranzactii_stoc_idx` ON `tranzactii` (`id_gestiune`,`id_locdispunere`,`id_categ`,`id_reper`,`stare_material`);--> statement-breakpoint
CREATE INDEX `tranzactii_reper_idx` ON `tranzactii` (`id_reper`);