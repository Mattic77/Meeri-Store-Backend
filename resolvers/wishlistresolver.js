const User = require('../models/User');
const { Product} = require('../models/Product');
const { WishList } = require('../models/Wishlist');
const {verifyTokenModerator,GetidfromToken} = require('../helpers/verify')
const mongoose = require('mongoose'); 
const dotenv = require('dotenv');
dotenv.config();



const resolvers = {
    wishlistGET:async (args,context)=>{
        try{
            const user =await GetidfromToken(context.req)
            const wishlistList =  await WishList.find().populate('user').populate('product');
            if(!wishlistList){
                return { success: false, message: 'No wishlist found.' }
            }    
            return wishlistList;           
            

        }catch(error){
            return { success: false, error: error.message }

        }

    },
    wishlistGETByuser:async(args,context)=>{
        try{
            const user =await GetidfromToken(context.req)
            const wishlist = await  WishList.findOne({ user: user._id }).populate('user').populate('product');

            if(!wishlist){
                return { success: false, message: 'Wishlist not found.' }
            }
            return wishlist;
        }catch(error){
            return { success: false, error: error.message }
        }
    },
    wishlistcreate: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req);
            const productT =await Product.findById(args.input.product)
            if (!productT) {
                return { success: false, message: 'Product not found' };
            }
            const wishlist = new WishList({
                user: user._id, 
                product: args.input.product,
            });

            // Save to the database
            const savedWishlist = await wishlist.save();
            const populatedWishlist = await WishList.findById(savedWishlist._id)
            .populate('user', 'username ').populate('product');
            return {
                wishlist: populatedWishlist,
                message: 'Wishlist created successfully!',
            };
        } catch (err) {
            // Return null and a message if error occurs
            return {
                wishlist: null,  
                message: `Server Error: ${err.message}`,
            };
        }
    }
};
module.exports =resolvers;