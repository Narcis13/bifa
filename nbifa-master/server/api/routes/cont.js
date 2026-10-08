const express =require("express");
const router = express.Router();

const ContController =require('../controllers/cont');
//const checkAuth = require('../middleware/check-auth');

//router.post("/signup", UserController.user_signup);

router.post("/analiticnou", ContController.analiticnou);

router.delete("/:idcont", /*checkaut,*/ ContController.sterg_cont);

//router.patch("/:idgest", /*checkaut,*/ GestController.update_gestiune);

router.get("/toate", /*checkaut,*/ ContController.toate); 
router.get("/toatetoate", /*checkaut,*/ ContController.toatetoate); 

module.exports=router;