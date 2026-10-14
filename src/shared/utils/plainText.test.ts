import { describe, expect, it } from 'vitest';
import { toPlainText } from './plainText';

describe('toPlainText', () => {
  it('strips tags and decodes entities', () => {
    expect(toPlainText('<b>CVE-1</b> &amp; <i>CVE-2</i> &lt;ok&gt;')).toBe('CVE-1 & CVE-2 <ok>');
  });

  it('turns <br> into line breaks and collapses spaces within lines', () => {
    expect(toPlainText('a<br>b<br/>c   d')).toBe('a\nb\nc d');
  });

  it('drops script content entirely', () => {
    expect(toPlainText('<b>CVE-1</b> is <script>x</script>critical')).toBe('CVE-1 is critical');
  });

  it('drops style content entirely', () => {
    expect(toPlainText('ok<style>p{color:red}</style>done')).toBe('okdone');
  });

  it('never executes markup', () => {
    const w = window as unknown as { __pwned?: boolean };
    toPlainText('<img src=x onerror="window.__pwned=true">hi');
    expect(w.__pwned).toBeUndefined();
  });

  it('returns an empty string for nullish input', () => {
    expect(toPlainText(null)).toBe('');
    expect(toPlainText(undefined)).toBe('');
  });
});
