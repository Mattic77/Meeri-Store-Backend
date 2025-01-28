const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Product} = require('../models/Product');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 
const {GETschemma,POSTschemma} = require('../schemas/productschema');
const resolvers = require('../resolvers/productresolver')
const { createHandler } = require("graphql-http/lib/use/express");



/**
 * @desc GET Product 
 * @method get
 * @route /api/products
 * @access public
 */
router.use('/productGET', 
    createHandler({
        schema: GETschemma,
        rootValue: resolvers,
      })
);

/**
 * @desc POST Product 
 * @method POST 
 * @route /api/products
 * @access public
 */
router.use(
    '/productPOST',
    (req, res) => {
        createHandler({
            schema: POSTschemma,
            rootValue: resolvers,
            context: { req,res }, 
        })(req, res); 
    }
);



/**
 * @desc get featured products
 * @method get
 * @route /api/products/isfeatured
 * @access public
 */
router.get('/isfeatured', async (req, res) => {
    try {
        const isfeatured = await Product.find({ IsFeatured: true });
        res.status(200).send(isfeatured);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


module.exports = router;
