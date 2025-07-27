// public/script.js

// Initialize Socket.IO client
const socket = io();

// --- DOM Elements ---
const homeSection = document.getElementById('home-section');
const supplierSection = document.getElementById('supplier-section');
const productDetailSection = document.getElementById('product-detail-section');
const authSection = document.getElementById('auth-section'); // Authentication section
const profileSection = document.getElementById('profile-section'); // User profile section

// Header Buttons
const loginBtn = document.getElementById('login-btn');
const sellBtn = document.getElementById('sell-btn'); // This button remains always visible
const profileBtn = document.getElementById('profile-btn'); // Shows after login

// Main Product Listing & Search
const productSearchInputMain = document.getElementById('product-search-main');
const searchBtnMain = document.getElementById('search-btn-main');
const productList = document.getElementById('product-list');

// Product Detail Page Elements
const productDetailsDiv = document.getElementById('product-details');
const backToHomeBtn = document.getElementById('back-to-home-btn'); // Button to go back to home feed

// Chat Elements
const chatMessagesDiv = document.getElementById('chat-messages');
const chatInputField = document.getElementById('chat-input-field');
const sendChatBtn = document.getElementById('send-chat-btn');
const dealFinalizedInfo = document.getElementById('deal-finalized-info');
const finalDealPriceSpan = document.getElementById('final-deal-price');
const supplierContactSpan = document.getElementById('supplier-contact');
const vendorContactSpan = document.getElementById('vendor-contact');
const dealDistanceSpan = document.getElementById('deal-distance');

// Supplier Product Upload Elements
const productNameInput = document.getElementById('product-name');
const productMrpInput = document.getElementById('product-mrp');
const productUnitInput = document.getElementById('product-unit');
const productImageInput = document.getElementById('product-image');
const addProductBtn = document.getElementById('add-product-btn');
const supplierProductsDiv = document.getElementById('supplier-products');

// Authentication & Profile Section Elements
const authTitle = document.getElementById('auth-title');
const authDescription = document.getElementById('auth-description');
const authMobileInput = document.getElementById('auth-mobile-input');
const authContinueBtn = document.getElementById('auth-continue-btn');
const authErrorMessage = document.getElementById('auth-error-message');

const profileMobileSpan = document.getElementById('profile-mobile');
const profileRoleSpan = document.getElementById('profile-role');
const profileNameInput = document.getElementById('profile-name-input');
const profileAddressInput = document.getElementById('profile-address-input');
const saveProfileBtn = document.getElementById('save-profile-btn');
const logoutBtn = document.getElementById('logout-btn');
const profileLoginPrompt = document.getElementById('profile-login-prompt'); // Prompt if profile is viewed when logged out
const profileDetails = document.getElementById('profile-details'); // Div containing actual profile details


// --- Global State Variables ---
let currentProduct = null; // Stores the product currently being viewed/chatted about
let currentUserRole = null; // 'Vendor' or 'Supplier' based on last login/sell action
let currentUserMobile = null; // Stores the logged-in user's mobile number
let currentUserProfile = {}; // Stores user's name and address from profile


// --- Helper Functions ---

// Shows a specific section and hides all other main sections
function showSection(sectionToShow) {
    const sections = [homeSection, supplierSection, productDetailSection, authSection, profileSection];
    sections.forEach(section => {
        if (section === sectionToShow) {
            section.classList.remove('hidden'); // Show the target section
        } else {
            section.classList.add('hidden'); // Hide other sections
        }
    });
}

// Displays messages in the chat window, applying appropriate styles
function displayMessage(user, message, isSystem = false) {
    const msgElem = document.createElement('p');
    msgElem.textContent = `${user}: ${message}`;
    if (user === 'Vendor') {
        msgElem.classList.add('vendor-message');
    } else if (user === 'Supplier') {
        msgElem.classList.add('supplier-message');
    } else if (isSystem) {
        msgElem.classList.add('system-message');
    }
    chatMessagesDiv.appendChild(msgElem);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight; // Auto-scroll to the bottom
}

