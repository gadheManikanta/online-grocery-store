const jwt = require("jsonwebtoken");

// ==========================================
// JWT AUTHENTICATION MIDDLEWARE
// ==========================================

const authenticateToken = (req, res, next) => {

    try {

        // Get token from request header
        const authHeader = req.headers["authorization"];

        // Check whether token exists
        if (!authHeader || !authHeader.startsWith("Bearer ")) {

            return res.status(401).json({

                message: "Access denied. Please provide a valid token."

            });

        }

        // Extract token
        const token = authHeader.split(" ")[1];

        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Store user information in request
        req.user = decoded;

        // Allow next operation
        next();

    }

    catch (error) {

        return res.status(403).json({

            message: "Invalid or expired JWT token"

        });

    }

};


// ==========================================
// ADMIN AUTHORIZATION MIDDLEWARE
// ==========================================

const authorizeAdmin = (req, res, next) => {

    if (!req.user || req.user.role !== "admin") {

        return res.status(403).json({

            message: "Access denied. Admin permission required."

        });

    }

    next();

};


// EXPORT MIDDLEWARE

module.exports = {
    authenticateToken,
    authorizeAdmin
};