const Package = require('../models/package');

const getAllPackages = (req, res, next) => {
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
}


const createPackage =  async (req, res, next) => {
    const { pickupLocationName, destinationName, estimatedDeliveryTime, estimatedPrice, deliverTo, userName } = req.body;

    // Fetch coordinates for pickup and destination locations
    const pickupCoordinates = await getCoordinates(pickupLocationName);
    const destinationCoordinates = await getCoordinates(destinationName);
    // console.log(req.userData);
    console.log(pickupCoordinates, destinationCoordinates)
    const userId = req.userData.userId;
    console.log(userId);
    const newPackage = new Package({
        _id: new mongoose.Types.ObjectId(),
        userName,
        userId,
        pickupLocationName,
        pickupCoordinates,
        destinationName,
        destinationCoordinates,
        estimatedDeliveryTime,
        estimatedPrice,
        deliverTo,
        createdOn: new Date(),
        deliveryDistance: calculateDistance(pickupCoordinates, destinationCoordinates) // Assuming you calculate distance here
    });
    console.log(newPackage);
    await newPackage
        .save()
        .then(result => {
            console.log("hello");
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
}


const getPackageById = (req, res, next) => {
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
}

const deletePackagesForUser = async (req, res, next) => {
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
}


const deletePackageById = async (req, res, next) => {
    const id = req.params.packageId;
    await Package.deleteOne({ _id: id })
        .exec()
        .then(result => {
            res.status(200).json({ message: 'Package deleted' });
        })
        .catch(err => {
            res.status(500).json({ error: err });
        });
}

const fetchNearByPackages = async (req, res, next) => {
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
}


const confirmPackageById = async (req, res,next) => {
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
}

const completePackageById = async (req, res,next) => {
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
  }


const driversHistory =  async (req, res,next) => {
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
}


const customerComfirmedPackages = async (req, res,next) => {
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
}


const postRatingForDriver = async (req, res) => {
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
}
module.exports = {
  getAllPackages,
  createPackage,
  getPackageById,
  deletePackagesForUser,
  deletePackageById,
  fetchNearByPackages,
  confirmPackageById,
  completePackageById,
  driversHistory,
  customerComfirmedPackages,
  postRatingForDriver
};
