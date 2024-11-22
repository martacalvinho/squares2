import { supabase } from "../integrations/supabase/client";

async function testDatabaseSetup() {
  console.log("Testing database setup...");

  try {
    // 1. Check total number of spots
    const { count: totalSpots, error: countError } = await supabase
      .from('spots')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error("Error counting spots:", countError);
      return;
    }
    console.log(`Total spots: ${totalSpots}`);

    // 2. Check if any spots have bids
    const { count: spotsWithBids, error: bidsError } = await supabase
      .from('spots')
      .select('*', { count: 'exact', head: true })
      .gt('current_bid', 0);

    if (bidsError) {
      console.error("Error counting spots with bids:", bidsError);
      return;
    }
    console.log(`Spots with bids: ${spotsWithBids}`);

    // 3. Sample some spots to check their state
    const { data: sampleSpots, error: sampleError } = await supabase
      .from('spots')
      .select('*')
      .limit(5);

    if (sampleError) {
      console.error("Error sampling spots:", sampleError);
      return;
    }
    console.log("\nSample spots:", sampleSpots);

    // 4. Test constraints
    console.log("\nTesting constraints...");
    
    // Test minimum bid constraint
    const { error: negBidError } = await supabase
      .from('spots')
      .update({ current_bid: -1 })
      .eq('id', 0);

    console.log("Negative bid constraint:", negBidError ? "Working" : "Failed");

    // Test URL format constraint
    const { error: urlError } = await supabase
      .from('spots')
      .update({ project_link: 'invalid-url' })
      .eq('id', 0);

    console.log("URL format constraint:", urlError ? "Working" : "Failed");

    // Test wallet address constraint
    const { error: walletError } = await supabase
      .from('spots')
      .update({ current_bidder: '123' })
      .eq('id', 0);

    console.log("Wallet address constraint:", walletError ? "Working" : "Failed");

    // 5. Performance test
    console.log("\nTesting query performance...");
    
    const startTime = Date.now();
    await supabase
      .from('spots')
      .select('*')
      .order('current_bid', { ascending: false })
      .limit(10);
    
    console.log(`Query execution time: ${Date.now() - startTime}ms`);

  } catch (error) {
    console.error("Unexpected error during testing:", error);
  }
}

// Run the test
console.log("Starting database tests...");
testDatabaseSetup()
  .then(() => console.log("\nTests completed!"))
  .catch(error => console.error("\nTest execution failed:", error));