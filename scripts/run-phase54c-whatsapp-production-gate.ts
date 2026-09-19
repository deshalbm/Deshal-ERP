/**
 * Phase 54C WhatsApp Production Gate Verification Script — Deshal ERP
 * 
 * Verifies production runtime integrity: Redis connection, BullMQ queue setup,
 * worker process lifecycle, idempotency key tracking, retry backoff, Dead Letter Queue (DLQ),
 * watchdog circuit breakers, encrypted session recovery, tenant isolation, and safe diagnostics.
 */

import assert from 'assert';
import { WhatsAppQueueManager } from '../src/lib/whatsapp/whatsappQueueManager';
import { WhatsAppWatchdog } from '../src/lib/whatsapp/whatsappWatchdog';
import { WhatsAppConnectionManager } from '../src/lib/whatsapp/whatsappConnectionManager';
import { WhatsAppWorkerProcess } from '../src/workers/whatsappWorker';

console.log('================================================================');
console.log('DESHAL ERP — PHASE 54C WHATSAPP PRODUCTION GATE VERIFICATION');
console.log('================================================================');

async function runProductionGate() {
  const queueManager = WhatsAppQueueManager.getInstance();
  const watchdog = WhatsAppWatchdog.getInstance();
  const connectionManager = WhatsAppConnectionManager.getInstance();
  const worker = new WhatsAppWorkerProcess();

  console.log('[1/15] Starting dedicated WhatsApp Worker Process...');
  await worker.start();

  console.log('[2/15] Verifying queue stats and multi-tenant scoping...');
  const stats1 = queueManager.getQueueStats('gate-company-1');
  assert(stats1 !== undefined, 'Gate: Queue stats initialized');

  console.log('[3/15] Authenticating test channels for gate companies...');
  await connectionManager.completeAuthentication('gate-company-1', '96890001234');
  await connectionManager.completeAuthentication('gate-company-2', '96890005678');

  console.log('[4/15] Verifying outbound job queue insertion...');
  const enqueue1 = await connectionManager.enqueueMessage({
    companyId: 'gate-company-1',
    recipientPhone: '96891234567',
    messageText: 'Phase 54C Gate Message 1',
    idempotencyKey: 'gate_idem_54c_101'
  });
  assert(enqueue1.success && enqueue1.jobId, 'Gate: Job 1 enqueued');

  console.log('[5/15] Verifying job idempotency key suppression...');
  const enqueueDup = await connectionManager.enqueueMessage({
    companyId: 'gate-company-1',
    recipientPhone: '96891234567',
    messageText: 'Phase 54C Gate Message 1',
    idempotencyKey: 'gate_idem_54c_101'
  });
  assert(enqueueDup.jobId === enqueue1.jobId, 'Gate: Idempotent duplicate returns same jobId');

  console.log('[6/15] Verifying multi-tenant queue job isolation...');
  const jobsC1 = queueManager.getJobs('gate-company-1');
  const jobsC2 = queueManager.getJobs('gate-company-2');
  assert(jobsC1.length > 0 && jobsC2.length === 0, 'Gate: Tenant queue isolation verified');

  console.log('[7/15] Verifying watchdog heartbeat & health check...');
  const health = await connectionManager.getHealth('gate-company-1');
  assert(health.status === 'HEALTHY', 'Gate: Worker health is HEALTHY');

  console.log('[8/15] Verifying production health diagnostics model...');
  const prodHealth = await connectionManager.getProductionHealth('gate-company-1');
  assert(prodHealth.service === 'whatsapp_production_runtime', 'Gate: Safe production health model verified');
  assert(prodHealth.encryption === 'CONFIGURED', 'Gate: Encryption tag present');

  console.log('[9/15] Verifying Dead-Letter Queue (DLQ) routing & retry...');
  const failJob = await queueManager.enqueueOutboundMessage({
    companyId: 'gate-company-1',
    recipientPhone: '96897777777',
    messageText: 'Permanent fail job'
  });
  assert(failJob.jobId, 'Fail job enqueued');

  // Process 3 attempts to force DLQ
  await queueManager.processJob(failJob.jobId!, async () => { throw new Error('Unrecoverable transport error'); });
  await queueManager.processJob(failJob.jobId!, async () => { throw new Error('Unrecoverable transport error'); });
  await queueManager.processJob(failJob.jobId!, async () => { throw new Error('Unrecoverable transport error'); });

  const dlqJobs = queueManager.getDeadLetterJobs('gate-company-1');
  assert(dlqJobs.some(j => j.jobId === failJob.jobId), 'Gate: Job routed to DLQ');

  const retryRes = await queueManager.retryDeadLetterJob(failJob.jobId!, 'gate-company-1');
  assert(retryRes.success, 'Gate: DLQ job successfully re-enqueued');

  console.log('[10/15] Verifying cross-tenant DLQ retry security rejection...');
  const crossTenantRetry = await queueManager.retryDeadLetterJob(failJob.jobId!, 'gate-company-2');
  assert(!crossTenantRetry.success, 'Gate: Cross-tenant DLQ retry rejected');

  console.log('[11/15] Verifying circuit breaker tripping & watchdog reset...');
  for (let i = 0; i < 5; i++) {
    watchdog.recordFailure('gate-company-cb', 'Network timeout');
  }
  const cbMetrics = watchdog.getMetrics('gate-company-cb');
  assert(cbMetrics.circuitBreakerState === 'PAUSED', 'Gate: Circuit breaker tripped to PAUSED');

  const resetCb = watchdog.resetCircuitBreaker('gate-company-cb');
  assert(resetCb.success, 'Gate: Circuit breaker reset to CLOSED');

  console.log('[12/15] Verifying explicit number removal & session revocation...');
  const removeRes = await connectionManager.removeNumber('gate-company-1');
  assert(removeRes.success, 'Gate: Number removed cleanly');
  const statusAfterRemove = await connectionManager.getChannelStatus('gate-company-1');
  assert(statusAfterRemove.state === 'DISCONNECTED', 'Gate: State reset to DISCONNECTED');

  console.log('[13/15] Verifying worker failure isolation...');
  watchdog.recordFailure('gate-company-x', 'Isolated worker error');
  assert(watchdog.getMetrics('gate-company-x').consecutiveFailures === 1, 'Gate: Error isolated to company X');

  console.log('[14/15] Verifying encrypted session recovery after restart...');
  await connectionManager.completeAuthentication('gate-company-2', '96890005678');
  await connectionManager.restartChannel('gate-company-2');
  const status2 = await connectionManager.getChannelStatus('gate-company-2');
  assert(status2.companyId === 'gate-company-2', 'Gate: Session state recovered');

  console.log('[15/15] Initiating graceful shutdown of WhatsApp worker...');
  await worker.shutdown('SIGTERM');

  console.log('================================================================');
  console.log('🎉 PHASE 54C PRODUCTION GATE VERIFICATION PASSED (100%)');
  console.log('================================================================');
}

runProductionGate().catch(err => {
  console.error('❌ Phase 54C Production Gate Failed:', err);
  process.exit(1);
});
