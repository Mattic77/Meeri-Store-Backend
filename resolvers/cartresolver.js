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
    cartGETByuser: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req); 
            const cart = await Cart.find({ userid: user._id })
                .populate('userid') 
                .populate('ProductList.Productid'); 
    
            if (cart && cart.length > 0) {
                // Transform the cart data to match the GraphQL schema
                const transformedCart = cart.map(cartItem => ({
                    _id: cartItem._id.toString(),
                    ProductList: cartItem.ProductList.map(productInfo => ({
                        Productid: {
                            _id: productInfo.Productid._id.toString(),
                            name: productInfo.Productid.name,
                            description: productInfo.Productid.description,
                            Price: productInfo.Productid.Price,
                        },
                        quantityselect: productInfo.quantityselect,
                        sum: productInfo.sum,
                    })),
                    userid: {
                        username: cartItem.userid.username,
                        email: cartItem.userid.email,
                        firstname: cartItem.userid.firstname,
                        lastname: cartItem.userid.lastname,
                    },
                    total: cartItem.total,
                }));
    
                return transformedCart[0]; // Return the transformed cart
            } else {
                throw new Error("Cart not found");
            }
        } catch (error) {
            console.error("Error in cartGETByuser:", error.message);
            throw new Error("Failed to get cart.");
        }
    }
    

}

module.exports = resolvers;