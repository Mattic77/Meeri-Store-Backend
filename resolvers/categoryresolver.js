const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {Category} = require('../models/Category')
const {verifyTokenModerator} = require('../helpers/verify')

const mongoose = require('mongoose'); 
const dotenv = require('dotenv');

dotenv.config();

const resolvers = {


    CategoryGET: async () => {
        try {
            const categories = await Category.find();
            if (!categories) {
                return { success: false, message: 'No categories found.' };
            }
            return categories;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return { success: false, error: error.message };
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
            const iconUrl = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;

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
    categoryDELETE : async (args)=>{
        try {
            const user =await verifyTokenModerator(context.req)


            const deleteCategory = await Category.findByIdAndDelete(args.input.productId);
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
    },categoryDELETE: async ({ input }) => {
        const { categoryId, token, password } = input;
        try {
            const Vuser =await verifyTokenModerator(context.req)

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.user_id);

            const isMatch = await bcrypt.compare(password, user.passwordhash);
            if (!isMatch) {
                return { message: 'Password mismatch' };
            }
            const deletedCategory = await Category.findByIdAndDelete(categoryId);
            if (!deletedCategory) {
                return { message: 'Category not found or already deleted' };
            }
            return { category: deletedCategory, message: 'Category deleted successfully' };
        } catch (error) {
            console.error('Error in categoryDELETE:', error.message);
            return { message: `Error: ${error.message}` };
        }
    },
    
}
module.exports = resolvers;