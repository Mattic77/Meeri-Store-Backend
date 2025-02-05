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
        type productinfo{
        Productid : ID
        quantityselect: Int
        sum : Int

    }
    type User{
        username : String
        email: String
        }
    type cart {
        ProductList: [productinfo]
        userid: ID
        total: Int
    }

    input productinfoInput {
        Productid: ID
        quantityselect: Int
        sum: Int
    }

    input inputcart {
        ProductList: [productinfoInput]
    }

    type Query {
            _empty : String
        }
    type Response {
        cart: cart
        message: String
    }
    type Mutation {
        cartcreate(input: inputcart): Response
    }
`);

module.exports = { GETschemma, POSTschemma };