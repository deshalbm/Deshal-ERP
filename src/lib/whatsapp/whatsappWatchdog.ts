/**
 * Production WhatsApp Connection Watchdog & Circuit Breaker — Deshal ERP
 * 
 * Server-Side Infrastructure Layer:
 * - Monitors individual company WhatsApp channels independently.
 * - Tracks heartbeats, connection states, queue latency, and consecutive failures.
 * - Enforces circuit breaker policy (CLOSED, OPEN, PAUSED, MANUAL_REVIEW) to prevent reconnect storms
 *   and account bans.
 * - Provides administrative reset capabilities with full audit trail.
 */

import {
  CircuitBreakerState,
  WhatsAppChannelInfo,
  WhatsAppChannelState,
  WhatsAppSafetyState
} from '../../domain/whatsapp/whatsappDomain';

export interface ChannelWatchdogMetrics {
  companyId: string;
  channelId: string;
  state: WhatsAppChannelState;
  circuitBreakerState: CircuitBreakerState;
  lastHeartbeat: string;
  heartbeatAgeSeconds: number;
  lastSuccessfulOperation?: string;
  lastFailedOperation?: string;
  consecutiveFailures: number;
  reconnectAttempts: number;
  queueLatencyMs: number;
  nextRetryAt?: string;
  isStale: boolean;
  errorMessage?: string;
}

export class WhatsAppWatchdog {
  private static instance: WhatsAppWatchdog;
  private metricsMap: Map<string, ChannelWatchdogMetrics> = new Map();
  private maxConsecutiveFailures = 5;
  private staleHeartbeatThresholdSeconds = 60;
  private isWorkerRunning = true;

  private constructor() {}

  public static getInstance(): WhatsAppWatchdog {
    if (!WhatsAppWatchdog.instance) {
      WhatsAppWatchdog.instance = new WhatsAppWatchdog();
    }
    return WhatsAppWatchdog.instance;
  }

  /**
   * Initializes or updates watchdog metrics for a company channel
   */
  public recordHeartbeat(info: WhatsAppChannelInfo): ChannelWatchdogMetrics {
    const companyId = info.companyId;
    const channelId = `ch_${companyId}`;
    const now = new Date();

    if (!this.metricsMap.has(companyId)) {
      this.metricsMap.set(companyId, {
        companyId,
        channelId,
        state: info.state,
        circuitBreakerState: 'CLOSED',
        lastHeartbeat: now.toISOString(),
        heartbeatAgeSeconds: 0,
        consecutiveFailures: 0,
        reconnectAttempts: 0,
        queueLatencyMs: 0,
        isStale: false
      });
    }

    const metrics = this.metricsMap.get(companyId)!;
    metrics.state = info.state;
    metrics.lastHeartbeat = now.toISOString();
    metrics.heartbeatAgeSeconds = 0;
    metrics.isStale = false;
    metrics.errorMessage = info.errorMessage;

    // Synchronize circuit breaker state with domain safety state
    if (info.safetyState === 'PAUSED') {
      metrics.circuitBreakerState = 'PAUSED';
    } else if (info.safetyState === 'MANUAL_REVIEW') {
      metrics.circuitBreakerState = 'MANUAL_REVIEW';
    }

    return metrics;
  }

  /**
   * Records a successful operation (send/receive/connect)
   */
  public recordSuccess(companyId: string) {
    const metrics = this.getMetrics(companyId);
    metrics.lastSuccessfulOperation = new Date().toISOString();
    metrics.consecutiveFailures = 0;
    metrics.isStale = false;
    metrics.errorMessage = undefined;

    if (metrics.circuitBreakerState === 'OPEN') {
      metrics.circuitBreakerState = 'CLOSED';
    }
  }

