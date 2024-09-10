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


module.exports=getCoordinates;