const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { WishList, validateWishlist } = require('../models/Wishlist');
const { Product } = require('../models/Product');
const { User } = require('../models/User');
const verifyToken = require('../helpers/verify');
const resolvers = require('../resolvers/wishlistresolver')
const {GETschemma,POSTschemma} = require('../schemas/wishlistscehma');
const { createHandler } = require("graphql-http/lib/use/express");


/**
 * @desc GET Product 
 * @method get
 * @route /api/products
 * @access public
 */
router.use('/wishlistGET', 
    (req, res) => {

    createHandler({
        schema: GETschemma,
        rootValue: resolvers,
        context: { req,res }, 
    })(req, res); }
);

/**
 * @desc POST Product 
 * @method POST 
 * @route /api/products
 * @access public
 */
router.use(
    '/wishlistPOST',
    (req, res) => {
        createHandler({
            schema: POSTschemma,
            rootValue: resolvers,
            context: { req,res }, 
        })(req, res); 
    }
);



module.exports = router;
