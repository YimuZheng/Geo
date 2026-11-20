// Target: the building entrance selected for this project.
const targetLat = 40.69305164764042;
const targetLon = -73.9874011248904;

// Distances are in meters. Adjust them after testing outdoors.
const CLOSE_DISTANCE = 50;
const NEAR_DISTANCE = 150;

const site = document.getElementById("site");
const message = document.getElementById("message");
const distanceText = document.getElementById("distance");
const statusText = document.getElementById("status");
const accuracyText = document.getElementById("accuracy");
const toggleButton = document.getElementById("toggleButton");

let watchId = null;
let lastState = "idle";

// The Haversine formula estimates the distance between two GPS coordinates.
function distanceInMeters(lat1, lon1, lat2, lon2) {
  const radians = degrees => degrees * Math.PI / 180;
  const earthRadius = 6371000;
  const deltaLat = radians(lat2 - lat1);
  const deltaLon = radians(lon2 - lon1);

  const a = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) *
    Math.sin(deltaLon / 2) ** 2;

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function showState(state, text) {
  site.dataset.state = state;
  if (lastState !== state) {
    message.textContent = text;
    message.classList.remove("updated");
    void message.offsetWidth; // Restart the fade-in when the message changes.
    message.classList.add("updated");
    lastState = state;
  }
}

function updateLocation(position) {
  const { latitude, longitude, accuracy } = position.coords;
  const meters = distanceInMeters(latitude, longitude, targetLat, targetLon);

  distanceText.textContent = `${Math.round(meters)} m from the entrance`;
  accuracyText.textContent = `Location accuracy: ±${Math.round(accuracy)} m`;
  statusText.textContent = "Tracking location";

  if (meters <= CLOSE_DISTANCE) {
    showState("found", "Welcome to IDM.");
  } else if (meters <= NEAR_DISTANCE) {
    showState("near", "You're getting closer.");
  } else {
    showState("far", "Not here yet.");
  }
}

function locationError(error) {
  const messages = {
    1: "Location permission denied. Check browser settings.",
    2: "Location unavailable. Try moving outdoors.",
    3: "Location timed out. Please try again."
  };

  statusText.textContent = "Location error";
  distanceText.textContent = messages[error.code] || "Unable to find your location.";
  accuracyText.textContent = "Check location settings or connectivity";

  // If permission is denied, stop the watch without hiding the error message.
  if (error.code === 1 && watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
    toggleButton.textContent = "Try again";
  }
}

function startTracking() {
  if (!window.isSecureContext) {
    statusText.textContent = "Location unavailable";
    distanceText.textContent = "Open this site using HTTPS.";
    return;
  }

  if (!navigator.geolocation) {
    statusText.textContent = "Location unavailable";
    distanceText.textContent = "Your browser does not support geolocation.";
    return;
  }

  statusText.textContent = "Finding your location...";
  distanceText.textContent = "Allow location access if prompted.";
  accuracyText.textContent = "Move outdoors for a better GPS signal";

  watchId = navigator.geolocation.watchPosition(
    updateLocation,
    locationError,
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
  );

  toggleButton.textContent = "Stop tracking";
}

function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  toggleButton.textContent = "Start tracking";
  statusText.textContent = "Location inactive";
}

toggleButton.addEventListener("click", () => {
  if (watchId === null) startTracking();
  else stopTracking();
});
