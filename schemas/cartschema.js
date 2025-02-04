const { buildSchema } = require("graphql");

const GETschemma = buildSchema(`
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
        ProductList : productinfo
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