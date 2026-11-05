// ==========================================
// FRESHCART BACKEND - EXPRESS + MONGODB
// ==========================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();


// ==========================================
// IMPORT MONGODB MODELS
// ==========================================

const Product = require("./models/Product");
const Order = require("./models/Order");


// ==========================================
// IMPORT AUTHENTICATION ROUTES
// ==========================================

const authRoutes = require("./routes/authRoutes");


// ==========================================
// IMPORT JWT MIDDLEWARE
// ==========================================

const {
    authenticateToken,
    authorizeAdmin
} = require("./middleware/authMiddleware");


// ==========================================
// CREATE EXPRESS APPLICATION
// ==========================================

const app = express();


// ==========================================
// MIDDLEWARE
// ==========================================

app.use(cors());

app.use(express.json());


// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

app.use("/api/auth", authRoutes);


// ==========================================
// HOME / TEST API
// ==========================================

app.get("/", (req, res) => {

    res.status(200).send(
        "FreshCart Backend Server is Running!"
    );

});


// ==========================================
// PRODUCT MANAGEMENT APIs
// ==========================================


// GET ALL PRODUCTS - PUBLIC

app.get("/api/products", async (req, res) => {

    try {

        const products = await Product.find();

        res.status(200).json(products);

    }

    catch (error) {

        console.error("Product Fetch Error:", error);

        res.status(500).json({

            message: "Failed to fetch products",

            error: error.message

        });

    }

});


// GET SINGLE PRODUCT - PUBLIC

app.get("/api/products/:id", async (req, res) => {

    try {

        const product = await Product.findById(
            req.params.id
        );

        if (!product) {

            return res.status(404).json({

                message: "Product not found"

            });

        }

        res.status(200).json(product);

    }

    catch (error) {

        res.status(400).json({

            message: "Invalid product ID",

            error: error.message

        });

    }

});


// ADD NEW PRODUCT - ADMIN ONLY

app.post(
    "/api/products",
    authenticateToken,
    authorizeAdmin,
    async (req, res) => {

        try {

            const newProduct = new Product(req.body);

            const savedProduct = await newProduct.save();

            res.status(201).json({

                message: "Product added successfully",

                product: savedProduct

            });

        }

        catch (error) {

            res.status(400).json({

                message: "Failed to add product",

                error: error.message

            });

        }

    }
);


// UPDATE PRODUCT - ADMIN ONLY

app.put(
    "/api/products/:id",
    authenticateToken,
    authorizeAdmin,
    async (req, res) => {

        try {

            const updatedProduct =
                await Product.findByIdAndUpdate(

                    req.params.id,

                    req.body,

                    {
                        new: true,
                        runValidators: true
                    }

                );

            if (!updatedProduct) {

                return res.status(404).json({

                    message: "Product not found"

                });

            }

            res.status(200).json({

                message: "Product updated successfully",

                product: updatedProduct

            });

        }

        catch (error) {

            res.status(400).json({

                message: "Failed to update product",

                error: error.message

            });

        }

    }
);


// DELETE PRODUCT - ADMIN ONLY

app.delete(
    "/api/products/:id",
    authenticateToken,
    authorizeAdmin,
    async (req, res) => {

        try {

            const deletedProduct =
                await Product.findByIdAndDelete(
                    req.params.id
                );

            if (!deletedProduct) {

                return res.status(404).json({

                    message: "Product not found"

                });

            }

            res.status(200).json({

                message: "Product deleted successfully"

            });

        }

        catch (error) {

            res.status(400).json({

                message: "Failed to delete product",

                error: error.message

            });

        }

    }
);


// ==========================================
// ORDER MANAGEMENT APIs
// ==========================================


// GET ALL ORDERS - ADMIN ONLY

app.get(
    "/api/orders",
    authenticateToken,
    authorizeAdmin,
    async (req, res) => {

        try {

            const orders = await Order.find().sort({

                orderDate: -1

            });

            res.status(200).json(orders);

        }

        catch (error) {

            console.error("Order Fetch Error:", error);

            res.status(500).json({

                message: "Failed to fetch orders",

                error: error.message

            });

        }

    }
);


// GET SINGLE ORDER - PUBLIC TRACKING

app.get("/api/orders/:orderId", async (req, res) => {

    try {

        const order = await Order.findOne({

            orderId: req.params.orderId

        });

        if (!order) {

            return res.status(404).json({

                message: "Order not found"

            });

        }

        res.status(200).json(order);

    }

    catch (error) {

        res.status(500).json({

            message: "Failed to fetch order",

            error: error.message

        });

    }

});


// PLACE NEW ORDER - PUBLIC

