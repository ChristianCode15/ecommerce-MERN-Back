const { Product } = require('../models/product');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');

//Filtro para obtener productos
router.get(`/`, async (req, res) => {
    //Localhost:3000/api/v1/products?categories=23334,2114, n..
    let filter = {};
    if(req.query.categories){
        filter = {category: req.query.categories.split(',')}
    }
    const productList = await Product.find(filter).populate('category');

    if(!productList){
        res.status(500).json({success: false})
    }
    res.send(productList);
});

//Obtener un producto mediante id
router.get(`/:id`, async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category');

    if(!product) {
        return res.status(500).json({success: false, message: 'No se a encontrado el producto'});
    }

    res.send(product);
})

//Agregar producto
router.post(`/`, async (req, res) => {
    const category = await Category.findById(req.body.category);
    if(!category) {
        return res.status(400).send('La categoria no existe');
    }

    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category ,
        countInStock: req.body.countInStock,
        raiting: req.body.raiting,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured,
    })

    product = await product.save();
    if(!product) {
        return res.status(500).send('No se pudo crear su producto');
    }

    res.send(product);

})

//Editar producto
router.put('/:id', async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Producto no encontrado');
    }
    const category = await Category.findById(req.body.category);
    if(!category) return res.status(400).send('Categoria invalida');
    
    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: req.body.image,
            brand: req.body.brand,
            price: req.body.price,
            category: req.body.category ,
            countInStock: req.body.countInStock,
            raiting: req.body.raiting,
            numReviews: req.body.numReviews,
            isFeatured: req.body.isFeatured,
        },
        {new: true}
    )
    
    if(!product) {
        return res.status(500).json({success: false, message: 'No se a encontrado el producto'});
    }

    res.send(product);
})

//Borrar producto
router.delete('/:id', (req, res) => {
    Product.findByIdAndDelete(req.params.id)
    .then( product => {
        if(product){
            return res.status(200).json({success: true, message: 'El producto a sido eliminada con exito'});
        } else {
            return res.status(404).json({success: false, message: 'No se ha encontrado el producto'});
        }
    })
    .catch( err => {
        return res.status(400).json({success: false, error: err});
    })
})

//Contador de productos existentes
router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments((count) => count);

    if(!productCount) {
        res.status(500).json({success: false});
    }

    res.send({
        productCount: productCount,
    });
})

//Producto destacado(featured)
router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const products = await Product.find({isFeatured: true}).limit(+count);

    if(!products) {
        res.status(500).json({success: false});
    }

    res.send(products);
})

module.exports = router;