const { buildSchema } = require("graphql");

const GETschemma = buildSchema(`

        type Productsize{
    size : String
    stock : Int
    }
    

    type Productdetail{
    color : String
    sizes: [Productsize]

    }
    type Product{
        _id :String
        name: String
        description: String
        richDescription: String
        images: [String]
        brand: String
        Price: Int
        category:String
        CountINStock:Int
        rating: Int
        IsFeatured: Boolean
        productdetail: [Productdetail]
    }
    
    type User {
        username : String
        email: String
        firstname: String
        lastname: String
    }
    type productinfo {
        Productid : Product
        quantityselect: Int
        sum : Int
        color : String
        size : String
    }
    type cart {
        _id : ID
        ProductList : [productinfo]
        userid : User
        total : Int
    }
    type Query {
        cartGETByuser : cart
        cartlistGET: [cart]
    }
`);

const POSTschemma = buildSchema(`
        type Productsize{
    size : String
    stock : Int
    }
    

    type Productdetail{
    color : String
    sizes: [Productsize]

    }
    type Product{
        _id :String
        name: String
        description: String
        richDescription: String
        images: [String]
        brand: String
        Price: Int
        category:String
        CountINStock:Int
        rating: Int
        IsFeatured: Boolean
        productdetail: [Productdetail]
    }
    
    type User {
        username : String
        email: String
        firstname: String
        lastname: String
    }
    type productinfo {
        Productid : Product
        quantityselect: Int
        sum : Int
        color : String
        size : String
    }
    type cart {
        _id : ID
        ProductList : [productinfo]
        userid : User
        total : Int
    }
    input productinfoInput {
        Productid: ID!
        quantityselect: Int!
        color: String!
        size: String!
    }
    input deleteproduct{
    Productid: ID!
    }

    input inputcart {
        ProductList: productinfoInput! # Accepts a single product
    }
    input incrementinput{
            Productid: ID
            color :String
            size :String    


    }
    type Query {
            _empty : String
        }
    type responsedelte {
    message: String
    }        
    type Response {
        cart: cart
        message: String
    }
    type Mutation {
        cartcreate(input: inputcart): Response
        DeleteProductfromcart(input:deleteproduct) :Response
        incrementquantity(input : incrementinput):Response
        discrementquantity(input : incrementinput):Response


    }
`);

module.exports = { GETschemma, POSTschemma };