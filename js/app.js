// ==============================================================================
// CivicFix AI 2.0 - Main Application Controller
// Orchestrates views, state, submissions, Leaflet maps, AI analysis, and audit trails
// ==============================================================================

import { Config } from "./config.js";
import { Auth } from "./auth.js";
import { ComplaintsStore } from "./complaints-store.js";
import { GeoService } from "./geo-service.js";
import { GeminiService } from "./gemini-service.js";
import { MapView } from "./map-view.js";

// Global Application State
const state = {
  currentView: "home",
  currentUser: null,
  complaints: [],
  selectedComplaint: null,
  activeImageBase64: null,
  activeImageMime: null,
  aiAnalysisResult: null,
  activeMapFilter: { category: "All", status: "All", query: "" },
  activeDashboardFilter: { status: "All", query: "" },
  activeAdminFilter: { status: "All", category: "All", priority: "All", query: "" },
};

// DOM Selector Helper
const $ = (id) => document.getElementById(id);

// Notification Toasts
function showToast(message, type = "info") {
  const toastContainer = $("toast-container");
  if (!toastContainer) return;

  const bgClass =
    type === "success"
      ? "bg-success text-white"
      : type === "danger"
      ? "bg-danger text-white"
      : type === "warning"
      ? "bg-warning text-dark"
      : "bg-primary text-white";

  const toastEl = document.createElement("div");
  toastEl.className = `toast align-items-center ${bgClass} border-0 mb-2 shadow`;
  toastEl.setAttribute("role", "alert");
  toastEl.setAttribute("aria-live", "assertive");
  toastEl.setAttribute("aria-atomic", "true");
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body fw-semibold">${message}</div>
      <button type="button" class="btn-close ${type !== "warning" ? "btn-close-white" : ""} me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);
  if (window.bootstrap && window.bootstrap.Toast) {
    const bsToast = new window.bootstrap.Toast(toastEl, { delay: 4500 });
    bsToast.show();
    toastEl.addEventListener("hidden.bs.toast", () => toastEl.remove());
  } else {
    setTimeout(() => toastEl.remove(), 4500);
  }
}

