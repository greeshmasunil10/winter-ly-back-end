const Product = require("../models/product");
const {errorHandler} = require('../helpers/dbErrorHandler');
const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');

exports.productById = (req,res,next,id) =>{
    Product.findById(id).exec((err,product)=>{
        if(err || !product){
            return res.status(400).json({
                error:"Product not found"
            });
        }
        req.product=product;
        next();
    }) 
};

exports.read = (req,res)=>{
     return res.json(req.product);
};

exports.create = (req, res) =>{
    let form = formidable.IncomingForm();
    form.keepExtensions=true;
    form.parse( req, (err, fields, files) => {
        if(err){
            return res.status(400).json({error:"Image could not be uploaded"});
        }
        let product = new Product(fields);
        if(files.photo){
            if(files.photo.size > 1000000)
               return res.status(400).json({error:"Photo upload failed. Image Size should be less than 1mb."});
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type ;
        }

        const { name, description, price, category, quantity, shipping } = fields;
        if (!name|| !description|| !price|| !category|| !quantity|| !shipping) {
                return res.status(400).json({
                    error: 'All fields are required'
                });
        }

        product.save((err, result) =>{
            if(err){
                return res.status(400).json({error:errorHandler(err)});
            }
            return res.json({result});
        });
    });

};

exports.remove = (req ,res) =>{
    let product = req.product;
    product.remove( (err, deletedProduct)=>{
        if(err){
            return res.status(400).json({error:errorHandler(err)});
        }
        return res.json({message: "Product successfully deleted.","name":deletedProduct.name,"id":deletedProduct.id });
    })
}

exports.update = (req, res) =>{
    let form = formidable.IncomingForm();
    form.keepExtensions=true;
    form.parse( req, (err, fields, files) => {
        if(err){
            return res.status(400).json({error:"Image could not be uploaded"});
        }
        let product = req.product;
        product= _.extend(product,fields);
        if(files.photo){
            if(files.photo.size > 1000000)
               return res.status(400).json({error:"Photo upload failed. Image Size should be less than 1mb."});
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type ;
        }

        const { name, description, price, category, quantity, shipping } = fields;
        if (!name|| !description|| !price|| !category|| !quantity|| !shipping) {
                return res.status(400).json({
                    error: 'All fields are required'
                });
        }

        product.save((err, result) =>{
            if(err){
                return res.status(400).json({error:errorHandler(err)});
            }
            return res.json({result});
        });
    });

};

//http://localhost:8000/api/products?sortBy=sold&order=desc&limit=4
//http://localhost:8000/api/products?sortBy=createdAt&order=desc&limit=4
exports.list = (req,res) =>{
    let order = req.query.order ? req.query.order :'asc'
    let sortBy = req.query.sortBy ? req.query.sortBy :'_id'
    let limit = req.query.limit ? parseInt(req.query.limit) :6
    Product.find() 
                .select('-photo')
                .populate('category')
                .sort([[sortBy,order]])
                .limit(limit)
                .exec((err,products)=>{
                    if(err){
                            return res.status(400).json({err:errorHandler(err)});
                        }
        return res.json(products);
    });
};
/**
 *
 * Will find products related to the requested product id
 * by fetching products from the same category
 *  http://localhost:8000/api/products/related/5fca6e65c4891745a14213ed?limit=4
 */
exports.listRelated = (req,res) =>{
    let limit = req.query.limit ? parseInt(req.query.limit) :6
    Product.find({ _id: { $ne: req.product }, category: req.product.category })
                .select('-photo')
                .populate('category', '_id name')
                .limit(limit)
                .exec((err,products)=>{
                    if(err){
                            return res.status(400).json({err:errorHandler(err)});
                        }
        return res.json(products);
    });
};
/**
 * 
 *
 */

exports.listCategories = (req,res) =>{
    Product.distinct("category",(err,categories)=>{
                    if(err){
                            return res.status(400).json({err:errorHandler(err)});
                        }
        return res.json(categories);
    });
};