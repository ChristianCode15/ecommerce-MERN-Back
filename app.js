const express = require('express');
const app = express();
const  bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv/config');
const authJwt = require('./helpers/jwt');
const errorHandler = require('./helpers/handler-error');

app.use(cors());
app.options('*', cors());

//Middleware
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt());
app.use('/public/images', express.static(__dirname + '/public/images'));//Lo uso para poder acceder a mi carpeta publica
app.use(errorHandler);

const api = process.env.API_URL;
//Routers
const productsRouter = require('./routers/products');
const categoriesRouter = require('./routers/categories');
const ordersRoutes = require('./routers/orders');
const usersRoutes = require('./routers/users');

app.use(`${api}/products`, productsRouter);
app.use( `${api}/categories`, categoriesRouter);
app.use( `${api}/orders`, ordersRoutes);
app.use( `${api}/users`, usersRoutes);

mongoose.connect(process.env.CONECCTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'db_ecommerce'
})
.then(() => {
    console.log('Database conecction succesful');
})
.catch((err) => {
    console.log(err);
});

const server = app.listen(process.env.PORT || 3000, function() {
    const port = server.address().port;
    console.log('Funcionando Exp. en el puerto' + port);
})