// Updates visibility of header buttons based on current login status
function updateHeaderButtons() {
    if (currentUserMobile) {
        // If logged in, hide Login button and show Profile button
        loginBtn.classList.add('hidden');
        profileBtn.classList.remove('hidden');
        // The sellBtn (+ Add Product) remains visible always.
    } else {
        // If logged out, show Login button and hide Profile button
        loginBtn.classList.remove('hidden');
        profileBtn.classList.add('hidden');
    }
}

// Loads user data (mobile, role, profile) from localStorage to maintain session
function loadUserData() {
    currentUserMobile = localStorage.getItem('userMobile');
    currentUserRole = localStorage.getItem('userRole');
    try {
        currentUserProfile = JSON.parse(localStorage.getItem('userProfile')) || {};
    } catch (e) {
        // Handle potential parsing errors if localStorage data is corrupted
        console.error("Error parsing user profile from localStorage:", e);
        currentUserProfile = {}; // Reset profile if invalid
    }
    updateHeaderButtons(); // Update header buttons based on loaded data
}

// Saves current user data (mobile, role, profile) to localStorage
function saveUserData() {
    if (currentUserMobile) {
        localStorage.setItem('userMobile', currentUserMobile);
        localStorage.setItem('userRole', currentUserRole);
        localStorage.setItem('userProfile', JSON.stringify(currentUserProfile));
    } else { // If user logs out, clear their data from localStorage
        localStorage.removeItem('userMobile');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userProfile');
    }
    updateHeaderButtons(); // Update header buttons after save/clear
}


// --- Event Listeners ---

// Header: Login button click handler
loginBtn.addEventListener('click', () => {
    showSection(authSection); // Show the authentication section
    authTitle.textContent = "Login as Vendor"; // Set title for Vendor login
    authDescription.textContent = "Enter your 10-digit mobile number to login as a Vendor.";
    authMobileInput.value = ''; // Clear previous input
    authErrorMessage.classList.add('hidden'); // Hide any previous error message
    currentUserRole = 'Vendor'; // Set the role for this specific login attempt
});

// Header: Sell / Add Product button click handler
sellBtn.addEventListener('click', () => {
    // If already logged in as a Supplier, go directly to supplier section
    if (currentUserMobile && currentUserRole === 'Supplier') {
        showSection(supplierSection);
    } else {
        // Otherwise, prompt for login/registration as Supplier
        showSection(authSection);
        authTitle.textContent = "Login as Supplier"; // Set title for Supplier login
        authDescription.textContent = "Enter your 10-digit mobile number to login as a Supplier and start adding products.";
        authMobileInput.value = '';
        authErrorMessage.classList.add('hidden');
        currentUserRole = 'Supplier'; // Set the role for this specific login attempt
    }
});

// Header: Profile button click handler
profileBtn.addEventListener('click', () => {
    showSection(profileSection); // Show the profile section
    if (currentUserMobile) {
        // If logged in, populate and show profile details
        profileLoginPrompt.classList.add('hidden'); // Hide login prompt in profile
        profileDetails.classList.remove('hidden'); // Show actual profile details
        profileMobileSpan.textContent = currentUserMobile;
        profileRoleSpan.textContent = currentUserRole;
        profileNameInput.value = currentUserProfile.name || ''; // Populate name from stored profile
        profileAddressInput.value = currentUserProfile.address || ''; // Populate address from stored profile
    } else {
        // If not logged in, show login prompt within the profile section
        profileLoginPrompt.classList.remove('hidden');
        profileDetails.classList.add('hidden'); // Hide profile details if not logged in
    }
});

