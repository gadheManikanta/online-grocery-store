console.log("FreshCart JavaScript Started!");

var API_URL = "http://localhost:5000/api/products";

var EXTERNAL_API_URL = "https://dummyjson.com/products/category/groceries";

var products = [];
var externalProducts = [];

console.log("API URLs Loaded Successfully!");


// =====================================================
// REDUX TOOLKIT - CART SLICE
// =====================================================

// Check Redux Toolkit
if (typeof RTK === "undefined") {
    console.error("Redux Toolkit CDN is not loaded!");
    throw new Error("Redux Toolkit is required.");
}

var configureStore = RTK.configureStore;
var createSlice = RTK.createSlice;


// =====================================================
// LOAD CART FROM LOCAL STORAGE
// =====================================================

var savedCart = [];

try {

    savedCart = JSON.parse(
        localStorage.getItem("freshCartCart") || "[]"
    );

    if (!Array.isArray(savedCart)) {
        savedCart = [];
    }

} catch (error) {

    console.error("Cart loading error:", error);
    savedCart = [];

}


// =====================================================
// CREATE REDUX CART SLICE
// =====================================================

var cartSlice = createSlice({

    name: "cart",

    initialState: {
        items: savedCart
    },

    reducers: {

        addItem: function (state, action) {

            var product = action.payload;

            var existingProduct = state.items.find(
                function (item) {
                    return String(item.id) === String(product.id);
                }
            );

            if (existingProduct) {

                existingProduct.quantity++;

            } else {

                state.items.push({

                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1

                });

            }

        },


        increaseQuantity: function (state, action) {

            var item = state.items.find(
                function (item) {
                    return String(item.id) === String(action.payload);
                }
            );

            if (item) {
                item.quantity++;
            }

        },


        decreaseQuantity: function (state, action) {

            var item = state.items.find(
                function (item) {
                    return String(item.id) === String(action.payload);
                }
            );

            if (item) {

                if (item.quantity > 1) {

                    item.quantity--;

                } else {

                    state.items = state.items.filter(
                        function (item) {
                            return String(item.id) !== String(action.payload);
                        }
                    );

                }

            }

        },


        removeItem: function (state, action) {

            state.items = state.items.filter(
                function (item) {
                    return String(item.id) !== String(action.payload);
                }
            );

        }

    }

});


// =====================================================
// CREATE REDUX STORE
// =====================================================

var store = configureStore({

    reducer: {
        cart: cartSlice.reducer
    }

});


// =====================================================
// REDUX ACTIONS
// =====================================================

var addItem = cartSlice.actions.addItem;

var increaseQuantity = cartSlice.actions.increaseQuantity;

var decreaseQuantity = cartSlice.actions.decreaseQuantity;

var removeItem = cartSlice.actions.removeItem;


// Current cart state
var cart = store.getState().cart.items;


console.log("FreshCart Redux Store Initialized!");

console.log("Initial Redux State:", store.getState());


// =====================================================
// LOAD PRODUCTS FROM MONGODB
// =====================================================

async function loadProducts() {

    try {

        var response = await fetch(API_URL);

        if (!response.ok) {

            throw new Error(
                "MongoDB API Error: " + response.status
            );

        }

        products = await response.json();

        console.log("Products loaded from MongoDB:", products);

        displayProducts(products);

    } catch (error) {

        console.error("MongoDB Product Error:", error);

        var container = document.getElementById("productContainer");

        if (container) {

            container.innerHTML =
                "<p>Unable to load FreshCart products. Please start the backend server.</p>";

        }

    }

}


// =====================================================
// PRODUCT AVAILABILITY
// =====================================================

function isProductAvailable(product) {

    return (
        product.availability === true ||
        product.availability === "available"
    );

}


// =====================================================
// DISPLAY MONGODB PRODUCTS
// =====================================================

function displayProducts(productList) {

    var container = document.getElementById("productContainer");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    productList.forEach(function (product) {

        var productId = product._id;

        var available = isProductAvailable(product);

        var cartButton = "";

        if (available) {

            cartButton =
                '<button class="add-button" onclick="addToCart(\'' +
                productId +
                '\')">🛒 Add to Cart</button>';

        } else {

            cartButton =
                '<button class="add-button" disabled style="background:#b2bec3;cursor:not-allowed;">❌ Out of Stock</button>';

        }


        var productHTML =

            '<div class="product-card">' +

                '<div class="product-image">' +
                    (product.image || "") +
                '</div>' +

                '<h3>' +
                    (product.name || "Unnamed Product") +
                '</h3>' +

                '<p>' +
                    (product.description || "") +
                '</p>' +

                '<div class="product-price">' +
                    '₹' + product.price +
                '</div>' +

                '<div>' +

                    cartButton +

                    '<button class="details-button" onclick="viewProduct(\'' +
                    productId +
                    '\')">👁️ View Details</button>' +

                '</div>' +

            '</div>';


        container.innerHTML += productHTML;

    });

}


