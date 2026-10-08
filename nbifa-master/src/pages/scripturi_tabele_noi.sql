CREATE TABLE `tipuridocumente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `denumire` varchar(45) NOT NULL,
  `tip` varchar(1) NOT NULL DEFAULT 'i',
  `denumire_scurta` varchar(15) NOT NULL,
  `prioritate` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
SELECT * FROM bifa.tipuridocumente;


CREATE TABLE `bifa`.`operatiuni` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `idtipoperatiuni` INT NOT NULL,
  `tipoperatiune` VARCHAR(15) NOT NULL,
  `data` DATE NOT NULL,
  `nrdoc` VARCHAR(25) NOT NULL,
  `stare` VARCHAR(15) NOT NULL,
  `datacreere` DATETIME NOT NULL,
  `datamodificare` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC) VISIBLE);

CREATE TABLE `bifa`.`tranzactii` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `idAntet` INT NOT NULL,
  `id_categ` INT NOT NULL,
  `id_reper` INT NOT NULL,
  `id_gestiune` INT NOT NULL,
  `id_locdispunere` INT NOT NULL,
  `um` VARCHAR(20) NOT NULL,
  `cantitate_debit` DECIMAL(10,2) NOT NULL,
  `cantitate_credit` DECIMAL(10,2) NOT NULL,
  `pret` DECIMAL(12,4) NOT NULL,
  `debit` DECIMAL(12,4) NOT NULL,
  `credit` DECIMAL(12,4) NOT NULL,
  `stare_material` VARCHAR(15) NOT NULL,
  `stare` VARCHAR(15) NOT NULL,
  `datacreere` DATETIME NULL,
  `datamodificare` DATETIME NULL,
  PRIMARY KEY (`id`));

SELECT o.id,o.idtipoperatiuni,o.tipoperatiune,o.data,o.nrdoc,o.datacreere,o.datamodificare,o.stare,sum(t.debit) debit,sum(t.credit) credit FROM bifa.operatiuni o
inner join tranzactii t on t.idAntet=o.id
group by t.idAntet