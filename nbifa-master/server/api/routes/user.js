const express =require("express");
const router = express.Router();
const checkaut =require('../middleware/check-aut');
const UserController =require('../controllers/user');
//const checkAuth = require('../middleware/check-auth');

router.post("/signup", UserController.user_signup);

router.post("/login", UserController.user_login);
router.post("/loginaky", UserController.user_loginaky);

router.delete("/:userId", /*checkaut,*/ UserController.user_delete);

router.get("/allusers", /*checkaut,*/ UserController.all_users); 


module.exports=router;