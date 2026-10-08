-- MySQL dump 10.13  Distrib 8.0.42, for macos15 (x86_64)
--
-- Host: localhost    Database: bifa
-- ------------------------------------------------------
-- Server version	5.5.44-0ubuntu0.14.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `analitice`
--

DROP TABLE IF EXISTS `analitice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analitice` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `cont` varchar(255) DEFAULT NULL,
  `explicatii` varchar(255) DEFAULT NULL,
  `idsintetic` int(11) DEFAULT NULL,
  `stare` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `categorii`
--

DROP TABLE IF EXISTS `categorii`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorii` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `denumire` varchar(255) DEFAULT NULL,
  `idgestiune` int(11) DEFAULT NULL,
  `cont` varchar(255) DEFAULT NULL,
  `contcheltuiala` varchar(255) DEFAULT NULL,
  `tipmaterial` varchar(255) DEFAULT NULL,
  `info` varchar(255) DEFAULT NULL,
  `stare` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `idcont` int(11) DEFAULT NULL,
  `idcontchelt` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `conturi`
--

DROP TABLE IF EXISTS `conturi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conturi` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cont` varchar(35) NOT NULL,
  `tip` varchar(1) NOT NULL,
  `denumire` varchar(120) NOT NULL,
  `sintetic` varchar(35) DEFAULT NULL,
  `nivel` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1894 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `gestiuni`
--

DROP TABLE IF EXISTS `gestiuni`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gestiuni` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `denumire` varchar(255) DEFAULT NULL,
  `userid` int(11) DEFAULT NULL,
  `gestionar` varchar(70) DEFAULT NULL,
  `r_presedinte` varchar(255) DEFAULT NULL,
  `r_membru1` varchar(255) DEFAULT NULL,
  `r_membru2` varchar(255) DEFAULT NULL,
  `r_membru3` varchar(255) DEFAULT NULL,
  `i_presedinte` varchar(255) DEFAULT NULL,
  `i_membru1` varchar(255) DEFAULT NULL,
  `i_membru2` varchar(255) DEFAULT NULL,
  `i_membru3` varchar(255) DEFAULT NULL,
  `stare` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `knex_migrations`
--

DROP TABLE IF EXISTS `knex_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `batch` int(11) DEFAULT NULL,
  `migration_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `knex_migrations_lock`
--

DROP TABLE IF EXISTS `knex_migrations_lock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knex_migrations_lock` (
  `index` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `is_locked` int(11) DEFAULT NULL,
  PRIMARY KEY (`index`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `locuri`
--

DROP TABLE IF EXISTS `locuri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locuri` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `denumire` varchar(45) NOT NULL DEFAULT 'DEPOZIT',
  `stare` varchar(45) DEFAULT 'ACTIV',
  `prioritate` int(11) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `materiale`
--

DROP TABLE IF EXISTS `materiale`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materiale` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `denumire` varchar(100) NOT NULL DEFAULT 'generic',
  `um` varchar(15) NOT NULL DEFAULT 'buc',
  `pretpredefinit` decimal(14,4) NOT NULL DEFAULT '0.0000',
  `idgestiune` int(11) NOT NULL,
  `iduser` int(11) NOT NULL,
  `stare` varchar(15) NOT NULL DEFAULT 'activ',
  `datacreere` datetime DEFAULT NULL,
  `datamodificare` datetime DEFAULT NULL,
  `cod_import` varchar(45) DEFAULT '000000',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5978 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `operatiuni`
--

DROP TABLE IF EXISTS `operatiuni`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operatiuni` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idtipoperatiuni` int(11) NOT NULL,
  `tipoperatiune` varchar(15) NOT NULL,
  `data` date NOT NULL,
  `nrdoc` varchar(25) NOT NULL,
  `stare` varchar(15) NOT NULL,
  `datacreere` datetime NOT NULL,
  `datamodificare` datetime NOT NULL,
  `idgestiune` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6376 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tipuridocumente`
--

DROP TABLE IF EXISTS `tipuridocumente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipuridocumente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `denumire` varchar(45) NOT NULL,
  `tip` varchar(1) NOT NULL DEFAULT 'i',
  `denumire_scurta` varchar(15) NOT NULL,
  `prioritate` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tranzactii`
--

DROP TABLE IF EXISTS `tranzactii`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tranzactii` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `idAntet` int(11) NOT NULL,
  `id_categ` int(11) NOT NULL,
  `id_reper` int(11) NOT NULL,
  `id_gestiune` int(11) NOT NULL,
  `id_locdispunere` int(11) NOT NULL,
  `um` varchar(20) NOT NULL,
  `cantitate_debit` decimal(10,2) NOT NULL,
  `cantitate_credit` decimal(10,2) NOT NULL,
  `pret` decimal(12,4) NOT NULL,
  `debit` decimal(12,4) NOT NULL,
  `credit` decimal(12,4) NOT NULL,
  `stare_material` varchar(15) NOT NULL,
  `stare` varchar(15) NOT NULL,
  `datacreere` datetime DEFAULT NULL,
  `datamodificare` datetime DEFAULT NULL,
  `tip_material` varchar(3) DEFAULT 'M',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=96167 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `public_id` varchar(50) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `password` varchar(80) DEFAULT NULL,
  `admin` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `public_id` (`public_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `utilizatori`
--

DROP TABLE IF EXISTS `utilizatori`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `utilizatori` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `stare` varchar(255) DEFAULT NULL,
  `rol` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-08 13:14:20
