// ==============================================================================
// CivicFix AI 2.0 - Interactive Map View (Leaflet + OpenStreetMap)
// ==============================================================================

import { Config } from "./config.js";

let mainMap = null;
let markerLayerGroup = null;
let miniPickerMap = null;
let miniPickerMarker = null;

// Color mapping for marker badges
const STATUS_COLORS = {
  Pending: "#64748b",
  "In Review": "#6366f1",
  "In Progress": "#f59e0b",
  Resolved: "#10b981",
  Rejected: "#94a3b8",
};

export const MapView = {
  // Initialize the main interactive map
  initMainMap(containerId = "leaflet-map", onMarkerClick = null) {
    if (typeof L === "undefined") {
      console.warn("Leaflet library is not loaded.");
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) return;

    if (mainMap) {
      mainMap.remove();
      mainMap = null;
    }

    mainMap = L.map(containerId).setView(Config.defaultMapCenter, Config.defaultZoom);

    // OpenStreetMap standard tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mainMap);

    markerLayerGroup = L.layerGroup().addTo(mainMap);

    // Ensure Leaflet recalculates dimensions when tab/view switches
    setTimeout(() => {
      mainMap.invalidateSize();
    }, 200);

    return mainMap;
  },

  // Render complaint markers on the main map
  renderComplaints(complaints, onDetailsRequest = null) {
    if (!mainMap || !markerLayerGroup) return;

    markerLayerGroup.clearLayers();
    const validCoords = [];

    complaints.forEach((issue) => {
      if (!issue.latitude || !issue.longitude) return;

      const lat = parseFloat(issue.latitude);
      const lng = parseFloat(issue.longitude);
      if (isNaN(lat) || isNaN(lng)) return;

      validCoords.push([lat, lng]);

      // Create custom SVG Pin Marker
      const statusColor = STATUS_COLORS[issue.status] || "#087f8c";
      const customIcon = L.divIcon({
        className: "custom-map-pin",
        html: `
          <div style="
            background-color: ${statusColor};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 3px 8px rgba(0,0,0,0.3);
            cursor: pointer;
          ">
            <span style="transform: rotate(45deg); font-size: 14px; color: white;">📍</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      // Create rich popup card
      const popupHtml = `
        <div style="min-width: 220px; font-family: inherit;">
          ${
            issue.image_url
              ? `<img src="${issue.image_url}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;">`
              : ""
          }
          <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">
            ${issue.tracking_id || "Civic Issue"} • ${issue.category}
          </div>
          <h6 style="font-weight: 700; margin: 4px 0 6px 0; font-size: 14px;">${issue.title}</h6>
          <div style="margin-bottom: 8px;">
            <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; border: 1px solid #cbd5e1; font-weight: 600;">
              Status: ${issue.status}
            </span>
            <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background: #fef3c7; border: 1px solid #fcd34d; font-weight: 600; margin-left: 4px;">
              ${issue.priority} Priority
            </span>
          </div>
          <p style="font-size: 12px; color: #475569; margin-bottom: 10px; line-height: 1.3;">
            ${(issue.description || "").slice(0, 90)}...
          </p>
          <button id="popup-btn-${issue.id}" class="btn btn-sm btn-outline-primary w-100" style="font-size: 12px; padding: 4px 8px;">
            View Full Report →
          </button>
        </div>
      `;

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        const btn = document.getElementById(`popup-btn-${issue.id}`);
        if (btn && onDetailsRequest) {
          btn.addEventListener("click", () => {
            onDetailsRequest(issue);
          });
        }
      });

      markerLayerGroup.addLayer(marker);
    });

    // Auto fit map bounds if multiple markers exist
    if (validCoords.length > 1) {
      mainMap.fitBounds(validCoords, { padding: [40, 40] });
    } else if (validCoords.length === 1) {
      mainMap.setView(validCoords[0], 14);
    }
  },

  // Mini Map Picker on Issue Submission Form
  initMiniPicker(containerId = "mini-picker-map", onLocationPicked = null) {
    if (typeof L === "undefined") return;

    const container = document.getElementById(containerId);
    if (!container) return;

    if (miniPickerMap) {
      miniPickerMap.remove();
      miniPickerMap = null;
    }

    miniPickerMap = L.map(containerId).setView(Config.defaultMapCenter, 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
    }).addTo(miniPickerMap);

    // Click handler to drop a pin
    miniPickerMap.on("click", (e) => {
      const { lat, lng } = e.latlng;
      MapView.setMiniPickerLocation(lat, lng);
      if (onLocationPicked) {
        onLocationPicked(lat, lng);
      }
    });

    setTimeout(() => {
      miniPickerMap.invalidateSize();
    }, 200);

    return miniPickerMap;
  },

  // Update pin position on mini map
  setMiniPickerLocation(lat, lng) {
    if (!miniPickerMap) return;

    if (miniPickerMarker) {
      miniPickerMarker.setLatLng([lat, lng]);
    } else {
      miniPickerMarker = L.marker([lat, lng], { draggable: true }).addTo(miniPickerMap);
      miniPickerMarker.on("dragend", (event) => {
        const position = event.target.getLatLng();
        const latInput = document.getElementById("issue-lat");
        const lngInput = document.getElementById("issue-lng");
        if (latInput) latInput.value = position.lat.toFixed(6);
        if (lngInput) lngInput.value = position.lng.toFixed(6);
      });
    }

    miniPickerMap.setView([lat, lng], 15);
  },

  // Refresh sizes when tabs change
  refreshSizes() {
    if (mainMap) mainMap.invalidateSize();
    if (miniPickerMap) miniPickerMap.invalidateSize();
  },
};