// Authentication Section: Continue button click handler
authContinueBtn.addEventListener('click', () => {
    const mobile = authMobileInput.value.trim();
    // Basic validation: must be 10 digits and only numbers
    if (mobile.length === 10 && /^\d+$/.test(mobile)) {
        currentUserMobile = mobile; // Store the mobile number
        saveUserData(); // Save user data to localStorage
        authErrorMessage.classList.add('hidden'); // Hide error message

        alert(`Logged in as ${currentUserRole} with number ${currentUserMobile}!`);

        // Redirect based on the role chosen during login/registration
        if (currentUserRole === 'Vendor') {
            showSection(homeSection); // Go to main product list
            fetchProducts(); // Load products for the vendor
        } else { // Supplier role
            showSection(supplierSection); // Go to supplier dashboard
            // Prompt supplier to add products
            supplierProductsDiv.innerHTML = '<p>Use the form above to add your products.</p>'; 
        }
    } else {
        authErrorMessage.classList.remove('hidden'); // Show validation error
    }
});

// Profile Section: Save Profile button click handler
saveProfileBtn.addEventListener('click', () => {
    if (currentUserMobile) { // Only allow saving if user is logged in
        currentUserProfile.name = profileNameInput.value.trim();
        currentUserProfile.address = profileAddressInput.value.trim();
        saveUserData(); // Save updated profile to localStorage
        alert('Profile saved successfully!');
    } else {
        alert('Please login first to save your profile.');
    }
});

// Profile Section: Logout button click handler
logoutBtn.addEventListener('click', () => {
    currentUserMobile = null; // Clear mobile number
    currentUserRole = null; // Clear role
    currentUserProfile = {}; // Clear profile data
    saveUserData(); // Clear data from localStorage
    alert('Logged out successfully!');
    showSection(homeSection); // Go back to the home/public view
    fetchProducts(); // Reload products for public view
});

// Login from Profile Section (if user was logged out)
document.getElementById('login-from-profile-btn').addEventListener('click', () => {
    showSection(authSection);
    authTitle.textContent = "Login to View Profile";
    authDescription.textContent = "Enter your mobile number to view your profile.";
    authMobileInput.value = '';
    authErrorMessage.classList.add('hidden');
    // Role will be determined by what they were before, or default to Vendor
    // For simplicity, we just trigger a general login flow here.
});


// Main Search Bar functionality
searchBtnMain.addEventListener('click', fetchProducts); // On click, fetch products
productSearchInputMain.addEventListener('keypress', (e) => { // On Enter key, fetch products
    if (e.key === 'Enter') {
        fetchProducts();
    }
});

// Back button from product detail to main product list
backToHomeBtn.addEventListener('click', () => {
    showSection(homeSection); // Go back to the main product feed
    currentProduct = null; // Clear the context of the current product
    chatMessagesDiv.innerHTML = ''; // Clear chat history
    dealFinalizedInfo.classList.add('hidden'); // Hide deal info section
    // Re-enable chat input fields (in case they were disabled after a deal)
    chatInputField.disabled = false;
    sendChatBtn.disabled = false;
});


// --- Product Listing (Vendor/General Browse) ---
// Fetches products from the backend API based on search term
async function fetchProducts() {
    productList.innerHTML = '<p>Loading products...</p>'; // Show loading message
    const searchTerm = productSearchInputMain.value; // Get search query from the main search bar
    try {
        const response = await fetch(`/api/products/search?q=${searchTerm}`); // Call backend search API
        const products = await response.json(); // Parse the JSON response
        displayProducts(products, productList); // Display the fetched products in the product list area
    } catch (error) {
        console.error('Error fetching products:', error);
        productList.innerHTML = '<p>Error loading products. Please try again.</p>'; // Show error message if fetch fails
    }
}

