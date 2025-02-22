const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Order } = require('../models/Order');
const { OrderItem } = require('../models/Order_item'); 
const { Product } = require('../models/Product');
const { createHandler } = require("graphql-http/lib/use/express");
const {GETschemma,POSTschemma} = require('../schemas/orderschema');
const resolvers = require('../resolvers/orderresolver')
const {verifyTokenModerator,GetidfromToken} = require('../helpers/verify')
const fs = require('fs'); 
const path = require('path'); 



router.get('/countorders', async (req, res) => {
    try {
        const user = await  verifyTokenModerator(req)
        const countorders = await Order.countDocuments();
        res.status(200).send({ success: true, count: countorders });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/countordersconfirm', async (req, res) => {
    try {
        const user = await  verifyTokenModerator(req)
        const countorders = await Order.countDocuments({status : "confirmé"});
        res.status(200).send({ success: true, count: countorders });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
router.get('/totalprice', async (req, res) => {
    try {
        const user = await verifyTokenModerator(req); // Verify if the user is authorized

        // Aggregate total price of all orders
        const totalPrice = await Order.aggregate([
            {
                $group: {
                    _id: null, // Group all documents together
                    total: { $sum: "$totalprice" }, // Sum the `totalprice` field
                }
            }
        ]);

        // Extract the total price value from the result
        const total = totalPrice.length > 0 ? totalPrice[0].total : 0;

        res.status(200).send({ success: true, totalPrice: total });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

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

router.get('/delivery', (req, res) => {
  // Combine delivery_prices and delivery_addresses into a single array
  const combinedData = deliveryData.delivery_prices.map(price => {
    const address = deliveryData.delivery_addresses.find(addr => addr.code === price.code);
    return {
      code: price.code,
      wilaya: price.wilaya,
      a_domicile: price.a_domicile,
      stop_desk: price.stop_desk,
      retour: price.retour,
      address: address ? address.address : null // Include address if found, otherwise null
    };
  });

  res.json(combinedData);
});


/**
 * @desc GET Product 
 * @method get
 * @route /api/products
 * @access public
 */
router.use('/orderGET', 
    (req, res) => {
    createHandler({
        schema: GETschemma,
        rootValue: resolvers,
        context: { req,res }
    })(req, res);}
 );

/**
 * @desc POST Product 
 * @method POST 
 * @route /api/products
 * @access public
 */
router.use(
    '/orderPOST',
    (req, res) => {
        createHandler({
            schema: POSTschemma,
            rootValue: resolvers,
            context: { req,res }, 
        })(req, res); 
    }
);
/**
 * @desc get  all orders
 * @method get
 * @route /api/orders
 * @access public
 */
router.get('/GetALLOrders', async (req, res) => {
    const Orderlist = await Order.find().populate('user','username -_id').populate('orderitems','product quantity -_id')
    if (!Orderlist) {
        return res.status(500).json({ success: false });
    }
    res.send(Orderlist);
});


/**
 * @desc create order
 * @method post
 * @route /api/orders
 * @access public
 */
router.post('/Createorder', async (req, res) => {
    try {
        // Create order items and return their ids
        const orderitemsids = await Promise.all(req.body.orderitems.map(async item => {
            // Convert quantity to Number
            const quantity = Number(item.quantity); // Convert to number

            let newOrderitem = new OrderItem({
                quantity: quantity,
                product: item.product,
            });
            newOrderitem = await newOrderitem.save();
            return newOrderitem._id;
        }));

        // Fetch order items to calculate total quantity and price
        const orderitems = await OrderItem.find({ _id: { $in: orderitemsids } });
        if (!orderitems.length) {
            return res.status(400).send('No valid order items created.');
        }

        // Fetch product details to calculate total price
        const productIds = orderitems.map(item => item.product);
        const products = await Product.find({ _id: { $in: productIds } });

        // Calculate total quantity and total price
        const totalQuantity = orderitems.reduce((total, item) => total + item.quantity, 0);
        const totalPrice = orderitems.reduce((total, item) => {
            const product = products.find(p => p._id.equals(item.product));
            if (product && product.Price) {
                return total + (product.Price * item.quantity); // Make sure product.Price is a number
            }
            return total; // If product not found, skip
        }, 0);

        // Create the order with total quantity and price
        let order = new Order({
            orderitems: orderitemsids,
            adress: req.body.adress,
            city: req.body.city,
            postalcode: req.body.postalcode,
            phonenumber: req.body.phonenumber,
            status: req.body.status,
            totalprice: totalPrice,
            quantityOrder: totalQuantity,
            user: req.body.user,
        });

        order = await order.save();

        if (!order) {
            return res.status(404).send('The order cannot be created');
        }

        res.send(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).send('An error occurred while creating the order.');
    }
});

    module.exports = router;
