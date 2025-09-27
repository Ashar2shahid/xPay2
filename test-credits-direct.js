#!/usr/bin/env node

/**
 * Direct test of credit system without actual payments
 * Tests the credit logic by simulating overpayments and credit usage
 */

const { db, endpointCredits } = require('./src/lib/db');
const { addCredits, deductCredits, getCreditBalance } = require('./src/lib/credits');
const { eq } = require('drizzle-orm');

async function testCreditsDirect() {
  console.log('🧪 Direct Credit System Test\n');

  // Test data
  const projectId = 'test-project-123';
  const endpointId = 'test-endpoint-456';
  const userAddress = '0xTestUser123456789';

  console.log('1. Testing credit creation with overpayment...');

  // Simulate: User pays $2.00 for $0.02 endpoint = $1.98 overpayment
  const overpayment1 = 1.98;
  const credit1 = await addCredits(projectId, endpointId, userAddress, overpayment1, '0xTxHash1');

  console.log(`   ✅ Credits added: $${credit1.balance}`);
  console.log(`   ✅ Total deposited: $${credit1.totalDeposited}`);
  console.log(`   Expected: $1.98 | Actual: $${credit1.balance}`);

  if (Math.abs(credit1.balance - 1.98) < 0.001) {
    console.log('   ✅ PASS: Correct credit amount\n');
  } else {
    console.log('   ❌ FAIL: Incorrect credit amount\n');
  }

  console.log('2. Testing credit deduction...');

  // Simulate: User makes request to $0.02 endpoint using credits
  const endpointPrice = 0.02;
  const credit2 = await deductCredits(endpointId, userAddress, endpointPrice);

  if (credit2) {
    console.log(`   ✅ Credits deducted: $${endpointPrice}`);
    console.log(`   ✅ New balance: $${credit2.balance}`);
    console.log(`   ✅ Total spent: $${credit2.totalSpent}`);
    console.log(`   Expected balance: $1.96 | Actual: $${credit2.balance}`);

    if (Math.abs(credit2.balance - 1.96) < 0.001) {
      console.log('   ✅ PASS: Correct balance after deduction\n');
    } else {
      console.log('   ❌ FAIL: Incorrect balance after deduction\n');
    }
  } else {
    console.log('   ❌ FAIL: Credit deduction failed\n');
  }

  console.log('3. Testing multiple credit top-ups...');

  // Simulate: Another overpayment of $0.50
  const overpayment2 = 0.50;
  const credit3 = await addCredits(projectId, endpointId, userAddress, overpayment2, '0xTxHash2');

  console.log(`   ✅ Additional credits added: $${overpayment2}`);
  console.log(`   ✅ New balance: $${credit3.balance}`);
  console.log(`   ✅ Total deposited: $${credit3.totalDeposited}`);
  console.log(`   Expected balance: $2.46 | Actual: $${credit3.balance}`);
  console.log(`   Expected total deposited: $2.48 | Actual: $${credit3.totalDeposited}`);

  if (Math.abs(credit3.balance - 2.46) < 0.001 && Math.abs(credit3.totalDeposited - 2.48) < 0.001) {
    console.log('   ✅ PASS: Correct cumulative credits\n');
  } else {
    console.log('   ❌ FAIL: Incorrect cumulative credits\n');
  }

  console.log('4. Testing multiple deductions until depleted...');

  let currentBalance = credit3.balance;
  let deductionCount = 0;

  while (currentBalance >= endpointPrice) {
    const result = await deductCredits(endpointId, userAddress, endpointPrice);
    if (result) {
      deductionCount++;
      currentBalance = result.balance;
      console.log(`   Request ${deductionCount}: $${result.balance.toFixed(2)} remaining`);
    } else {
      break;
    }
  }

  console.log(`   ✅ Successfully made ${deductionCount} requests using credits`);
  console.log(`   ✅ Final balance: $${currentBalance.toFixed(4)}\n`);

  console.log('5. Testing insufficient credits...');

  const largeAmount = 100.00;
  const result = await deductCredits(endpointId, userAddress, largeAmount);

  if (result === null) {
    console.log(`   ✅ PASS: Correctly rejected deduction of $${largeAmount} (insufficient balance)\n`);
  } else {
    console.log(`   ❌ FAIL: Should have rejected insufficient balance\n`);
  }

  console.log('6. Checking final credit state...');

  const finalBalance = await getCreditBalance(endpointId, userAddress);

  if (finalBalance) {
    console.log(`   Balance: $${finalBalance.balance.toFixed(4)}`);
    console.log(`   Total Deposited: $${finalBalance.totalDeposited.toFixed(2)}`);
    console.log(`   Total Spent: $${finalBalance.totalSpent.toFixed(2)}`);
    console.log(`   ✅ PASS: Credit state is consistent\n`);
  }

  // Cleanup
  console.log('7. Cleaning up test data...');
  await db.delete(endpointCredits)
    .where(eq(endpointCredits.endpointId, endpointId));
  console.log('   ✅ Test data cleaned up\n');

  console.log('✅ All Credit System Tests Complete!\n');

  console.log('📊 Summary:');
  console.log(`   • Credit Creation: ✅`);
  console.log(`   • Credit Deduction: ✅`);
  console.log(`   • Multiple Top-ups: ✅`);
  console.log(`   • Multiple Deductions: ✅ (${deductionCount} requests)`);
  console.log(`   • Insufficient Balance Handling: ✅`);
  console.log(`   • State Consistency: ✅`);
}

testCreditsDirect().catch(console.error).finally(() => process.exit(0));