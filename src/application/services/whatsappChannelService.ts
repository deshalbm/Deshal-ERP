/**
 * WhatsApp Channel Application Service — Deshal ERP
 * 
 * Clean Architecture Application Layer: Coordinates channel initialization, message dispatch,
 * anti-spam safety checks, idempotency, company isolation, and health aggregation.
 * ZERO Supabase imports, ZERO Browser Storage globals, ZERO direct DOM references.
 */

import { WhatsAppPort } from '../ports/whatsappPort';
import {
  WhatsAppChannelInfo,
  WhatsAppHealthStatus,
  WhatsAppOutboundPayload,
  formatWhatsAppRecipient,
  evaluateAntiSpamPolicy,
  interpolateWhatsAppTemplate
} from '../../domain/whatsapp/whatsappDomain';

export class WhatsAppChannelService {
  private adapter?: WhatsAppPort;

  constructor(adapter?: WhatsAppPort) {
    this.adapter = adapter;
  }

  /**
   * Application Use Case: Get current company WhatsApp channel state & health
   */
  async getChannelStatus(companyId: string): Promise<WhatsAppChannelInfo> {
    if (!companyId) {
      throw new Error('companyId is required to fetch channel status');
    }

    if (!this.adapter) {
      return {
        companyId,
        state: 'DISCONNECTED',
        safetyState: 'NORMAL',
        queueDepth: 0,
        retryCount: 0,
        errorMessage: 'WhatsAppPort adapter not provided'
      };
    }

    return await this.adapter.getChannelStatus(companyId);
  }

  /**
   * Application Use Case: Trigger QR generation and connection initiation
   */
  async initiateConnect(companyId: string): Promise<{ success: boolean; state: string; qrCodeUrl?: string }> {
    if (!companyId) {
      return { success: false, state: 'DISCONNECTED', qrCodeUrl: undefined };
    }

    if (!this.adapter) {
      return { success: false, state: 'DISCONNECTED' };
    }

    return await this.adapter.initiateConnect(companyId);
  }

  /**
   * Application Use Case: Disconnect WhatsApp session cleanly
   */
  async disconnectChannel(companyId: string): Promise<{ success: boolean; message: string }> {
    if (!companyId) {
      return { success: false, message: 'companyId is required' };
    }

    if (!this.adapter) {
      return { success: false, message: 'Adapter not configured' };
    }

    return await this.adapter.disconnectChannel(companyId);
  }

  /**
   * Application Use Case: Restart WhatsApp connection channel
   */
  async restartChannel(companyId: string): Promise<{ success: boolean; message: string }> {
    if (!companyId) {
      return { success: false, message: 'companyId is required' };
    }

    if (!this.adapter) {
      return { success: false, message: 'Adapter not configured' };
    }

    return await this.adapter.restartChannel(companyId);
  }

  /**
   * Application Use Case: Outbound message enqueue with safety validation
   */
  async sendOutboundMessage(payload: WhatsAppOutboundPayload): Promise<{
    success: boolean;
    jobId?: string;
    error?: string;
  }> {
    const { companyId, recipientPhone, messageText } = payload;

    if (!companyId || !recipientPhone || !messageText) {
      return { success: false, error: 'Missing required parameters (companyId, recipientPhone, messageText)' };
    }

    // 1. Phone Format Validation
    const phoneCheck = formatWhatsAppRecipient(recipientPhone);
    if (!phoneCheck.isValid) {
      return { success: false, error: 'Invalid recipient phone number format' };
    }

    if (!this.adapter) {
      return { success: false, error: 'WhatsAppPort adapter not configured' };
    }

    // 2. Channel & Anti-Spam Safety Evaluation
    const status = await this.adapter.getChannelStatus(companyId);
    if (status.state !== 'CONNECTED' && status.state !== 'CONNECTING') {
      return { success: false, error: `WhatsApp channel is not connected (current state: ${status.state})` };
    }

    const antiSpam = evaluateAntiSpamPolicy({
      companyId,
      recipientPhone: phoneCheck.cleanDigits,
      messagesSentLastMinute: 0,
      messagesSentLastHour: 0,
      failedAttemptsLastHour: status.retryCount
    });

    if (!antiSpam.allowed) {
      return { success: false, error: antiSpam.reason || 'Anti-spam policy violation' };
    }

    // 3. Template Interpolation if variables present
    const finalMessage = payload.variables
      ? interpolateWhatsAppTemplate(messageText, payload.variables)
      : messageText;

    // 4. Enqueue Job via Port Adapter
    return await this.adapter.enqueueMessage({
      ...payload,
      recipientPhone: phoneCheck.internationalPhone,
      messageText: finalMessage
    });
  }

  /**
   * Application Use Case: Get overall system & worker health
   */
  async getSystemHealth(companyId?: string): Promise<WhatsAppHealthStatus> {
    if (!this.adapter) {
      return {
        service: 'whatsapp_worker',
        status: 'DOWN',
        activeChannels: 0,
        totalQueueDepth: 0,
        failedJobsLastHour: 0,
        redisConnected: false,
        workerUptimeSeconds: 0,
        channels: {}
      };
    }

    return await this.adapter.getChannelHealth(companyId);
  }

  /**
   * Application Use Case: Fetch Dead-Letter Queue jobs scoped by companyId
   */
  async getDeadLetterJobs(companyId?: string) {
    if (!this.adapter) return [];
    return await this.adapter.getDeadLetterJobs(companyId);
  }

  /**
   * Application Use Case: Retry Dead-Letter Queue job
   */
  async retryDeadLetterJob(jobId: string, companyId?: string) {
    if (!this.adapter) return { success: false, message: 'Adapter not configured' };
    return await this.adapter.retryDeadLetterJob(jobId, companyId);
  }

  /**
   * Application Use Case: Fetch Watchdog & Circuit Breaker status metrics
   */
  async getWatchdogStatus(companyId?: string) {
    if (!this.adapter) return { service: 'whatsapp_watchdog', workerActive: false, totalMonitoredChannels: 0, channels: {} };
    return await this.adapter.getWatchdogStatus(companyId);
  }

  /**
   * Application Use Case: Reset Circuit Breaker state
   */
  async resetCircuitBreaker(companyId: string) {
    if (!this.adapter) return { success: false, message: 'Adapter not configured' };
    return await this.adapter.resetCircuitBreaker(companyId);
  }

  /**
   * Application Use Case: Destructively remove WhatsApp number and revoke encrypted session credentials
   */
  async removeNumber(companyId: string): Promise<{ success: boolean; message: string }> {
    if (!companyId) return { success: false, message: 'companyId is required' };
    if (!this.adapter) return { success: false, message: 'Adapter not configured' };
    return await this.adapter.removeNumber(companyId);
  }

  /**
   * Application Use Case: Get unified production health diagnostics
   */
  async getProductionHealth(companyId?: string) {
    if (!this.adapter) {
      return {
        service: 'whatsapp_production_runtime',
        environment: 'development',
        status: 'DOWN',
        redis: 'DISCONNECTED',
        worker: 'DOWN',
        encryption: 'CONFIGURED',
        watchdog: 'DEGRADED',
        companyId,
        activeChannelsCount: 0,
        queueDepth: 0,
        deadLetterCount: 0,
        timestamp: new Date().toISOString()
      };
    }
    return await this.adapter.getProductionHealth(companyId);
  }
}
