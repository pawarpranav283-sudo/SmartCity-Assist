// ==============================================================================
// CivicFix AI 2.0 - Complaints Data Store
// Bridges Supabase PostgreSQL (Live) and LocalStorage (Demo), with v1 backward compatibility
// ==============================================================================

import { Config } from "./config.js";
import { getSupabaseClient } from "./supabase-client.js";

// Realistic Initial Demo Issues (Coordinates centered in Metro Area)
const INITIAL_DEMO_COMPLAINTS = [
  {
    id: "a1111111-1111-1111-1111-111111111111",
    tracking_id: "CFX-2026-08142",
    reporter_name: "Aarav Sharma",
    reporter_email: "aarav.sharma@example.com",
    title: "Massive Pothole near MG Road Metro Station",
    description: "A deep crater approximately 1.5 meters wide on the left lane right after metro pillar 142. Two two-wheelers skidded this morning during rain. Severe traffic hazard.",
    category: "Road Damage",
    priority: "Critical",
    status: "In Progress",
    image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    latitude: 28.6139,
    longitude: 77.2090,
    address: "Connaught Place / MG Road Pillar 142, Central District",
    ai_analysis: {
      suggested_category: "Road Damage",
      summary: "Deep road crater with exposed aggregate causing severe vehicle hazard.",
      safety_severity: "Critical",
      recommended_priority: "Critical",
      confidence_score: 0.94,
      reasoning: "Visible depression exceeding 15cm depth in active transit lane with water pooling and loose asphalt shards.",
      detected_hazards: ["Two-wheeler skid risk", "Nighttime collision hazard", "Axle damage"]
    },
    assigned_department: "Public Works & Roads Dept",
    admin_notes: "Work order #PW-9821 issued. Asphalt patching crew dispatched.",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    status_history: [
      { old_status: null, new_status: "Pending", notes: "Initial complaint report filed", created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
      { old_status: "Pending", new_status: "In Review", notes: "Under review by Public Works triage officer", created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
      { old_status: "In Review", new_status: "In Progress", notes: "Work order #PW-9821 issued. Asphalt patching crew dispatched.", created_at: new Date(Date.now() - 1 * 86400000).toISOString() }
    ]
  },
  {
    id: "b2222222-2222-2222-2222-222222222222",
    tracking_id: "CFX-2026-08143",
    reporter_name: "Priya Sundaram",
    reporter_email: "priya.sundaram@example.com",
    title: "Overflowing Dumpster and Litter Spillover",
    description: "Commercial waste dumpsters at the corner of 4th Cross have not been cleared for 4 days. Waste is spilling across the sidewalk and blocking pedestrian pathway.",
    category: "Garbage",
    priority: "High",
    status: "Pending",
    image_url: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80",
    latitude: 28.6189,
    longitude: 77.2140,
    address: "Corner 4th Cross & Market Ave, Block B",
    ai_analysis: {
      suggested_category: "Garbage",
      summary: "Uncollected municipal waste container overflowing onto pedestrian sidewalk.",
      safety_severity: "High",
      recommended_priority: "High",
      confidence_score: 0.92,
      reasoning: "Organic decomposing matter, plastic obstruction of walkway, potential health and vermin hazard.",
      detected_hazards: ["Pedestrian walkway obstruction", "Sanitation hazard", "Stray animal aggregation"]
    },
    assigned_department: "Solid Waste Management",
    admin_notes: "Pending assignment to morning sanitation route.",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    status_history: [
      { old_status: null, new_status: "Pending", notes: "Initial complaint report filed", created_at: new Date(Date.now() - 2 * 86400000).toISOString() }
    ]
  },
  {
    id: "c3333333-3333-3333-3333-333333333333",
    tracking_id: "CFX-2026-08144",
    reporter_name: "Rahul Mehta",
    reporter_email: "rahul.m@example.com",
    title: "Flickering and Blacked-Out Streetlights on School Road",
    description: "A row of 4 consecutive street lamps are completely dark between St. Jude School and the community park. Creates an unsafe dark zone for pedestrians after sunset.",
    category: "Streetlight",
    priority: "Medium",
    status: "Resolved",
    image_url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80",
    latitude: 28.6095,
    longitude: 77.2025,
    address: "Green Park Link Road, opposite Gate 2",
    ai_analysis: {
      suggested_category: "Streetlight",
      summary: "Multiple non-functional pole-mounted LED luminaires along school perimeter.",
      safety_severity: "Medium",
      recommended_priority: "Medium",
      confidence_score: 0.89,
      reasoning: "Power supply or fixture burnout covering approximately 120m of residential pedestrian corridor.",
      detected_hazards: ["Low-visibility pedestrian corridor", "Night safety concern"]
    },
    assigned_department: "Municipal Electricity Board",
    admin_notes: "Replaced 4 sodium-vapor lamps with 60W energy-efficient LEDs. Line tested successfully.",
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    status_history: [
      { old_status: null, new_status: "Pending", notes: "Initial complaint report filed", created_at: new Date(Date.now() - 6 * 86400000).toISOString() },
      { old_status: "Pending", new_status: "In Progress", notes: "Assigned to Municipal Electricity Board line team", created_at: new Date(Date.now() - 4 * 86400000).toISOString() },
      { old_status: "In Progress", new_status: "Resolved", notes: "Replaced 4 sodium-vapor lamps with 60W energy-efficient LEDs.", created_at: new Date(Date.now() - 1 * 86400000).toISOString() }
    ]
  },
  {
    id: "d4444444-4444-4444-4444-444444444444",
    tracking_id: "CFX-2026-08145",
    reporter_name: "Ananya Sen",
    reporter_email: "ananya.sen@example.com",
    title: "Broken Water Pipeline Flooding Main Road",
    description: "Potable water pipeline rupture underneath the sidewalk. Clean water gushing at high pressure for over 12 hours, washing away gravel and flooding road.",
    category: "Water Supply",
    priority: "Critical",
    status: "In Review",
    image_url: "https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80",
    latitude: 28.6250,
    longitude: 77.2180,
    address: "Sector 12, Main Ring Road Junction",
    ai_analysis: {
      suggested_category: "Water Supply",
      summary: "Pressurized water pipe fracture causing localized road surface flooding.",
      safety_severity: "Critical",
      recommended_priority: "Critical",
      confidence_score: 0.96,
      reasoning: "High-volume water loss with sub-base erosion risks under road surface.",
      detected_hazards: ["Subsurface soil erosion", "Aquaplaning risk", "Massive drinking water wastage"]
    },
    assigned_department: "Water Supply & Sewerage Board",
    admin_notes: "Emergency valve isolation team notified.",
    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    status_history: [
      { old_status: null, new_status: "Pending", notes: "Initial complaint report filed", created_at: new Date(Date.now() - 8 * 3600000).toISOString() },
      { old_status: "Pending", new_status: "In Review", notes: "Emergency valve isolation team notified.", created_at: new Date(Date.now() - 4 * 3600000).toISOString() }
    ]
  },
  {
    id: "e5555555-5555-5555-5555-555555555555",
    tracking_id: "CFX-2026-08146",
    reporter_name: "Vikram Malhotra",
    reporter_email: "v.malhotra@example.com",
    title: "Open High-Voltage Distribution Box Near Bus Stop",
    description: "The metallic casing of the distribution transformer box is broken open with exposed live wires dangling less than 1 meter from the bus stop bench.",
    category: "Public Hazard",
    priority: "Critical",
    status: "In Progress",
    image_url: "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80",
    latitude: 28.6120,
    longitude: 77.2250,
    address: "Kasturba Marg Bus Shelter #14",
    ai_analysis: {
      suggested_category: "Public Hazard",
      summary: "Unsecured electrical junction box with accessible live cables near public transit.",
      safety_severity: "Critical",
      recommended_priority: "Critical",
      confidence_score: 0.98,
      reasoning: "Direct electrocution risk to commuters and children within reaching distance.",
      detected_hazards: ["Direct electrocution danger", "Rainwater short-circuit hazard", "Fire risk"]
    },
    assigned_department: "Electrical Safety Inspectorate",
    admin_notes: "Warning tape installed. Maintenance crew on-site with replacement enclosure.",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    status_history: [
      { old_status: null, new_status: "Pending", notes: "Initial complaint report filed", created_at: new Date(Date.now() - 86400000).toISOString() },
      { old_status: "Pending", new_status: "In Progress", notes: "Warning tape installed. Maintenance crew on-site.", created_at: new Date(Date.now() - 18 * 3600000).toISOString() }
    ]
  }
];

export const ComplaintsStore = {
  // Initialize and migrate legacy v1 data if present
  init() {
    if (Config.isDemoMode) {
      let v2Data = [];
      try {
        v2Data = JSON.parse(localStorage.getItem(Config.STORAGE_KEYS.LOCAL_REPORTS_V2) || "[]");
      } catch {
        v2Data = [];
      }

      // Check legacy v1 data from original index.html
      let v1Data = [];
      try {
        v1Data = JSON.parse(localStorage.getItem(Config.STORAGE_KEYS.LOCAL_REPORTS_V1) || "[]");
      } catch {
        v1Data = [];
      }

      if (Array.isArray(v1Data) && v1Data.length > 0) {
        // Migrate v1 to v2 format if not already migrated
        const existingTitles = new Set(v2Data.map((d) => d.title));
        v1Data.forEach((oldItem, idx) => {
          if (!existingTitles.has(oldItem.title)) {
            v2Data.push({
              id: `v1-migrated-${oldItem.id || idx}`,
              tracking_id: `CFX-V1-${String(1000 + idx)}`,
              reporter_name: "Community Member",
              reporter_email: "citizen@civicfix.org",
              title: oldItem.title,
              description: oldItem.description || "Migrated civic issue report.",
              category: oldItem.category || "Other",
              priority: "Medium",
              status: oldItem.status || "Pending",
              image_url: null,
              latitude: 28.6139 + (Math.random() - 0.5) * 0.03,
              longitude: 77.2090 + (Math.random() - 0.5) * 0.03,
              address: oldItem.location || "Community Location",
              ai_analysis: null,
              created_at: new Date(oldItem.id || Date.now()).toISOString(),
              status_history: [
                { old_status: null, new_status: oldItem.status || "Pending", notes: "Migrated report from v1", created_at: new Date().toISOString() }
              ]
            });
          }
        });
      }

      // If no data exists at all, seed with rich demo issues
      if (v2Data.length === 0) {
        v2Data = [...INITIAL_DEMO_COMPLAINTS];
      }

      localStorage.setItem(Config.STORAGE_KEYS.LOCAL_REPORTS_V2, JSON.stringify(v2Data));
    }
  },

  // Fetch all complaints (checks Express API first, then Supabase, then LocalStorage)
  async getAll() {
    // 1. Try Node.js Express backend API
    try {
      const response = await fetch("/api/complaints");
      if (response.ok) {
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          return json.data;
        }
      }
    } catch {
      // Backend server not active, proceed to Supabase or LocalStorage
    }

    // 2. Try Supabase if live mode configured
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("complaints")
          .select("*, complaint_status_history(*)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.warn("Failed to fetch live complaints from Supabase. Falling back to local data.", err);
      }
    }

    // 3. Fallback to LocalStorage
    try {
      const data = JSON.parse(localStorage.getItem(Config.STORAGE_KEYS.LOCAL_REPORTS_V2) || "[]");
      return Array.isArray(data) && data.length > 0 ? data : [...INITIAL_DEMO_COMPLAINTS];
    } catch {
      return [...INITIAL_DEMO_COMPLAINTS];
    }
  },

  // Create a new complaint (Express backend -> Supabase -> LocalStorage)
  async create(complaintData) {
    const trackingId = `CFX-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newRecord = {
      tracking_id: trackingId,
      reporter_name: complaintData.reporter_name || "Anonymous Citizen",
      reporter_email: complaintData.reporter_email || null,
      title: complaintData.title,
      description: complaintData.description,
      category: complaintData.category,
      urgency: complaintData.urgency || complaintData.priority || "Medium",
      priority: complaintData.priority || "Medium",
      status: "Pending",
      image_url: complaintData.image_url || null,
      latitude: complaintData.latitude || null,
      longitude: complaintData.longitude || null,
      address: complaintData.address || "Unspecified Location",
      ai_analysis: complaintData.ai_analysis || null,
      assigned_department: null,
      admin_notes: null,
    };

    // 1. Try Express backend API
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecord),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Proceed to Supabase or LocalStorage fallback
    }

    // 2. Try Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from("complaints")
          .insert([newRecord])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn("Supabase complaint insert failed:", err);
      }
    }

    // 3. LocalStorage fallback
    const demoId = `demo-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const fullDemoRecord = {
      ...newRecord,
      id: demoId,
      created_at: new Date().toISOString(),
      status_history: [
        {
          id: `hist-${Date.now()}`,
          old_status: null,
          new_status: "Pending",
          notes: "Initial complaint report filed",
          created_at: new Date().toISOString(),
        },
      ],
    };

    const currentList = await this.getAll();
    currentList.unshift(fullDemoRecord);
    localStorage.setItem(Config.STORAGE_KEYS.LOCAL_REPORTS_V2, JSON.stringify(currentList));
    return fullDemoRecord;
  },

  // Update complaint status (Express backend -> Supabase -> LocalStorage)
  async updateStatus(complaintId, newStatus, notes = "", assignedDepartment = null) {
    // 1. Try Express backend API
    try {
      const res = await fetch(`/api/complaints/${complaintId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          assigned_department: assignedDepartment,
          admin_notes: notes,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch {
      // Proceed to fallback
    }

    // 2. Try Supabase
    const supabase = getSupabaseClient();
    if (supabase) {
      const updates = {
        status: newStatus,
        admin_notes: notes,
      };
      if (assignedDepartment) updates.assigned_department = assignedDepartment;

      const { data, error } = await supabase
        .from("complaints")
        .update(updates)
        .eq("id", complaintId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // 3. LocalStorage fallback
    const list = await this.getAll();
    const item = list.find((c) => c.id === complaintId || c.tracking_id === complaintId);
    if (!item) throw new Error("Complaint not found");

    const oldStatus = item.status;
    item.status = newStatus;
    if (notes) item.admin_notes = notes;
    if (assignedDepartment) item.assigned_department = assignedDepartment;
    item.updated_at = new Date().toISOString();

    if (!item.status_history) item.status_history = [];
    item.status_history.push({
      id: `hist-${Date.now()}`,
      old_status: oldStatus,
      new_status: newStatus,
      notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
      created_at: new Date().toISOString(),
    });

    localStorage.setItem(Config.STORAGE_KEYS.LOCAL_REPORTS_V2, JSON.stringify(list));
    return item;
  },

  // Calculate high-level metrics
  calculateStats(complaints) {
    const total = complaints.length;
    const pending = complaints.filter((c) => c.status === "Pending").length;
    const inReview = complaints.filter((c) => c.status === "In Review").length;
    const inProgress = complaints.filter((c) => c.status === "In Progress").length;
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    const rejected = complaints.filter((c) => c.status === "Rejected").length;
    const critical = complaints.filter((c) => c.priority === "Critical" || c.priority === "High").length;

    return { total, pending, inReview, inProgress, resolved, rejected, critical };
  },
};

// Auto-run initialization
ComplaintsStore.init();
