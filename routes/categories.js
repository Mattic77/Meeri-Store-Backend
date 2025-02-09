const express = require('express');
const router = express.Router();
const Joi = require('joi');
const cors = require('cors'); 
const asyncHandler = require('express-async-handler');
const {Category} = require('../models/Category')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 
const auth_jwt = require('../helpers/jwt');
const {GETschemma,POSTschemma} = require('../schemas/categoryschema');
const resolvers = require('../resolvers/categoryresolver')
const { createHandler } = require("graphql-http/lib/use/express");


router.post('/CreateProduct', upload.array('images', 10), async (req, res) => {
    try {
        
        // Parse productdetail from JSON string to array of objects
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
        const imageUrls = req.files ? req.files.map(file => `https://meeriproject.onrender.com/uploads/${file.filename}`) : [];

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
 * @desc GET Category 
 * @method get
 * @route /api/Category
 * @access public
 */
router.use('/categoryGET', 
    createHandler({
        schema: GETschemma,
        rootValue: resolvers,
      })
);

/**
 * @desc POST Category 
 * @method POST 
 * @route /api/products
 * @access public
 */

router.use('/categoryPOST', 
    (req, res) => {
        createHandler({
            schema: POSTschemma,
            rootValue: resolvers,
            context: { req,res }, 
        })(req, res); 
    }
);
/**
 * @desc get  all categories
 * @method get
 * @route /api/categories
 * @access public
 */
router.get('/GetALLCategories',async (req,res)=>{
 const  CategoryList = await Category.find();
 if(!CategoryList){
    res.status(500).json({succes : false});
 }
 res.status(200).send(CategoryList);
})

/**
 * @desc get   category byID
 * @method get
 * @route /api/categories
 * @access public
 */
router.get('/Get/:id',async (req,res)=>{
    Category.findById(req.params.id).then( category =>{
        if(!category)
            res.status(404).json({succes : false, message : 'category not found'});
        
        res.status(200).send(category)
    })
})



/**
 * @desc update category
 * @method PUT
 * @route /api/categories/:id
 * @access public
 */
router.put('/Update/:id', upload.single('icon'), async (req, res) => {
    // If a new icon is uploaded, generate the new icon URL
    const iconUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : req.body.icon;

    let category = await Category.findByIdAndUpdate(req.params.id, {
        name: req.body.name,
        icon: iconUrl,  // Update the icon with the new URL or keep the existing one
        typestore: req.body.typestore
    }, { new: true });

    if (!category)
        return res.status(404).send('The category cannot be updated');

    res.send(category);
});

/**
 * @desc DELETE category
 * @method DELETE
 * @route /api/categories
 * @access public
 */
router.delete('/delete/:id', auth_jwt(),async(req,res)=>{
    Category.findByIdAndDelete(req.params.id).then(category =>{
        if(category){
            res.status(200).json({ succes : true ,message : 'the category is deleted'})
        }else{
            return res.status(404).json({succes : false , message : 'category not found '})
        }
    }).catch(err=>{
        return res.status(400).json({succes: false , message: err})
    })
})    


module.exports = router;
