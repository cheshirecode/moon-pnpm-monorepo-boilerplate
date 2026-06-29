import DOMPurify from 'isomorphic-dompurify';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedValue?: string;
}

export interface TextInputValidationOptions {
  emptyMessage?: string;
  harmfulContentMessage?: string;
  maxLength?: number;
  maxLengthMessage?: string;
}

const DEFAULT_MAX_LENGTH = 2000;
const HARMFUL_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
];

export function containsHarmfulContent(value: string): boolean {
  return HARMFUL_PATTERNS.some((pattern) => pattern.test(value));
}

export function sanitizeTextInput(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_ATTR: [],
    ALLOWED_TAGS: []
  });
}

export function validateTextInput(
  value: string,
  options: TextInputValidationOptions = {}
): ValidationResult {
  const maxLength = options.maxLength ?? DEFAULT_MAX_LENGTH;

  if (typeof value !== 'string' || value.trim().length === 0) {
    return {
      error: options.emptyMessage ?? 'Input cannot be empty',
      isValid: false
    };
  }

  if (value.length > maxLength) {
    return {
      error:
        options.maxLengthMessage ?? `Input too long (max ${maxLength} characters)`,
      isValid: false
    };
  }

  if (containsHarmfulContent(value)) {
    return {
      error: options.harmfulContentMessage ?? 'Input contains invalid content',
      isValid: false
    };
  }

  return {
    isValid: true,
    sanitizedValue: sanitizeTextInput(value)
  };
}

export function validateChatMessage(message: string): ValidationResult {
  return validateTextInput(message, {
    emptyMessage: 'Message cannot be empty',
    harmfulContentMessage: 'Message contains invalid content',
    maxLength: DEFAULT_MAX_LENGTH,
    maxLengthMessage: `Message too long (max ${DEFAULT_MAX_LENGTH} characters)`
  });
}
