const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../models/user");

router.post("/signup", (req, res, next) => {
    const { email, password, username, role, address, contactNumber } = req.body;

    // Check if all fields are present
    if (!email || !password || !username || !role || !address || !contactNumber) {
        return res.status(400).json({
            message: "All fields are required (email, password, username, role, address, phoneNumber)"
        });
    }
    User.find({ email: req.body.email })
      .exec()
      .then(user => {
        if (user.length >= 1) {
          return res.status(409).json({
            message: "Email already exists"
          });
        } else {
          bcrypt.hash(req.body.password, 10, (err, hash) => {
            if (err) {
              return res.status(500).json({
                error: err
              });
            } else {
              const newUser = new User({
                _id: new mongoose.Types.ObjectId(),
                username: req.body.username,
                email: req.body.email,
                password: hash,
                roles: req.body.roles, // Accept roles (customer/driver)
                contactNumber: req.body.contactNumber,
                address: req.body.address,
                packages: [] // Initialize packages as an empty array
              });
              newUser
                .save()
                .then(result => {
                  console.log(result);
                  res.status(201).json({
                    message: "User created successfully",
                    user: result
                  });
                })
                .catch(err => {
                  console.log(err);
                  res.status(500).json({
                    error: err
                  });
                });
            }
          });
        }
      });
});


router.post("/login", (req, res, next) => {
    User.find({ email: req.body.email })
      .exec()
      .then(user => {
        if (user.length < 1) {
          return res.status(401).json({
            message: "Authentication failed"
          });
        }
        bcrypt.compare(req.body.password, user[0].password, (err, result) => {
          if (err) {
            return res.status(401).json({
              message: "Authentication failed"
            });
          }
          if (result) {
            const token = jwt.sign(
              {
                email: user[0].email,
                userId: user[0]._id
              },
              process.env.JWT_KEY,
              {
                  expiresIn: "1h"
              }
            );
            return res.status(200).json({
              message: "Authentication successful",
              token: token,
              user: {
                username: user[0].username,
                email: user[0].email,
                roles: user[0].roles,
                packages: user[0].packages // Return associated packages
              }
            });
          }
          res.status(401).json({
            message: "Authentication failed"
          });
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
});
router.delete("/:userId", (req, res, next) => {
    User.deleteOne({ _id: req.params.userId })
      .exec()
      .then(result => {
        res.status(200).json({
          message: "User deleted successfully"
        });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({
          error: err
        });
      });
});


module.exports=router;