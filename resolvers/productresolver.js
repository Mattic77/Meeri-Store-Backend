const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { verifyTokenModerator } = require('../helpers/verify');
const { Product, validationproduct, validationupdate } = require('../models/Product');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const {Category} = require('../models/Category')

dotenv.config();

const resolvers = {
    productGET: async () => {
        try {
            const Productlist = await Product.find()
            .populate({
                path: 'category', // Populate the category field
                model: 'Category', // Specify the model to populate
                select: 'name', // Only retrieve the category name
            });
                        if (!Productlist) {
                return { success: false, message: 'No products found.' };
            }
            return Productlist;
        } catch (error) {
            console.error('Error fetching products:', error);
            return { success: false, error: error.message };
        }
    },
    productGETById: async (args) => {
        if (!mongoose.isValidObjectId(args._id)) {
            return { success: false, message: 'Invalid product ID' };
        }
        const product = await Product.findById(args._id);
        if (!product) {
            return { success: false, message: 'Product not found' };
        }
        return product;
    },
    productGETByname:async (args)=>{
        try {
            const product = await Product.findOne({ name: args.name });
            if (!product) {
                return { success: false, message: 'Product not found' };
            }
            return product;
        } catch (error) {
            console.error('Error fetching product:', error);
            return { success: false, error: error.message };
        }

    },
    productCreate: async (args, context) => {
        try {
            const user = await verifyTokenModerator(context.req);
            const {
                name,
                description,
                richDescription,
                images,
                brand,
                Price,
                category,
                CountINStock,
                rating,
                IsFeatured,
                productdetail,
            } = args.input;

            const { error } = validationproduct.validate({
                name,
                description,
                richDescription,
                images,
                brand,
                Price,
                category,
                CountINStock,
                rating,
                IsFeatured,
                productdetail,
            });

            if (error) {
                return {
                    product: null,
                    message: error.details[0].message,
                };
            }

            let imageUrls = [];
            if (context.req && context.req.files) {
                imageUrls = context.req.files.map(file => `${context.req.protocol}://${context.req.get('host')}/uploads/${file.filename}`);
            }

            const product = new Product({
                name,
                description,
                richDescription,
                images: imageUrls.length > 0 ? imageUrls : images,
                brand,
                Price,
                category,
                CountINStock,
                rating,
                IsFeatured,
                productdetail,
            });

            const savedProduct = await product.save();
            return {
                product: savedProduct,
                message: 'Product created successfully!',
            };
        } catch (err) {
            console.error('Error in productCreate:', err.message);
            return {
                product: null,
                message: `Server Error: ${err.message}`,
            };
        }
    },
    productDELETE: async (args, context) => {
        try {
            const user = await verifyTokenModerator(context.req);
            const deletedProduct = await Product.findByIdAndDelete(args.input.productId);
            if (!deletedProduct) {
                return {
                    message: 'Product not found or already deleted',
                };
            }
            return {
                username: user.username,
                message: 'Product deleted successfully',
            };
        } catch (error) {
            console.error('Error in productDELETE:', error.message);
            return {
                message: `Error: ${error.message}`,
            };
        }
    },
    productUpdate: async (args, context) => {
        try {
            const user = await verifyTokenModerator(context.req);
            const { _id, updates } = args.input;

            const { error } = validationupdate.validate(updates);
            if (error) {
                return {
                    product: null,
                    message: error.details[0].message,
                };
            }

            if (!mongoose.isValidObjectId(_id)) {
                return { message: 'Invalid product ID', product: null };
            }

            const updatedProduct = await Product.findByIdAndUpdate(
                _id,
                { $set: updates },
                { new: true }
            );

            if (!updatedProduct) {
                return {
                    product: null,
                    message: 'Product not found or update failed',
                };
            }

            return {
                product: updatedProduct,
                message: 'Product updated successfully!',
            };
        } catch (err) {
            console.error('Error in productUpdate:', err.message);
            return {
                product: null,
                message: `Server Error: ${err.message}`,
            };
        }
    },
    productGETBycategory :async (args) => {
        try{
        if (!mongoose.isValidObjectId(args._id)) {
            return { product: [], message: "Invalid category ID" };
        }
    
        const products = await Product.find({ category: args._id });
        if (products.length === 0) {
            return { product: [], message: "No products found for this category" };
        }
        const categoryF = Category.findById(args._id);
        return {
            category: categoryF,
            product: products,
            message: "Products fetched successfully",
        }
    }catch(err){
        return {message: err.message}
    }
},
featuredproductGET :async ()=>{
    try {
        const Productlist = await Product.find({IsFeatured : true})
        .populate({
            path: 'category', // Populate the category field
            model: 'Category', // Specify the model to populate
            select: 'name', // Only retrieve the category name
        });
                    if (!Productlist) {
            return { success: false, message: 'No products found.' };
        }
        return Productlist;
    } catch (error) {
        console.error('Error fetching products:', error);
        return { success: false, error: error.message };
    }
}
}

module.exports = resolvers;