app.post("/api/orders", async (req, res) => {

    try {

        const {

            orderId,

            customerName,

            phone,

            address,

            deliveryDate,

            paymentMethod,

            items,

            discount

        } = req.body;


        // VALIDATE CUSTOMER DETAILS

        if (

            !customerName ||

            !phone ||

            !address ||

            !deliveryDate ||

            !paymentMethod

        ) {

            return res.status(400).json({

                message: "Please provide all customer details"

            });

        }


        // VALIDATE CART

        if (

            !Array.isArray(items) ||

            items.length === 0

        ) {

            return res.status(400).json({

                message: "Order must contain at least one product"

            });

        }


        // CALCULATE SUBTOTAL

        const subtotal = items.reduce((total, item) => {

            const price = Number(item.price);

            const quantity = Number(item.quantity);

            if (

                !Number.isFinite(price) ||

                price < 0 ||

                !Number.isInteger(quantity) ||

                quantity < 1

            ) {

                throw new Error(
                    "Invalid product price or quantity"
                );

            }

            return total + (price * quantity);

        }, 0);


        // CALCULATE DISCOUNT

        const requestedDiscount = Number(discount) || 0;

        const validDiscount = Math.min(

            Math.max(requestedDiscount, 0),

            subtotal

        );


        // CALCULATE FINAL TOTAL

        const finalTotal = subtotal - validDiscount;


        // PREPARE ORDER ITEMS

        const orderItems = items.map(item => ({

            productId: String(
                item._id || item.id || ""
            ),

            name: item.name,

            price: Number(item.price),

            image: item.image || "",

            quantity: Number(item.quantity)

        }));


        // CREATE NEW ORDER

        const newOrder = new Order({

            orderId: orderId || "FC" + Date.now(),

            customerName,

            phone,

            address,

            deliveryDate,

            paymentMethod,

            items: orderItems,

            subtotal,

            discount: validDiscount,

            finalTotal,

            status: "Order Placed"

        });


        // SAVE ORDER IN MONGODB

        const savedOrder = await newOrder.save();


        res.status(201).json({

            message: "Order placed successfully",

            order: savedOrder

        });

    }

    catch (error) {

        console.error("Order Creation Error:", error);

        res.status(400).json({

            message: "Failed to place order",

            error: error.message

        });

    }

});


// ==========================================
// UPDATE ORDER STATUS - ADMIN ONLY
// ==========================================

app.put(
    "/api/orders/:orderId",
    authenticateToken,
    authorizeAdmin,
    async (req, res) => {

        try {

            const { status } = req.body;


            const allowedStatuses = [

                "Order Placed",

                "Processing",

                "Shipped",

                "Out for Delivery",

                "Delivered",

                "Cancelled"

            ];


            if (!allowedStatuses.includes(status)) {

                return res.status(400).json({

                    message: "Invalid order status"

                });

            }


            const updatedOrder = await Order.findOneAndUpdate(

                { orderId: req.params.orderId },

                { status: status },

                {

                    new: true,

                    runValidators: true

                }

            );


            if (!updatedOrder) {

                return res.status(404).json({

                    message: "Order not found"

                });

            }


            res.status(200).json({

                message: "Order status updated successfully",

                order: updatedOrder

            });

        }

        catch (error) {

            res.status(400).json({

                message: "Failed to update order status",

                error: error.message

            });

        }

    }
);


// ==========================================
// DELETE ORDER - ADMIN ONLY
// ==========================================

app.delete(
    "/api/orders/:orderId",
    authenticateToken,
    authorizeAdmin,
    async (req, res) => {

        try {

            const deletedOrder = await Order.findOneAndDelete({

                orderId: req.params.orderId

            });


            if (!deletedOrder) {

                return res.status(404).json({

                    message: "Order not found"

                });

            }


            res.status(200).json({

                message: "Order deleted successfully"

            });

        }

        catch (error) {

            res.status(500).json({

                message: "Failed to delete order",

                error: error.message

            });

        }

    }
);


// ==========================================
// START SERVER AFTER MONGODB CONNECTS
// ==========================================

const PORT = process.env.PORT || 5000;


async function startServer() {

    try {

        // CHECK MONGODB ENVIRONMENT VARIABLE

        if (!process.env.MONGO_URI) {

            throw new Error(
                "MONGO_URI is missing from environment variables"
            );

        }


        // CONNECT TO MONGODB ATLAS

        await mongoose.connect(process.env.MONGO_URI);

        console.log(
            "MongoDB Atlas Connected Successfully!"
        );


        // START EXPRESS SERVER

        app.listen(PORT, () => {

            console.log(
                `FreshCart Backend running on port ${PORT}`
            );

        });

    }

    catch (error) {

        console.error(
            "Backend startup failed:",
            error.message
        );

        process.exit(1);

    }

}


// INITIALIZE SERVER

startServer();