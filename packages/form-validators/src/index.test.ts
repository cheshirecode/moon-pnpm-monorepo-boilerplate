import { describe, expect, it } from 'vitest';

import {
  composeValidators,
  validateEmail,
  validateMaxLength,
  validateMinLength,
  validateName,
  validatePhone,
  validateRequired
} from './index';

describe('form validators', () => {
  it('validates email addresses', () => {
    expect(validateEmail('user@example.com')).toBeUndefined();
    expect(validateEmail('test.user+tag@domain.co.uk')).toBeUndefined();
    expect(validateEmail('')).toBe('Email is required');
    expect(validateEmail('missing@domain')).toBe(
      'Please enter a valid email address'
    );
  });

  it('validates North American phone-like values', () => {
    expect(validatePhone('1234567890')).toBeUndefined();
    expect(validatePhone('11234567890')).toBeUndefined();
    expect(validatePhone('(123) 456-7890')).toBeUndefined();
    expect(validatePhone('')).toBe('Phone number is required');
    expect(validatePhone('12345')).toBe(
      'Phone number must be at least 10 digits'
    );
    expect(validatePhone('123456789012')).toBe('Phone number is too long');
  });

  it('validates required and length constraints', () => {
    expect(validateRequired('value')).toBeUndefined();
    expect(validateRequired('   ', 'Email')).toBe('Email is required');
    expect(validateMinLength('hello', 5)).toBeUndefined();
    expect(validateMinLength('hi', 5, 'Password')).toBe(
      'Password must be at least 5 characters'
    );
    expect(validateMaxLength('hello', 5)).toBeUndefined();
    expect(validateMaxLength('too long value', 5, 'Bio')).toBe(
      'Bio must be no more than 5 characters'
    );
  });

  it('validates simple person names', () => {
    expect(validateName('Mary-Jane')).toBeUndefined();
    expect(validateName("O'Brien")).toBeUndefined();
    expect(validateName('John123')).toBe(
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    );
    expect(validateName('A', 'Last Name')).toBe(
      'Last Name must be at least 2 characters'
    );
  });

  it('composes validators and stops at the first error', () => {
    let secondValidatorCalled = false;
    const validator = composeValidators(
      () => 'First error',
      () => {
        secondValidatorCalled = true;
        return undefined;
      }
    );

    expect(validator('test')).toBe('First error');
    expect(secondValidatorCalled).toBe(false);
    expect(composeValidators()('anything')).toBeUndefined();
  });
});
