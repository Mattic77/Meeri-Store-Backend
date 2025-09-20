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
const fs = require('fs');
const path = require('path');
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
  const deliveryFilePath = path.join(__dirname, '../Data/delivery.json');
  
  // Read the JSON file
  let deliveryData;
  try {
    const rawData = fs.readFileSync(deliveryFilePath);
     deliveryData = JSON.parse(rawData);
   } catch (err) {
    console.error('Error reading delivery.json:', err);
    process.exit(1); 
   }
  const getDeliveryPricesByWilaya = (wilayaName) => {
    if (!wilayaName || typeof wilayaName !== 'string') {
        return null;
    }

    const wilayaData = deliveryData.delivery_prices.find(
        w => w.wilaya === wilayaName
    );

    if (!wilayaData) {
        return null;
    }

    return {
        a_domicile: wilayaData.a_domicile || 0,
        stop_desk: wilayaData.stop_desk || 0
    };
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

        // Import missing? Add at top of file:
        // const fs = require('fs');
        // const path = require('path');

        // 1. Fetch products
        const productIds = orderitems.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds } }).session(session);

        // 2. Calculate totals
        let totalQuantity = 0;
        let totalPrice = 0;
        const orderItemsData = [];

        // 3. Validate stock
        for (const item of orderitems) {
            const quantity = Number(item.quantity);
            const product = products.find(p => p._id.equals(item.product));
            
            if (!product) throw new Error(`Product ${item.product} not found`);

            const productDetail = product.productdetail.find(pd => pd.color === item.color);
            if (!productDetail) throw new Error(`Color ${item.color} not available`);

            const sizeObj = productDetail.sizes.find(s => s.size === item.size);
            if (!sizeObj) throw new Error(`Size ${item.size} not available`);

            if (sizeObj.stock < quantity) throw new Error(`Insufficient stock`);

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
            console.log(args.input.livprice )
            // 4. Validate delivery price
            const wilayaToUse = userT.wilaya || args.input.wilaya; // ✅ Fallback sur input

            if (!wilayaToUse) {
                throw new Error("Wilaya is required to calculate delivery price");
            }

            const deliveryPrices = getDeliveryPricesByWilaya(wilayaToUse);

            if (!deliveryPrices) {
                throw new Error(`Delivery prices not found for wilaya: ${wilayaToUse}`);
            }

            const validDeliveryPrices = [deliveryPrices.a_domicile, deliveryPrices.stop_desk];

            console.log("Delivery prices for", wilayaToUse, ":", deliveryPrices);

            if (!validDeliveryPrices.includes(args.input.livprice)) {
                throw new Error(`Invalid delivery price. Expected one of: ${validDeliveryPrices.join(', ')}`);
}

        // 5. Set delivery type
        let adomicile = null;
        if (args.input.livprice === deliveryPrices.a_domicile) {
            adomicile = true;
        } else if (args.input.livprice === deliveryPrices.stop_desk) {
            adomicile = false;
        }

        // 6. Update stock
        for (const item of orderitems) {
            const product = products.find(p => p._id.equals(item.product));
            const quantity = Number(item.quantity);

            const productDetail = product.productdetail.find(pd => pd.color === item.color);
            const sizeObj = productDetail.sizes.find(s => s.size === item.size);
            sizeObj.stock -= quantity;
        }

        // Save all products at once
        await Promise.all(products.map(p => p.save({ session })));

        // 7. Create order
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
            adomicile: adomicile
        });

        const savedOrder = await order.save({ session });
        await session.commitTransaction();

        // 8. Send email
        const userF = await User.findById(userT._id);
        const orderDetails = orderitems.map(item => {
            const product = products.find(p => p._id.equals(item.product));
            return {
                productName: product?.name || 'Unknown',
                quantity: item.quantity,
                price: product?.Price || 0,
                color: item.color,
                size: item.size,
            };
        });

        await sendOrderEmail({
            idorder: orderId,
            recipient: userF.email,
            name: userF.username,
            orderDetails,
            productTotal: totalPrice,
            deliveryFee: args.input.livprice,
            grandTotal: totalPrice + (args.input.livprice || 0),
        });

        console.log(`✅ Order created: ${orderId} for ${userF.username}`);

        return {
            user: userF,
            orderitems: orderItemsData,
            order: savedOrder,
            message: 'Order saved successfully',
        };

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Order creation failed:', error.message);
        throw new Error(`Order creation failed: ${error.message}`);
    } finally {
        session.endSession();
    }
},
createOrderAnonym: async (args, context) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const orderitems = args.input.orderitems;

        // 1. Fetch products
        const productIds = orderitems.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds } }).session(session);

        // 2. Calculate totals
        let totalQuantity = 0;
        let totalPrice = 0;
        const orderItemsData = [];

        // 3. Validate stock
        for (const item of orderitems) {
            const quantity = Number(item.quantity);
            const product = products.find(p => p._id.equals(item.product));
            
            if (!product) throw new Error(`Product ${item.product} not found`);

            const productDetail = product.productdetail.find(pd => pd.color === item.color);
            if (!productDetail) throw new Error(`Color ${item.color} not available`);

            const sizeObj = productDetail.sizes.find(s => s.size === item.size);
            if (!sizeObj) throw new Error(`Size ${item.size} not available`);

            if (sizeObj.stock < quantity) throw new Error(`Insufficient stock`);

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

        // 4. Validate delivery price
        const wilayaToUse = args.input.wilaya;

        if (!wilayaToUse) {
            throw new Error("Wilaya is required to calculate delivery price");
        }

        const deliveryPrices = getDeliveryPricesByWilaya(wilayaToUse);

        if (!deliveryPrices) {
            throw new Error(`Delivery prices not found for wilaya: ${wilayaToUse}`);
        }

        const validDeliveryPrices = [deliveryPrices.a_domicile, deliveryPrices.stop_desk];

        if (!validDeliveryPrices.includes(args.input.livprice)) {
            throw new Error(`Invalid delivery price. Expected one of: ${validDeliveryPrices.join(', ')}`);
        }

        // 5. Set delivery type
        let adomicile;
        if (args.input.livprice === deliveryPrices.a_domicile) {
            adomicile = true;
        } else if (args.input.livprice === deliveryPrices.stop_desk) {
            adomicile = false;
        } else {
            throw new Error(`Unable to determine delivery type for price: ${args.input.livprice}`);
        }

        // 6. Update stock (all at once)
        for (const item of orderitems) {
            const product = products.find(p => p._id.equals(item.product));
            const quantity = Number(item.quantity);

            const productDetail = product.productdetail.find(pd => pd.color === item.color);
            const sizeObj = productDetail.sizes.find(s => s.size === item.size);
            sizeObj.stock -= quantity;
        }

        await Promise.all(products.map(p => p.save({ session })));

        // 7. Create order
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
            adomicile: adomicile, // ✅ Maintenant sauvegardé
        });

        const savedOrder = await order.save({ session });
        await session.commitTransaction();

        // 8. (Optionnel) Send email to customer
        // Si vous voulez envoyer un email à l'utilisateur anonyme :
        /*
        await sendOrderEmail({
            idorder: orderId,
            recipient: args.input.email,
            name: `${args.input.firstname} ${args.input.lastname}`,
            orderDetails: orderitems.map(item => {
                const product = products.find(p => p._id.equals(item.product));
                return {
                    productName: product?.name || 'Unknown',
                    quantity: item.quantity,
                    price: product?.Price || 0,
                    color: item.color,
                    size: item.size,
                };
            }),
            productTotal: totalPrice,
            deliveryFee: args.input.livprice,
            grandTotal: totalPrice + (args.input.livprice || 0),
        });
        */

        console.log(`✅ Anonymous order created: ${orderId} for ${args.input.email}`);

        return {
            orderitems: orderItemsData,
            order: savedOrder,
            message: 'Order saved successfully',
        };

    } catch (error) {
        await session.abortTransaction();
        console.error('❌ Anonymous order creation failed:', error.message);
        throw new Error(`Order creation failed: ${error.message}`);
    } finally {
        session.endSession();
    }
},
      
      
      
    
    orderDELETE: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req); 
            const order = await Order.findById(args.input._id);  
            const isPasswordValid = await bcrypt.compare(args.input.password, user.passwordhash);
                        if (!isPasswordValid) {
                            return {
                                message: 'Invalid password',
                            };
                        }
            if (!order) {
                return {
                    message: 'Order not found',
                };
            }
    
            // Check if the order's status is 'pending'
            if (order.status !== "en cours de confirmation") {
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
