const { Product } = require('../models/product');
const express = require('express');
const { Category } = require('../models/category');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];//Valido tipo de archivo imaagen
        let uploadError = new Error('Tipo de imagen incorrecta, agregue imagen jpg,jpeg, png');

        if(isValid){
            uploadError = null
        }
      cb(null, 'public/images/') //callback, primer parametro para el error y el segundo el path(destino)
    },
    filename: function (req, file, cb) {
        //const fileName = file.originalname.split(' ').join('-');
        const extension = FILE_TYPE_MAP[file.mimetype];
      cb(null, `/${Date.now()}.${extension}`);
    }
  })
   
  const uploadOptions = multer({ storage: storage })

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
});

//Agregar producto
router.post(`/`, uploadOptions.single('image'), async (req, res) => {
    const category = await Category.findById(req.body.category);
    if(!category) {
        return res.status(400).send('La categoria no existe');
    }
    
    const file = req.file;
    if(!file) return res.status(400).send('Agregue imagen del producto');

    const fileName = req.file.filename;
    const basePath = `${req.protocol}://${req.get('host')}/public/images`;
    
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
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

});

//Editar producto
router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Id de producto incorrecto');
    }
    const category = await Category.findById(req.body.category);
    if(!category) return res.status(400).send('Categoria invalida');

    const product = await Product.findById(req.params.id);
    if(!product) return res.status(400).send('No es valido el producto');

    const file = req.file;
    let imagePath;

    if(file) {
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get('host')}/public/images`;
        let ref = product.image;
        fs.unlinkSync(ref.replace(`http://192.168.0.18:3000/`,''));//Agrego referencia para eliminar imagen de mi carpeta para que no se cumulen
        imagePath = `${basePath}${fileName}`;
    } else {
        imagePath = product.image;
    }
    
    const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            description: req.body.description,
            richDescription: req.body.richDescription,
            image: imagePath,
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
    
    if(!updatedProduct) {
        return res.status(500).json({success: false, message: 'No se a podido actualizar producto'});
    }

    res.send(updatedProduct);
});

router.put('/gallery-images/:id',uploadOptions.array('images', 5), async (req, res) => {
    if(!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Producto no encontrado');
    }
    const files = req.files;
    let imagesPaths = [];
    const basePath = `${req.protocol}://${req.get('host')}/public/images`;

    if(files) {
        files.map(file => {
            imagesPaths.push(`${basePath}${file.filename}`);//mapeo para agregar cada url respecto a cada imagen del arreglo
        })
    }

    const product = await Product.findByIdAndUpdate(
        req.params.id,
        {
            images: imagesPaths
        },
        {new: true}
    )

    if(!product) {
        return res.status(500).json({success: false, message: 'No se a podido actualizar producto'});
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
});

//Contador de productos existentes
router.get(`/get/count`, async (req, res) => {
    const productCount = await Product.countDocuments((count) => count);

    if(!productCount) {
        res.status(500).json({success: false});
    }

    res.send({
        productCount: productCount,
    });
});

//Producto destacado(featured)
router.get(`/get/featured/:count`, async (req, res) => {
    const count = req.params.count ? req.params.count : 0;
    const products = await Product.find({isFeatured: true}).limit(+count);

    if(!products) {
        res.status(500).json({success: false});
    }

    res.send(products);
});

module.exports = router;