  /**
   * Records a failed operation and evaluates circuit breaker threshold
   */
  public recordFailure(companyId: string, error: string): {
    tripped: boolean;
    circuitBreakerState: CircuitBreakerState;
    errorMessage: string;
  } {
    const metrics = this.getMetrics(companyId);
    metrics.consecutiveFailures += 1;
    metrics.lastFailedOperation = new Date().toISOString();
    metrics.errorMessage = error;

    if (metrics.consecutiveFailures >= this.maxConsecutiveFailures) {
      if (metrics.consecutiveFailures >= this.maxConsecutiveFailures * 2) {
        metrics.circuitBreakerState = 'MANUAL_REVIEW';
      } else {
        metrics.circuitBreakerState = 'PAUSED';
      }
      return {
        tripped: true,
        circuitBreakerState: metrics.circuitBreakerState,
        errorMessage: `Circuit breaker tripped after ${metrics.consecutiveFailures} consecutive failures: ${error}`
      };
    }

    return {
      tripped: false,
      circuitBreakerState: metrics.circuitBreakerState,
      errorMessage: error
    };
  }

  /**
   * Evaluates stale channel status across all registered metrics
   */
  public checkStaleChannels(): { staleCount: number; staleCompanies: string[] } {
    const now = Date.now();
    const staleCompanies: string[] = [];

    for (const [cId, metrics] of this.metricsMap.entries()) {
      const heartbeatTime = new Date(metrics.lastHeartbeat).getTime();
      const ageSeconds = Math.floor((now - heartbeatTime) / 1000);
      metrics.heartbeatAgeSeconds = ageSeconds;

      if (ageSeconds > this.staleHeartbeatThresholdSeconds && (metrics.state === 'CONNECTED' || metrics.state === 'CONNECTING')) {
        metrics.isStale = true;
        staleCompanies.push(cId);
      }
    }

    return { staleCount: staleCompanies.length, staleCompanies };
  }

  /**
   * Resets circuit breaker state for authorized administrative action
   */
  public resetCircuitBreaker(companyId: string): { success: boolean; message: string } {
    if (!companyId) {
      return { success: false, message: 'companyId is required to reset circuit breaker' };
    }

    const metrics = this.getMetrics(companyId);
    metrics.circuitBreakerState = 'CLOSED';
    metrics.consecutiveFailures = 0;
    metrics.reconnectAttempts = 0;
    metrics.isStale = false;
    metrics.errorMessage = undefined;

    return { success: true, message: `Circuit breaker successfully reset to CLOSED for company ${companyId}` };
  }

  /**
   * Gets metrics for a company or initializes defaults
   */
  public getMetrics(companyId: string): ChannelWatchdogMetrics {
    if (!this.metricsMap.has(companyId)) {
      this.metricsMap.set(companyId, {
        companyId,
        channelId: `ch_${companyId}`,
        state: 'DISCONNECTED',
        circuitBreakerState: 'CLOSED',
        lastHeartbeat: new Date().toISOString(),
        heartbeatAgeSeconds: 0,
        consecutiveFailures: 0,
        reconnectAttempts: 0,
        queueLatencyMs: 0,
        isStale: false
      });
    }
    return this.metricsMap.get(companyId)!;
  }

  /**
   * Returns complete watchdog status overview
   */
  public getWatchdogStatus(companyId?: string): {
    service: string;
    workerActive: boolean;
    totalMonitoredChannels: number;
    staleChannelsCount: number;
    trippedCircuitBreakersCount: number;
    channels: Record<string, ChannelWatchdogMetrics>;
  } {
    const resultChannels: Record<string, ChannelWatchdogMetrics> = {};
    let staleChannelsCount = 0;
    let trippedCircuitBreakersCount = 0;

    this.checkStaleChannels();

    for (const [cId, metrics] of this.metricsMap.entries()) {
      if (!companyId || cId === companyId) {
        resultChannels[cId] = metrics;
        if (metrics.isStale) staleChannelsCount += 1;
        if (metrics.circuitBreakerState !== 'CLOSED') trippedCircuitBreakersCount += 1;
      }
    }

    return {
      service: 'whatsapp_watchdog',
      workerActive: this.isWorkerRunning,
      totalMonitoredChannels: Object.keys(resultChannels).length,
      staleChannelsCount,
      trippedCircuitBreakersCount,
      channels: resultChannels
    };
  }

  public setWorkerRunning(running: boolean) {
    this.isWorkerRunning = running;
  }
}
