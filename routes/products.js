const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Product} = require('../models/Product');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 
const {GETschemma,POSTschemma} = require('../schemas/productschema');
const resolvers = require('../resolvers/productresolver')
const { createHandler } = require("graphql-http/lib/use/express");
const { verifyTokenModerator } = require('../helpers/verify');


router.post('/CreateProduct',  upload.array('images', 10), async (req, res) => {
    // Validate request body against Joi validation schema
    const user = await verifyTokenModerator(context.req);

    
    // If validation fails, send a 400 response with error message
    if (error) {
        return res.status(400).send(error.details[0].message);
    }

    // Create array of file names or URLs for the uploaded images
    const imageUrls = req.files.map(file => `https://meeriproject.onrender.com/uploads/${file.filename}`);

    // Create new Product instance with validated values and uploaded images
    let product = new Product({
        name: value.name,
        description: value.description,
        richDescription: value.richDescription,
        images: imageUrls, // Store array of image URLs
        brand: value.brand,
        Price: value.Price,
        category: value.category,
        CountINStock: value.CountINStock,
        rating: value.rating,
        IsFeatured: value.IsFeatured,
        productdetail: value.productdetail
    });

    try {
        // Save the product to the database
        product = await product.save();
        // Send the created product back as a response with 201 status code
        res.status(201).send(product);
    } catch (err) {
        // In case of error during saving, send a 500 error response
        res.status(500).send('Server Error: ' + err.message);
    }
});

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
