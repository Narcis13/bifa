const express =require("express");
const router = express.Router();

const AngController =require('../controllers/ang');

router.get("/toate/:idcomp", /*checkaut,*/ AngController.toate); 
router.get("/angajamentelaantet/:idAntet", /*checkaut,*/ AngController.ang_la_antet); 
router.get("/codviza/:artbug", /*checkaut,*/ AngController.codviza); 
router.get("/calcdezangajare/:idang", /*checkaut,*/ AngController.calc_dezangajare); 
router.get("/catbugetare/:idcomp", /*checkaut,*/ AngController.categorii_bugetare); 
router.post("/angnou", AngController.angajament_nou);
router.post("/angvizat", AngController.angajament_vizat);
router.post("/angnoudetalii", AngController.angajament_nou_detalii);
router.post("/angsuplimentare", AngController.angajament_nou_detalii);
router.delete("/stergtotal/:idang/:idantang", /*checkaut,*/ AngController.sterg_total);
router.delete("/stergpartial/:idang/:idantang", /*checkaut,*/ AngController.sterg_partial);

module.exports=router;