const { Product } = require('../models/Product');
const {verifyTokenModerator,GetidfromToken} = require('../helpers/verify')
const { Cart } = require('../models/Cart');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('../models/User');



const resolvers = {
    cartcreate: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req);

            const { input } = args;
            const { ProductList } = input;
            let userCart = await Cart.findOne({ userid: user._id });

            if (userCart) {
                ProductList.forEach((newProduct) => {
                    const existingProduct = userCart.ProductList.find(
                        (p) => p.Productid.toString() === newProduct.Productid
                    );

                    if (existingProduct) {
                        existingProduct.quantityselect += newProduct.quantityselect;
                        existingProduct.sum += newProduct.sum;
                    } else {
                        userCart.ProductList.push(newProduct);
                    }
                });

                userCart.total = userCart.ProductList.reduce(
                    (acc, p) => acc + p.sum,
                    0
                );

                // Save the updated cart
                console.log(userCart)
                await userCart.save();

                return {
                    cart: userCart, 
                    message: "Product(s) added to the existing cart successfully.",
                };
            } else {
                // If no cart exists, create a new cart for the user
                const newCart = new Cart({
                    userid: user._id,
                    ProductList,
                    total: ProductList.reduce((acc, p) => acc + p.sum, 0),
                });

                // Save the new cart
                await newCart.save();
                console.log(newCart);
                return {
                    cart : newCart,
                    message: "New cart created successfully.",
                };
            }
        } catch (error) {
            console.error("Error in cartcreate:", error.message);
            throw new Error("Failed to create or update cart.");
        }
    },

}

module.exports = resolvers;