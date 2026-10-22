-- ==============================================================================
-- CivicFix AI 2.0 - Realistic Seed Data
-- For testing and populating the database
-- ==============================================================================

-- Insert Sample Complaints
INSERT INTO public.complaints (
    id,
    tracking_id,
    reporter_name,
    reporter_email,
    title,
    description,
    category,
    priority,
    status,
    image_url,
    latitude,
    longitude,
    address,
    ai_analysis,
    assigned_department,
    admin_notes,
    created_at
) VALUES 
(
    'a1111111-1111-1111-1111-111111111111',
    'CFX-2026-08142',
    'Aarav Sharma',
    'aarav.sharma@example.com',
    'Massive Pothole near MG Road Metro Station',
    'A deep crater approximately 1.5 meters wide on the left lane right after the metro pillar 142. Two two-wheelers skidded this morning during rain. Severe traffic hazard.',
    'Road Damage',
    'Critical',
    'In Progress',
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    28.6139,
    77.2090,
    'Connaught Place / MG Road Pillar 142, Central District',
    '{
        "suggested_category": "Road Damage",
        "summary": "Deep road crater with exposed aggregate causing severe vehicle hazard.",
        "safety_severity": "Critical",
        "recommended_priority": "Critical",
        "confidence_score": 0.94,
        "reasoning": "Visible depression exceeding 15cm depth in active transit lane with water pooling and loose asphalt shards.",
        "detected_hazards": ["Two-wheeler skid risk", "Nighttime collision hazard", "Axle damage"],
        "duplicate_risk_factors": "Proximity to Metro Pillar 142"
    }'::jsonb,
    'Public Works & Roads Dept',
    'Work order #PW-9821 issued. Asphalt patching crew dispatched.',
    NOW() - INTERVAL '3 days'
),
(
    'b2222222-2222-2222-2222-222222222222',
    'CFX-2026-08143',
    'Priya Sundaram',
    'priya.sundaram@example.com',
    'Overflowing Dumpster and Litter Spillover',
    'Commercial waste dumpsters at the corner of 4th Cross have not been cleared for 4 days. Waste is spilling across the sidewalk and blocking pedestrian pathway.',
    'Garbage',
    'High',
    'Pending',
    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    28.6189,
    77.2140,
    'Corner 4th Cross & Market Ave, Block B',
    '{
        "suggested_category": "Garbage",
        "summary": "Uncollected municipal waste container overflowing onto pedestrian sidewalk.",
        "safety_severity": "High",
        "recommended_priority": "High",
        "confidence_score": 0.92,
        "reasoning": "Organic decomposing matter, plastic obstruction of walkway, potential health and vermin hazard.",
        "detected_hazards": ["Pedestrian walkway obstruction", "Sanitation hazard", "Stray animal aggregation"],
        "duplicate_risk_factors": "4th Cross Commercial intersection"
    }'::jsonb,
    'Solid Waste Management',
    'Pending assignment to morning sanitation route.',
    NOW() - INTERVAL '2 days'
),
(
    'c3333333-3333-3333-3333-333333333333',
    'CFX-2026-08144',
    'Rahul Mehta',
    'rahul.m@example.com',
    'Flickering and Blacked-Out Streetlights on School Road',
    'A row of 4 consecutive street lamps are completely dark between St. Jude School and the community park. Creates an unsafe dark zone for pedestrians after sunset.',
    'Streetlight',
    'Medium',
    'Resolved',
    'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=800&q=80',
    28.6095,
    77.2025,
    'Green Park Link Road, opposite Gate 2',
    '{
        "suggested_category": "Streetlight",
        "summary": "Multiple non-functional pole-mounted LED luminaires along school perimeter.",
        "safety_severity": "Medium",
        "recommended_priority": "Medium",
        "confidence_score": 0.89,
        "reasoning": "Power supply or fixture burnout covering approximately 120m of residential pedestrian corridor.",
        "detected_hazards": ["Low-visibility pedestrian corridor", "Night safety concern"],
        "duplicate_risk_factors": "St. Jude School frontage"
    }'::jsonb,
    'Municipal Electricity Board',
    'Replaced 4 sodium-vapor lamps with 60W energy-efficient LEDs. Line tested successfully.',
    NOW() - INTERVAL '6 days'
),
(
    'd4444444-4444-4444-4444-444444444444',
    'CFX-2026-08145',
    'Ananya Sen',
    'ananya.sen@example.com',
    'Broken Water Pipeline Flooding Main Road',
    'Potable water pipeline rupture underneath the sidewalk. Clean water gushing at high pressure for over 12 hours, washing away gravel and flooding road.',
    'Water Supply',
    'Critical',
    'In Review',
    'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
    28.6250,
    77.2180,
    'Sector 12, Main Ring Road Junction',
    '{
        "suggested_category": "Water Supply",
        "summary": "Pressurized water pipe fracture causing localized road surface flooding.",
        "safety_severity": "Critical",
        "recommended_priority": "Critical",
        "confidence_score": 0.96,
        "reasoning": "High-volume water loss with sub-base erosion risks under road surface.",
        "detected_hazards": ["Subsurface soil erosion", "Aquaplaning risk", "Massive drinking water wastage"],
        "duplicate_risk_factors": "Sector 12 junction valve box"
    }'::jsonb,
    'Water Supply & Sewerage Board',
    'Emergency valve isolation team notified.',
    NOW() - INTERVAL '8 hours'
),
(
    'e5555555-5555-5555-5555-555555555555',
    'CFX-2026-08146',
    'Vikram Malhotra',
    'v.malhotra@example.com',
    'Open High-Voltage Distribution Box Near Bus Stop',
    'The metallic casing of the distribution transformer box is broken open with exposed live wires dangling less than 1 meter from the bus stop bench.',
    'Public Hazard',
    'Critical',
    'In Progress',
    'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80',
    28.6120,
    77.2250,
    'Kasturba Marg Bus Shelter #14',
    '{
        "suggested_category": "Public Hazard",
        "summary": "Unsecured electrical junction box with accessible live cables near public transit.",
        "safety_severity": "Critical",
        "recommended_priority": "Critical",
        "confidence_score": 0.98,
        "reasoning": "Direct electrocution risk to commuters and children within reaching distance.",
        "detected_hazards": ["Direct electrocution danger", "Rainwater short-circuit hazard", "Fire risk"],
        "duplicate_risk_factors": "Bus Shelter #14 electrical feeder"
    }'::jsonb,
    'Electrical Safety Inspectorate',
    'Warning tape installed. Maintenance crew on-site with replacement enclosure.',
    NOW() - INTERVAL '1 day'
);

