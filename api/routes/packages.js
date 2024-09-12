const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Package = require('../models/package');  // Import the Package model
const User = require('../models/user');  // Import the User model
const DriverRating = require('../models/driverRating');
const { checkAuth, authorize } = require('../middleware/check-auth');
const getCoordinates = require('../utils/getcoordinates');
// const User = require('../models/user');
// const calculateDistance = require('../utils/getcoordinates');
// GET all packages
const PackageController = require('../controllers/packages');
const JWT_KEY = process.env.JWT_KEY || 'your_secret_key';
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

router.get('/', checkAuth, PackageController.getAllPackages);

// POST create a new package
router.post('/', checkAuth, authorize('customer'),PackageController.createPackage);

// GET a single package by ID
router.get('/:packageId', checkAuth, PackageController.getPackageById);

// DELETE a package
router.delete('/', checkAuth, authorize('customer'), PackageController.deletePackagesForUser);
router.delete('/:packageId', checkAuth,authorize('customer'),PackageController.deletePackageById);

router.post('/near-by', checkAuth,authorize('driver'), async (req, res, next) => {
    console.log("hello");
    // console.log(req.body);
    const driverLocation = req.body.locationCoordinates;
    const maxDistance = req.body.range;
    console.log(maxDistance, driverLocation)
    const driverCoords = {
        lat: parseFloat(driverLocation.lat),
        lng: parseFloat(driverLocation.lng)
    };

    const packages = await Package.find({ status: 'open' });

    const packagesWithDistance = packages.map(pkg => {
        const distance_from_driver = calculateDistance(driverCoords, {
            lat: pkg.pickupCoordinates.lat,
            lng: pkg.pickupCoordinates.lng
        });
        return { ...pkg.toObject(), distance_from_driver };


    });
    res.status(200).json(packagesWithDistance);
});

router.post('/:packageId/confirm', checkAuth, authorize('driver'), async (req, res,next) => {
    try {
        const { packageId } = req.params;
        const driverId = req.userData.userId;

        const selectedPackage = await Package.findOne({
            _id: packageId,
            status: 'open'
        });

        if (!selectedPackage) {
            return res.status(404).json({ message: 'Package not found or already confirmed' });
        }

        // Update the package status to confirmed and assign the driver
        selectedPackage.status = 'confirmed';
        selectedPackage.driver = driverId;
        selectedPackage.confirmedAt = Date.now(); // Set the confirmation time
        await selectedPackage.save();

        res.status(200).json({ message: 'Package confirmed successfully', selectedPackage });
    } catch (error) {
        res.status(500).json({ message: 'Error confirming package', error });
    }
});
router.post('/:packageId/complete', checkAuth,authorize('driver'), async (req, res,next) => {
    try {
        const { packageId } = req.params;
        const driverId = req.userData.userId;
  
        const selectedPackage = await Package.findOne({
            _id: packageId,
            driver: driverId, // Ensure the driver is the one who confirmed it
            status: 'confirmed'
        });
  
        if (!selectedPackage) {
            return res.status(404).json({ message: 'Package not found or already completed' });
        }
  
        // Mark the package as completed and set the completion timestamp
        selectedPackage.status = 'completed';
        selectedPackage.completedAt = Date.now();
  
        await selectedPackage.save();
  
        res.status(200).json({ message: 'Package marked as completed', selectedPackage });
    } catch (error) {
        res.status(500).json({ message: 'Error completing package', error });
    }
  });

  router.get('/my-deliveries/history',checkAuth,authorize('driver'), async (req, res,next) => {
    try {
        const driverId = req.userData.userId;
 
        const completedPackages = await Package.find({
            driver: driverId,
            status: 'completed'
        }).populate('owner', 'name email') // Optionally get the owner details
          .sort({ completedAt: -1 }); // Sort by most recent deliveries
 
        res.status(200).json(completedPackages);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching delivery history', error });
    }
});
router.get('/my-packages/confirmed', checkAuth, authorize('user'), async (req, res,next) => {
    try {
        const userId = req.userData.userId;
 
        const confirmedPackages = await Package.find({
            owner: userId,
            status: 'confirmed',
            confirmedAt: { $ne: null } // Packages that have been confirmed
        }).populate('driver', 'name email'); // Optionally, get driver details
 
        res.status(200).json(confirmedPackages);
    } catch (error) {
        res.status(500).json({ message: 'Error checking confirmed packages', error });
    }
});
router.post('/:packageId/review', checkAuth, authorize('user'), async (req, res) => {
    try {
        const { packageId } = req.params;
        const { rating, review } = req.body;
        const userId = req.user._id;
 
        // Ensure the user is reviewing a completed package
        const completedPackage = await Package.findOne({
            _id: packageId,
            owner: userId,
            status: 'completed'
        });
 
        if (!completedPackage) {
            return res.status(400).json({ message: 'Package not found or not completed' });
        }
 
        const driverId = completedPackage.driver;
 
        // Update the driver's rating and review
        await DriverRating.create({
            driver: driverId,
            user: userId,
            package: packageId,
            rating,
            review
        });
 
        res.status(200).json({ message: 'Review submitted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error submitting review', error });
    }
});
module.exports = router;
