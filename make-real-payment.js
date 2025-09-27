#!/usr/bin/env node

// Script to make a real x402 payment and test the endpoint
const { createSigner, createConnectedClient } = require('x402/types');
const { encodePayment } = require('x402/schemes');
require('dotenv').config();

async function makeRealPayment() {
  console.log('🔐 Creating payment with real signature...\n');

  // Step 1: Get the payment challenge from our endpoint
  console.log('1. Getting payment challenge...');
  const challengeResponse = await fetch('http://localhost:3000/api/proxy/test-api/posts/1');

  if (challengeResponse.status !== 402) {
    throw new Error(`Expected 402, got ${challengeResponse.status}`);
  }

  const challengeData = await challengeResponse.json();
  console.log('✅ Challenge received');
  console.log('   Network:', challengeData.challenge.network);
  console.log('   Amount:', challengeData.challenge.paymentRequirements.amount, challengeData.challenge.paymentRequirements.currency);
  console.log('   PayTo:', challengeData.challenge.paymentRequirements.payTo);
  console.log('   Nonce:', challengeData.challenge.nonce);

  // Step 2: Create a signer from private key
  console.log('\n2. Creating signer from private key...');
  const privateKey = process.env.EVM_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('EVM_PRIVATE_KEY not found in environment');
  }

  try {
    const signer = await createSigner(
      challengeData.challenge.network,
      privateKey
    );

    console.log('✅ Signer created');
    console.log('   Signer type:', typeof signer);
    console.log('   Signer keys:', Object.keys(signer));
    const signerAddress = signer.address || 'unknown';
    console.log('   Signer address:', signerAddress);

    // Step 3: Create connected client that can make payments
    console.log('\n3. Creating connected client...');
    const client = await createConnectedClient(challengeData.challenge.network);

    console.log('✅ Connected client created');
    console.log('   Client keys:', Object.keys(client));

    // Step 4: Make the actual payment request using the client
    console.log('\n4. Making payment request with x402 client...');

    const response = await client.fetch('http://localhost:3000/api/proxy/test-api/posts/1', {
      method: 'GET'
    });

    console.log(`\n📨 Response status: ${response.status}`);

    if (response.status === 200) {
      console.log('✅ SUCCESS! Payment was accepted and request was proxied!');
      const data = await response.json();
      console.log('\n📋 Response from backend API:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Payment failed or not accepted');
      const errorData = await response.text();
      console.log('Error response:', errorData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
  }
}

// Handle fetch not being available in older Node versions
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

makeRealPayment().catch(console.error);