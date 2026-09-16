import { AiParserPort } from "../../application/ports/aiParserPort";

export const aiParserHttpAdapter: AiParserPort = {
  parseVoucher: async (textPrompt: string) => {
    const res = await fetch("/api/ai/parse-voucher", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ textPrompt })
    });
    return res.json();
  }
};
