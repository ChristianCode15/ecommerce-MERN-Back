

const { Category } = require('../models/category');
const express = require('express');
const router = express.Router();

router.get(`/`, async (req, res) => {
    const categoryList = await Category.find();

    if(!categoryList) {
        res.status(500).json({success: false})
    }
    res.status(200).send(categoryList);
})

router.get('/:id', async (req,res) => {
    const category = await Category.findById(req.params.id);
    if(!category) {
        return res.status(500).json({status: false, message: 'No se encontro categoria con ese Id'})
    }
    res.status(200).send(category);
})

router.post(`/`, async (req, res) => {
    let category = new Category({
        name: req.body.name,
        icon: req.body.icon,
        color: req.body.color,
    })
    category = await category.save();

    if(!category)
    {
        return res.status(404).send('La categoria no ha sido creada')
    }

    res.send(category);
})

router.put('/:id', async (req, res) => {
    const category = await Category.findByIdAndUpdate(
        req.params.id,
        {
            name: req.body.name,
            icon: req.body.icon,
            color: req.body.color,
        },
        {new: true}
    )
    
    if(!category) {
        return res.status(404).json({success: false, message: 'No se a encontrado la categoria'});
    }

    res.status(200).json(category);
})

router.delete('/:id', (req, res) => {
    Category.findByIdAndDelete(req.params.id)
    .then( category => {
        if(category){
            return res.status(200).json({success: true, message: 'La categoria a sido eliminada con exito'});
        } else {
            return res.status(404).json({success: false, message: 'No se ha encontrado la categoria'});
        }
    })
    .catch( err => {
        return res.status(400).json({success: false, error: err});
    })
})


module.exports = router;