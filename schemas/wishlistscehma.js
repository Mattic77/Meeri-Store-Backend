const { buildSchema } = require("graphql");

const GETschemma = buildSchema(`
    type Productsize {
        size: String
        stock: Int
    }

    type Productdetail {
        color: String
        sizes: [Productsize]
    }

    type Product {
        _id: String
        name: String
        description: String
        richDescription: String
        images: [String]
        brand: String
        Price: Int
        category: String
        CountINStock: Int
        rating: Int
        IsFeatured: Boolean
        productdetail: [Productdetail]
    }

    type User{
        username : String
        email: String
        }

    type wishlist {
        product: [Product]
        user: User
    }



    type Response {
        wishlist: wishlist
        message: String
    }

    type Query {
      wishlistGETByuser : Response
      wishlistGET: Response
        }
`);

const POSTschemma = buildSchema(`
    type Productsize {
        size: String
        stock: Int
    }

    type Productdetail {
        color: String
        sizes: [Productsize]
    }

    type Product {
        _id: String
        name: String
        description: String
        richDescription: String
        images: [String]
        brand: String
        Price: Int
        category: String
        CountINStock: Int
        rating: Int
        IsFeatured: Boolean
        productdetail: [Productdetail]
    }

    type User{
        username : String
        email: String
        }

    type wishlist {
        product: [Product]
        user: User
    }

    input inputWishlist {
        product: ID
        user: ID
    }
    input inputWishlistdelete{
        product: ID
    }    

    type Response {
        wishlist: wishlist
        message: String
    }

    type Query {
        _empty: String
    }

    type Mutation {
        wishlistcreate(input: inputWishlist): Response
        wishlistdeleteproduct(input: inputWishlist): Response

    }
`);

module.exports = { GETschemma, POSTschemma };
