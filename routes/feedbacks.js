const express = require('express');
const router = express.Router();
const resolvers = require('../resolvers/feedbackresolver')
const {GETschemma,POSTschemma} = require('../schemas/feedbackschema');
const { createHandler } = require("graphql-http/lib/use/express");



/**
 * @desc GET wishlist 
 * @method get
 * @route /api/wishlists
 * @access public
 */
router.use('/feedbackGET', 
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
    '/feedbackPOST',
    (req, res) => {
        createHandler({
            schema: POSTschemma,
            rootValue: resolvers,
            context: { req,res }, 
        })(req, res); 
    }
);



module.exports = router;


