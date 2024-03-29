const Product = require("../models/product");
const { errorHandler } = require("../helpers/dbErrorHandler");
const formidable = require("formidable");
const _ = require("lodash");
const fs = require("fs");

exports.productById = (req, res, next, id) => {
  Product.findById(id)
    .populate("category")
    .exec((err, product) => {
      if (err || !product) {
        return res.status(400).json({
          error: "Product not found",
        });
      }
      req.product = product;
      next();
    });
};

/**
 * @swagger
 * /api/product/{productId}:
 *  get :
 *    description: Lists at most 6 products related to the requested product Id
 *    tags: [Products]
 *    parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         minimum: 1
 *         description: The product id to be passed
 *    responses:
 *      '200' : 
 *        description: Success
 *      
 */
exports.read = (req, res) => {
  req.product.photo = undefined;
  return res.json(req.product);
};

exports.create = (req, res) => {
  let form = formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({ error: "Image could not be uploaded" });
    }
    let product = new Product(fields);
    if (files.photo) {
      if (files.photo.size > 1000000)
        return res.status(400).json({
          error: "Photo upload failed. Image Size should be less than 1mb.",
        });
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }

    const { name, description, price, category, quantity, shipping } = fields;
    if (
      !name ||
      !description ||
      !price ||
      !category ||
      !quantity ||
      !shipping
    ) {
      return res.status(400).json({
        error: "All fields are required",
      });
    }

    product.save((err, result) => {
      if (err) {
        return res.status(400).json({ error: errorHandler(err) });
      }
      return res.json(result);
    });
  });
};

exports.remove = (req, res) => {
  let product = req.product;
  product.remove((err, deletedProduct) => {
    if (err) {
      return res.status(400).json({ error: errorHandler(err) });
    }
    return res.json({
      message: "Product successfully deleted.",
      name: deletedProduct.name,
      id: deletedProduct.id,
    });
  });
};

exports.update = (req, res) => {
  let form = new formidable.IncomingForm();
  form.keepExtensions = true;
  form.parse(req, (err, fields, files) => {
    if (err) {
      return res.status(400).json({
        error: "Image could not be uploaded",
      });
    }

    let product = req.product;
    product = _.extend(product, fields);

    // 1kb = 1000
    // 1mb = 1000000

    if (files.photo) {
      // console.log("FILES PHOTO: ", files.photo);
      if (files.photo.size > 1000000) {
        return res.status(400).json({
          error: "Image should be less than 1mb in size",
        });
      }
      product.photo.data = fs.readFileSync(files.photo.path);
      product.photo.contentType = files.photo.type;
    }

    product.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err),
        });
      }
      res.json(result);
    });
  });
};

//http://localhost:8000/api/products?sortBy=sold&order=desc&limit=4
//http://localhost:8000/api/products?sortBy=createdAt&order=desc&limit=4

/**
 * 
 * @swagger
 * /api/products:
 *  get :
 *    description: Lists all the products.
 *    tags: [Products]
 *    parameters:
 *        - in: query
 *          name: sortBy
 *          description: Sort by can be -  "sold", "createdAt", "name" or any other field of the product
 *        - in: query
 *          name: order
 *          description: Order can be "asc" or "desc"
 *        - in: query
 *          name: limit
 *          description: The number of products to display
 *    responses:
 *          '200' : 
 *             description: Success
 */
exports.list = (req, res) => {
  let order = req.query.order ? req.query.order : "asc";
  let sortBy = req.query.sortBy ? req.query.sortBy : "_id";
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;
  Product.find()
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({ error: errorHandler(err) });
      }
      return res.json(products);
    });
};
// /**
//  
//  Will find products related to the requested product id
//  by fetching products from the same category
//   http://localhost:8000/api/products/related/5fca6e65c4891745a14213ed?limit=4
//  

/**
 * @swagger
 * /api/products/related/{productId}:
 *  get :
 *    description: Lists at most 6 products related to the requested product Id
 *    tags: [Products]
 *    parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         minimum: 1
 *         description: The product id to be passed
 *       - in: query
 *         name: limit
 *         type: integer
 *         description: Limit
 *    responses:
 *      '200' : 
 *        description: Success
 *      
 */
exports.listRelated = (req, res) => {
  let limit = req.query.limit ? parseInt(req.query.limit) : 6;
  Product.find({ _id: { $ne: req.product }, category: req.product.category })
    .select("-photo")
    .populate("category", "_id name")
    .limit(limit)
    .exec((err, products) => {
      if (err) {
        return res.status(400).json({ error: errorHandler(err) });
      }
      return res.json(products);
    });
};


/**
 * @swagger
 * /api/products/categories:
 *  get :
 *    tags: [Products]
 *    description: Lists the categories (Category IDs)
 *    responses:
 *      '200' : 
 *        description: Success
 */
exports.listCategories = (req, res) => {
  Product.distinct("category", (err, categories) => {
    if (err) {
      return res.status(400).json({ error: errorHandler(err) });
    }
    return res.json(categories);
  });
};

exports.listBySearch = (req, res) => {
  let order = req.body.order ? req.body.order : "desc";
  let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
  let limit = req.body.limit ? parseInt(req.body.limit) : 100;
  let skip = parseInt(req.body.skip);
  let findArgs = {};

  // console.log(order, sortBy, limit, skip, req.body.filters);
  // console.log("findArgs", findArgs);

  for (let key in req.body.filters) {
    if (req.body.filters[key].length > 0) {
      if (key === "price") {
        // gte -  greater than price [0-10]
        // lte - less than
        findArgs[key] = {
          $gte: req.body.filters[key][0],
          $lte: req.body.filters[key][1],
        };
      } else {
        findArgs[key] = req.body.filters[key];
      }
    }
  }

  Product.find(findArgs)
    .select("-photo")
    .populate("category")
    .sort([[sortBy, order]])
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
      if (err) {
        return res.status(400).json({
          error: "Products not found",
        });
      }
      res.json({ size: data.length, data });
    });
};

/**
 * @swagger
 * /api//product/photo/productId}:
 *  get :
 *    tags: [Products]
 *    description: Lists the categories (Category IDs)
 *    parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         minimum: 1
 *         description: Product ID
 *    responses:
 *      '200' : 
 *        description: Success
 */
exports.photo = (req, res, next) => {
  if (req.product.photo.data) {
    res.set("Content-Type", req.product.photo.contentType);
    return res.send(req.product.photo.data);
  }
  next();
};

//creates query obj to hold search and categroy values
exports.listSearch = (req, res) => {
  const query = {};
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: "i" };
    if (req.query.category && req.query.category !== "All") {
      query.category = req.query.category;
    }
    Product.find(query, (err, products) => {
      if (err) {
        return res.status(400).json({ error: "did not work" });
      } else {
        res.json(products);
      }
    }).select("-photo");
  }
};
exports.decreaseQuantity = (req, res, next) => {
  let bulkOps = req.body.order.products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item._id },
        update: { $inc: { quantity: -item.count, sold: +item.count } },
      },
    };
  });
  Product.bulkWrite(bulkOps, {}, (error, producs) => {
    if (error) {
      return res.status(400).json({ error: "Could not update product" });
    }
    next();
  });
};
