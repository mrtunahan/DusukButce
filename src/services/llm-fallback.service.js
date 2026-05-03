const { anthropic } = require('../../config/llm');
const { LLMReceiptSchema } = require('../utils/validation-schemas');
const logger = require('../utils/logger');

const SYSTEM_PROMPT = `Sen bir Türk market fişi ayrıştırma asistanısın.
Verilen ham OCR metnini yapısal JSON'a çevir.

Kurallar:
- Sadece geçerli JSON döndür, açıklama veya markdown ekleme.
- KDV oranları sadece 1, 10 veya 20 olabilir.
- Tarih ISO 8601 formatında (YYYY-MM-DD) olsun.
- Tutarlar sayı olsun (string değil), nokta ondalık ayırıcısı.
- Kalem ismindeki gereksiz kısaltmaları açma, ham haliyle bırak.
- Toplam tutar yoksa null döndür, uydurma.

Çıktı şeması:
{
  "market_name": string | null,
  "vkn": string | null,
  "purchase_date": string | null,
  "total_amount": number | null,
  "items": [
    {
      "raw_name": string,
      "unit_price": number,
      "quantity": number,
      "line_total": number,
      "kdv_rate": 1 | 10 | 20
    }
  ]
}`;

async function llmParse(rawOcrText) {
  let attempt = 0;

  while (attempt < 2) {
    try {
      const response = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Şu fişi ayrıştır:\n\n${rawOcrText}` }],
      });

      const text = response.content[0].text.trim();
      const json = JSON.parse(text);
      return LLMReceiptSchema.parse(json);
    } catch (err) {
      attempt++;
      logger.warn({ err, attempt }, 'LLM parse attempt failed');
      if (attempt >= 2) throw err;
    }
  }
}

module.exports = { llmParse };
