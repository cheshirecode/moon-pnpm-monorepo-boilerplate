export type ValidationError = string | undefined;
export type FieldValidator = (value: string) => ValidationError;

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationError {
  if (!email) {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return undefined;
}

export function validatePhone(phone: string): ValidationError {
  if (!phone) {
    return 'Phone number is required';
  }

  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10) {
    return 'Phone number must be at least 10 digits';
  }

  if (digits.length > 11) {
    return 'Phone number is too long';
  }

  return undefined;
}

export function validateRequired(
  value: string,
  fieldName = 'This field'
): ValidationError {
  if (!value || value.trim() === '') {
    return `${fieldName} is required`;
  }

  return undefined;
}

export function validateMinLength(
  value: string,
  minLength: number,
  fieldName = 'This field'
): ValidationError {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }

  return undefined;
}

export function validateMaxLength(
  value: string,
  maxLength: number,
  fieldName = 'This field'
): ValidationError {
  if (value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters`;
  }

  return undefined;
}

export function validateName(
  name: string,
  fieldName = 'Name'
): ValidationError {
  if (!name) {
    return `${fieldName} is required`;
  }

  const nameRegex = /^[a-zA-Z\s'-]+$/;

  if (!nameRegex.test(name)) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }

  if (name.length < 2) {
    return `${fieldName} must be at least 2 characters`;
  }

  return undefined;
}

export function composeValidators(...validators: FieldValidator[]): FieldValidator {
  return (value: string) => {
    for (const validator of validators) {
      const error = validator(value);

      if (error) {
        return error;
      }
    }

    return undefined;
  };
}
