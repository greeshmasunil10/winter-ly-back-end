const { Order } = require("../models/order");
const user = require("../models/user");
const { findOne } = require("../models/user");
const User = require("../models/user");
const { errorHandler } = require("../helpers/dbErrorHandler");

exports.userById = (req, res, next, id) => {
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    req.profile = user;
    next();
  });
};

exports.read = (req, res) => {
  req.profile.hashed_password = undefined;
  req.profile.salt = undefined;
  return res.json(req.profile);
};

// exports.update = (req, res) => {
//   User.findOneAndUpdate(
//     { _id: req.profile._id },
//     { $set: req.body },
//     { $new: true },
//     (err, user) => {
//       if (err) {
//         console.log("body:", req.body);
//         console.log("user:", user);
//         return res
//           .status(400)
//           .json({ err: "Action could not be performed. User not found" });
//       }
//       console.log("body:", req.body);
//       console.log("user:", user);
//       user.hashed_password = undefined;
//       user.salt = undefined;
//       return res.json(user);
//     }
//   );
// };

exports.update = (req, res) => {
  // console.log('UPDATE USER - req.user', req.user, 'UPDATE DATA', req.body);
  const { name, password } = req.body;

  User.findOne({ _id: req.profile._id }, (err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    if (!name) {
      return res.status(400).json({
        error: "Name is required",
      });
    } else {
      user.name = name;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          error: "Password should be min 6 characters long",
        });
      } else {
        user.password = password;
      }
    }

    user.save((err, updatedUser) => {
      if (err) {
        console.log("USER UPDATE ERROR", err);
        return res.status(400).json({
          error: "User update failed",
        });
      }
      updatedUser.hashed_password = undefined;
      updatedUser.salt = undefined;
      res.json(updatedUser);
    });
  });
};

exports.addOrderToUserHistory = (req, res, next) => {
  let history = [];
  req.body.order.products.forEach((item) => {
    history.push({
      id: item._id,
      name: item.name,
      description: item.description,
      category: item.category,
      quantity: item.count,
      transaction_id: req.body.order.transaction_id,
      amount: req.body.order.amount,
    });
  });

  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $push: { history: history } },
    { new: true },
    (error, data) => {
      if (error) {
        return res
          .status(400)
          .json({ error: "Could not update user purchase history" });
      }
      next();
    }
  );
};

exports.purchaseHistory = (req, res) => {
  Order.find({ user: req.profile._id })
    .populate("user", "_id name")
    .sort([["createdAt", "desc"]])
    .exec((err, orders) => {
      if (err) {
        return res.status(400).json({ error: errorHandler(err) });
      }
      res.json(orders);
    });
};
