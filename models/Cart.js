const Joi = require('joi');
const mongoose = require('mongoose'); 
const productInfoSchema = new mongoose.Schema({
    Productid: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantityselect: {
        type: Number,
        required: true
    },
    sum: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    size: {
        type: String,
        required: true
    }
});

const cartSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ProductList: [productInfoSchema],
    total: {
        type: Number,
        default: 0
    }
});

const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;

