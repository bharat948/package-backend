const mongoose = require('mongoose');

const driverRatingSchema = new mongoose.Schema({
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'Package', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String }
});
 
module.exports = mongoose.model('DriverRating', driverRatingSchema);