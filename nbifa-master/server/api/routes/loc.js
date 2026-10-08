const express =require("express");
const router = express.Router();

const LocController =require('../controllers/loc');
//const checkAuth = require('../middleware/check-auth');

//router.post("/signup", UserController.user_signup);

router.post("/locnou", LocController.locnou);

//router.delete("/:idgest", /*checkaut,*/ GestController.sterg_gestiune);

router.patch("/:idloc", /*checkaut,*/ LocController.update_loc);

router.get("/toatelocurile", /*checkaut,*/ LocController.toate_locurile); 


module.exports=router;