/**
 * WhatsApp Infrastructure Port Adapter — Deshal ERP
 * 
 * Clean Architecture Infrastructure Layer: Implements abstract WhatsAppPort.
 * Connects Application Services with WhatsAppConnectionManager engine.
 */

import { WhatsAppPort } from '../../application/ports/whatsappPort';
import {
  WhatsAppChannelInfo,
  WhatsAppHealthStatus,
  WhatsAppOutboundPayload,
  WhatsAppQueueJob,
  WhatsAppSafetyState
} from '../../domain/whatsapp/whatsappDomain';
import { WhatsAppConnectionManager } from '../whatsapp/whatsappConnectionManager';
import { WhatsAppQueueManager } from '../whatsapp/whatsappQueueManager';
import { WhatsAppWatchdog } from '../whatsapp/whatsappWatchdog';

export class WhatsAppServerAdapter implements WhatsAppPort {
  private manager = WhatsAppConnectionManager.getInstance();
  private queueManager = WhatsAppQueueManager.getInstance();
  private watchdog = WhatsAppWatchdog.getInstance();

  async getChannelStatus(companyId: string): Promise<WhatsAppChannelInfo> {
    return await this.manager.getChannelStatus(companyId);
  }

  async initiateConnect(companyId: string): Promise<{ success: boolean; state: string; qrCodeUrl?: string }> {
    return await this.manager.initiateConnect(companyId);
  }

  async getQrCode(companyId: string): Promise<{ qrCodeUrl?: string; expiresAt?: string; status: string }> {
    const status = await this.manager.getChannelStatus(companyId);
    return {
      qrCodeUrl: status.qrCodeUrl,
      expiresAt: status.qrExpiresAt,
      status: status.state
    };
  }

  async disconnectChannel(companyId: string): Promise<{ success: boolean; message: string }> {
    return await this.manager.disconnectChannel(companyId);
  }

  async restartChannel(companyId: string): Promise<{ success: boolean; message: string }> {
    return await this.manager.restartChannel(companyId);
  }

  async removeNumber(companyId: string): Promise<{ success: boolean; message: string }> {
    return await this.manager.removeNumber(companyId);
  }

  async enqueueMessage(payload: WhatsAppOutboundPayload): Promise<{ success: boolean; jobId?: string; error?: string }> {
    return await this.manager.enqueueMessage(payload);
  }

  async getChannelHealth(companyId?: string): Promise<WhatsAppHealthStatus> {
    return await this.manager.getHealth(companyId);
  }

  async getProductionHealth(companyId?: string): Promise<any> {
    return await this.manager.getProductionHealth(companyId);
  }

  async updateSafetyState(companyId: string, safetyState: WhatsAppSafetyState): Promise<{ success: boolean }> {
    return await this.manager.updateSafetyState(companyId, safetyState);
  }

  async getQueuedJobs(companyId: string): Promise<WhatsAppQueueJob[]> {
    return await this.manager.getQueuedJobs(companyId);
  }

  async getDeadLetterJobs(companyId?: string): Promise<WhatsAppQueueJob[]> {
    return this.queueManager.getDeadLetterJobs(companyId);
  }

  async retryDeadLetterJob(jobId: string, companyId?: string): Promise<{ success: boolean; message: string }> {
    return await this.queueManager.retryDeadLetterJob(jobId, companyId);
  }

  async getWatchdogStatus(companyId?: string): Promise<any> {
    return this.watchdog.getWatchdogStatus(companyId);
  }

  async resetCircuitBreaker(companyId: string): Promise<{ success: boolean; message: string }> {
    return this.watchdog.resetCircuitBreaker(companyId);
  }
}

export const defaultWhatsAppAdapter = new WhatsAppServerAdapter();
