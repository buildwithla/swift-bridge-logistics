const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

const authRoutes = require('./routes/auth');
const shipmentRoutes = require('./routes/shipments');
const trackRoutes = require('./routes/track');
const User = require('./models/User');
const Shipment = require('./models/Shipment');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '')));

app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/track', trackRoutes);

app.get('/api/brand', (req, res) => {
    res.json({
        company: 'Swift Bridge Logistics',
        tagline: 'Bridging Distances. Delivering Promises.',
        colors: {
            dark: '#0D1B2A',
            blue: '#1B365D',
            accent: '#FF6A00',
            text: '#6B7280',
            surface: '#F2F4F7'
        }
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swiftbridge';
const port = process.env.PORT || 4000;

async function seedDemoData() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@swiftbridge.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const userCount = await User.countDocuments();
    if (userCount === 0) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await User.create({ email: adminEmail, password: hashedPassword, role: 'admin' });
        console.log(`Seeded admin user: ${adminEmail}`);
    }

    const existingShipment = await Shipment.findOne({ trackingNumber: 'US33BGH0001' });
    if (!existingShipment) {
        await Shipment.create({
            trackingNumber: 'US33BGH0001',
            from: 'Los Angeles, CA',
            to: 'New York, NY',
            status: 'Delivered',
            currentLocation: 'Delivered to recipient',
            timeline: [
                'Package Received',
                'In Transit',
                'Out for Delivery',
                'Delivered'
            ]
        });
        console.log('Seeded demo shipment US33BGH0001');
    }
}

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('Connected to MongoDB');
        await seedDemoData();
        app.listen(port, () => {
            console.log(`Swift Bridge Logistics app listening on http://localhost:${port}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
