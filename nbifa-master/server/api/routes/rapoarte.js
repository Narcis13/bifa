const express =require("express");
const router = express.Router();
const checkaut =require('../middleware/check-aut');
const RapoarteController =require('../controllers/rapoarte');
//const checkAuth = require('../middleware/check-auth');

router.post("/documenteinterval", RapoarteController.documente_interval);
router.get("/undocument/:iddoc",  RapoarteController.un_document);
router.get("/unreferat/:iddoc",  RapoarteController.un_referat);
router.get("/unangajament/:idAntet/:idAng",  RapoarteController.un_angajament);
router.get("/toateangajamentele/:idcomp/:cod",  RapoarteController.toate_angajamentele);

//router.post("/login", UserController.user_login);

//router.delete("/:userId", /*checkaut,*/ UserController.user_delete);
//router.put("/:idmaterial", /*checkaut,*/ MaterialeController.update);
//router.patch("/sterg/:id", /*checkaut,*/ MaterialeController.sterg_material);
//router.get("/lab"/*/:idgest"*/, /*checkaut,*/ RapoarteController.toate); 


module.exports=router;