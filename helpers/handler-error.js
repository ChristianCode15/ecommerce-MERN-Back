

function errorHandler(err, req, res, next) {
    if(err.name === 'UnauthorizedError') {
        //Error de autentiacion jtw
        return res.status(401).json({message: 'El usuario no esta autorizado'});
    }

    if( err.name === 'ValidationError') {
        //Error de validacion
        return res.status(401).json({message: err});
    }

    //Error 500 de server por defecto
    return res.status(500).json(err);
}

module.exports = errorHandler;