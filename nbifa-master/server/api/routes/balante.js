const express =require("express");
const router = express.Router();

const BalController =require('../controllers/balante');


router.post("/balantanoua", BalController.analitica);
router.post("/rapanalitica", BalController.raportanalitica);
router.post("/rapli", BalController.raportli);
router.post("/rapfisacont", BalController.raportfisacont);
router.post("/fisacont", BalController.fisacont);

//router.delete("/:idgest", /*checkaut,*/ GestController.sterg_gestiune);
//router.put("/:idcateg", /*checkaut,*/ CatController.update);

//router.patch("/:idcateg", /*checkaut,*/ CatController.update_categorie);

//router.get("/toate", /*checkaut,*/ CatController.toate); 
//router.get("/categoriilegestiunii/:idgest/:tipmaterial", /*checkaut,*/ CatController.categoriilegestiunii); 


module.exports=router;