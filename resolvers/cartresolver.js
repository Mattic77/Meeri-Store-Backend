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
    
            // Wrap into an array if not already
            if (!Array.isArray(ProductList)) {
                ProductList = [ProductList];
            }
    
            // Fetch the user's cart
            let userCart = await Cart.findOne({ userid: user._id })
                .populate('ProductList') // Populate product details
                .populate('userid'); // Populate user details
    
            // Process each product in the input
            for (const product of ProductList) {
                // Check if the product exists in the database
                const checkproduct = await Product.findById(product.Productid);
                if (!checkproduct) {
                    return { message: `Product with ID ${product.Productid} not found` };
                }
    
                // Prepare the new product data
                const newProduct = {
                    Productid: new mongoose.Types.ObjectId(product.Productid),
                    quantityselect: product.quantityselect || 1,
                    sum: checkproduct.Price * (product.quantityselect || 1), // Calculate dynamically here
                    color: product.color || "defaultColor",
                    size: product.size || "defaultSize",
                };
    
                if (userCart) {
                    // Check if the product already exists in the cart
                    const existingProduct = userCart.ProductList.find(
                        (p) =>
                            p.Productid.toString() === newProduct.Productid.toString() &&
                            p.color === newProduct.color &&
                            p.size === newProduct.size
                    );
    
                    if (existingProduct) {
                        // Increment the quantity and update the sum
                        existingProduct.quantityselect += newProduct.quantityselect;
                        existingProduct.sum += newProduct.sum;
                    } else {
                        // Add as a new product if it doesn't already exist
                        userCart.ProductList.push(newProduct);
                    }
                } else {
                    // Create a new cart if it doesn't exist
                    userCart = new Cart({
                        userid: user._id,
                        ProductList: [newProduct],
                        total: newProduct.sum,
                    });
                }
            }
    
            // Recalculate the total for the cart
            if (userCart) {
                userCart.total = userCart.ProductList.reduce((acc, p) => acc + p.sum, 0);
                await userCart.save();
            }
    
            return {
                cart: userCart,
                message: userCart ? "Product(s) added to the cart successfully." : "New cart created successfully.",
            };
        } catch (error) {
            console.error("Error in cartcreate:", error.message, error);
            throw new Error("Failed to create or update cart.");
        }
    },
    
    cartGETByuser: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req); 
            const cart = await Cart.find({ userid: user._id })
                .populate({
                    path: 'userid',
                    select: '_id username' // Only return _id and username
                })
                .populate('ProductList.Productid'); // keep full product info for now

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
                            images: productInfo.Productid.images?.length > 0  ? [productInfo.Productid.images[0]] : []    ,  },                 
                             size : productInfo.size,
                              color : productInfo.color,
                              quantityselect: productInfo.quantityselect,
                        sum: productInfo.sum,
                    })),
                    userid: {
                        username: cartItem.userid.username,
                        email: cartItem.userid.email,
                        firstname: cartItem.userid.firstname,
                        lastname: cartItem.userid.lastname,
                        wilaya :cartItem.userid.wilaya,
                        commune : cartItem.userid.commune,
                        phonenumber: cartItem.userid.phonenumber,
                        adress : cartItem.userid.adress
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
    },
    incrementquantity: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req);
    
            const { Productid, color, size } = args.input;
    
            // Find the user's cart and populate ProductList.Productid
            const userCart = await Cart.findOne({ userid: user._id })
                .populate({
                    path: 'ProductList.Productid', 
                    model: 'Product', 
                })
                .populate('userid'); 
    
            if (!userCart) {
                return { message: "Cart not found for the user." };
            }
    
            // Find the product in the cart
            const productInCart = userCart.ProductList.find(
                (p) =>
                    p.Productid._id.toString() === Productid && // Use p.Productid._id to match
                    p.color === color &&
                    p.size === size
            );
    
            if (!productInCart) {
                return { message: "Product not found in the cart." };
            }
    
            // Fetch the product details from the database to get the latest price
            const product = await Product.findById(Productid);
            if (!product) {
                return { message: "Product not found in the database." };
            }
    
            // Increment the quantity by 1
            productInCart.quantityselect += 1;
    
            // Recalculate the sum for the product
            productInCart.sum = product.Price * productInCart.quantityselect;
    
            // Recalculate the total for the cart
            userCart.total = userCart.ProductList.reduce((acc, p) => acc + p.sum, 0);
    
            // Save the updated cart
            await userCart.save();
    
            return {
                cart: userCart,
                message: "Product quantity incremented successfully.",
            };
        } catch (error) {
            console.error("Error in incrementquantity:", error.message, error);
            throw new Error("Failed to increment product quantity.");
        }
    },
    discrementquantity: async (args, context) => {
        try {
            const user = await GetidfromToken(context.req);
    
            const { Productid, color, size } = args.input;
    
            // Find the user's cart and populate ProductList.Productid
            const userCart = await Cart.findOne({ userid: user._id })
                .populate({
                    path: 'ProductList.Productid', // Populate the Productid field in ProductList
                    model: 'Product', // Specify the model to populate from
                })
                .populate('userid'); // Populate user details
    
            if (!userCart) {
                return { message: "Cart not found for the user." };
            }
    
            // Find the product in the cart
            const productInCart = userCart.ProductList.find(
                (p) =>
                    p.Productid._id.toString() === Productid && // Use p.Productid._id.toString()
                    p.color === color &&
                    p.size === size
            );
    
            if (!productInCart) {
                return { message: "Product not found in the cart." };
            }
    
            // Fetch the product details from the database to get the latest price
            const product = await Product.findById(Productid);
            if (!product) {
                return { message: "Product not found in the database." };
            }
    
            // Decrement the quantity by 1
            productInCart.quantityselect -= 1;
    
            // If quantity reaches 0, remove the product from the cart
            if (productInCart.quantityselect <= 0) {
                userCart.ProductList = userCart.ProductList.filter(
                    (p) =>
                        p.Productid._id.toString() !== Productid || // Use p.Productid._id.toString()
                        p.color !== color ||
                        p.size !== size
                );
            } else {
                // Recalculate the sum for the product
                productInCart.sum = product.Price * productInCart.quantityselect;
            }
    
            // Recalculate the total for the cart
            userCart.total = userCart.ProductList.reduce((acc, p) => acc + p.sum, 0);
    
            // Save the updated cart
            await userCart.save();
    
            // Fetch the updated cart with populated fields
            const lastupdatecart = await Cart.findOne({ userid: user._id })
                .populate('userid') // Populate user details
                .populate('ProductList.Productid'); // Populate product details in ProductList
    
            return {
                cart: lastupdatecart,
                message: productInCart.quantityselect <= 0
                    ? "Product removed from the cart."
                    : "Product quantity decremented successfully.",
            };
        } catch (error) {
            console.error("Error in discrementquantity:", error.message, error);
            throw new Error("Failed to decrement product quantity.");
        }
    },
    Deletecartuser: async (args,context )=>{
        try {
            const user = await GetidfromToken(context.req);
            const cart = await Cart.findOneAndDelete({ userid: user._id });
            if (!cart) {
                throw new Error("Cart not found.");
            }
            return { message: "Cart deleted successfully." };
        } catch (error) {
            console.error("Error in Deletecartuser:", error.message);
            throw new Error("Failed to delete cart.");
        }
    }


}

module.exports = resolvers;