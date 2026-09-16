export interface AiParserPort {
  parseVoucher: (textPrompt: string) => Promise<{ success: boolean; data?: any; error?: string }>;
}
