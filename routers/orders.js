

const { Order } = require('../models/order');
const express = require('express');
const { OrderItem } = require('../models/order-item');
const router = express.Router();

router.get(`/`, async (req,  res) => {
    const orderList = await Order.find()
    .populate('user', 'name')
    .sort({'dateOrdered': -1}); //Ordeno por ordenes nuevas a antiguas

    if(!orderList) {
        res.status(500).json({success: false});
    }

    res.send(orderList);
});

router.get(`/:id`, async (req,  res) => {
    const orderList = await Order.findById(req.params.id)
    .populate('user', 'name')               //Populate para elegir campo de mis bd
    .populate({path: 'orderItems', populate: {
        path: 'product', populate: 'category'
    }}) 

    if(!orderList) {
        res.status(500).json({success: false});
    }

    res.send(orderList);
});

router.post(`/`, async (req, res) => {
    const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => { 
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save();

        return newOrderItem._id;
    }))

    const orderItemsIdsResolved = await orderItemsIds;

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async orderItemId => {
        const orderItem = await OrderItem.findById(orderItemId).populate('product', 'price');
        const totalPrice = orderItem.quantity * orderItem.product.price;
        return totalPrice;
    }))

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0);

    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress: req.body.shippingAddress,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user,
    })
    order = await order.save();

    if(!order)
    {
        return res.status(400).send('La orden no ha sido creada')
    }

    res.send(order);
});

router.put('/:id', async (req, res) => {
    const order = await Order.findByIdAndUpdate(
        req.params.id,
        {
            status: req.body.status
        },
        {new: true}
    )
    
    if(!order) {
        return res.status(404).json({success: false, message: 'No se a encontrado la orden'});
    }

    res.status(200).json(order);
});

router.delete('/:id', (req, res) => {
    Order.findByIdAndDelete(req.params.id)
    .then(async order => {
        if(order){
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({success: true, message: 'La orden a sido eliminada con exito'});
        } else {
            return res.status(404).json({success: false, message: 'No se ha encontrado la orden'});
        }
    })
    .catch( err => {
        return res.status(400).json({success: false, error: err});
    })
});

router.get('/get/totalsales', async (req, res) => {
    const totalSales = await Order.aggregate([
        { $group: { _id: null, totalsales: { $sum: '$totalPrice'}}}
    ]) //

    if(!totalSales) {
        return res.status(400).send('El total de ventas de orden no pudo ser generada');
    }

    res.send({totalsales: totalSales.pop().totalsales});
});

router.get(`/get/userorders/:userid`, async (req,  res) => {
    const userOrderList = await Order.find({user: req.params.userid}).populate({
       path: 'orderItems', populate: {
           path: 'product', populate: 'category'
       } 
    }).sort({'dateOrdered': -1});

    if(!userOrderList) {
        res.status(500).json({success: false});
    }

    res.send(userOrderList);
});

router.get(`/get/count`, async (req, res) => {
    const ordersCount = await Order.countDocuments((count) => count);

    if(!ordersCount) {
        res.status(500).json({success: false});
    }

    res.send({
        ordersCount: ordersCount,
    });
});

module.exports = router;