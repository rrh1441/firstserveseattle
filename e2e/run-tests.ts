import { runSignupSubscriptionTest } from './signup-flow.js';

async function main() {
  console.log('🚀 First Serve Seattle E2E Test Suite\n');
  console.log('='.repeat(50));
  console.log(`Date: ${new Date().toISOString()}`);
  console.log(`Environment: ${process.env.CI ? 'CI' : 'Local'}`);
  console.log('='.repeat(50));

  const results: { name: string; passed: boolean }[] = [];

  // Run signup + subscription test
  const result = await runSignupSubscriptionTest();
  results.push({ name: 'Signup + Subscription Flow', passed: result });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));

  for (const result of results) {
    const status = result.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`${status}: ${result.name}`);
  }

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;
  console.log(`\nTotal: ${passed}/${total} tests passed`);

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
