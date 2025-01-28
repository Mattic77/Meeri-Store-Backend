const Joi = require('joi');
const { string } = require('joi');
const mongoose = require('mongoose'); 
const { ENUM } = require('sequelize');
const { INTEGER } = require('sequelize');
const { STRING } = require('sequelize');


const wishlistschema = new mongoose.Schema({
    product: {  // Changed to match the GraphQL schema
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    user: {  // Changed to match the GraphQL schema
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
}, {
    timestamps: true
});

const WishList = mongoose.model("Wishlist", wishlistschema);

const validateWishlist = Joi.object({
    user: Joi.string().required(),  // Changed to match Mongoose schema field names
    product: Joi.string().required()  // Changed to match Mongoose schema field names
});

module.exports = { WishList, validateWishlist };