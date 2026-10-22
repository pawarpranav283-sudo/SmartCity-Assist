// ==============================================================================
// CivicFix AI 2.0 - Geolocation, Reverse Geocoding & Duplicate Detection
// ==============================================================================

import { Config } from "./config.js";

export const GeoService = {
  // Get current device position using browser Geolocation API
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation is not supported by your browser."));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          let msg = "Failed to retrieve location.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              msg = "Location permission was denied. Please select location manually on the map.";
              break;
            case error.POSITION_UNAVAILABLE:
              msg = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              msg = "Location request timed out.";
              break;
          }
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  },

  // Reverse Geocoding using OpenStreetMap Nominatim
  async reverseGeocode(latitude, longitude) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: { "Accept-Language": "en" },
      });

      if (!response.ok) {
        return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      }

      const data = await response.json();
      if (data && data.display_name) {
        // Return cleaned up short address
        const parts = data.display_name.split(",").map((s) => s.trim());
        return parts.slice(0, 4).join(", ");
      }
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  },

  // Calculate distance between two coordinates in meters (Haversine Formula)
  calculateDistanceMeters(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  },

  // Token-based Jaccard similarity for description and title
  calculateTextSimilarity(textA, textB) {
    if (!textA || !textB) return 0;
    const tokenize = (t) =>
      new Set(
        t
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, "")
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );

    const setA = tokenize(textA);
    const setB = tokenize(textB);
    if (!setA.size || !setB.size) return 0;

    const intersection = new Set([...setA].filter((x) => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  },

  // Find potential duplicates among active complaints
  findPotentialDuplicates(candidate, existingList, thresholdMeters = Config.duplicateProximityMeters) {
    const duplicates = [];

    for (const item of existingList) {
      // Ignore resolved or rejected issues for duplicate active alerts
      if (item.status === "Resolved" || item.status === "Rejected") continue;
      if (candidate.id && item.id === candidate.id) continue;

      let distance = null;
      let isNearby = false;

      if (candidate.latitude && candidate.longitude && item.latitude && item.longitude) {
        distance = this.calculateDistanceMeters(
          candidate.latitude,
          candidate.longitude,
          item.latitude,
          item.longitude
        );
        isNearby = distance <= thresholdMeters;
      }

      const sameCategory = candidate.category && item.category && candidate.category === item.category;
      const titleSim = this.calculateTextSimilarity(candidate.title, item.title);
      const descSim = this.calculateTextSimilarity(candidate.description, item.description);
      const textMatch = titleSim > 0.35 || descSim > 0.3;

      // Flag if geographically close with same category OR high text similarity
      if ((isNearby && sameCategory) || (isNearby && textMatch) || (textMatch && sameCategory)) {
        duplicates.push({
          existingComplaint: item,
          distanceMeters: distance,
          isNearby,
          sameCategory,
          similarityScore: Math.max(titleSim, descSim),
        });
      }
    }

    return duplicates.sort((a, b) => (a.distanceMeters ?? 99999) - (b.distanceMeters ?? 99999));
  },
};