// =====================================================
// SEARCH PRODUCTS
// =====================================================

function searchProducts() {

    var searchBox = document.getElementById("searchBox");

    if (!searchBox) {
        return;
    }

    var searchText = searchBox.value.toLowerCase();

    var filteredProducts = products.filter(function (product) {

        var name = (product.name || "").toLowerCase();

        var category = (product.category || "").toLowerCase();

        return (
            name.includes(searchText) ||
            category.includes(searchText)
        );

    });

    displayProducts(filteredProducts);

}


// =====================================================
// CATEGORY FILTER
// =====================================================

function filterProducts(category) {

    if (category === "all") {

        displayProducts(products);
        return;

    }

    var filteredProducts = products.filter(function (product) {

        return product.category === category;

    });

    displayProducts(filteredProducts);

    var productsSection = document.getElementById("products");

    if (productsSection) {

        productsSection.scrollIntoView({
            behavior: "smooth"
        });

    }

}


// =====================================================
// ADD PRODUCT TO REDUX CART
// =====================================================

function addToCart(productId) {

    var product = products.find(function (item) {

        return String(item._id) === String(productId);

    });


    if (!product) {

        alert("Product not found!");
        return;

    }


    if (!isProductAvailable(product)) {

        alert("This product is currently out of stock.");
        return;

    }


    store.dispatch(addItem({

        id: product._id,
        name: product.name,
        price: Number(product.price),
        image: product.image

    }));


    alert(product.name + " added to your cart! 🛒");

}


// =====================================================
// UPDATE CART DISPLAY
// =====================================================

function updateCart() {

    var cartItems = document.getElementById("cartItems");

    var cartCount = document.getElementById("cartCount");

    var cartTotal = document.getElementById("cartTotal");


    if (!cartItems || !cartCount || !cartTotal) {
        return;
    }


    cartItems.innerHTML = "";

    var total = 0;

    var count = 0;


    cart.forEach(function (item) {

        var itemTotal = item.price * item.quantity;

        total += itemTotal;

        count += item.quantity;


        cartItems.innerHTML +=

            '<div class="cart-item">' +

                '<strong>' +
                    item.name +
                '</strong>' +

                '<p>₹' + item.price + ' each</p>' +

                '<div>' +

                    '<button onclick="decreaseCartQuantity(\'' +
                    item.id +
                    '\')">−</button>' +

                    '<span>' +
                    item.quantity +
                    '</span>' +

                    '<button onclick="increaseCartQuantity(\'' +
                    item.id +
                    '\')">+</button>' +

                '</div>' +

                '<p>Item Total: ₹' +
                itemTotal +
                '</p>' +

                '<button onclick="removeFromCart(\'' +
                item.id +
                '\')">🗑️ Remove</button>' +

            '</div>';

    });


    cartCount.innerText = count;

    cartTotal.innerText = total.toFixed(2);

}


// =====================================================
// REDUX STORE SUBSCRIPTION
// =====================================================

store.subscribe(function () {

    cart = store.getState().cart.items;

    localStorage.setItem(
        "freshCartCart",
        JSON.stringify(cart)
    );

    updateCart();

});


// =====================================================
// INCREASE CART QUANTITY
// =====================================================

function increaseCartQuantity(productId) {

    store.dispatch(increaseQuantity(productId));

}


// =====================================================
// DECREASE CART QUANTITY
// =====================================================

function decreaseCartQuantity(productId) {

    store.dispatch(decreaseQuantity(productId));

}


// =====================================================
// REMOVE CART PRODUCT
// =====================================================

function removeFromCart(productId) {

    store.dispatch(removeItem(productId));

}


// =====================================================
// OPEN CART
// =====================================================

function openCart() {

    var cartPanel = document.getElementById("cartPanel");

    if (cartPanel) {
        cartPanel.style.display = "block";
    }

}


// =====================================================
// CLOSE CART
// =====================================================

function closeCart() {

    var cartPanel = document.getElementById("cartPanel");

    if (cartPanel) {
        cartPanel.style.display = "none";
    }

}


// =====================================================
// SHOP NOW
// =====================================================

function goToProducts() {

    var productsSection = document.getElementById("products");

    if (productsSection) {

        productsSection.scrollIntoView({
            behavior: "smooth"
        });

    }

}


// =====================================================
// APPLY COUPON
// =====================================================

