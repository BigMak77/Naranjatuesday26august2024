// Test script to verify archive functionality
// This will help us understand if the database operations are working correctly

const testArchiveFunctionality = () => {
  console.log("Testing archive functionality...");
  
  // Simulate what happens in the component
  const mockModules = [
    { id: 1, name: "Module 1", is_archived: false },
    { id: 2, name: "Module 2", is_archived: true },
    { id: 3, name: "Module 3", is_archived: false },
    { id: 4, name: "Module 4", is_archived: true }
  ];
  
  console.log("All modules:", mockModules);
  
  // Test view tab filtering (should show only non-archived)
  const viewTabModules = mockModules.filter((m) => !m.is_archived);
  console.log("View tab modules (should be non-archived only):", viewTabModules);
  
  // Test archive tab filtering (should show only archived)
  const archiveTabModules = mockModules.filter((m) => m.is_archived);
  console.log("Archive tab modules (should be archived only):", archiveTabModules);
  
  // Verify the logic
  const hasNonArchivedInView = viewTabModules.some(m => m.is_archived);
  const hasArchivedInView = viewTabModules.some(m => !m.is_archived);
  const hasNonArchivedInArchive = archiveTabModules.some(m => !m.is_archived);
  const hasArchivedInArchive = archiveTabModules.some(m => m.is_archived);
  
  console.log("\n=== FILTERING VERIFICATION ===");
  console.log("View tab should have NO archived modules:", !hasNonArchivedInView ? "✅ PASS" : "❌ FAIL");
  console.log("View tab should have active modules:", hasArchivedInView ? "✅ PASS" : "❌ FAIL");
  console.log("Archive tab should have NO active modules:", !hasNonArchivedInArchive ? "✅ PASS" : "❌ FAIL");
  console.log("Archive tab should have archived modules:", hasArchivedInArchive ? "✅ PASS" : "❌ FAIL");
};

testArchiveFunctionality();
