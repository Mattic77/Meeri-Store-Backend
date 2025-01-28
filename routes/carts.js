const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const {Cart,validatecart} = require('../models/Cart');
const {User} = require('../models/User');
const jwt = require('../helpers/jwt');
const { createHandler } = require("graphql-http/lib/use/express");
const {GETschemma,POSTschemma} = require('../schemas/cartschema');
const resolvers = require('../resolvers/cartresolver')




/**
 * @desc GET Cart 
 * @method get
 * @route /api/carts
 * @access public
 */
router.use('/cartGET', 
    (req, res) => {
    createHandler({
        schema: GETschemma,
        rootValue: resolvers,
        context: { req,res }
    })(req, res);}
 );

/**
 * @desc POST Cart 
 * @method POST 
 * @route /api/carts
 * @access public
 */
router.use(
    '/cartPOST',
    (req, res) => {
        createHandler({
            schema: POSTschemma,
            rootValue: resolvers,
            context: { req,res }, 
        })(req, res); 
    }
);
/**
 * @desc get  user carts
 * @method get
 * @route 
 * */
router.get('/getcartuser', jwt(), async (req, res) => {
    try {
        const userId = req.auth._id; // Extract user ID from the token payload

        const cart = await Cart.findOne({ userid: userId }).populate('items.product');
        if (!cart) return res.status(404).send('Cart not found.');

        res.status(200).send(cart);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});
router.post('createcart',jwt(),async(req,res) =>{
    try {
        const userId = req.auth._id; // Extract user ID from the token payload

        const user = await User.findById(userId);
        if (!user) return res.status(404).send('User not found.');

        const { error } = validateCart(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const cart = new Cart({ userid: userId });
        await cart.save();

        res.status(201).send(cart);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
})
module.exports = router;