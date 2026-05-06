const express = require('express');
const authMiddleware = require('../middleware/auth');
const Shipment = require('../models/Shipment');

const router = express.Router();

router.get('/public', async (req, res) => {
    const shipments = await Shipment.find().sort({ createdAt: -1 });
    res.json(shipments);
});

router.use(authMiddleware);

function generateTrackingNumber() {
    const prefix = 'US';
    const random = Math.floor(100000 + Math.random() * 900000).toString();
    return `${prefix}${random}`;
}

router.get('/', async (req, res) => {
    const shipments = await Shipment.find().sort({ createdAt: -1 });
    res.json(shipments);
});

router.post('/', async (req, res) => {
    const { from, to, status, currentLocation } = req.body;
    if (!from || !to || !status || !currentLocation) {
        return res.status(400).json({ message: 'All shipment fields are required' });
    }

    let trackingNumber = generateTrackingNumber();
    while (await Shipment.exists({ trackingNumber })) {
        trackingNumber = generateTrackingNumber();
    }

    const shipment = await Shipment.create({
        trackingNumber,
        from,
        to,
        status,
        currentLocation,
        timeline: ['Package Received']
    });

    res.status(201).json(shipment);
});

// New route for creating shipment with optional tracking number
router.post('/create-shipment', async (req, res) => {
    const { trackingNumber, from, to, status } = req.body;
    if (!from || !to || !status) {
        return res.status(400).json({ message: 'From, to, and status are required' });
    }

    let finalTrackingNumber = trackingNumber;
    if (!finalTrackingNumber) {
        finalTrackingNumber = generateTrackingNumber();
        while (await Shipment.exists({ trackingNumber: finalTrackingNumber })) {
            finalTrackingNumber = generateTrackingNumber();
        }
    } else if (await Shipment.exists({ trackingNumber: finalTrackingNumber })) {
        return res.status(400).json({ message: 'Tracking number already exists' });
    }

    const shipment = await Shipment.create({
        trackingNumber: finalTrackingNumber,
        from,
        to,
        status,
        currentLocation: 'Processing center',
        timeline: ['Package Received']
    });

    res.status(201).json(shipment);
});

// New route for updating status by tracking number
router.put('/update-status', async (req, res) => {
    const { trackingNumber, status } = req.body;
    if (!trackingNumber || !status) {
        return res.status(400).json({ message: 'Tracking number and status are required' });
    }

    const shipment = await Shipment.findOne({ trackingNumber });
    if (!shipment) {
        return res.status(404).json({ message: 'Shipment not found' });
    }

    shipment.status = status;
    shipment.currentLocation = getLocationByStatus(status);
    shipment.timeline = getTimelineByStatus(status);

    await shipment.save();
    res.json(shipment);
});

function getLocationByStatus(status) {
    const map = {
        'Package Received': 'Processing center',
        'In Transit': 'In transit',
        'Out for Delivery': 'Out for delivery',
        'Delivered': 'Delivered to recipient'
    };
    return map[status] || 'Unknown';
}

function getTimelineByStatus(status) {
    const map = {
        'Package Received': ['Package Received'],
        'In Transit': ['Package Received', 'In Transit'],
        'Out for Delivery': ['Package Received', 'In Transit', 'Out for Delivery'],
        'Delivered': ['Package Received', 'In Transit', 'Out for Delivery', 'Delivered']
    };
    return map[status] || ['Package Received'];
}

router.patch('/:id', async (req, res) => {
    const { id } = req.params;
    const { status, currentLocation, timeline } = req.body;

    const shipment = await Shipment.findById(id);
    if (!shipment) {
        return res.status(404).json({ message: 'Shipment not found' });
    }

    if (status) shipment.status = status;
    if (currentLocation) shipment.currentLocation = currentLocation;
    if (timeline && Array.isArray(timeline)) shipment.timeline = timeline;

    await shipment.save();
    res.json(shipment);
});

router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const shipment = await Shipment.findById(id);
    if (!shipment) {
        return res.status(404).json({ message: 'Shipment not found' });
    }

    await shipment.deleteOne();
    res.json({ message: 'Shipment deleted' });
});

module.exports = router;
