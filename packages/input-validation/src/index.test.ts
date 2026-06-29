import { describe, expect, it } from 'vitest';

import {
  containsHarmfulContent,
  sanitizeTextInput,
  validateChatMessage,
  validateTextInput
} from './index';

describe('input validation', () => {
  it('validates and sanitizes text input', () => {
    expect(validateTextInput('Hello world')).toEqual({
      isValid: true,
      sanitizedValue: 'Hello world'
    });
    expect(sanitizeTextInput('<b>Hello</b>')).toBe('Hello');
  });

  it('rejects empty and whitespace-only values', () => {
    expect(validateTextInput('')).toMatchObject({
      error: 'Input cannot be empty',
      isValid: false
    });
    expect(validateTextInput('   ')).toMatchObject({
      error: 'Input cannot be empty',
      isValid: false
    });
  });

  it('rejects overly long values with configurable limits', () => {
    expect(validateTextInput('abcd', { maxLength: 3 })).toMatchObject({
      error: 'Input too long (max 3 characters)',
      isValid: false
    });
  });

  it('rejects harmful content before sanitization', () => {
    expect(containsHarmfulContent('javascript:alert("test")')).toBe(true);
    expect(containsHarmfulContent('<script>alert("test")</script>Hello')).toBe(
      true
    );
    expect(validateTextInput('<img src=x onerror=alert(1)>')).toMatchObject({
      error: 'Input contains invalid content',
      isValid: false
    });
  });

  it('keeps the source chat-message API behavior', () => {
    expect(validateChatMessage('Hello world')).toEqual({
      isValid: true,
      sanitizedValue: 'Hello world'
    });
    expect(validateChatMessage('')).toMatchObject({
      error: 'Message cannot be empty',
      isValid: false
    });
    expect(validateChatMessage('a'.repeat(2001))).toMatchObject({
      error: 'Message too long (max 2000 characters)',
      isValid: false
    });
  });
});
