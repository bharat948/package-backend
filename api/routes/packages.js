const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Package = require('../models/package');  // Import the Package model
const User = require('../models/user');  // Import the User model
const checkAuth = require('../middleware/check-auth');
const getCoordinates = require('../utils/getcoordinates');
// const User = require('../models/user');
// const calculateDistance = require('../utils/getcoordinates');
// GET all packages
const calculateDistance = (coord1, coord2) => {
    const toRadians = (degree) => degree * (Math.PI / 180);
    const R = 6371; // Earth's radius in kilometers

    const lat1 = coord1.lat;
    const lng1 = coord1.lng;
    const lat2 = coord2.lat;
    const lng2 = coord2.lng;

    const dLat = toRadians(lat2 - lat1);
    const dLng = toRadians(lng2 - lng1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c; // Distance in kilometers
};

router.get('/', checkAuth, (req, res, next) => {
    Package.find()
        .exec()
        .then(packages => {
            res.status(200).json({
                count: packages.length,
                packages: packages
            });
        })
        .catch(err => {
            res.status(500).json({ error: err });
        });
});

// POST create a new package
router.post('/', checkAuth, async (req, res, next) => {
    const { pickupLocation, destination, estimatedDeliveryTime, estimatedPrice, deliverTo, userName } = req.body;
    
    // Fetch coordinates for pickup and destination locations
    const pickupCoordinates = await getCoordinates(pickupLocation);
    const destinationCoordinates = await getCoordinates(destination);
    // console.log(req.userData);
    console.log(pickupCoordinates,destinationCoordinates)
    const userId = req.userData.userId;
    console.log(userId);
    const newPackage = new Package({
      _id: new mongoose.Types.ObjectId(),
      userName,
      userId,
      pickupLocation,
      pickupCoordinates,
      destination,
      destinationCoordinates,
      estimatedDeliveryTime,
      estimatedPrice,
      deliverTo,
      createdOn: new Date(),
      deliveryDistance: calculateDistance(pickupCoordinates, destinationCoordinates) // Assuming you calculate distance here
    });

    await newPackage
        .save()
        .then(result => {
            // After saving package, add the packageId to the user’s packages array
            return User.findByIdAndUpdate(
                req.userData.userId,
                { $push: { packages: result._id } },  // Push package ID to user's packages array
                { new: true }
            ).exec();
        })
        .then(user => {
            res.status(201).json({
                message: 'Package created successfully',
                createdPackage: newPackage,
                user: user  // Updated user with the new package reference
            });
        })
        .catch(err => {
            console.error("Error occurred:", err.message || err);
            res.status(500).json({ error: err });

        });
});

// GET a single package by ID
router.get('/:packageId', checkAuth, (req, res, next) => {
    const id = req.params.packageId;
    Package.findById(id)
        .exec()
        .then(doc => {
            if (doc) {
                res.status(200).json(doc);
            } else {
                res.status(404).json({ message: 'No valid entry found for provided ID' });
            }
        })
        .catch(err => {
            res.status(500).json({ error: err });
        });
});

// DELETE a package
router.delete('/', checkAuth, async (req, res, next) => {
    const userId = req.userData.userId;

    try {
        // Check if the user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete all packages associated with the user
        const result = await Package.deleteMany({ userId: userId });
        console.log('Packages Deleted:', result);

        // Optionally, update the user to remove package references
        await User.findByIdAndUpdate(userId, { $set: { packages: [] } }).exec();

        res.status(200).json({
            message: 'All packages for the user have been deleted',
            deletedCount: result.deletedCount
        });
    } catch (err) {
        console.error('Error deleting packages:', err);
        res.status(500).json({ error: err.message || err });
    }
});
router.delete('/:packageId', checkAuth, (req, res, next) => {
    const id = req.params.packageId;
    Package.deleteOne({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json({ message: 'Package deleted' });
        })
        .catch(err => {
            res.status(500).json({ error: err });
        });
});

module.exports = router;
