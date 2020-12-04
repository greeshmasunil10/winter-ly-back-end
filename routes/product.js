const express = require("express");
const router = express.Router();

const {requireSignin, isAuth, isAdmin} = require('../controllers/auth');
const {create} = require('../controllers/product');
const {userById} = require('../controllers/user');
const {productById ,read, remove, update, list, listRelated, listCategories} = require('../controllers/product');


router.param('userId',userById);
router.param('productId',productById);

router.get('/product/:productId', read);
router.get('/products', list);
router.get('/products/related/:productId', listRelated);
router.get('/products/categories', listCategories);
router.post('/product/create/:userId', requireSignin, isAuth, isAdmin, create);
router.put('/product/:productId/:userId', requireSignin, isAuth, isAdmin, update);
router.delete('/product/:productId/:userId', requireSignin, isAuth, isAdmin, remove);

module.exports = router;