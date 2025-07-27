// server.js

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const http = require('http'); // Required for Socket.IO
const socketIo = require('socket.io'); // For real-time chat simulation
const path = require('path'); // For serving static files
const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Initialize Socket.IO with the HTTP server

const PORT = process.env.PORT || 3000;

// Middleware to serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // To parse JSON request bodies

// --- Dummy Data (For Prototype Only) ---
// In a real application, this data would be managed in a database.
// This array is global so it can be accessed within Socket.IO logic for simulation.
const products = [
  { id: 'p1', name: 'Fresh Onions', category: 'Vegetables', supplier: 'A-Grade Veggies', mrp: 25, unit: 'kg', imageUrl: 'images/onion.png' },
  { id: 'p2', name: 'Premium Tomatoes', category: 'Vegetables', supplier: 'Green Farms', mrp: 40, unit: 'kg', imageUrl: 'https://rare-gallery.com/uploads/posts/859804-Closeup-Tomatoes-White-background.jpg' },
  { id: 'p3', name: 'Paneer Blocks', category: 'Dairy', supplier: 'Dairy Delights', mrp: 250, unit: 'kg', imageUrl: 'https://5.imimg.com/data5/ANDROID/Default/2020/9/JX/IE/SG/107337283/product-jpeg-500x500.png' },
  { id: 'p4', name: 'Chaat Masala', category: 'Spices', supplier: 'Spice Mart', mrp: 80, unit: 'pack', imageUrl: 'https://th.bing.com/th/id/OIP.LzpJ8xORtT0sOj06wS34KAHaE8?r=0&o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'p5', name: 'Potatoes (New Crop)', category: 'Vegetables', supplier: 'Farm Fresh Co.', mrp: 20, unit: 'kg', imageUrl: 'https://img.freepik.com/premium-photo/potato-hd-8k-wallpaper-stock-photographic-image_949228-19017.jpg' },
  { id: 'p6', name: 'Coriander Leaves', category: 'Vegetables', supplier: 'Local Greens', mrp: 15, unit: 'bunch', imageUrl: 'https://png.pngtree.com/background/20230607/original/pngtree-fresh-coriander-leaves-hanging-onto-a-black-surface-picture-image_2902530.jpg' },
  { id: 'p7', name: 'Carrots', category: 'Vegetables', supplier: 'Veggie Hub', mrp: 28, unit: 'kg', imageUrl: 'https://tse4.mm.bing.net/th/id/OIP.lW_Ca6FIXdDTR9iFtZauBQHaEu?r=0&w=596&h=380&rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'p8', name: 'Capsicum', category: 'Vegetables', supplier: 'Fresh Farm', mrp: 34, unit: 'kg', imageUrl: 'https://t4.ftcdn.net/jpg/02/87/25/37/360_F_287253716_I1seSRet5pt8YGBRRcTbPPV1WesM00n9.jpg' },
  { id: 'p9', name: 'Black Pepper', category: 'Spices', supplier: 'Spice Hub', mrp: 88, unit: 'pack', imageUrl: 'https://i.etsystatic.com/26866741/r/il/01b647/2872934319/il_1588xN.2872934319_4qgs.jpg' },
  { id: 'p10', name: 'Cumin Powder', category: 'Spices', supplier: 'Masala Mart', mrp: 92, unit: 'pack', imageUrl: 'https://tse3.mm.bing.net/th/id/OIP.foyGcU7KYge9ntfKWTMM4AHaE8?r=0&rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'p11', name: 'Cheese Cubes', category: 'Dairy', supplier: 'Dairy World', mrp: 310, unit: 'kg', imageUrl: 'https://tse2.mm.bing.net/th/id/OIP.tDag7JBRkoLY7-DYGn_9egHaE7?r=0&rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'p12', name: 'Milk (Full Cream)', category: 'Dairy', supplier: 'Dairy Fresh', mrp: 58, unit: 'liter', imageUrl: 'https://tse1.mm.bing.net/th/id/OIP.li8ZmdbN6Ja5MbDA63CaBAAAAA?r=0&w=474&h=346&rs=1&pid=ImgDetMain&o=7&rm=3https://tse1.mm.bing.net/th/id/OIP.li8ZmdbN6Ja5MbDA63CaBAAAAA?r=0&w=474&h=346&rs=1&pid=ImgDetMain&o=7&rm=3' },
  { id: 'p13', name: 'Wheat Flour', category: 'Grains', supplier: 'Grain Basket', mrp: 46, unit: 'kg', imageUrl: 'https://thumbs.dreamstime.com/b/wheat-flour-sack-ears-grains-table-golden-ripe-cereal-field-sunset-as-background-193017320.jpg' },
  { id: 'p14', name: 'Rice (Basmati)', category: 'Grains', supplier: 'Grain House', mrp: 72, unit: 'kg', imageUrl: 'https://5.imimg.com/data5/NR/UM/RM/SELLER-41632875/rice-500x500.png' }
];
// --- API Endpoints ---

// API to get all products or search by query parameter 'q'
app.get('/api/products/search', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(query) || p.supplier.toLowerCase().includes(query)
    );
    res.json(filteredProducts);
});

// --- Socket.IO for Chat Simulation ---
io.on('connection', (socket) => {
    console.log('A user connected for chat');

    // Handle 'join_chat' event from client
    socket.on('join_chat', (data) => {
        socket.join(data.chatRoom); // Client joins a specific chat room (identified by product ID)
        console.log(`User joined chat room: ${data.chatRoom}`);
        
        // Store user info directly on the socket object for this connection (for prototype simplicity)
        socket.userRole = data.role; // e.g., 'Vendor' or 'Supplier'
        socket.mobile = data.mobile; // Store their mobile number for later reveal

        // Find the product details for this chat room to include in the welcome message
        const productForChat = products.find(p => p.id === data.chatRoom);
        const productName = productForChat ? productForChat.name : 'this product';
        const productMRP = productForChat ? `MRP: ₹${productForChat.mrp}/${productForChat.unit}` : '';

        // Send a system welcome message to the client
        socket.emit('chat_message', {
            user: 'System',
            message: `Welcome to the chat for ${productName}! ${productMRP}. You can now negotiate the price.`,
            isSystem: true
        });
    });

    // Handle 'send_message' event from client
    socket.on('send_message', (data) => {
        console.log(`Message in room ${data.chatRoom} from ${data.user} (${data.mobile}): ${data.message}`);
        
        // Emit the received message to all clients in the same chat room
        io.to(data.chatRoom).emit('chat_message', { user: data.user, message: data.message });

        // Find the product related to this chat (needed for MRP in price simulation logic)
        const productForChat = products.find(p => p.id === data.chatRoom);
        if (!productForChat) {
            console.error('Product not found for chat room:', data.chatRoom);
            return; // Exit if product not found, preventing errors in simulation
        }

        // Simulate supplier's reply after a short delay
        if (data.user === 'Vendor') { // Assuming Vendor initiates the bargaining
            setTimeout(() => {
                let reply = '';
                let isDealFinal = false;
                let finalPrice = 0;

                // Basic logic to simulate price negotiation based on offered price vs. MRP
                if (data.message.toLowerCase().includes('₹')) {
                    const offeredPrice = parseInt(data.message.match(/₹(\d+)/)?.[1]); // Extract number after '₹'
                    
                    if (offeredPrice) {
                        if (offeredPrice < productForChat.mrp * 0.75) { // Offer too low (e.g., <75% of MRP)
                            reply = `Your offer of ₹${offeredPrice}/${productForChat.unit} is a bit low. The MRP is ₹${productForChat.mrp}. Can you increase it?`;
                        } else if (offeredPrice >= productForChat.mrp * 0.9) { // Offer is reasonable (e.g., >=90% of MRP)
                            reply = `That's a good offer of ₹${offeredPrice}/${productForChat.unit}! I accept. Let's finalize this.`;
                            isDealFinal = true;
                            finalPrice = offeredPrice;
                        } else { // Offer is between 75-90% of MRP
                            reply = `Hmm, for ₹${offeredPrice}/${productForChat.unit}, what quantity are you looking for? I can consider a little more.`;
                        }
                    } else {
                        reply = "Please specify your price offer clearly (e.g., '₹XX/kg')."; // If '₹' is present but no valid number
                    }
                } else if (data.message.toLowerCase().includes('hello') || data.message.toLowerCase().includes('hi')) {
                    reply = `Hello! This is ${productForChat.supplier}. The MRP for ${productForChat.name} is ₹${productForChat.mrp}/${productForChat.unit}. What is your offer?`;
                } else {
                    reply = `I'm here to help. The MRP is ₹${productForChat.mrp}/${productForChat.unit}. What is your offer?`;
                }

                // Emit supplier's simulated reply to the client
                io.to(data.chatRoom).emit('chat_message', { user: 'Supplier', message: reply });

                // If a deal is finalized, emit a special event with contact details
                if (isDealFinal) {
                    // For prototype, we use a fixed dummy supplier contact
                    // The vendor's contact is taken from the data sent by the client
                    const dummySupplierContact = '9876543210'; 
                    const dummyVendorContact = data.mobile; 
                    const dummyDistance = '5 km'; // Simplified distance for prototype

                    io.to(data.chatRoom).emit('deal_finalized', {
                        finalPrice: finalPrice,
                        supplierContact: dummySupplierContact,
                        vendorContact: dummyVendorContact,
                        distance: dummyDistance
                    });
                }
            }, 1500); // Simulate typing delay for supplier's response
        }
    });

    // Handle user disconnection from chat
    socket.on('disconnect', () => {
        console.log('A user disconnected from chat');
    });
});


// Start the HTTP server to listen for requests
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open your browser and navigate to http://localhost:${PORT}`);
});
// Simulated multi-supplier data for each product (temporary, in-memory)
const productSuppliersMap = {
    'p1': [
        { supplierId: 's1', supplierName: 'A-Grade Veggies', price: 24, unit: 'kg', distance: 3, rating: 4.5 },
        { supplierId: 's2', supplierName: 'Fresh Fields', price: 25, unit: 'kg', distance: 5, rating: 4.1 }
    ],
    'p2': [
        { supplierId: 's3', supplierName: 'Green Farms', price: 38, unit: 'kg', distance: 2, rating: 4.7 },
        { supplierId: 's4', supplierName: 'Veggie Point', price: 40, unit: 'kg', distance: 4, rating: 4.2 }
    ],
    'p3': [
        { supplierId: 's5', supplierName: 'Dairy Delights', price: 245, unit: 'kg', distance: 6, rating: 4.6 }
    ],
    'p4': [
        { supplierId: 's6', supplierName: 'Spice Mart', price: 75, unit: 'pack', distance: 1, rating: 4.3 }
    ],
    'p5': [
        { supplierId: 's7', supplierName: 'Farm Fresh Co.', price: 19, unit: 'kg', distance: 2.5, rating: 4.0 }
    ],
    'p6': [
        { supplierId: 's8', supplierName: 'Local Greens', price: 14, unit: 'bunch', distance: 1.2, rating: 4.4 }
    ],
    'p7': [
        { supplierId: 's9', supplierName: 'Veggie Hub', price: 28, unit: 'kg', distance: 3, rating: 4.2 }
    ],
    'p8': [
        { supplierId: 's10', supplierName: 'Fresh Farm', price: 34, unit: 'kg', distance: 2.8, rating: 4.4 }
    ],
    'p9': [
        { supplierId: 's11', supplierName: 'Spice Hub', price: 88, unit: 'pack', distance: 4, rating: 4.5 }
    ],
    'p10': [
        { supplierId: 's12', supplierName: 'Masala Mart', price: 92, unit: 'pack', distance: 3.5, rating: 4.6 }
    ],
    'p11': [
        { supplierId: 's13', supplierName: 'Dairy World', price: 310, unit: 'kg', distance: 5, rating: 4.3 }
    ],
    'p12': [
        { supplierId: 's14', supplierName: 'Dairy Fresh', price: 58, unit: 'liter', distance: 3.7, rating: 4.2 }
    ],
    'p13': [
        { supplierId: 's15', supplierName: 'Grain Basket', price: 46, unit: 'kg', distance: 4.5, rating: 4.1 }
    ],
    'p14': [
        { supplierId: 's16', supplierName: 'Grain House', price: 72, unit: 'kg', distance: 6, rating: 4.4 }
    ]
};


// New API to fetch suppliers for a given product ID
app.get('/api/product-suppliers/:productId', (req, res) => {
    const productId = req.params.productId;
    const suppliers = productSuppliersMap[productId];
    if (!suppliers) {
        return res.status(404).json({ message: 'No suppliers found for this product.' });
    }
    res.json(suppliers);
});