// Format Dates
function formatDate(dateStr) {
  if (!dateStr) return "Just now";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ------------------------------------------------------------------------------
// VIEW NAVIGATION
// ------------------------------------------------------------------------------
function switchView(viewName) {
  state.currentView = viewName;

  const views = ["home", "report", "map", "dashboard", "admin"];
  views.forEach((v) => {
    const el = $(`view-${v}`);
    if (el) el.classList.toggle("d-none", v !== viewName);

    const navBtn = $(`nav-${v}`);
    if (navBtn) navBtn.classList.toggle("active", v === viewName);
  });

  // Scroll to top
  window.scrollTo({ top: 0, behavior: "smooth" });

  // View specific activations
  if (viewName === "map") {
    setTimeout(() => {
      MapView.initMainMap("leaflet-map");
      applyMapFilters();
    }, 150);
  } else if (viewName === "report") {
    setTimeout(() => {
      MapView.initMiniPicker("mini-picker-map", async (lat, lng) => {
        $("issue-lat").value = lat.toFixed(6);
        $("issue-lng").value = lng.toFixed(6);
        const addr = await GeoService.reverseGeocode(lat, lng);
        $("issue-address").value = addr;
        checkDuplicateOnInput();
      });
    }, 150);
  } else if (viewName === "dashboard") {
    renderCitizenDashboard();
  } else if (viewName === "admin") {
    renderAdminPortal();
  }
}

// ------------------------------------------------------------------------------
// REFRESH DATA & METRICS
// ------------------------------------------------------------------------------
async function reloadData() {
  state.complaints = await ComplaintsStore.getAll();
  renderStats();
  if (state.currentView === "dashboard") renderCitizenDashboard();
  if (state.currentView === "admin") renderAdminPortal();
  if (state.currentView === "map") applyMapFilters();
}

function renderStats() {
  const stats = ComplaintsStore.calculateStats(state.complaints);
  if ($("stat-total")) $("stat-total").textContent = stats.total;
  if ($("stat-pending")) $("stat-pending").textContent = stats.pending;
  if ($("stat-progress")) $("stat-progress").textContent = stats.inProgress;
  if ($("stat-resolved")) $("stat-resolved").textContent = stats.resolved;

  if ($("badge-map-count")) $("badge-map-count").textContent = `${stats.total} Active Issues`;
}

// ------------------------------------------------------------------------------
// CITIZEN DASHBOARD
// ------------------------------------------------------------------------------
function renderCitizenDashboard() {
  const container = $("dashboard-cards-container");
  if (!container) return;

  const q = ($("dashboard-search")?.value || "").toLowerCase().trim();
  const statusFilter = state.activeDashboardFilter.status;

  const filtered = state.complaints.filter((c) => {
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    const matchQ =
      !q ||
      [c.title, c.category, c.address, c.tracking_id, c.description]
        .some((val) => (val || "").toLowerCase().includes(q));
    return matchStatus && matchQ;
  });

  container.innerHTML = "";

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-12 py-5 text-center text-secondary">
        <div style="font-size: 3rem;">📋</div>
        <h5 class="fw-bold mt-2">No Reports Found</h5>
        <p class="small">No complaints match your selected filters. Report a new issue to get started.</p>
        <button class="btn btn-main btn-sm mt-2" onclick="window.CivicFixApp.switchView('report')">
          + Report an Issue
        </button>
      </div>
    `;
    return;
  }

  filtered.forEach((issue) => {
    const cardCol = document.createElement("div");
    cardCol.className = "col-md-6 col-lg-4";

    const priorityClass = `badge-priority-${(issue.priority || "Medium").toLowerCase()}`;
    const statusClass = `badge-status-${(issue.status || "Pending").toLowerCase().replace(/\s+/g, "")}`;

    cardCol.innerHTML = `
      <div class="issue-card h-100">
        ${
          issue.image_url
            ? `<img src="${issue.image_url}" class="card-thumb" alt="${issue.title}" loading="lazy">`
            : `<div class="card-thumb d-flex align-items-center justify-content-center text-secondary fw-semibold">No Image Provided</div>`
        }
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge ${priorityClass} px-2 py-1 rounded-pill small fw-semibold">
            ${issue.priority} Priority
          </span>
          <span class="badge ${statusClass} px-2 py-1 rounded-pill small fw-semibold">
            ${issue.status}
          </span>
        </div>
        <h6 class="fw-bold text-dark mb-1 text-truncate" title="${issue.title}">${issue.title}</h6>
        <div class="small text-secondary mb-2">
          <span>🏷️ ${issue.category}</span> • <span>📍 ${issue.address ? issue.address.slice(0, 30) : "Location"}...</span>
        </div>
        <p class="small text-muted mb-3 flex-grow-1" style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
          ${issue.description}
        </p>
        ${
          issue.ai_analysis
            ? `<div class="mb-3">
                 <span class="ai-badge">🤖 AI Verified: ${issue.ai_analysis.safety_severity || "Severity"}</span>
               </div>`
            : ""
        }
        <div class="d-flex justify-content-between align-items-center pt-2 border-top mt-auto">
          <small class="text-secondary font-monospace" style="font-size: 0.75rem;">${issue.tracking_id || "CFX"}</small>
          <button class="btn btn-outline-navy btn-sm" onclick="window.CivicFixApp.openDetailsModal('${issue.id}')">
            View Details →
          </button>
        </div>
      </div>
    `;

    container.appendChild(cardCol);
  });
}

// ------------------------------------------------------------------------------
// LEAFLET MAP FILTERS & DISPLAY
// ------------------------------------------------------------------------------
function applyMapFilters() {
  const catFilter = $("map-filter-category")?.value || "All";
  const statusFilter = $("map-filter-status")?.value || "All";

  const filtered = state.complaints.filter((c) => {
    const matchCat = catFilter === "All" || c.category === catFilter;
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchCat && matchStatus;
  });

  MapView.renderComplaints(filtered, (issue) => {
    openDetailsModal(issue.id);
  });
}

// ------------------------------------------------------------------------------
// ADMIN PORTAL
// ------------------------------------------------------------------------------
function renderAdminPortal() {
  const tbody = $("admin-table-body");
  if (!tbody) return;

  const q = ($("admin-search")?.value || "").toLowerCase().trim();
  const statusFilter = $("admin-filter-status")?.value || "All";
  const catFilter = $("admin-filter-category")?.value || "All";

  const filtered = state.complaints.filter((c) => {
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    const matchCat = catFilter === "All" || c.category === catFilter;
    const matchQ =
      !q ||
      [c.title, c.category, c.address, c.tracking_id, c.reporter_name]
        .some((val) => (val || "").toLowerCase().includes(q));
    return matchStatus && matchCat && matchQ;
  });

  tbody.innerHTML = "";

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-secondary">No complaints match criteria.</td></tr>`;
    return;
  }

  filtered.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-monospace fw-bold small text-primary">${c.tracking_id || "CFX"}</td>
      <td>
        <div class="fw-semibold text-dark">${c.title}</div>
        <small class="text-secondary">${c.address ? c.address.slice(0, 35) : "Location"}...</small>
      </td>
      <td><span class="badge text-bg-light border">${c.category}</span></td>
      <td>
        <span class="badge badge-priority-${(c.priority || "Medium").toLowerCase()}">
          ${c.priority}
        </span>
      </td>
      <td>
        <span class="badge badge-status-${(c.status || "Pending").toLowerCase().replace(/\s+/g, "")}">
          ${c.status}
        </span>
      </td>
      <td class="small text-secondary">${formatDate(c.created_at)}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="window.CivicFixApp.openAdminActionModal('${c.id}')">
          Triage & Update
        </button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// ------------------------------------------------------------------------------
// COMPLAINT DETAILS & AUDIT TIMELINE MODAL
// ------------------------------------------------------------------------------
function openDetailsModal(complaintId) {
  const issue = state.complaints.find((c) => c.id === complaintId);
  if (!issue) return;

  state.selectedComplaint = issue;

  if ($("modal-detail-tracking")) $("modal-detail-tracking").textContent = issue.tracking_id || "CFX-RECORD";
  if ($("modal-detail-title")) $("modal-detail-title").textContent = issue.title;
  if ($("modal-detail-category")) $("modal-detail-category").textContent = issue.category;
  if ($("modal-detail-priority")) $("modal-detail-priority").textContent = issue.priority;
  if ($("modal-detail-status")) $("modal-detail-status").textContent = issue.status;
  if ($("modal-detail-address")) $("modal-detail-address").textContent = issue.address;
  if ($("modal-detail-desc")) $("modal-detail-desc").textContent = issue.description;
  if ($("modal-detail-date")) $("modal-detail-date").textContent = formatDate(issue.created_at);
  if ($("modal-detail-dept")) $("modal-detail-dept").textContent = issue.assigned_department || "Not Assigned Yet";

  // Photo
  const imgContainer = $("modal-detail-img-box");
  if (imgContainer) {
    if (issue.image_url) {
      imgContainer.innerHTML = `<img src="${issue.image_url}" class="img-fluid rounded mb-3 shadow-sm" style="max-height: 280px; width: 100%; object-fit: cover;">`;
    } else {
      imgContainer.innerHTML = "";
    }
  }

  // AI Box
  const aiBox = $("modal-detail-ai-box");
  if (aiBox) {
    if (issue.ai_analysis) {
      aiBox.classList.remove("d-none");
      $("modal-detail-ai-summary").textContent = issue.ai_analysis.summary || "";
      $("modal-detail-ai-severity").textContent = issue.ai_analysis.safety_severity || "Normal";
      $("modal-detail-ai-reasoning").textContent = issue.ai_analysis.reasoning || "";
    } else {
      aiBox.classList.add("d-none");
    }
  }

  // Timeline
  const timelineContainer = $("modal-detail-timeline");
  if (timelineContainer) {
    timelineContainer.innerHTML = "";
    const history = issue.status_history || [
      { new_status: issue.status, notes: "Current status", created_at: issue.created_at }
    ];

    history.forEach((h, i) => {
      const item = document.createElement("div");
      item.className = `timeline-item ${i === history.length - 1 ? "active" : ""}`;
      item.innerHTML = `
        <div class="timeline-dot"></div>
        <div class="fw-bold small text-dark">${h.new_status}</div>
        <div class="small text-secondary mb-1">${h.notes || "Status change recorded"}</div>
        <div class="text-muted" style="font-size: 0.7rem;">${formatDate(h.created_at)}</div>
      `;
      timelineContainer.appendChild(item);
    });
  }

  const modalEl = $("complaintDetailModal");
  if (modalEl && window.bootstrap && window.bootstrap.Modal) {
    const modal = new window.bootstrap.Modal(modalEl);
    modal.show();
  }
}

// ------------------------------------------------------------------------------
// ADMIN ACTION MODAL
// ------------------------------------------------------------------------------
function openAdminActionModal(complaintId) {
  const issue = state.complaints.find((c) => c.id === complaintId);
  if (!issue) return;

  state.selectedComplaint = issue;

  $("admin-modal-id").value = issue.id;
  $("admin-modal-tracking").textContent = issue.tracking_id || "CFX";
  $("admin-modal-title").textContent = issue.title;
  $("admin-modal-status-select").value = issue.status;
  $("admin-modal-dept-select").value = issue.assigned_department || "";
  $("admin-modal-notes").value = issue.admin_notes || "";

  // AI suggestions preview in admin modal
  const aiPreview = $("admin-modal-ai-preview");
  if (aiPreview) {
    if (issue.ai_analysis) {
      aiPreview.innerHTML = `
        <div class="p-3 bg-light rounded border mb-3 small">
          <div class="fw-bold text-primary mb-1">🤖 Gemini AI Triage Suggestion:</div>
          <div><strong>Suggested Category:</strong> ${issue.ai_analysis.suggested_category}</div>
          <div><strong>Recommended Severity:</strong> <span class="badge text-bg-warning">${issue.ai_analysis.safety_severity}</span></div>
          <div><strong>Reasoning:</strong> ${issue.ai_analysis.reasoning}</div>
        </div>
      `;
    } else {
      aiPreview.innerHTML = `<div class="p-2 text-muted small fst-italic mb-3">No AI analysis attached.</div>`;
    }
  }

  const modalEl = $("adminActionModal");
  if (modalEl && window.bootstrap && window.bootstrap.Modal) {
    const modal = new window.bootstrap.Modal(modalEl);
    modal.show();
  }
}

async function handleAdminStatusSubmit(e) {
  e.preventDefault();
  const id = $("admin-modal-id").value;
  const newStatus = $("admin-modal-status-select").value;
  const dept = $("admin-modal-dept-select").value;
  const notes = $("admin-modal-notes").value;

  try {
    await ComplaintsStore.updateStatus(id, newStatus, notes, dept);
    showToast(`Complaint updated to "${newStatus}"`, "success");
    const modalEl = $("adminActionModal");
    if (modalEl && window.bootstrap) {
      const inst = window.bootstrap.Modal.getInstance(modalEl);
      if (inst) inst.hide();
    }
    await reloadData();
  } catch (err) {
    showToast(`Update failed: ${err.message}`, "danger");
  }
}

// ------------------------------------------------------------------------------
// REAL-TIME DUPLICATE DETECTION CHECKER
// ------------------------------------------------------------------------------
function checkDuplicateOnInput() {
  const title = $("issue-title")?.value.trim() || "";
  const desc = $("issue-desc")?.value.trim() || "";
  const category = $("issue-category")?.value || "";
  const lat = parseFloat($("issue-lat")?.value) || null;
  const lng = parseFloat($("issue-lng")?.value) || null;

  const alertBox = $("duplicate-warning-banner");
  if (!alertBox) return;

  if (!title && !desc) {
    alertBox.style.display = "none";
    return;
  }

  const candidate = { title, description: desc, category, latitude: lat, longitude: lng };
  const matches = GeoService.findPotentialDuplicates(candidate, state.complaints);

  if (matches.length > 0) {
    const topMatch = matches[0];
    const existing = topMatch.existingComplaint;
    const distText = topMatch.distanceMeters !== null ? `(${topMatch.distanceMeters}m away)` : "";

    alertBox.innerHTML = `
      <div class="d-flex align-items-start gap-2">
        <span style="font-size: 1.25rem;">⚠️</span>
        <div class="flex-grow-1">
          <strong>Potential Duplicate Issue Detected!</strong>
          <div class="small mt-1">
            A similar issue <em>"${existing.title}"</em> was previously reported nearby ${distText}.
            Status: <strong>${existing.status}</strong> (${existing.tracking_id}).
          </div>
          <div class="mt-2">
            <button type="button" class="btn btn-sm btn-outline-dark py-0 px-2" onclick="window.CivicFixApp.openDetailsModal('${existing.id}')">
              Review Existing Report
            </button>
            <span class="small text-muted ms-2">You can still proceed with submission if this is a distinct issue.</span>
          </div>
        </div>
      </div>
    `;
    alertBox.style.display = "block";
  } else {
    alertBox.style.display = "none";
  }
}

// ------------------------------------------------------------------------------
// ISSUE SUBMISSION FLOW
// ------------------------------------------------------------------------------
async function handleIssueSubmit(e) {
  e.preventDefault();

  const title = $("issue-title").value.trim();
  const category = $("issue-category").value;
  const address = $("issue-address").value.trim();
  const description = $("issue-desc").value.trim();
  const reporterName = $("issue-reporter-name").value.trim() || (state.currentUser?.full_name || "Community Citizen");
  const reporterEmail = $("issue-reporter-email").value.trim() || (state.currentUser?.email || "citizen@civicfix.org");
  const lat = parseFloat($("issue-lat").value) || null;
  const lng = parseFloat($("issue-lng").value) || null;

  if (!title || !category || !address || !description) {
    showToast("Please fill in all required fields.", "warning");
    return;
  }

  const submitBtn = $("btn-submit-issue");
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Submitting Report...`;
  }

  try {
    // If AI analysis was not manually run yet, trigger analysis now
    let aiResult = state.aiAnalysisResult;
    if (!aiResult) {
      aiResult = await GeminiService.analyzeIssue({
        title,
        description,
        category,
        imageBase64: state.activeImageBase64,
        mimeType: state.activeImageMime,
      });
    }

    const priority = aiResult?.recommended_priority || "Medium";

    // Create the complaint
    const created = await ComplaintsStore.create({
      reporter_name: reporterName,
      reporter_email: reporterEmail,
      title,
      description,
      category,
      priority,
      address,
      latitude: lat,
      longitude: lng,
      image_url: state.activeImageBase64 || null,
      ai_analysis: aiResult,
    });

    showToast(`Issue submitted! Tracking ID: ${created.tracking_id}`, "success");

    // Reset Form
    $("issue-form").reset();
    clearImagePreview();
    state.aiAnalysisResult = null;
    $("ai-suggestion-preview").classList.add("d-none");
    $("duplicate-warning-banner").style.display = "none";

    await reloadData();

    // Show Success Modal or Switch to Citizen Dashboard
    switchView("dashboard");
  } catch (err) {
    showToast(`Submission failed: ${err.message}`, "danger");
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Submit Report +`;
    }
  }
}

