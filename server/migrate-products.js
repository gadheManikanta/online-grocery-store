const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const Product = require("./models/Product");

async function migrateProducts() {

    try {

        // Connect to MongoDB Atlas
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Atlas Connected!");

        // Read existing db.json
        const filePath = path.join(__dirname, "..", "db.json");

        const database = JSON.parse(
            fs.readFileSync(filePath, "utf8")
        );

        const products = database.products || [];

        // Check existing products
        const count = await Product.countDocuments();

        if (count > 0) {
            console.log(
                "Products already exist. Migration skipped."
            );
            return;
        }

        // Remove old JSON Server IDs
        const productsToInsert = products.map(product => {

            const { id, ...productData } = product;

            return productData;

        });

        // Insert products into MongoDB
        await Product.insertMany(productsToInsert);

        console.log(
            `${productsToInsert.length} products migrated successfully!`
        );

    }

    catch (error) {

        console.error("Migration Error:", error);

    }

    finally {

        await mongoose.disconnect();

    }

}

migrateProducts();