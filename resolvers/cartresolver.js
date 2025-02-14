const { Product } = require('../models/Product');
const {verifyTokenModerator,GetidfromToken} = require('../helpers/verify')
const  Cart  = require('../models/Cart');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();



const resolvers = {
    cartcreate: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req);
    
            let { ProductList } = args.input;
    
            // Check if the product exists
            const checkproduct = await Product.findById(ProductList.Productid);
            if (!checkproduct) {
                return { message: "Product not found" };
            }
    
            // Wrap into an array if not already
            if (!Array.isArray(ProductList)) {
                ProductList = [ProductList];
            }
    
            // Map and calculate `sum` for each product
            ProductList = ProductList.map((product) => ({
                Productid: new mongoose.Types.ObjectId(product.Productid),
                quantityselect: product.quantityselect || 1,
                sum: checkproduct.Price * (product.quantityselect || 1), // Calculate dynamically here
                color: product.color || "defaultColor",
                size: product.size || "defaultSize",
            }));
    
            let userCart = await Cart.findOne({ userid: user._id })
            .populate('ProductList.Productid') // Populate product details
            .populate('userid'); // Populate user details
            
            if (userCart) {
                ProductList.forEach((newProduct) => {
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
    
                // Recalculate the total
                userCart.total = userCart.ProductList.reduce((acc, p) => acc + p.sum, 0);
                await userCart.save();
    
                return {
                    cart: userCart,
                    message: "Product(s) added to the existing cart successfully.",
                };
            } else {
                const newCart = new Cart({
                    userid: user._id,
                    ProductList,
                    total: ProductList.reduce((acc, p) => acc + p.sum, 0),
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
    },
    DeleteProductfromcart: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req); // Extract user ID from token
    
            // Find the cart and check if the product exists
            const cart = await Cart.findOne({ userid: user._id });
    
            if (!cart) {
                throw new Error("Cart not found.");
            }
    
            const productIndex = cart.ProductList.findIndex(
                (p) => p.Productid.toString() === args.input.Productid
            );
    
            if (productIndex === -1) {
                throw new Error("Product not found in cart.");
            }
    
            // Use `new mongoose.Types.ObjectId` if needed
            const productId = new mongoose.Types.ObjectId(args.input.Productid);
    
            // Remove the product
            const updatedCart = await Cart.findOneAndUpdate(
                { userid: user._id },
                { $pull: { ProductList: { Productid: productId } } },
                { new: true }
            ).populate('ProductList.Productid');
    
            // Recalculate total
            updatedCart.total = updatedCart.ProductList.reduce((sum, p) => sum + p.sum, 0);
            await updatedCart.save();
    
            return {
                cart: updatedCart,
                message: "Product deleted from cart successfully.",
            };
        } catch (error) {
            console.error("Error in DeleteProductfromcart:", error.message);
            throw new Error("Failed to delete product from cart.");
        }
    }
    


}

module.exports = resolvers;