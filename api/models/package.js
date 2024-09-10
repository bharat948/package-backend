const mongoose = require('mongoose');

const packageSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userName: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pickupLocation: { type: String, required: true },
  pickupCoordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  destination: { type: String, required: true },
  destinationCoordinates: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  estimatedDeliveryTime: { type: Date, required: true },
  estimatedPrice: { type: Number, required: true },
  deliverTo: { type: String, required: true },
  createdOn: { type: Date, required: true },
  deliveryDistance: { type: Number }
});

module.exports = mongoose.model('Package', packageSchema);
