const Product = require("../models/product");
const {errorHandler} = require('../helpers/dbErrorHandler');
const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');

exports.create = (req, res) =>{
    let form = formidable.IncomingForm();
    form.keepExtensions=true;
    form.parse( req, (err, field, files) => {
        if(err){
            return res.status.json({error:"Image could not be uploaded"});
        }
        let product = new Product(fields);
        if(files.photo){
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type ;
        }

        product.save((err, result) =>{
            if(err){
                return res.status.json({error:errorHandler(err)});
            }
            res.json({result});
        });
    });

};