/**
 * Production Smoke Test Script for Phase 54B WhatsApp Runtime — Deshal ERP
 * 
 * Verifies end-to-end runtime queueing, worker execution, watchdog circuit breaker,
 * dead-letter queue routing, multi-company isolation, and health metrics.
 */

import assert from 'assert';
import { WhatsAppQueueManager } from '../src/lib/whatsapp/whatsappQueueManager';
import { WhatsAppWatchdog } from '../src/lib/whatsapp/whatsappWatchdog';
import { WhatsAppConnectionManager } from '../src/lib/whatsapp/whatsappConnectionManager';
import { WhatsAppWorkerProcess } from '../src/workers/whatsappWorker';

console.log('======================================================');
console.log('DESHAL ERP — PHASE 54B PRODUCTION RUNTIME SMOKE TEST');
console.log('======================================================');

async function runSmokeTest() {
  const queueManager = WhatsAppQueueManager.getInstance();
  const watchdog = WhatsAppWatchdog.getInstance();
  const connectionManager = WhatsAppConnectionManager.getInstance();
  const worker = new WhatsAppWorkerProcess();

  console.log('1. Starting WhatsApp Worker process...');
  await worker.start();

  console.log('2. Verifying queue stats & channels...');
  const initialStats = queueManager.getQueueStats('smoke-company-1');
  assert(initialStats !== undefined, 'Smoke Test: Queue stats initialized');

  console.log('3. Authenticating test channels for smoke companies...');
  await connectionManager.completeAuthentication('smoke-company-1', '96890001111');
  await connectionManager.completeAuthentication('smoke-company-2', '96890002222');

  console.log('4. Testing outbound job queue insertion & idempotency...');
  const enqueue1 = await connectionManager.enqueueMessage({
    companyId: 'smoke-company-1',
    recipientPhone: '96891234567',
    messageText: 'Smoke test message 1',
    idempotencyKey: 'smoke_idem_101'
  });
  assert(enqueue1.success && enqueue1.jobId, 'Smoke Test: Message 1 enqueued');

  const enqueueDuplicate = await connectionManager.enqueueMessage({
    companyId: 'smoke-company-1',
    recipientPhone: '96891234567',
    messageText: 'Smoke test message 1',
    idempotencyKey: 'smoke_idem_101'
  });
  assert(enqueueDuplicate.jobId === enqueue1.jobId, 'Smoke Test: Idempotent duplicate job suppressed');

  console.log('5. Testing multi-company queue & watchdog isolation...');
  const statsC1 = queueManager.getQueueStats('smoke-company-1');
  const statsC2 = queueManager.getQueueStats('smoke-company-2');
  assert(statsC1.jobs.length > 0 && statsC2.jobs.length === 0, 'Smoke Test: Company 1 jobs isolated from Company 2');

  console.log('6. Testing watchdog heartbeat & health check...');
  const health = await connectionManager.getHealth('smoke-company-1');
  assert(health.status === 'HEALTHY', 'Smoke Test: Worker health is HEALTHY');
  assert(health.activeChannels >= 1, 'Smoke Test: Active channels recorded');

  console.log('7. Testing Dead-Letter Queue (DLQ) routing & retry...');
  const enqueueFail = await queueManager.enqueueOutboundMessage({
    companyId: 'smoke-company-1',
    recipientPhone: '96895555555',
    messageText: 'Fail message for DLQ'
  });
  assert(enqueueFail.jobId, 'Fail job enqueued');

  // Force 3 attempts
  await queueManager.processJob(enqueueFail.jobId!, async () => { throw new Error('Permanent fail'); });
  await queueManager.processJob(enqueueFail.jobId!, async () => { throw new Error('Permanent fail'); });
  await queueManager.processJob(enqueueFail.jobId!, async () => { throw new Error('Permanent fail'); });

  const dlqJobs = queueManager.getDeadLetterJobs('smoke-company-1');
  assert(dlqJobs.some(j => j.jobId === enqueueFail.jobId), 'Smoke Test: Job routed to DLQ');

  const retryRes = await queueManager.retryDeadLetterJob(enqueueFail.jobId!, 'smoke-company-1');
  assert(retryRes.success, 'Smoke Test: DLQ job retry re-enqueued');

  console.log('8. Testing circuit breaker tripping & administrative reset...');
  for (let i = 0; i < 5; i++) {
    watchdog.recordFailure('smoke-company-cb', 'Network timeout');
  }
  const cbMetrics = watchdog.getMetrics('smoke-company-cb');
  assert(cbMetrics.circuitBreakerState === 'PAUSED', 'Smoke Test: Circuit breaker tripped to PAUSED');

  const resetCb = watchdog.resetCircuitBreaker('smoke-company-cb');
  assert(resetCb.success, 'Smoke Test: Circuit breaker reset to CLOSED');

  console.log('9. Initiating graceful shutdown of WhatsApp worker...');
  await worker.shutdown('SIGTERM');

  console.log('======================================================');
  console.log('PHASE 54B RUNTIME SMOKE TEST PASSED (100%)');
  console.log('======================================================');
}

runSmokeTest().catch(err => {
  console.error('❌ Phase 54B Smoke Test Failed:', err);
  process.exit(1);
});
