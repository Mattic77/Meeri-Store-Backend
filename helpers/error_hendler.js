function errorHandler(err, req, res, next) {
    if (err.name) {
        res.status(500).json({message: err.name});
    } else {
        next();
    }
}

module.exports = errorHandler;
