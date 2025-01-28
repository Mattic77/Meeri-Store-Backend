const Joi = require('joi');
const { string } = require('joi');
const mongoose = require('mongoose'); 
const { ENUM } = require('sequelize');
const { INTEGER } = require('sequelize');
const { STRING } = require('sequelize');

const Orderschema = new mongoose.Schema({
    idorder: {
      type: Number,
      unique: true,
    },
    orderitems: [{
      type: mongoose.Types.ObjectId,
      ref: 'OrderItem',
      required: true,
    }],
    adress: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    postalcode: {
      type: String,
      required: true,
    },
    phonenumber: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    totalprice: {
      type: Number,
    },
    quantityOrder: {
      type: Number,
      default: 0,
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    dateordered: {
      type: Date,
      default: Date.now,
    },
  }, {
    timestamps: true,
  });
  

  const counterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    count: { type: Number, default: 0 },
  });
  
  const Counter = mongoose.model('Counter', counterSchema);

  
  const Order = mongoose.model('Order', Orderschema);
  
  module.exports = {Order,Counter};