const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: { type: String, required: true, unique: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    password: { type: String, required: true },
    roles: { type: [String], enum: ['customer', 'driver'], required: true },
    contactNumber: { type: String, required: true },
    address: { type: String, required: true },
    packages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Package' }] // Array of package IDs
});

module.exports = mongoose.model('User', userSchema);
