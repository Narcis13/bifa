const express =require("express");
const router = express.Router();

const GestController =require('../controllers/gestiune');
//const checkAuth = require('../middleware/check-auth');

//router.post("/signup", UserController.user_signup);

router.post("/gestiunenoua", GestController.gestiunenoua);

router.delete("/:idgest", /*checkaut,*/ GestController.sterg_gestiune);

router.patch("/:idgest", /*checkaut,*/ GestController.update_gestiune);

router.get("/toategestiunile", /*checkaut,*/ GestController.toate_gestiunile); 


module.exports=router;