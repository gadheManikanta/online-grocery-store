require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected!");

        const name = process.env.ADMIN_NAME;
        const email = process.env.ADMIN_EMAIL;
        const password = process.env.ADMIN_PASSWORD;

        if (!name || !email || !password) {
            throw new Error("Please configure ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env");
        }

        if (password.length < 8) {
            throw new Error("Admin password must contain at least 8 characters.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await User.findOneAndUpdate(
            { email: email.trim().toLowerCase() },
            {
                name: name.trim(),
                email: email.trim().toLowerCase(),
                password: hashedPassword,
                role: "admin"
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        console.log("Admin account created successfully!");
        console.log("Admin Email:", admin.email);
        console.log("Admin Role:", admin.role);

    } catch (error) {
        console.error("Admin creation error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();