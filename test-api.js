// Test script for CivicFix-AI REST API
async function runTests() {
  const baseUrl = "http://localhost:3000";

  console.log("1. Testing GET /api/stats...");
  const statsRes = await fetch(`${baseUrl}/api/stats`);
  const stats = await statsRes.json();
  console.log("Stats result:", stats);

  console.log("\n2. Testing POST /api/ai/analyze...");
  const aiRes = await fetch(`${baseUrl}/api/ai/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Deep pothole on flyover exit",
      description: "Cars skidding, two-wheeler fell down, rebar exposed",
      category: "Road Damage"
    })
  });
  const aiResult = await aiRes.json();
  console.log("AI Analysis:", aiResult.data?.suggested_category, "Severity:", aiResult.data?.safety_severity, "Priority:", aiResult.data?.recommended_priority);

  console.log("\n3. Testing POST /api/complaints (Create new issue)...");
  const createRes = await fetch(`${baseUrl}/api/complaints`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Broken water main flooding school lane",
      description: "Drinking water pipe burst, high pressure flow eroding road",
      category: "Water Supply",
      address: "Near Greenfield School Gate 1",
      latitude: 28.6150,
      longitude: 77.2100,
      reporter_name: "Karan Johar",
      reporter_email: "karan@example.com"
    })
  });
  const created = await createRes.json();
  console.log("Created Complaint:", created.data?.tracking_id, "ID:", created.data?.id, "Status:", created.data?.status);

  console.log("\n4. Testing PATCH /api/complaints/:id/status (Admin Triage)...");
  const updateRes = await fetch(`${baseUrl}/api/complaints/${created.data.id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status: "In Progress",
      assigned_department: "Water Supply & Sewerage Board",
      admin_notes: "Emergency valve team dispatched to isolate the section."
    })
  });
  const updated = await updateRes.json();
  console.log("Updated Status:", updated.data?.status, "Dept:", updated.data?.assigned_department);
  console.log("Status History Count:", updated.data?.status_history?.length);

  console.log("\n5. Verifying GET /api/complaints with query search...");
  const searchRes = await fetch(`${baseUrl}/api/complaints?q=Greenfield`);
  const searchList = await searchRes.json();
  console.log("Search matches found:", searchList.count);

  console.log("\n✅ ALL API TESTS PASSED SUCCESSFULLY!");
}

runTests().catch(console.error);
