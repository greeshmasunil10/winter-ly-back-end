const Category = require("../models/category");
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.categoryById = (req, res, next, id) => {
  Category.findById(id).exec((err, category) => {
    if (err || !category) {
      return res.status(400).json({
        error: "Category does not exist",
      });
    }
    req.category = category;
    next();
  });
};

/**
 * @swagger
 * /api/category/{categoryId}:
 *  get :
 *    description: Finds the category
 *    tags: [Categories]
 *    parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         minimum: 1
 *         description: Category id
 *    responses:
 *      '200' : 
 *        description: Success
 *      
 */
exports.read = (req, res) => {
  return res.json(req.category);
};

exports.create = (req, res) => {
  const category = new Category(req.body);
  category.save((err, data) => {
    if (err) {
      console.log("error:", err);
      return res.status(400).json({ error: errorHandler(err) });
    }

    res.json({ data });
  });
};

exports.remove = (req, res) => {
  const category = req.category;
  category.remove((err, deletedcategory) => {
    if (err) {
      return res.status(400).json({ error: errorHandler(err) });
    }
    return res.json({
      message: "Product successfully deleted.",
      name: deletedcategory.name,
      id: deletedcategory.id,
    });
  });
};

exports.update = (req, res) => {
  const category = req.category;
  category.name = req.body.name;
  category.save((err, data) => {
    if (err) {
      return res.status(400).json({ error: errorHandler(err) });
    }
    res.json({ data });
  });
};

/**
 * @swagger
 * /api/categories:
 *  get :
 *    description: Finds the category
 *    tags: [Categories]
 *    responses:
 *      '200' : 
 *        description: Success
 *      
 */
exports.list = (req, res) => {
  Category.find().exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json(data);
  });
};
