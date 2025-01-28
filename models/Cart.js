const Joi = require('joi');
const { string } = require('joi');
const mongoose = require('mongoose'); 
const { ENUM } = require('sequelize');
const { INTEGER } = require('sequelize');
const { STRING } = require('sequelize');
const productinfo = new mongoose.Schema({
    Productid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantityselect :{
        type: Number,
        required: true
    },
    sum :{
        type: Number,
        required: true
    }
})

const cartschema = new mongoose.Schema({
    ProductList :[productinfo],
    userid :{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required: true
    },total :{
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});
const validateCart = Joi.object({
    userid: Joi.string().required(),
    ProductList: Joi.array().items(
        Joi.object({
            Productid: Joi.string().required(),
            quantityselect: Joi.number().required(),
            sum: Joi.number().required()  
 
        })
    ).required
});
const Cart = mongoose.model("Cart", cartschema);
module.exports = { Cart ,validateCart};
