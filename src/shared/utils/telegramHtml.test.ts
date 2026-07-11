import { describe, expect, it } from "vitest";
import { sanitizeTelegramHtml } from "./telegramHtml";

describe("sanitizeTelegramHtml", () => {
  it("renders allowed Telegram HTML tags", () => {
    const html = 'ALERTA: <b>Nuevo Ciberataque</b>\n🔗 <a href="https://example.com">Ver más</a>';

    expect(sanitizeTelegramHtml(html)).toBe(
      'ALERTA: <b>Nuevo Ciberataque</b><br />🔗 <a href="https://example.com" target="_blank" rel="noopener noreferrer">Ver más</a>'
    );
  });

  it("strips unsafe tags and javascript links", () => {
    const html = '<script>alert(1)</script><a href="javascript:alert(1)">x</a><b>ok</b>';

    expect(sanitizeTelegramHtml(html)).toBe("x<b>ok</b>");
  });
});
