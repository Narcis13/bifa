const express =require("express");
const router = express.Router();

const DocumenteController =require('../controllers/documente');
//const checkAuth = require('../middleware/check-auth');

router.post("/documentnou", DocumenteController.documentnou);
router.post("/tranzactienoua", DocumenteController.tranzactienoua);

router.post("/documenteinterval", DocumenteController.documenteinterval);
router.post("/stocpretmediu", DocumenteController.stocPretMediu);
router.patch("/:iddoc", /*checkaut,*/ DocumenteController.invalidez_document);
//router.delete("/:userId", /*checkaut,*/ UserController.user_delete);
//router.put("/:idmaterial", /*checkaut,*/ MaterialeController.update);
//router.patch("/sterg/:id", /*checkaut,*/ MaterialeController.sterg_material);
router.get("/tipuridocumente", /*checkaut,*/ DocumenteController.tipuridocumente); 
router.get("/modificdocument/:iddoc", /*checkaut,*/ DocumenteController.modoc); 


module.exports=router; 