import * as assert from 'assert';

import DemoBftConsensusService from '../modules/transactions/services/DemoBftConsensusService';

const service = new DemoBftConsensusService();

function testApprovedProposal(): void {
  const result = service.execute({
    proposalId: 'proposal-approved',
    fromUser: 'Chuck',
    toUser: 'Connie',
    amount: 25,
    hasSufficientBalance: true,
  });

  assert.strictEqual(result.mode, 'simulation');
  assert.strictEqual(result.status, 'approved');
  assert.strictEqual(result.quorum, 2);
  assert.strictEqual(result.approvalCount, 3);
  assert.strictEqual(result.rejectionCount, 0);
  assert.strictEqual(result.votes.length, 3);
  assert.strictEqual(new Set(result.votes.map(vote => vote.node)).size, 3);
}

function testInsufficientBalanceRejection(): void {
  const result = service.execute({
    proposalId: 'proposal-insufficient',
    fromUser: 'Chuck',
    toUser: 'Connie',
    amount: 25,
    hasSufficientBalance: false,
  });

  assert.strictEqual(result.status, 'rejected');
  assert.strictEqual(result.approvalCount, 0);
  assert.strictEqual(result.rejectionCount, 3);
  assert.ok(
    result.votes.every(vote => vote.reason === 'Insufficient balance'),
  );
}

function testSameAccountRejection(): void {
  const result = service.execute({
    proposalId: 'proposal-same-account',
    fromUser: 'Chuck',
    toUser: 'Chuck',
    amount: 25,
    hasSufficientBalance: true,
  });

  assert.strictEqual(result.status, 'rejected');
  assert.ok(
    result.votes.every(vote =>
      vote.reason.includes('Sender and recipient must be different'),
    ),
  );
}

function testInvalidAmountRejection(): void {
  const result = service.execute({
    proposalId: 'proposal-invalid-amount',
    fromUser: 'Chuck',
    toUser: 'Connie',
    amount: 0,
    hasSufficientBalance: true,
  });

  assert.strictEqual(result.status, 'rejected');
  assert.ok(
    result.votes.every(vote =>
      vote.reason.includes('Transfer amount must be greater than zero'),
    ),
  );
}

testApprovedProposal();
testInsufficientBalanceRejection();
testSameAccountRejection();
testInvalidAmountRejection();

console.log('PASS: Demo BFT consensus tests');
