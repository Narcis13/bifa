const express =require("express");
const router = express.Router();

const RNController =require('../controllers/rn');
router.post("/antetnou", RNController.antet_rn_nou);
router.post("/detaliinoi", RNController.detalii_noi);
router.get("/toatereferatele/:idcomp", /*checkaut,*/ RNController.toate_referatele); 
//router.get("/paapintegral/:idcomp/:an", /*checkaut,*/ PAAPController.tot); 
//router.post("/paapfiltrat", /*checkaut,*/ PAAPController.filtrat); 
//router.get("/toateprocedurile", /*checkaut,*/ PAAPController.toate_procedurile); 
//router.get("/toatecodurilecpv", /*checkaut,*/ PAAPController.toate_codurilecpv); 
//router.get("/toatecompartimentele", /*checkaut,*/ PAAPController.toate_compartimentele); 
//router.put("/:idpaap", /*checkaut,*/ PAAPController.update);
//router.put("/atomicupdate/:idpaap", /*checkaut,*/ PAAPController.update_atomic);
//router.put("/updateobiectaky/:idpaap", /*checkaut,*/ PAAPController.update_obiect_aky);
//router.put("/invalideazapozitieplan/:idpaap", /*checkaut,*/ PAAPController.invalideazapozitieplan);

//router.post("/cloneazapozitii", PAAPController.cloneaza_pozitii);
//router.post("/pozitienoua", PAAPController.pozitie_noua);
module.exports=router;