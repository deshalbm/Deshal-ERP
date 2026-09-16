import { AiParserPort } from "../ports/aiParserPort";

/**
 * Application Use Case: Parses text/image inputs into voucher structure using AI capability.
 */
export function parseVoucherWithAI(
  textPrompt: string,
  aiParserPort: AiParserPort
): Promise<{ success: boolean; data?: any; error?: string }> {
  return aiParserPort.parseVoucher(textPrompt);
}
