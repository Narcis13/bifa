CREATE TABLE `mf_amortizari` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`idmijloc` int unsigned NOT NULL,
	`an` int NOT NULL,
	`luna` tinyint NOT NULL,
	`suma` decimal(14,4) NOT NULL,
	`data_calcul` date NOT NULL,
	`iduser` int unsigned,
	`stare` enum('activ','inactiv') NOT NULL DEFAULT 'activ',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mf_amortizari_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mf_documente` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`idtipoperatiuni` int NOT NULL,
	`data` date NOT NULL,
	`nrdoc` varchar(25) NOT NULL,
	`idgestiune` int unsigned NOT NULL,
	`observatii` varchar(255),
	`stare` enum('activ','inactiv') NOT NULL DEFAULT 'activ',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mf_documente_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mf_linii` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`iddocument` int unsigned NOT NULL,
	`idmijloc` int unsigned NOT NULL,
	`idloc_sursa` int,
	`idloc_destinatie` int,
	`valoare` decimal(14,4) NOT NULL DEFAULT '0.0000',
	`stare` enum('activ','inactiv') NOT NULL DEFAULT 'activ',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mf_linii_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mijloace_fixe` (
	`id` int unsigned AUTO_INCREMENT NOT NULL,
	`nr_inventar` varchar(45) NOT NULL,
	`denumire` varchar(255) NOT NULL,
	`caracteristici` varchar(500),
	`idgestiune` int unsigned NOT NULL,
	`idcateg` int unsigned NOT NULL,
	`idloc` int NOT NULL,
	`cod_clasificare` varchar(30) NOT NULL,
	`grupa` tinyint NOT NULL,
	`valoare_intrare` decimal(14,4) NOT NULL,
	`amortizare_initiala` decimal(14,4) NOT NULL DEFAULT '0.0000',
	`durata_luni` int NOT NULL,
	`amortizare_lunara` decimal(14,4) NOT NULL,
	`data_punere_functiune` date NOT NULL,
	`data_casare` date,
	`stare_mf` enum('in_functiune','casat') NOT NULL DEFAULT 'in_functiune',
	`stare` enum('activ','inactiv') NOT NULL DEFAULT 'activ',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `mijloace_fixe_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `mf_amortizari` ADD CONSTRAINT `mf_amortizari_idmijloc_mijloace_fixe_id_fk` FOREIGN KEY (`idmijloc`) REFERENCES `mijloace_fixe`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mf_amortizari` ADD CONSTRAINT `mf_amortizari_iduser_utilizatori_id_fk` FOREIGN KEY (`iduser`) REFERENCES `utilizatori`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mf_documente` ADD CONSTRAINT `mf_documente_idtipoperatiuni_tipuridocumente_id_fk` FOREIGN KEY (`idtipoperatiuni`) REFERENCES `tipuridocumente`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mf_documente` ADD CONSTRAINT `mf_documente_idgestiune_gestiuni_id_fk` FOREIGN KEY (`idgestiune`) REFERENCES `gestiuni`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mf_linii` ADD CONSTRAINT `mf_linii_iddocument_mf_documente_id_fk` FOREIGN KEY (`iddocument`) REFERENCES `mf_documente`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mf_linii` ADD CONSTRAINT `mf_linii_idmijloc_mijloace_fixe_id_fk` FOREIGN KEY (`idmijloc`) REFERENCES `mijloace_fixe`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mf_linii` ADD CONSTRAINT `mf_linii_idloc_sursa_locuri_id_fk` FOREIGN KEY (`idloc_sursa`) REFERENCES `locuri`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mf_linii` ADD CONSTRAINT `mf_linii_idloc_destinatie_locuri_id_fk` FOREIGN KEY (`idloc_destinatie`) REFERENCES `locuri`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mijloace_fixe` ADD CONSTRAINT `mijloace_fixe_idgestiune_gestiuni_id_fk` FOREIGN KEY (`idgestiune`) REFERENCES `gestiuni`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mijloace_fixe` ADD CONSTRAINT `mijloace_fixe_idcateg_categorii_id_fk` FOREIGN KEY (`idcateg`) REFERENCES `categorii`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mijloace_fixe` ADD CONSTRAINT `mijloace_fixe_idloc_locuri_id_fk` FOREIGN KEY (`idloc`) REFERENCES `locuri`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `mf_amort_mijloc_idx` ON `mf_amortizari` (`idmijloc`,`an`,`luna`);--> statement-breakpoint
CREATE INDEX `mf_amort_perioada_idx` ON `mf_amortizari` (`an`,`luna`);--> statement-breakpoint
CREATE INDEX `mf_doc_gestiune_data_idx` ON `mf_documente` (`idgestiune`,`data`);--> statement-breakpoint
CREATE INDEX `mf_doc_nrdoc_idx` ON `mf_documente` (`idgestiune`,`idtipoperatiuni`,`nrdoc`);--> statement-breakpoint
CREATE INDEX `mf_linii_doc_idx` ON `mf_linii` (`iddocument`);--> statement-breakpoint
CREATE INDEX `mf_linii_mijloc_idx` ON `mf_linii` (`idmijloc`);--> statement-breakpoint
CREATE INDEX `mf_gestiune_nr_idx` ON `mijloace_fixe` (`idgestiune`,`nr_inventar`);--> statement-breakpoint
CREATE INDEX `mf_gestiune_loc_idx` ON `mijloace_fixe` (`idgestiune`,`idloc`);--> statement-breakpoint
CREATE INDEX `mf_gestiune_stare_idx` ON `mijloace_fixe` (`idgestiune`,`stare_mf`,`stare`);