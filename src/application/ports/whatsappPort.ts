/**
 * Abstract Port Interface for WhatsApp Channel — Deshal ERP
 * 
 * Clean Architecture Application Layer: Interface contract for WhatsApp transport adapters.
 * ZERO React, ZERO Supabase, ZERO LocalStorage.
 */

import {
  WhatsAppChannelInfo,
  WhatsAppHealthStatus,
  WhatsAppOutboundPayload,
  WhatsAppQueueJob,
  WhatsAppSafetyState
} from '../../domain/whatsapp/whatsappDomain';

export interface WhatsAppPort {
  getChannelStatus(companyId: string): Promise<WhatsAppChannelInfo>;
  initiateConnect(companyId: string): Promise<{ success: boolean; state: string; qrCodeUrl?: string }>;
  getQrCode(companyId: string): Promise<{ qrCodeUrl?: string; expiresAt?: string; status: string }>;
  disconnectChannel(companyId: string): Promise<{ success: boolean; message: string }>;
  restartChannel(companyId: string): Promise<{ success: boolean; message: string }>;
  removeNumber(companyId: string): Promise<{ success: boolean; message: string }>;
  enqueueMessage(payload: WhatsAppOutboundPayload): Promise<{ success: boolean; jobId?: string; error?: string }>;
  getChannelHealth(companyId?: string): Promise<WhatsAppHealthStatus>;
  getProductionHealth(companyId?: string): Promise<any>;
  updateSafetyState(companyId: string, safetyState: WhatsAppSafetyState): Promise<{ success: boolean }>;
  getQueuedJobs(companyId: string): Promise<WhatsAppQueueJob[]>;
  getDeadLetterJobs(companyId?: string): Promise<WhatsAppQueueJob[]>;
  retryDeadLetterJob(jobId: string, companyId?: string): Promise<{ success: boolean; message: string }>;
  getWatchdogStatus(companyId?: string): Promise<any>;
  resetCircuitBreaker(companyId: string): Promise<{ success: boolean; message: string }>;
}
