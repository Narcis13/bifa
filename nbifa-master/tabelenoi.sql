--
-- Table structure for table `stari_documente`
--

DROP TABLE IF EXISTS `stari_documente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stari_documente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stare` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stari_documente`
--

LOCK TABLES `stari_documente` WRITE;
/*!40000 ALTER TABLE `stari_documente` DISABLE KEYS */;
INSERT INTO `stari_documente` VALUES (1,'INITIAT(Asteapta aprobare)'),(2,'APROBAT'),(3,'IN DERULARE'),(4,'FINALIZAT'),(5,'INACTIV');
/*!40000 ALTER TABLE `stari_documente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detaliirn`
--

DROP TABLE IF EXISTS `detaliirn`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detaliirn` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_Antet` int(11) NOT NULL,
  `idpozPAAP` int(11) NOT NULL,
  `denumire` varchar(128) DEFAULT NULL,
  `codcpv` varchar(45) DEFAULT NULL,
  `detalii_tehnice` varchar(512) DEFAULT NULL,
  `cantitate` decimal(14,2) DEFAULT NULL,
  `pret` decimal(14,2) DEFAULT NULL,
  `valoare` decimal(14,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detaliirn`
--

LOCK TABLES `detaliirn` WRITE;
/*!40000 ALTER TABLE `detaliirn` DISABLE KEYS */;
INSERT INTO `detaliirn` VALUES (10,9,1975,'Monitoare','33195100-4','Super monitoare',2.00,123.00,246.00),(11,9,1835,'Diverse masini, echipamente si accesorii de birou','30190000-7','hgdhkjgsadkhjsa hsakjd hsakjgd kjhsad',3.00,232.00,696.00),(12,10,2447,'Sursa de alimentare electrica','31682530-4','dsfdsfds fsd fsdfsdfds',9.00,233.00,2097.00),(13,11,1884,'Imprimante laser','30232110-8','Super imprimante lser',5.00,333.00,1665.00);
/*!40000 ALTER TABLE `detaliirn` ENABLE KEYS */;
UNLOCK TABLES;


--
-- Table structure for table `antetrn`
--

DROP TABLE IF EXISTS `antetrn`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `antetrn` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `data` date NOT NULL,
  `obiect_achizitie` varchar(65) DEFAULT NULL,
  `valoare` decimal(14,2) DEFAULT NULL,
  `id_compartiment` int(11) NOT NULL,
  `id_stare` int(11) NOT NULL,
  `data_creere` datetime DEFAULT NULL,
  `data_modificare` datetime DEFAULT NULL,
  `justificare` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `antetrn`
--

LOCK TABLES `antetrn` WRITE;
/*!40000 ALTER TABLE `antetrn` DISABLE KEYS */;
INSERT INTO `antetrn` VALUES (9,'2020-12-02','Diverse obiecte de inventar',942.00,7,1,'2020-12-02 18:25:10','2020-12-02 18:25:10','Asigurarea derularii optime a activitatilor institutiei'),(10,'2020-12-03','surse diverse',2097.00,7,1,'2020-12-03 19:01:30','2020-12-03 19:01:30','Asigurarea derularii optime a activitatilor institutiei'),(11,'2020-12-14','ceva cu justificare',1665.00,7,1,'2020-12-14 18:29:48','2020-12-14 18:29:48','Asigurarea derularii optime a activitatilor institutiei');
/*!40000 ALTER TABLE `antetrn` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compartimente`
--

DROP TABLE IF EXISTS `compartimente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compartimente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `denumire` varchar(40) NOT NULL,
  `idsef` int(11) NOT NULL,
  `presrec` varchar(30) DEFAULT NULL,
  `memb1` varchar(30) DEFAULT NULL,
  `memb2` varchar(30) DEFAULT NULL,
  `gestionar` varchar(30) DEFAULT NULL,
  `stare` varchar(10) NOT NULL,
  `idClient` int(11) NOT NULL,
  `sef_nume_complet` varchar(45) DEFAULT NULL,
  `structura_nume_complet` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compartimente`
--

LOCK TABLES `compartimente` WRITE;
/*!40000 ALTER TABLE `compartimente` DISABLE KEYS */;
INSERT INTO `compartimente` VALUES (1,'bbbbb',20,NULL,NULL,NULL,NULL,'inactiv',8,NULL,NULL),(2,'dfsdfsdf',18,NULL,NULL,NULL,NULL,'inactiv',8,NULL,NULL),(3,'hhhhh',18,NULL,NULL,NULL,NULL,'inactiv',8,NULL,NULL),(4,'comp 1 ',18,NULL,NULL,NULL,NULL,'inactiv',8,NULL,NULL),(6,'ALIMENTE',20,'Luca Elena',NULL,NULL,NULL,'inactiv',8,NULL,NULL),(7,'INFO',30,'Pcc Narcis Brindusescu','Pcc Oprea Elena','Pcc Mirica Adina','Pcc Dragut Victor','activ',8,'P.c.c. ec. Narcis BRINDUSESCU','BIROU COMUNICATII SI INFORMATICA'),(10,'SAMT',23,'Dodenciu Folofteia','Vanatoru Viorel','Serban Madalin','Doanta Madalin','activ',8,NULL,NULL),(11,'FIN',26,'Florea Mihaela','ASDASDASD','ASDASDD','ASDASDAS','activ',8,NULL,NULL),(12,'FARMA',24,'Farm. Catruc Ion','ASDFASDF','ASDFASDF','ASDFASDF','activ',8,NULL,NULL),(14,'INSTR',25,'Farm Cruceana Danel','XCVBXCVB','XCVBXCVBXCV','XCVBXCVB','activ',8,NULL,NULL),(15,'CAZARMARE',27,'Ing Epure Mihaela','SDFSD','SDFSDF','SDFSD','activ',8,NULL,NULL),(17,'ALIMENTE MRH',29,'Luca Elena','SDFASDFA','ASDFASDF','ASDFASDF','activ',8,NULL,NULL),(18,'RAM',31,'Iacovescu Andrei','x','x','x','activ',8,NULL,NULL),(19,'LABORATOR',34,'X','X','X','X','activ',8,NULL,NULL),(20,'ECHIPAMENT',35,'Luca Elena','ZZ','ZZ','ZZ','activ',8,NULL,NULL),(21,'FINANCIAR',36,'z','z','z','z','activ',8,NULL,NULL),(22,'M CALITATE',39,'Mihaela GHEORGHE','x','x','x','activ',8,NULL,NULL),(23,'M. CALITATE',40,'zzz','zzz','zz','zzzzz','activ',8,NULL,NULL),(24,'BRU',41,'xxx','xxx','xxx','xxx','activ',8,NULL,NULL),(25,'BEAM',42,'xxxx','hgfhg','hgfhgf','hgfhgf','activ',8,NULL,NULL);
/*!40000 ALTER TABLE `compartimente` ENABLE KEYS */;
UNLOCK TABLES;