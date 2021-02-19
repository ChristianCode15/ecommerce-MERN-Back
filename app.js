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
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(authJwt());
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
})

app.listen( 3000, () => {
    console.log(api);
    console.log('Estoy usando el puerto 3000');
});