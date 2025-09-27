#!/usr/bin/env node

const { createPublicClient, http } = require('viem');
const { base } = require('viem/chains');
const { createSigner } = require('x402-fetch');
require('dotenv').config();

async function testCreditExhaustion() {
  console.log('🧪 Credit Exhaustion Test: Verify 402 after credits run out\n');

  const privateKey = process.env.EVM_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('EVM_PRIVATE_KEY not found in .env');
  }

  console.log('1. Creating wallet signer...');
  const signer = await createSigner('base', privateKey);
  console.log('✅ Account:', signer.account.address);

  console.log('\n2. Creating project with credit-enabled endpoint...');
  const projectData = {
    name: 'Credit Exhaustion Test',
    description: 'Test 402 response when credits run out',
    defaultPrice: 0.05,
    currency: 'USD',
    payTo: process.env.ADDRESS || '0xC237b055dd2f9e9B7fDBC531cca9fF44dF6727cf',
    paymentChains: ['base'],
    endpoints: [
      {
        url: 'https://jsonplaceholder.typicode.com',
        path: '/posts/1',
        method: 'GET',
        price: 0.01,
        description: 'Test endpoint'
      }
    ]
  };

  const projectResponse = await fetch('http://localhost:3000/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(projectData)
  });

  const projectResult = await projectResponse.json();
  if (!projectResponse.ok) {
    console.log('❌ Failed to create project:', projectResult);
    return;
  }

  const projectSlug = projectResult.project.slug;
  const endpointId = projectResult.project.endpoints[0].id;
  console.log(`✅ Project: ${projectSlug}`);

  console.log('\n3. Enabling credits...');
  const enableResponse = await fetch(`http://localhost:3000/api/endpoints/${endpointId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creditsEnabled: true, minTopupAmount: 0.01 })
  });

  if (!enableResponse.ok) {
    console.log('❌ Failed to enable credits');
    return;
  }
  console.log('✅ Credits enabled');

  console.log('\n4. Creating exactly $0.03 in credits (3 x $0.01 requests)...');
  const overpaymentAmount = 0.03;
  const endpointPrice = 0.01;

  const now = Math.floor(Date.now() / 1000);
  const payToAddress = process.env.ADDRESS || '0xC237b055dd2f9e9B7fDBC531cca9fF44dF6727cf';
  const usdcAddress = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

  const authorization = {
    from: signer.account.address,
    to: payToAddress,
    value: String(Math.floor(overpaymentAmount * 1000000)),
    validAfter: String(now - 60),
    validBefore: String(now + 600),
    nonce: '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
  };

  const domain = {
    name: 'USD Coin',
    version: '2',
    chainId: 8453,
    verifyingContract: usdcAddress
  };

  const types = {
    TransferWithAuthorization: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'validAfter', type: 'uint256' },
      { name: 'validBefore', type: 'uint256' },
      { name: 'nonce', type: 'bytes32' }
    ]
  };

  const signature = await signer.account.signTypedData({
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message: authorization
  });

  const payment = {
    x402Version: 1,
    scheme: 'exact',
    network: 'base',
    payload: { signature, authorization }
  };

  const paymentHeader = Buffer.from(JSON.stringify(payment)).toString('base64');
  const overpaymentUrl = `http://localhost:3000/api/proxy/${projectSlug}/posts/1`;

  const overpaymentResponse = await fetch(overpaymentUrl, {
    method: 'GET',
    headers: { 'X-Payment': paymentHeader }
  });

  if (overpaymentResponse.status !== 200) {
    console.log('❌ Overpayment failed');
    return;
  }

  const creditBalance = overpaymentResponse.headers.get('X-Credit-Balance');
  console.log(`✅ Credits created: $${creditBalance}`);

  console.log('\n5. Using credits with zero-value payments (should get 2 requests)...\n');

  for (let i = 1; i <= 2; i++) {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const zeroValueAuth = {
      from: signer.account.address,
      to: payToAddress,
      value: '0',
      validAfter: String(Math.floor(Date.now() / 1000) - 60),
      validBefore: String(Math.floor(Date.now() / 1000) + 600),
      nonce: '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
    };

    const zeroValueSig = await signer.account.signTypedData({
      domain,
      types,
      primaryType: 'TransferWithAuthorization',
      message: zeroValueAuth
    });

    const zeroValuePayment = {
      x402Version: 1,
      scheme: 'exact',
      network: 'base',
      payload: { signature: zeroValueSig, authorization: zeroValueAuth }
    };

    const zeroValueHeader = Buffer.from(JSON.stringify(zeroValuePayment)).toString('base64');

    const creditResponse = await fetch(overpaymentUrl, {
      method: 'GET',
      headers: { 'X-Payment': zeroValueHeader }
    });

    const balance = creditResponse.headers.get('X-Credit-Balance');
    const used = creditResponse.headers.get('X-Credit-Used');

    if (creditResponse.status === 200) {
      console.log(`   Request ${i}: ✅ Success - Balance: $${balance}, Used: ${used}`);
    } else {
      console.log(`   Request ${i}: ❌ Failed (${creditResponse.status})`);
      return;
    }
  }

  console.log('\n6. Making 3rd request - should fail with 402 (insufficient credits)...\n');

  await new Promise(resolve => setTimeout(resolve, 1500));

  const finalZeroValueAuth = {
    from: signer.account.address,
    to: payToAddress,
    value: '0',
    validAfter: String(Math.floor(Date.now() / 1000) - 60),
    validBefore: String(Math.floor(Date.now() / 1000) + 600),
    nonce: '0x' + Math.random().toString(16).substring(2).padStart(64, '0')
  };

  const finalZeroValueSig = await signer.account.signTypedData({
    domain,
    types,
    primaryType: 'TransferWithAuthorization',
    message: finalZeroValueAuth
  });

  const finalZeroValuePayment = {
    x402Version: 1,
    scheme: 'exact',
    network: 'base',
    payload: { signature: finalZeroValueSig, authorization: finalZeroValueAuth }
  };

  const finalZeroValueHeader = Buffer.from(JSON.stringify(finalZeroValuePayment)).toString('base64');

  const finalResponse = await fetch(overpaymentUrl, {
    method: 'GET',
    headers: { 'X-Payment': finalZeroValueHeader }
  });

  if (finalResponse.status === 402) {
    const errorBody = await finalResponse.json();
    console.log('✅ SUCCESS: Got 402 Payment Required');
    console.log('   Error:', errorBody.error);
    console.log('   Accepts:', errorBody.accepts?.length || 0, 'payment options');

    if (errorBody.error.includes('Insufficient credits')) {
      console.log('   ✅ Correct error message: Insufficient credits');
    } else {
      console.log('   ⚠️  Unexpected error message:', errorBody.error);
    }
  } else {
    console.log(`❌ FAILED: Expected 402, got ${finalResponse.status}`);
    const text = await finalResponse.text();
    console.log('   Response:', text.substring(0, 200));
  }

  console.log('\n✅ Credit Exhaustion Test Complete!\n');
}

if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testCreditExhaustion().catch(console.error);