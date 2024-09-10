const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const mongoose =require('mongoose');
const chechAuth = require('../middleware/check-auth');
router.get('/',(req,res,next)=>{
    res.status(200).json({message:"handling GET request to /products"})
});

router.post('/',chechAuth,(req,res,next)=>{
    const product = new Product({
    _id: new mongoose.Types.ObjectId(),
      name: req.body.name,
      price:req.body.price
    });
    product.save().then(result=>{
        console.log(result)
    })
    .catch(err=>console.log(err));

    res.status(200).json({message:"handling POST request to /products",
        createdProduct:product
    });
});


router.get('/:productId',(req,res,next)=>{
    const id = req.params.productId;
    Product.findById(id)
    .exec()
    .then(doc =>{
        console.log(doc);
        if(doc){
            res.status(200).json(doc);
        }else{
            res.status(404).json({message:'No valid entry found for provided Id'});
        }
        
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({error:err});
    });
});


module.exports = router;