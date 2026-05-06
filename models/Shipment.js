const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
    trackingNumber: { type: String, required: true, unique: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    status: { type: String, required: true, default: 'Pending' },
    currentLocation: { type: String, required: true, default: 'Processing center' },
    timeline: { type: [String], required: true, default: ['Package Received'] }
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