-- Insert Additional Lifecycle History Records for Progression Demo
-- Note: The initial 'Pending' record is automatically created by the database trigger upon complaint insertion.
INSERT INTO public.complaint_status_history (complaint_id, old_status, new_status, notes, created_at)
VALUES 
('a1111111-1111-1111-1111-111111111111', 'Pending', 'In Review', 'Under review by Public Works triage officer', NOW() - INTERVAL '2 days'),
('a1111111-1111-1111-1111-111111111111', 'In Review', 'In Progress', 'Work order #PW-9821 issued. Asphalt patching crew dispatched.', NOW() - INTERVAL '1 day'),

('c3333333-3333-3333-3333-333333333333', 'Pending', 'In Progress', 'Assigned to Municipal Electricity Board line team', NOW() - INTERVAL '4 days'),
('c3333333-3333-3333-3333-333333333333', 'In Progress', 'Resolved', 'Replaced 4 sodium-vapor lamps with 60W energy-efficient LEDs.', NOW() - INTERVAL '1 day'),

('d4444444-4444-4444-4444-444444444444', 'Pending', 'In Review', 'Emergency valve isolation team notified.', NOW() - INTERVAL '4 hours'),

('e5555555-5555-5555-5555-555555555555', 'Pending', 'In Progress', 'Warning tape installed. Maintenance crew on-site.', NOW() - INTERVAL '18 hours');