// ------------------------------------------------------------------------------
// IMAGE PREVIEW & FILE VALIDATION
// ------------------------------------------------------------------------------
function handleFileSelect(file) {
  if (!file) return;

  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    showToast("Invalid file type. Please upload a JPG, PNG, or WebP photo.", "warning");
    return;
  }

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    showToast("File is too large. Maximum allowed photo size is 5MB.", "warning");
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    state.activeImageBase64 = e.target.result;
    state.activeImageMime = file.type;

    const preview = $("image-preview-element");
    const container = $("preview-container");
    if (preview && container) {
      preview.src = e.target.result;
      container.classList.remove("d-none");
    }
  };
  reader.readAsDataURL(file);
}

function clearImagePreview() {
  state.activeImageBase64 = null;
  state.activeImageMime = null;
  const container = $("preview-container");
  const fileInput = $("issue-image-input");
  if (container) container.classList.add("d-none");
  if (fileInput) fileInput.value = "";
}

// ------------------------------------------------------------------------------
// MANUAL AI ANALYSIS BUTTON TRIGGER
// ------------------------------------------------------------------------------
async function triggerAiAnalysis() {
  const title = $("issue-title").value.trim();
  const desc = $("issue-desc").value.trim();
  const cat = $("issue-category").value;

  if (!title && !desc && !state.activeImageBase64) {
    showToast("Please enter a title, description, or attach a photo before running AI analysis.", "warning");
    return;
  }

  const aiBtn = $("btn-run-ai");
  if (aiBtn) {
    aiBtn.disabled = true;
    aiBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Analyzing with Gemini...`;
  }

  try {
    const result = await GeminiService.analyzeIssue({
      title,
      description: desc,
      category: cat,
      imageBase64: state.activeImageBase64,
      mimeType: state.activeImageMime,
    });

    state.aiAnalysisResult = result;

    // Populate AI Preview Box
    const previewBox = $("ai-suggestion-preview");
    if (previewBox) {
      previewBox.classList.remove("d-none");
      $("ai-suggested-category").textContent = result.suggested_category;
      $("ai-suggested-severity").textContent = result.safety_severity;
      $("ai-suggested-priority").textContent = result.recommended_priority;
      $("ai-confidence-bar").style.width = `${Math.round(result.confidence_score * 100)}%`;
      $("ai-confidence-score").textContent = `${Math.round(result.confidence_score * 100)}%`;
      $("ai-reasoning-text").textContent = result.reasoning;

      const noticeEl = $("ai-mode-notice");
      if (noticeEl) {
        if (result.isDemo) {
          noticeEl.textContent = "DEMO MODE: Simulated AI output. (Connect Supabase & Gemini in Settings for live inference)";
          noticeEl.className = "small text-warning-emphasis fw-semibold";
        } else {
          noticeEl.textContent = "Verified live analysis by Gemini API";
          noticeEl.className = "small text-success fw-semibold";
        }
      }

      // Auto-update category if empty
      if (!$("issue-category").value && result.suggested_category) {
        $("issue-category").value = result.suggested_category;
      }
    }

    showToast("AI analysis complete!", "success");
  } catch (err) {
    showToast(`AI analysis error: ${err.message}`, "danger");
  } finally {
    if (aiBtn) {
      aiBtn.disabled = false;
      aiBtn.innerHTML = `⚡ Analyze with Gemini AI`;
    }
  }
}

// ------------------------------------------------------------------------------
// GEOLOCATION BUTTON TRIGGER
// ------------------------------------------------------------------------------
async function triggerGeolocation() {
  const geoBtn = $("btn-detect-gps");
  if (geoBtn) {
    geoBtn.disabled = true;
    geoBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Locating...`;
  }

  try {
    const loc = await GeoService.getCurrentLocation();
    $("issue-lat").value = loc.latitude.toFixed(6);
    $("issue-lng").value = loc.longitude.toFixed(6);

    MapView.setMiniPickerLocation(loc.latitude, loc.longitude);

    const addr = await GeoService.reverseGeocode(loc.latitude, loc.longitude);
    $("issue-address").value = addr;

    showToast("Current location detected!", "success");
    checkDuplicateOnInput();
  } catch (err) {
    showToast(err.message, "warning");
  } finally {
    if (geoBtn) {
      geoBtn.disabled = false;
      geoBtn.innerHTML = `📍 Use Current Location`;
    }
  }
}