// Displays products (cards) in the given container element
function displayProducts(products, containerElement) {
    containerElement.innerHTML = ''; // Clear any previously displayed products
    if (products.length === 0) {
        containerElement.innerHTML = '<p>No products found for your search.</p>'; // Message if no products are found
        return;
    }
    products.forEach(product => {
        const card = document.createElement('div');
        card.classList.add('product-card');
        card.dataset.productId = product.id; // Store product ID for later use (e.g., clicking for details)

        card.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
            <div class="product-card-info">
                <h3>${product.name}</h3>
                <p>Supplier: ${product.supplier}</p>
                <p class="price">MRP: ₹${product.mrp}/${product.unit}</p>
            </div>
        `;
        card.addEventListener('click', () => showProductDetail(product)); // Add click listener to show details
        containerElement.appendChild(card); // Add the product card to the container
    });
}

// Shows detailed view of a product and initializes the bargaining chat
function showProductDetail(product) {
    // Before showing product details, ensure the user is logged in
    if (!currentUserMobile) {
        alert('Please login with your mobile number first to view product details and chat.');
        showSection(authSection); // Redirect to authentication section
        authTitle.textContent = "Login to View Product"; // Set specific title for context
        authDescription.textContent = "Enter your mobile number to proceed and view product details.";
        currentUserRole = 'Vendor'; // Default to Vendor role for product viewing if not logged in
        return;
    }

    currentProduct = product; // Set the global currentProduct variable
    showSection(productDetailSection); // Show the product detail section
    productDetailsDiv.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}">
        <div id="product-details-info">
            <h3>${product.name}</h3>
            <p><strong>Supplier:</strong> ${product.supplier}</p>
            <p><strong>Unit:</strong> ${product.unit}</p>
            <p class="price">MRP: ₹${product.mrp}/${product.unit}</p>
            <p>Ready to bargain for this product?</p>
        </div>
    `;
    // Clear and reset chat-related elements for a new product
    chatMessagesDiv.innerHTML = '';
    dealFinalizedInfo.classList.add('hidden');
    chatInputField.disabled = false;
    sendChatBtn.disabled = false;
    // Emit 'join_chat' event to the server to establish a chat for this product
    socket.emit('join_chat', { chatRoom: currentProduct.id, productName: currentProduct.name, role: currentUserRole, mobile: currentUserMobile });
}

// --- Chat Functionality ---
// Handles sending chat messages from the client to the server
sendChatBtn.addEventListener('click', () => {
    const message = chatInputField.value.trim();
    // Ensure user is logged in before allowing them to send messages
    if (!currentUserMobile) {
        alert('Please login with your mobile number to send messages.');
        showSection(authSection); // Redirect to authentication section
        authTitle.textContent = "Login to Chat"; // Set specific title for context
        authDescription.textContent = "Enter your mobile number to chat with the supplier.";
        currentUserRole = 'Vendor'; // Default to Vendor role for chatting if not logged in
        return;
    }
    // Only send if there's a message and a product is selected
    if (message && currentProduct) {
        const senderRole = currentUserRole || 'Vendor'; // Use current user role or default to Vendor
        socket.emit('send_message', {
            chatRoom: currentProduct.id, // Identify the chat room by product ID
            user: senderRole, // Sender's role
            message: message, // The message content
            mobile: currentUserMobile // Sender's mobile number (for reveal on deal)
        });
        chatInputField.value = ''; // Clear input field after sending
    }
});

// Allows sending message by pressing Enter key in the chat input field
chatInputField.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendChatBtn.click(); // Trigger the send button click
    }
});

// Listener for incoming chat messages from the server
socket.on('chat_message', (data) => {
    displayMessage(data.user, data.message, data.isSystem); // Display the message in chat
});

// Listener for the deal finalization event from the server
socket.on('deal_finalized', (data) => {
    dealFinalizedInfo.classList.remove('hidden'); // Show the deal finalized info section
    finalDealPriceSpan.textContent = `₹${data.finalPrice}/${currentProduct.unit}`; // Display final price
    supplierContactSpan.textContent = data.supplierContact; // Display supplier's contact
    vendorContactSpan.textContent = data.vendorContact; // Display vendor's contact
    dealDistanceSpan.textContent = data.distance; // Display distance
    displayMessage('System', 'Deal Finalized! Check details above.', true); // Add a system message to chat
    // Disable chat inputs after deal is finalized to prevent further messages
    chatInputField.disabled = true;
    sendChatBtn.disabled = true;
});


