const Joi = require('joi');
const { string } = require('joi');
const mongoose = require('mongoose'); 
const { ENUM } = require('sequelize');
const { INTEGER } = require('sequelize');
const { STRING } = require('sequelize');
const orderItemSchema = new mongoose.Schema({
    quantity: {
        type: Number,
        required: true
    },
    product: {
        type: mongoose.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    color :{
      type: String,
      required: true,
    },
    size :{
      type: String,
      required: true,
    },
    priceproduct :{
      type: Number,
    }
}, {
    timestamps: true
});

const Orderschema = new mongoose.Schema({
    livprice :{
      type: Number,
    },
    firstname :{
      type: String,
      required:  false
    },
    lastname :{
      type: String,
      required:  false
    },
    email :{
      type: String,
      required:  false
    },
    idorder: {
      type: String,
      unique: true,
    },
    orderitems: {
      type: [orderItemSchema],
      required: true,
    },
    adress: {
      type: String,
      required: true,
    },
    wilaya: {
      type: String,
      required: true,
    },
    commune: {
      type: String,
      required: true,
    },
    phonenumber: {
      type: String,
    },
    status: {
      type: String,
      enum: ['en cours de confirmation', 'confirmé', 'en livraison', 'livré', 'annulé'],
      default: 'en cours de confirmation',
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
