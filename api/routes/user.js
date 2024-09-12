const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../models/user");
const JWT_KEY = process.env.JWT_KEY || 'your_secret_key';
const UserController = require('../controllers/user');
router.post("/signup", UserController.registerUser);


router.post("/login",UserController.loginUser);
router.delete("/:userId",UserController.deleteUser);


module.exports=router;