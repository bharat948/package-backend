const express = require('express');
const router = express.Router();
const { checkAuth, authorize } = require('../middleware/check-auth');
const PackageController = require('../controllers/packages');


router.get('/', checkAuth, PackageController.getAllPackages);

// POST create a new package
router.post('/', checkAuth, authorize('customer'),PackageController.createPackage);

// GET a single package by ID
router.get('/:packageId', checkAuth, PackageController.getPackageById);

// DELETE a package
router.delete('/', checkAuth, authorize('customer'), PackageController.deletePackagesForUser);
router.delete('/:packageId', checkAuth,authorize('customer'),PackageController.deletePackageById);

router.post('/near-by', checkAuth,authorize('driver'),PackageController.fetchNearByPackages);

router.post('/:packageId/confirm', checkAuth, authorize('driver'), PackageController.confirmPackageById);
router.post('/:packageId/complete', checkAuth,authorize('driver'), PackageController.completePackageById);

  router.get('/my-deliveries/history',checkAuth,authorize('driver'),PackageController.driversHistory);
router.get('/my-packages/confirmed', checkAuth, authorize('user'), PackageController.customerComfirmedPackages);
router.post('/:packageId/review', checkAuth, authorize('user'), PackageController.postRatingForDriver);
module.exports = router;