// ------------------------------------------------------------------------------
// SETTINGS & DEMO MODE HANDLERS
// ------------------------------------------------------------------------------
function openSettingsModal() {
  $("settings-url").value = Config.supabaseUrl || "";
  $("settings-key").value = Config.supabaseAnonKey || "";
  $("settings-edge").value = Config.edgeFunctionUrl || "";

  const modalEl = $("settingsModal");
  if (modalEl && window.bootstrap) {
    new window.bootstrap.Modal(modalEl).show();
  }
}

function handleSaveSettings(e) {
  e.preventDefault();
  const url = $("settings-url").value.trim();
  const key = $("settings-key").value.trim();
  const edge = $("settings-edge").value.trim();

  Config.saveCredentials(url, key, edge);
}

function handleResetDemo() {
  if (confirm("Reset to Demo Mode with sample municipal data?")) {
    Config.clearCredentials();
  }
}

function toggleDemoRole(targetRole) {
  Auth.setDemoRole(targetRole);
  window.location.reload();
}

// ------------------------------------------------------------------------------
// INITIALIZATION
// ------------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", async () => {
  // Load current user
  state.currentUser = await Auth.getCurrentUser();

  // Mode banner update
  const banner = $("mode-indicator-banner");
  if (banner) {
    try {
      const ping = await fetch("/api/stats");
      if (ping.ok) {
        banner.className = "mode-banner live";
        banner.innerHTML = `<span>🟢 <strong>CIVICFIX-AI SERVER ACTIVE:</strong> Node.js + Express & JSON Database • Port 3000</span>`;
      } else if (Config.isLive) {
        banner.className = "mode-banner live";
        banner.innerHTML = `<span>🟢 <strong>LIVE SUPABASE MODE:</strong> Connected to database</span>`;
      } else {
        banner.className = "mode-banner demo";
        banner.innerHTML = `<span>🟡 <strong>DEMO MODE:</strong> Operating with realistic sample data & local AI inference.</span>`;
      }
    } catch {
      if (Config.isLive) {
        banner.className = "mode-banner live";
        banner.innerHTML = `<span>🟢 <strong>LIVE SUPABASE MODE</strong> Connected to database</span>`;
      } else {
        banner.className = "mode-banner demo";
        banner.innerHTML = `<span>🟡 <strong>DEMO MODE:</strong> Operating with realistic sample data & local AI inference.</span>`;
      }
    }
  }

  // Update User Profile Display
  if ($("user-display-name") && state.currentUser) {
    $("user-display-name").textContent = state.currentUser.full_name;
  }
  if ($("demo-role-badge") && state.currentUser?.isDemo) {
    $("demo-role-badge").textContent = state.currentUser.role === "admin" ? "Role: Admin" : "Role: Citizen";
  }

  // Wire View Navigation Buttons
  ["home", "report", "map", "dashboard", "admin"].forEach((view) => {
    const navBtn = $(`nav-${view}`);
    if (navBtn) navBtn.addEventListener("click", () => switchView(view));
  });

  // Wire Map Filters
  $("map-filter-category")?.addEventListener("change", applyMapFilters);
  $("map-filter-status")?.addEventListener("change", applyMapFilters);

  // Wire Dashboard Search & Filters
  $("dashboard-search")?.addEventListener("input", renderCitizenDashboard);
  document.querySelectorAll("[data-dashboard-filter]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll("[data-dashboard-filter]").forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      state.activeDashboardFilter.status = e.target.getAttribute("data-dashboard-filter");
      renderCitizenDashboard();
    });
  });

  // Wire Admin Search & Filters
  $("admin-search")?.addEventListener("input", renderAdminPortal);
  $("admin-filter-status")?.addEventListener("change", renderAdminPortal);
  $("admin-filter-category")?.addEventListener("change", renderAdminPortal);

  // Wire Issue Form
  $("issue-form")?.addEventListener("submit", handleIssueSubmit);
  $("btn-run-ai")?.addEventListener("click", triggerAiAnalysis);
  $("btn-detect-gps")?.addEventListener("click", triggerGeolocation);
  $("btn-remove-preview")?.addEventListener("click", clearImagePreview);

  // File Upload Drop Zone
  const uploadZone = $("image-upload-zone");
  const fileInput = $("issue-image-input");
  if (uploadZone && fileInput) {
    uploadZone.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", (e) => handleFileSelect(e.target.files[0]));

    uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadZone.classList.add("dragover");
    });
    uploadZone.addEventListener("dragleave", () => uploadZone.classList.remove("dragover"));
    uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadZone.classList.remove("dragover");
      if (e.dataTransfer.files?.length) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });
  }

  // Real-time Duplicate Detection listeners
  $("issue-title")?.addEventListener("input", checkDuplicateOnInput);
  $("issue-desc")?.addEventListener("input", checkDuplicateOnInput);
  $("issue-category")?.addEventListener("change", checkDuplicateOnInput);

  // Admin Action Form
  $("admin-action-form")?.addEventListener("submit", handleAdminStatusSubmit);

  // Settings Form
  $("settings-form")?.addEventListener("submit", handleSaveSettings);
  $("btn-reset-demo")?.addEventListener("click", handleResetDemo);

  // Initial Load
  await reloadData();
  switchView("home");
});

// Export Global API for inline HTML event handlers
window.CivicFixApp = {
  switchView,
  openDetailsModal,
  openAdminActionModal,
  openSettingsModal,
  toggleDemoRole,
};