function applyCoupon() {

    var couponInput = document.getElementById("couponCode");

    var discountAmount = document.getElementById("discountAmount");

    var finalTotal = document.getElementById("finalTotal");

    var cartTotalElement = document.getElementById("cartTotal");


    if (!couponInput || !discountAmount || !finalTotal || !cartTotalElement) {
        return;
    }


    var couponCode = couponInput.value.toUpperCase();

    var total = Number(cartTotalElement.innerText);


    if (couponCode === "FIRST10") {

        var discount = total * 0.10;

        var finalPrice = total - discount;


        discountAmount.innerText = discount.toFixed(2);

        finalTotal.innerText = finalPrice.toFixed(2);


        localStorage.setItem(
            "freshCartDiscount",
            discount.toString()
        );


        alert("🎉 Coupon applied! You got 10% OFF.");

    } else {

        discountAmount.innerText = "0";

        finalTotal.innerText = total.toFixed(2);


        localStorage.setItem(
            "freshCartDiscount",
            "0"
        );


        alert("Invalid coupon code!");

    }

}


// =====================================================
// DISCOUNT
// =====================================================

function applyDiscount() {

    alert(
        "Congratulations!\n\n" +
        "You will receive 10% OFF on your first order."
    );

}


// =====================================================
// CHECKOUT
// =====================================================

function checkout() {

    if (cart.length === 0) {

        alert("Your cart is empty!");
        return;

    }

    window.location.href = "checkout.html";

}


// =====================================================
// VIEW PRODUCT DETAILS
// =====================================================

function viewProduct(productId) {

    window.location.href =
        "product-details.html?id=" +
        encodeURIComponent(productId);

}


// =====================================================
// THIRD-PARTY API INTEGRATION
// DUMMYJSON PRODUCTS API
// =====================================================

async function loadExternalProducts() {

    var container = document.getElementById(
        "externalProductContainer"
    );


    if (!container) {

        console.error("External product container not found!");
        return;

    }


    try {

        container.innerHTML =
            '<p class="external-api-message">' +
            'Loading products from DummyJSON API...' +
            '</p>';


        console.log(
            "Connecting to DummyJSON Third-Party API..."
        );


        // Send HTTP request
        var response = await fetch(EXTERNAL_API_URL);


        if (!response.ok) {

            throw new Error(
                "Third-Party API Error: " + response.status
            );

        }


        // Convert response into JSON
        var data = await response.json();


        externalProducts = data.products || [];


        console.log("Third-Party API Response:", data);

        console.log("External Products Received:", externalProducts);


        if (externalProducts.length === 0) {

            container.innerHTML =
                '<p class="external-api-message">' +
                'No external products available.' +
                '</p>';

            return;

        }


        // Clear loading message
        container.innerHTML = "";


        // Display external products
        externalProducts.forEach(function (product) {

            var productCard = document.createElement("div");

            productCard.className = "external-product-card";


            var image = document.createElement("img");

            image.src = product.thumbnail;

            image.alt = product.title;

            image.loading = "lazy";


            var title = document.createElement("h3");

            title.textContent = product.title;


            var description = document.createElement("p");

            description.textContent = product.description;


            var price = document.createElement("div");

            price.className = "external-product-price";

            price.textContent =
                "$" + Number(product.price).toFixed(2);


            var category = document.createElement("small");

            category.textContent =
                "Category: " + product.category;


            productCard.appendChild(image);

            productCard.appendChild(title);

            productCard.appendChild(description);

            productCard.appendChild(price);

            productCard.appendChild(category);


            container.appendChild(productCard);

        });


        console.log(
            "External products displayed successfully!"
        );

        console.log(
            "Total external products:",
            externalProducts.length
        );


    } catch (error) {

        console.error("Third-Party API Error:", error);


        container.innerHTML =
            '<p class="external-api-message">' +
            'Unable to load external products. ' +
            'Please check your internet connection.' +
            '</p>';

    }

}


// =====================================================
// LOAD EXTERNAL PRODUCTS WHEN PAGE OPENS
// =====================================================

loadExternalProducts();


// =====================================================
// INITIAL CART DISPLAY
// =====================================================

updateCart();


// =====================================================
// REDUX DEBUGGING FUNCTION
// =====================================================

window.getFreshCartReduxState = function () {

    return store.getState();

};


// =====================================================
// THIRD-PARTY API DEBUGGING FUNCTION
// =====================================================

window.getFreshCartExternalProducts = function () {

    return externalProducts;

};


// =====================================================
// INITIALIZATION MESSAGE
// =====================================================

console.log(
    "FreshCart Application Initialized Successfully!"
);