const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {Category} = require('../models/Category')
const {verifyTokenModerator} = require('../helpers/verify')

const mongoose = require('mongoose'); 
const dotenv = require('dotenv');

dotenv.config();
const cloudinary = require ('cloudinary').v2

dotenv.config();
cloudinary.config({
    cloud_name : "djbdanrbf",
    secure : true,
    api_key : process.env.CLOUD_API_KEY,
    api_secret : process.env.CLOUD_SECRET_KEY
})

const resolvers = {


    CategoryGET: async () => {
        try {
        const categories = await Category.find().sort({ createdAt: -1 }); 
                    if (!categories) {
                return { success: false, message: 'No categories found.' };
            }
            return categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return { success: false, error: error};
        }
    },
    
    CategoryGETById: async ({ _id }) => {
        if (!mongoose.isValidObjectId(_id)) {
            return { success: false, message: 'Invalid category ID' };
        }
        const category = await Category.findById(_id);
        if (!category) {
            return { success: false, message: 'Category not found' };
        }
        return category;
    },
    
    categoryCreate : async (args,context)=>{
        try {
            const user =await verifyTokenModerator(context.req)

            const {       
                name,
                icon,
                description,
                typestore,
            } = args.input;
            const iconUrl = context.req.file ? `${context.req.protocol}://${context.req.get('host')}/uploads/${context.req.file.filename}` : null;

            const category = new Category({
                name,
                icon :iconUrl ,
                description,
                typestore,
            });

            const savedCategory = await category.save();

            return {
                category: savedCategory,
                message: 'Category created successfully!',
            };
        }catch (err) {
            console.error('Error in categoryCreate:', err.message);
            return {
                category: null,
                message: `Server Error: ${err.message}`,
            };
    }
    },
    categoryDELETE : async (args,context)=>{
        try {
            const user =await verifyTokenModerator(context.req)
            const isPasswordValid = await bcrypt.compare(args.input.password, user.passwordhash);
            if (!isPasswordValid) {
                return {
                    message: 'Invalid password',
                };
            }
            const category = await Category.findById(args.input.categoryId);
            if (!category) {
                return {
                    message: 'Category not found',
                };
            }
    
            // If the category has an associated image, delete it from Cloudinary
            if (category.icon) {
                const publicId = category.icon.split('/').pop().split('.')[0]; // Extract the public ID
                await cloudinary.uploader.destroy(`categories/${publicId}`, (error, result) => {
                    if (error) {
                        console.error('Error deleting image from Cloudinary:', error.message);
                    } else {
                        console.log('Image deleted from Cloudinary:', result);
                    }
                });
            }
    
            const deleteCategory = await Category.findByIdAndDelete(args.input.categoryId);
            if (!deleteCategory) {
                return {
                    message: 'Category not found or already deleted',
                };
            }

            return {
                username: user.username,
                message: 'Category deleted successfully',
            };
        } catch (error) {
            console.error('Error in categoryDELETE:', error.message);
            return {
                message: `Error: ${error.message}`,
            };
        }
    }
    
}
module.exports = resolvers;
