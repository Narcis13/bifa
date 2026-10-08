const express =require("express");
const router = express.Router();

const PAAPController =require('../controllers/paap');

router.get("/paapintegral/:idcomp/:an", /*checkaut,*/ PAAPController.tot); 
router.get("/paapsolduri/:idcomp/:an", /*checkaut,*/ PAAPController.tot_cu_solduri); 
router.post("/paapfiltrat", /*checkaut,*/ PAAPController.filtrat); 
router.get("/toateprocedurile", /*checkaut,*/ PAAPController.toate_procedurile); 
router.get("/toatecodurilecpv", /*checkaut,*/ PAAPController.toate_codurilecpv); 
router.get("/toatecompartimentele", /*checkaut,*/ PAAPController.toate_compartimentele); 
router.put("/:idpaap", /*checkaut,*/ PAAPController.update);
router.put("/atomicupdate/:idpaap", /*checkaut,*/ PAAPController.update_atomic);
router.put("/updateobiectaky/:idpaap", /*checkaut,*/ PAAPController.update_obiect_aky);
router.put("/invalideazapozitieplan/:idpaap", /*checkaut,*/ PAAPController.invalideazapozitieplan);

router.post("/cloneazapozitii", PAAPController.cloneaza_pozitii);
router.post("/pozitienoua", PAAPController.pozitie_noua);
module.exports=router;