const { Order, CartItem } = require("../models/order");
const { errorHandler } = require("../helpers/dbErrorHandler");

/**
 * @swagger
 * tags:
 *  name: Orders
 *  description:  Manage orders
 */

exports.orderById = (req, res, next, id) => {
  Order.findById(id)
    .populate("products.product", "name price")
    .exec((err, order) => {
      if (err || !order) {
        return res.status(400).json({ error: errorHandler(err) });
      }
      req.order = order;
      next();
    });
};

exports.create = (req, res) => {
  //   console.log("CREATE Order:", req.body);
  req.body.order.user = req.profile;
  const order = new Order(req.body.order);
  order.save((error, data) => {
    if (error) {
      return res.status(400).json({ error: errorHandler(error) });
    } else {
      res.json(data);
    }
  });
};

/**
 * @swagger
 * /api/orders/list/{userId}:
 *  get :
 *    description: Lists the orders
 *    tags: [Orders]
 *    parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         minimum: 1
 *         description: User ID
 *    responses:
 *      '200' : 
 *        description: Success
 */
exports.listOrders = (req, res) => {
  Order.find()
    .populate("user", "_id name address")
    .sort([["createdAt", "desc"]])
    .exec((err, orders) => {
      if (err) {
        return res.status(400).json({ error: errorHandler(err) });
      } else {
        res.json(orders);
      }
    });
};
exports.getStatusValues = (req, res) => {
  res.json(Order.schema.path("status").enumValues);
};

exports.updateOrderStatus = (req, res) => {
  Order.update(
    { _id: req.body.orderId },
    { $set: { status: req.body.status } },
    (err, order) => {
      if (err) {
        return res.status(400).json({ error: errorHandler(err) });
      }
      res.json(order);
    }
  );
};
