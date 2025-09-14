const mongoose = require('mongoose');
const  {Order,Counter} = require('../models/Order');
const { OrderItem } = require('../models/Order_item'); 
const { Product } = require('../models/Product');
const {verifyTokenModerator,GetidfromToken} = require('../helpers/verify')
const moment = require('moment');
const User = require('../models/User');
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
    orderGET: async (args,context) => {
        try {
          const user = await verifyTokenModerator(context.req);
  
          const orders = await Order.find({})
          .populate('user')
          .populate('orderitems.product');
          

          
          return orders;
        } catch (error) {
          throw new Error('Error fetching orders: ' + error.message);
        }
      },
     createOrder: async (args, context) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const userT = await GetidfromToken(context.req);
        const orderitems = args.input.orderitems;

        // 1. Fetch products with session for transaction
        const productIds = orderitems.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds } }).session(session);

        // 2. Calculate totals and prepare order items
        let totalQuantity = 0;
        let totalPrice = 0;
        const orderItemsData = [];

        // 3. First pass: validate stock availability
        for (const item of orderitems) {
            const quantity = Number(item.quantity);
            const product = products.find(p => p._id.equals(item.product));
            
            if (!product) {
                throw new Error(`Product ${item.product} not found`);
            }

            // Find matching color and size
            const productDetail = product.productdetail.find(
                pd => pd.color === item.color
            );
            
            if (!productDetail) {
                throw new Error(`Color ${item.color} not available for product ${product.name}`);
            }

            const sizeObj = productDetail.sizes.find(
                s => s.size === item.size
            );
            
            if (!sizeObj) {
                throw new Error(`Size ${item.size} not available for product ${product.name}`);
            }

            if (sizeObj.stock < quantity) {
                throw new Error(`Insufficient stock for ${product.name} (${item.color}, ${item.size})`);
            }

            // Calculate price
            const price = product.Price * quantity;
            totalPrice += price;
            totalQuantity += quantity;

            orderItemsData.push({
                quantity,
                product: item.product,
                color: item.color,
                size: item.size,
                priceproduct: price
            });
        }

        // 4. Second pass: update stock
        for (const item of orderitems) {
            const product = products.find(p => p._id.equals(item.product));
            const quantity = Number(item.quantity);

            // Find and update the specific size stock
            const productDetail = product.productdetail.find(
                pd => pd.color === item.color
            );
            const sizeObj = productDetail.sizes.find(
                s => s.size === item.size
            );
            
            sizeObj.stock -= quantity;
            await product.save({ session });
        }

        // 5. Create the order
        const orderId = await incrementOrderId();
        const order = new Order({
            firstname: userT.firstname || args.input.firstname,
            lastname: userT.lastname || args.input.lastname,
            email: userT.email || args.input.email,
            orderitems: orderItemsData,
            adress: args.input.adress || userT.adress,
            wilaya: args.input.wilaya || userT.wilaya,
            commune: args.input.commune || userT.commune,
            phonenumber: args.input.phonenumber || userT.phonenumber,
            status: 'en cours de confirmation',
            totalprice: totalPrice + (args.input.livprice || 0),
            quantityOrder: totalQuantity,
            user: userT._id,
            idorder: orderId,
        });

        const savedOrder = await order.save({ session });

        // 6. Commit transaction
        await session.commitTransaction();

        // 7. Send email (outside transaction)
        const userF = await User.findById(userT._id);
        const orderDetails = orderitems.map((item) => {
            const product = products.find(p => p._id.equals(item.product));
            return {
                productName: product ? product.name : 'Unknown Product',
                quantity: item.quantity,
                price: product ? product.Price : 0,
                color: item.color,
                size: item.size,
            };
        });

        await sendOrderEmail({
            idorder: orderId,
            recipient: userF.email,
            name: userF.username,
            orderDetails,
            totalPrice,
        });

        return {
            user: userF,
            orderitems: orderItemsData,
            order: savedOrder,
            message: 'Order saved successfully',
        };

    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating order:', error);
        throw new Error(error.message || 'An error occurred while creating the order.');
    } finally {
        session.endSession();
    }
},
   createOrderAnonym: async (args, context) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const orderitems = args.input.orderitems;

        // 1. Fetch products with session for transaction
        const productIds = orderitems.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds } }).session(session);

        // 2. Calculate totals and prepare order items
        let totalQuantity = 0;
        let totalPrice = 0;
        const orderItemsData = [];

        // 3. First pass: validate stock availability
        for (const item of orderitems) {
            const quantity = Number(item.quantity);
            const product = products.find(p => p._id.equals(item.product));
            
            if (!product) {
                throw new Error(`Product ${item.product} not found`);
            }

            // Find matching color and size
            const productDetail = product.productdetail.find(
                pd => pd.color === item.color
            );
            
            if (!productDetail) {
                throw new Error(`Color ${item.color} not available for product ${product.name}`);
            }

            const sizeObj = productDetail.sizes.find(
                s => s.size === item.size
            );
            
            if (!sizeObj) {
                throw new Error(`Size ${item.size} not available for product ${product.name}`);
            }

            if (sizeObj.stock < quantity) {
                throw new Error(`Insufficient stock for ${product.name} (${item.color}, ${item.size})`);
            }

            // Calculate price
            const price = product.Price * quantity;
            totalPrice += price;
            totalQuantity += quantity;

            orderItemsData.push({
                quantity,
                product: item.product,
                color: item.color,
                size: item.size,
                priceproduct: price
            });
        }

        // 4. Second pass: update stock
        for (const item of orderitems) {
            const product = products.find(p => p._id.equals(item.product));
            const quantity = Number(item.quantity);

            // Find and update the specific size stock
            const productDetail = product.productdetail.find(
                pd => pd.color === item.color
            );
            const sizeObj = productDetail.sizes.find(
                s => s.size === item.size
            );
            
            sizeObj.stock -= quantity;
            await product.save({ session });
        }

        // 5. Create the order
        const orderId = await incrementOrderId();
        const order = new Order({
            firstname: args.input.firstname,
            lastname: args.input.lastname,
            email: args.input.email,
            orderitems: orderItemsData,
            adress: args.input.adress,
            wilaya: args.input.wilaya,
            commune: args.input.commune,
            phonenumber: args.input.phonenumber,
            status: 'en cours de confirmation',
            totalprice: totalPrice + (args.input.livprice || 0),
            quantityOrder: totalQuantity,
            idorder: orderId,
        });

        const savedOrder = await order.save({ session });

        // 6. Commit transaction
        await session.commitTransaction();

        return {
            orderitems: orderItemsData,
            order: savedOrder,
            message: 'Order saved successfully',
        };

    } catch (error) {
        await session.abortTransaction();
        console.error('Error creating anonymous order:', error);
        throw new Error(error.message || 'An error occurred while creating the order.');
    } finally {
        session.endSession();
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
        const order = await Order.find({user: user._id}).populate('user', 'username').populate('orderitems.product');
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
