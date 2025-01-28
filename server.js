const express = require('express');
const app = express();
const port = 3002;
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const auth_jwt = require('./helpers/jwt');
const products = require('./routes/products');
const users = require('./routes/users');
const orders = require('./routes/orders');
const categories = require('./routes/categories');
const wishlists = require('./routes/wishlists');
const carts = require('./routes/carts');
const path = require('path');


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const errorhandler = require('./helpers/error_hendler');
const API = process.env.API_URL ;
mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.log('The error is', error);
    });

app.use(cors());
app.use(express.json());
app.use(auth_jwt());
app.use(errorhandler);
app.use(`${API}/products`, products);
app.use(`${API}/users`, users);
app.use(`${API}/categories`, categories);
app.use(`${API}/orders`, orders);
app.use(`${API}/wishlists`, wishlists);
app.use(`${API}/carts`, carts);




app.listen(port, () => {
    console.log('Listening on port ' + port);
});
