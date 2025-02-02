const mongoose = require('mongoose');
const  {Order,Counter} = require('../models/Order');
const { OrderItem } = require('../models/Order_item'); 
const { Product } = require('../models/Product');
const {verifyTokenModerator,GetidfromToken} = require('../helpers/verify')
const moment = require('moment');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config();
const sendOrderEmail = require('../Email/Order/ordermail')
const sendUpdateOrderEmail =require('../Email/Order/updateordermail')
const incrementOrderId = async () => {
    const counter = await Counter.findOneAndUpdate(
      { name: 'orderId' },
      { $inc: { count: 1 } },
      { new: true, upsert: true }
    );
  
    // Generate a timestamp (e.g., YYYYMMDDHHmmss)
    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  
    // Optionally add a prefix (e.g., 'ORD')
    const prefix = 'ORD';
  
    // Optionally add a random alphanumeric string (e.g., 4 characters)
    const randomString = Math.random().toString(36).substring(2, 6).toUpperCase();
  
    // Concatenate elements to create a complex order ID
    const complexOrderId = `${prefix}-${timestamp}-${counter.count}-${randomString}`;
  
    return complexOrderId;
  };
  
const resolvers = {
    orderGET: async (args, context) => {
        try {
            const user = await verifyTokenModerator(context.req); 
     
            const Orderlist = await Order.find()
                .populate('user', 'username _id')
                .populate('orderitems', 'product quantity _id createdAt updatedAt');
     
            // Format the createdAt and updatedAt fields before returning
            Orderlist.forEach(order => {
                order.createdAt = moment(order.createdAt).format('YYYY-MM-DD');  // You can customize the format
                order.updatedAt = moment(order.updatedAt).format('YYYY-MM-DD');
                order.dateordered = moment(order.dateordered).format('YYYY-MM-DD');
            });
     
            return Orderlist; 
        } catch (error) {
            console.error('Error fetching orders:', error);
            return { message: error.message };
        }
     },
     createOrder: async (args, context) => {
        try {
          const userT = await GetidfromToken(context.req);
      
          // Extract order items from input args
          const orderitems = args.input.orderitems;
      
          // Fetch product details to calculate total price and quantity
          const productIds = orderitems.map(item => item.product);
          const products = await Product.find({ _id: { $in: productIds } });
      
          // Calculate total quantity and total price
          let totalQuantity = 0;
          let totalPrice = 0;
      
          const orderItemsData = orderitems.map(item => {
            const quantity = Number(item.quantity); // Convert to number
            totalQuantity += quantity;
      
            const product = products.find(p => p._id.equals(item.product));
            const price = product ? product.Price : 0;
            totalPrice += price * quantity;
      
            return {
              quantity,
              product: item.product,
            };
          });
      
          const orderId = await incrementOrderId();
          const order = new Order({
            orderitems: orderItemsData,
            adress: args.input.adress,
            city: args.input.city,
            postalcode: args.input.postalcode,
            phonenumber: args.input.phonenumber,
            status: 'en cours de confirmation',
            totalprice: totalPrice,
            quantityOrder: totalQuantity,
            user: userT._id,
            idorder: orderId,
          });
      
          // Save the order
          const savedOrder = await order.save();
      
          if (!savedOrder) {
            return {
              message: 'The order cannot be created',
            };
          }
      
          const userF = await User.findById(userT._id);
          // Construct orderDetails using products data
          const orderDetails = orderitems.map((item) => {
            const product = products.find(p => p._id.equals(item.product));
            return {
              productName: product ? product.name : 'Unknown Product',
              quantity: item.quantity,
              price: product ? product.Price : 0,
            };
          });
      
          // Send order confirmation email
          await sendOrderEmail({
            idorder: orderId,
            recipient: userF.email,
            name: userF.username,
            orderDetails, // Pass the orderDetails array
            totalPrice,
          });
      
          return { 
             user  : userF,
             orderitems : orderItemsData,
             order: savedOrder,
             message: 'Order saved successfully' };
        } catch (error) {
          console.error('Error creating order:', error);
          throw new Error('An error occurred while creating the order.');
        }
      },
      
      
    
    orderDELETE: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req); 
            const order = await Order.findById(args.input._id);  // Find the order by its ID
            
            if (!order) {
                return {
                    message: 'Order not found',
                };
            }
    
            // Check if the order's status is 'pending'
            if (order.status !== "pending") {
                return{
                    message: 'Cannot delete an order that is not pending'
                }
            }
    
            // Delete the order
            const deletedOrder = await Order.findByIdAndDelete(args.input._id);
            
            if (!deletedOrder) {
                return {
                    message: 'Order not found or already deleted',
                };
            }
    
            return {order :deletedOrder,
                message : 'Order deleted successfully'
            } 
    
        } catch (error) {
            console.error('Error in deleteOrder:', error.message);
            throw new Error('An error occurred while deleting the order.');
        }
    },
    updateOrderStatus: async (args, context) => {
        try {
            const user = await verifyTokenModerator(context.req); 
            const order = await Order.findById(args.input._id);  
    
            if (!order) {
                return {
                    message: 'Order not found',
                };
            }
    
            // Fetch the order items details
            const orderitemsData = await OrderItem.find({ _id: { $in: order.orderitems } });
            if (!orderitemsData.length) {
                return {
                    message: 'No valid order items found.',
                };
            }
    
            // Fetch product details to calculate the price
            const productIds = orderitemsData.map(item => item.product);
            const products = await Product.find({ _id: { $in: productIds } });
    
            // Calculate order details (product name, quantity, price)
            const orderDetails = orderitemsData.map(item => {
                const product = products.find(p => p._id.equals(item.product));
                return {
                    productName: product ? product.name : 'Unknown Product',
                    quantity: item.quantity,
                    price: product ? product.Price : 0,
                };
            });
    
            // Send email after updating the order status
            const orderupdated = await Order.findByIdAndUpdate(order._id, { status: args.input.status });
            const userF = await User.findById(user._id);
    
            await sendUpdateOrderEmail({
                orderid: order.idorder,  
                recipient: userF.email,
                name: userF.username,
                orderDetails: orderDetails, 
                totalPrice: order.totalPrice,  
                status: args.input.status,  
            });
            
    
            return {
                message: 'Order updated successfully',
            };
        } catch (error) {
            console.error('Error updating order status:', error);
            throw new Error('An error occurred while updating the order.');
        }
    },
    userorderGET : async(args,context)=>{
        try{
        const user = await GetidfromToken(context.req)
        const order = await Order.find({user: user._id})
        if(!order){
            return{
                message : 'No order found'
            }

        }
        return {
            order : order,
            message : 'Order fetched successfully'
         }   

    }catch(err){
        return {
            message : err.message
        }
    }
    }
    
}
module.exports = resolvers;