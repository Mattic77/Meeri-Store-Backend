const { expressjwt: jwt } = require("express-jwt");

function auth_jwt() {
    const secret = process.env.JWT_SECRET;

    return jwt({
        secret,
        algorithms: ['HS256'],
        isRevoked : isRevoked
    }).unless({
       
            path: [
                { url: /\/StoreAPI\/users/, methods: ['GET', 'POST','DELETE'] },
                { url: /\/StoreAPI\/products/, methods: ['GET','POST'] },
                { url: /\/StoreAPI\/categories/, methods: ['GET','POST'] },
                { url: /\/StoreAPI\/orders/, methods: ['POST', 'GET'] },
                { url: /\/StoreAPI\/wishlists/, methods: ['GET', 'POST'] },
            ],

    });
}
async function isRevoked(req, token) {
    if (!token.payload.isAdmin) {
        return true; 
    }
    return false;
}

module.exports = auth_jwt;
