const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user');
router.post("/signup", UserController.registerUser);


router.post("/login",UserController.loginUser);
router.delete("/:userId",UserController.deleteUser);


module.exports=router;