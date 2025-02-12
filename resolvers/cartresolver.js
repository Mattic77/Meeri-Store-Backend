const { Product } = require('../models/Product');
const {verifyTokenModerator,GetidfromToken} = require('../helpers/verify')
const  Cart  = require('../models/Cart');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();



const resolvers = {
    cartcreate: async (args, context) => {
        try {
            console.log("Input args:", args);
            const user = await GetidfromToken(context.req);
    
            const { input } = args;
    
            // Validate and process ProductList
            if (!input.ProductList.every(product => product.size && product.color)) {
                throw new Error("All products must include `size` and `color`.");
            }
    
            input.ProductList = input.ProductList.map((product) => ({
                Productid: new mongoose.Types.ObjectId(product.Productid),
                quantityselect: product.quantityselect || 1,
                sum: product.sum || 0,
                color: product.color || "defaultColor",
                size: product.size || "defaultSize",
            }));
    
            console.log("Final ProductList before saving:", input.ProductList);
    
            let userCart = await Cart.findOne({ userid: user._id });
            if (userCart) {
                input.ProductList.forEach((newProduct) => {
                    const existingProduct = userCart.ProductList.find(
                        (p) => p.Productid.toString() === newProduct.Productid.toString()
                    );
    
                    if (existingProduct) {
                        existingProduct.quantityselect += newProduct.quantityselect;
                        existingProduct.sum += newProduct.sum;
                    } else {
                        userCart.ProductList.push(newProduct);
                    }
                });
    
                userCart.total = userCart.ProductList.reduce((acc, p) => acc + p.sum, 0);
                await userCart.save();
                return {
                    cart: userCart,
                    message: "Product(s) added to the existing cart successfully.",
                };
            } else {
                const newCart = new Cart({
                    userid: user._id,
                    ProductList: input.ProductList,
                    total: input.ProductList.reduce((acc, p) => acc + p.sum, 0),
                });
                await newCart.save();
                return {
                    cart: newCart,
                    message: "New cart created successfully.",
                };
            }
        } catch (error) {
            console.error("Error in cartcreate:", error.message, error);
            throw new Error("Failed to create or update cart.");
        }
    },
    
    
    
cartGETByuser: async (args, context) => {
    try {
        const user = await GetidfromToken(context.req); // Get user from the token
        const cart = await Cart.find({ userid: user._id })
            .populate('userid') // Populate user details
            .populate('ProductList.Productid'); // Populate product details in ProductList

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