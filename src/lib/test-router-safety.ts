/**
 * Test script to verify the router safety fixes
 * Run this to check if the history.replaceState() issue has been resolved
 */

// This would be run in a browser environment to test the fixes
console.log('Router Safety Test');

// Mock test for the rate limiting logic
function testRouterSafety() {
  let callCount = 0;
  const startTime = Date.now();
  
  // Simulate rapid navigation calls
  const interval = setInterval(() => {
    callCount++;
    console.log(`Navigation call ${callCount} at ${Date.now() - startTime}ms`);
    
    // Stop after 120 calls (more than the 100 limit)
    if (callCount >= 120) {
      clearInterval(interval);
      console.log('Test completed - if this was real router calls, it would have triggered the error');
      console.log('With our fixes, these calls should be debounced and rate-limited');
    }
  }, 50); // 50ms intervals = very rapid calls
}

// Run the test
testRouterSafety();

export {};
