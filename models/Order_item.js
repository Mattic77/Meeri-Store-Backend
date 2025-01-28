// Order_item.js
const mongoose = require('mongoose');
const { Product } = require('../models/Product');


const orderItemSchema = new mongoose.Schema({
    quantity: {
        type: Number,
        required: true
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    }
}, {
    timestamps: true
});

const OrderItem = mongoose.model('OrderItem', orderItemSchema);

module.exports = { OrderItem };