// --- Supplier Product Upload (Dummy) ---
// Handles adding new product listings by a supplier
addProductBtn.addEventListener('click', () => {
    // Ensure user is logged in AND their role is Supplier before allowing product addition
    if (!currentUserMobile || currentUserRole !== 'Supplier') {
        alert('Please login as a Supplier with your mobile number first to add products.');
        showSection(authSection); // Redirect to authentication section
        authTitle.textContent = "Login as Supplier"; // Set specific title for context
        authDescription.textContent = "Enter your mobile number to add products.";
        currentUserRole = 'Supplier'; // Set role for this context
        return;
    }

    const name = productNameInput.value.trim();
    const mrp = parseFloat(productMrpInput.value);
    const unit = productUnitInput.value.trim();
    const imageUrl = productImageInput.value.trim();

    // Basic validation for product details
    if (name && mrp && unit) {
        // In a real application, this would send data to the backend to add to a database permanently.
        // For this prototype, we're just simulating adding it to the UI locally for the supplier.
        const newProduct = {
            id: `p${Date.now()}`, // Simple unique ID for the prototype
            name,
            // Use logged-in user's profile name if available, otherwise just their mobile number
            supplier: currentUserProfile.name ? `${currentUserProfile.name} (${currentUserMobile})` : `Supplier (${currentUserMobile})`,
            mrp,
            unit,
            imageUrl: imageUrl || 'https://via.placeholder.com/150/CCCCCC/FFFFFF?text=No+Image' // Default image if none provided
        };

        // Display the new product in the supplier's own listed products section on the UI
        const supplierProductCard = document.createElement('div');
        supplierProductCard.classList.add('product-card');
        supplierProductCard.innerHTML = `
            <img src="${newProduct.imageUrl}" alt="${newProduct.name}">
            <div class="product-card-info">
                <h3>${newProduct.name}</h3>
                <p>Supplier: ${newProduct.supplier}</p>
                <p class="price">MRP: ₹${newProduct.mrp}/${newProduct.unit}</p>
            </div>
        `;
        // If it's the first product added by the supplier, remove the "No products listed yet" message
        if (supplierProductsDiv.querySelector('p')) {
            supplierProductsDiv.innerHTML = '';
        }
        supplierProductsDiv.appendChild(supplierProductCard); // Add the new card

        // Clear the form fields after adding the product
        productNameInput.value = '';
        productMrpInput.value = '';
        productUnitInput.value = '';
        productImageInput.value = '';
        alert('Product added successfully to your local view!'); // Inform the user
    } else {
        alert('Please fill in all required product details.'); // Alert if any required field is empty
    }
});


// --- Initial Load ---
// This function runs when the script first loads:
// 1. Loads any existing user data from localStorage (for persistent login).
// 2. Fetches and displays products on the home page.
loadUserData();
fetchProducts();

function showSuppliersForProduct(productId) {
  fetch(`/api/product-suppliers/${productId}`)
    .then(res => res.json())
    .then(suppliers => {
      const container = document.getElementById("supplierList");
      container.innerHTML = '';

      suppliers.forEach(s => {
        const card = document.createElement('div');
        card.className = "supplier-card";
        card.innerHTML = `
          <h4>${s.supplierName} (${s.distance} km away)</h4>
          <p>Price: ₹${s.price}/${s.unit}</p>
          <p>Rating: ${s.rating} ⭐</p>
          <button onclick="startChat('${s.supplierId}', '${s.supplierName}')">💬 Chat & Bargain</button>
        `;
        container.appendChild(card);
      });
    })
    .catch(err => {
      console.error("Error fetching suppliers:", err);
    });
}

document.querySelectorAll('.category-nav .nav-button').forEach(btn => {
    btn.addEventListener('click', () => {
        const category = btn.textContent.trim();
        if (category === "All Categories") {
            loadProducts(); // Already implemented function
        } else {
            fetch(`/api/products/category/${category}`)
                .then(res => res.json())
                .then(data => displayProducts(data));
        }
    });
});

