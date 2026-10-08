const express =require("express");
const router = express.Router();
const LabController =require('../controllers/lab');
//const checkAuth = require('../middleware/check-auth');

router.get("/:params", /*checkaut,*/ LabController.toate); 


module.exports=router;