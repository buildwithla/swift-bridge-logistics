const express = require('express');
const Shipment = require('../models/Shipment');

const router = express.Router();

router.get('/:trackingNumber', async (req, res) => {
    const { trackingNumber } = req.params;
    const shipment = await Shipment.findOne({ trackingNumber: trackingNumber.toUpperCase() });
    if (!shipment) {
        return res.status(404).json({ message: 'Shipment not found' });
    }

    res.json(shipment);
});

module.exports = router;
