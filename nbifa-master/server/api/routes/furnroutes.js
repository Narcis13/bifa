const express =require("express");
const router = express.Router();

const FurnController =require('../controllers/furn');

router.get("/toti/:idcomp", /*checkaut,*/ FurnController.toti); 
router.get("/toateangajamentele/:idcomp", /*checkaut,*/ FurnController.toateangajamentele); 
router.post("/furnizornou", FurnController.furnizor_nou);
router.post("/anglegalnou", FurnController.anglegal_nou);
router.post("/stergfurnizor/:idf", FurnController.stergfurnizor);
router.post("/stergangajament/:idf", FurnController.stergangajament);


module.exports=router;