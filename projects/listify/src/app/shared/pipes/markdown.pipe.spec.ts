import { SecurityContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { BrowserModule, DomSanitizer } from '@angular/platform-browser';
import { MarkdownPipe } from './markdown.pipe';

describe('MarkdownPipe', () => {
  let pipe: MarkdownPipe;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule],
    });
    sanitizer = TestBed.inject(DomSanitizer);
    // Create pipe within injection context so inject() works
    pipe = TestBed.runInInjectionContext(() => new MarkdownPipe());
  });

  it('should create the pipe', () => {
    expect(pipe).toBeTruthy();
  });

  it('should convert markdown bold to HTML strong', () => {
    const result = pipe.transform('**bold**');
    const html = sanitizer.sanitize(SecurityContext.HTML, result) ?? '';
    expect(html).toContain('<strong>bold</strong>');
  });

  it('should convert markdown italic to HTML em', () => {
    const result = pipe.transform('*italic*');
    const html = sanitizer.sanitize(SecurityContext.HTML, result) ?? '';
    expect(html).toContain('<em>italic</em>');
  });

  it('should pass plain text through', () => {
    const result = pipe.transform('plain text');
    const html = sanitizer.sanitize(SecurityContext.HTML, result) ?? '';
    expect(html).toContain('plain text');
  });

  it('should handle empty string input', () => {
    const result = pipe.transform('');
    const html = sanitizer.sanitize(SecurityContext.HTML, result) ?? '';
    expect(html).toBe('');
  });

  it('should handle null/undefined input gracefully', () => {
    const result = pipe.transform(null as unknown as string);
    const html = sanitizer.sanitize(SecurityContext.HTML, result) ?? '';
    expect(html).toBe('');
  });
});
