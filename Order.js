const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({

    orderId: {
        type: String,
        required: true,
        unique: true
    },

    customerName: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },

    address: {
        type: String,
        required: true
    },

    deliveryDate: {
        type: String,
        required: true
    },

    paymentMethod: {
        type: String,
        required: true
    },

    items: [
        {
            productId: String,
            name: String,
            price: Number,
            image: String,
            quantity: Number
        }
    ],

    subtotal: {
        type: Number,
        required: true
    },

    discount: {
        type: Number,
        default: 0
    },

    finalTotal: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        default: "Order Placed"
    },

    orderDate: {
        type: Date,
        default: Date.now
    }

}, {
    timestamps: true
});

module.exports = mongoose.model("Order", orderSchema);