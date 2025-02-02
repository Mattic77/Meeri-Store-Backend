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
            type response {
            product: [Product]
            message: String
        }

    type Query {
      
      productGETById(_id :String) : Product
       productGET: [Product] 
       productGETBycategory(_id :String):response
    }


    `)
    const POSTschemma = buildSchema(`
        type Productsize {
            size: String
            stock: Int
        }
        input inputproductsize {
            size: String
            stock: Int
        }
        type Productdetail {
            color: String
            sizes: [Productsize]
        }
        input inputProductdetail {
            color: String
            sizes: [inputproductsize]
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
        input productinput {
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
            productdetail: [inputProductdetail]
        }
        input ProductUpdateInput {
            _id: ID!
            updates: ProductUpdateFields!
        }
        input ProductUpdateFields {
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
            productdetail: [inputProductdetail]
        }
        input deleteinput {
            productId: String
            token: String
            password: String
        }
        type response {
            product: Product
            message: String
        }
        type Query {
            _empty: String
        }
        type Mutation {
            productUpdate(input: ProductUpdateInput): response
            productCreate(input: productinput): response
            productDELETE(input: deleteinput): response
        }
    `);
    

    module.exports = {GETschemma,POSTschemma};
