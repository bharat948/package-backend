async function getCoordinates(location) {
    const apiKey = 'd376faf854f8455a905b49040b997077'; // Replace with your OpenCage API key
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${apiKey}`;
    // const url =
    try {
        const response = await fetch(url);
        const data = await response.json();
        // console.log('API Response:', data);
        coords = {};
        if (data.results && data.results.length > 0) {
            coords = data.results[0].geometry;
            // lat = coords.lat;
            // lng = coords.lng;
            return coords;
        } else {
            throw new Error('Location not found in API response');
        }
    } catch (error) {
        console.error('Error in getCoordinates:', error);
        throw error;
    }
}
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

module.exports={
    getCoordinates,
    calculateDistance
};