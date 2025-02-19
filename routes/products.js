const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Product,validationproduct} = require('../models/Product');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 
const {GETschemma,POSTschemma} = require('../schemas/productschema');
const resolvers = require('../resolvers/productresolver')
const { createHandler } = require("graphql-http/lib/use/express");
const { verifyTokenModerator } = require('../helpers/verify');
const cloudinary = require ('cloudinary').v2


cloudinary.config({
    cloud_name : "djbdanrbf",
    secure : true,
    api_key : process.env.CLOUD_API_KEY,
    api_secret : process.env.CLOUD_SECRET_KEY
})
router.post('/CreateProduct', upload.array('images', 10), async (req, res) => {
    try {
        
        if (req.body.productdetail) {
            req.body.productdetail = JSON.parse(req.body.productdetail);
        }

        // Validate request body against Joi validation schema
        const { error, value } = validationproduct.validate(req.body);
        if (error) {
            return res.status(400).send(error.details[0].message);
        }

        // Verify the token and get the user
        const user = await verifyTokenModerator(req);
        if (!user) {
            return res.status(401).send('Unauthorized');
        }

        // Handle image uploads
        let imageUrls = [];
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file =>
                cloudinary.uploader.upload(file.path, {
                    folder: 'products', // Optional: Specify folder in Cloudinary
                })
            );

            // Wait for all uploads to complete
            const uploadResults = await Promise.all(uploadPromises);

            // Extract secure URLs from the upload results
            imageUrls = uploadResults.map(result => result.secure_url);

            // Optional: Remove uploaded files from local storage
            const fs = require('fs');
            req.files.forEach(file => fs.unlinkSync(file.path));
        }
        // Create a new product instance
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
            productdetail: value.productdetail, // Already parsed as an array of objects
        });

        // Save the product to the database
        product = await product.save();
        res.status(201).send(product);
    } catch (err) {
        console.error('Server Error:', err);
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







module.exports = router;
