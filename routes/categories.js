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
const cloudinary = require ('cloudinary').v2
const { verifyTokenModerator } = require('../helpers/verify');


cloudinary.config({
     cloud_name : "djbdanrbf",
     secure : true,
     api_key : process.env.CLOUD_API_KEY,
     api_secret : process.env.CLOUD_SECRET_KEY
})
router.post('/CreateCategory',upload.single('icon'), async (req, res) => {
    // Create the icon URL by concatenating the server URL with the file path


   // Upload the image to Cloudinary if a file is provided
   let iconUrlcloudinary = null;
   if (req.file) {
       const result = await cloudinary.uploader.upload(req.file.path, {
           folder: 'categories', // Optional: Organize your uploads into a folder
       });
       iconUrlcloudinary = result.secure_url; // Cloudinary's URL for the uploaded image
   }

    const user = await verifyTokenModerator(req);
    if (!user) {
        return res.status(401).send('Unauthorized');
    }
    let category = new Category({
        name: req.body.name,
        icon: iconUrlcloudinary,  // Store the full path to the icon
        description: req.body.description,
        typestore: req.body.typestore,
    });

    try {
        category = await category.save();
        if (!category) return res.status(404).send('The category cannot be created');
        res.send(category);
    } catch (error) {
        res.status(500).send('An error occurred: ' + error.message);
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
const fs = require('fs').promises; // Add this at the top with other imports

// Then in your update route:
router.put('/update/:id', upload.single('icon'), async (req, res) => {
  try {
    const user = await verifyTokenModerator(req);
    const { id } = req.params;
    const { name, typestore, description, existingIcon } = req.body;
    
    let iconUrl = existingIcon || "";

    // If a new icon file was uploaded
    if (req.file) {
      // Delete old icon from Cloudinary if it exists
      if (existingIcon) {
        try {
          const urlParts = existingIcon.split('/');
          const filename = urlParts[urlParts.length - 1];
          const publicId = `categories/${filename.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
        } catch (err) {
          console.error("Failed to delete old icon:", err);
        }
      }

      // Upload new icon
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'categories'
      });
      iconUrl = result.secure_url;
      
      // Clean up uploaded file using fs.promises
      await fs.unlink(req.file.path); // Changed from unlinkAsync to fs.unlink
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { 
        name, 
        typestore, 
        description,
        icon: iconUrl 
      },
      { new: true }
    );

    if (!updatedCategory) return res.status(404).send("Category not found");
    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).send("Internal Server Error");
  }
});


/**
 * @desc DELETE category
 * @method DELETE
 * @route /api/categories
 * @access public
 */
router.delete('/delete/:id', async(req,res)=>{
    const user = await verifyTokenModerator(req);
    if (!user) {
        return res.status(401).send('Unauthorized');
    }
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
