const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Product,validationproduct,validationupdate} = require('../models/Product');
const multer = require('multer');
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 Mo max par fichier
    files: 50                  // max 50 fichiers
  }
});
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
router.get("/byname", async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ error: "Le paramètre 'name' est requis" });
    }

    const products = await Product.find({
      name: { $regex: name, $options: "i" }
    }).populate({
      path: "category",
      model: "Category",
      select: "name _id",
    });

    if (!products || products.length === 0) {
      return res.json([]); // pas d'erreur, juste tableau vide
    }

    res.json(products);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: error.message });
  }
});
router.post('/CreateProduct', upload.array('images', 50), async (req, res) => {
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
const fs = require('fs');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);

router.put('/editProduct/:id', upload.array('images', 50), async (req, res) => {
    try {
        // Verify the token and get the user
        const user = await verifyTokenModerator(req);
        if (!user) {
            return res.status(401).send('Unauthorized');
        }

        const productId = req.params.id;

        if (req.body.productdetail && typeof req.body.productdetail === 'string') {
            try {
                req.body.productdetail = JSON.parse(req.body.productdetail);
            } catch (e) {
                return res.status(400).send('Invalid productdetail JSON');
            }
        }


// ✅ Parse existingImages → et stockez-le DANS existingImages
if (req.body.existingImages && typeof req.body.existingImages === 'string') {
    try {
        req.body.existingImages = JSON.parse(req.body.existingImages); // ✅ ICI : on remplace la string par le tableau
    } catch (e) {
        return res.status(400).send('Invalid existingImages JSON');
    }
}

// ✅ MAINTENANT, Joi verra un tableau → validation réussie
const { error, value } = validationupdate.validate(req.body);
if (error) {
    return res.status(400).send(error.details[0].message);
}

// ✅ Ensuite, utilisez value.existingImages pour mettre à jour les images du produit
let product = await Product.findById(productId);

// Supprimez les anciennes images non conservées
if (Array.isArray(value.existingImages)) {
    const validUrls = value.existingImages.filter(url =>
        typeof url === 'string' && /^https?:\/\/res\.cloudinary\.com\/.*$/.test(url)
    );

    const imagesToDelete = product.images.filter(img => !validUrls.includes(img));
    if (imagesToDelete.length > 0) {
        const deletePromises = imagesToDelete.map(imageUrl => {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            return cloudinary.uploader.destroy(publicId);
        });
        await Promise.all(deletePromises);
    }

    product.images = validUrls; // ✅ On part des URLs existantes
}

// ✅ Ajoutez les nouvelles images uploadées (req.files)
if (req.files && req.files.length > 0) {
    const uploadPromises = req.files.map(file =>
        cloudinary.uploader.upload(file.path, { folder: 'products' })
    );
    const uploadResults = await Promise.all(uploadPromises);
    const newImageUrls = uploadResults.map(result => result.secure_url);
    product.images = [...product.images, ...newImageUrls]; // ✅ Ajout aux existantes

    // Nettoyage fichiers locaux
    await Promise.all(req.files.map(file => unlinkAsync(file.path)));
}
        // Update other product fields
        const fieldsToUpdate = ['name', 'description', 'richDescription', 'brand', 'Price', 'category', 'CountINStock', 'rating', 'IsFeatured', 'productdetail'];
        fieldsToUpdate.forEach(field => {
            if (value[field] !== undefined) {
                product[field] = value[field];
            }
        });

        // Save the updated product
        product = await product.save();
        res.status(200).json(product);
        
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
