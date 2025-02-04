const Joi = require('joi');
const mongoose = require('mongoose'); 



const wishlistschema = new mongoose.Schema({
    product: [{  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }],
    
    user: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required : true
    }
}, {
    timestamps: true
});

const WishList = mongoose.model("Wishlist", wishlistschema);

const validateWishlist = Joi.object({
    user: Joi.string().required(), 
    product: Joi.array().items(Joi.string()).required()  
});

module.exports = { WishList, validateWishlist };