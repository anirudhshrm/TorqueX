/**
 * Input Validators
 * Provides comprehensive validation functions for common data types
 */

// Email validation
exports.validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (US format)
exports.validatePhone = (phone) => {
  const phoneRegex = /^(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Date validation
exports.validateDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

// Booking date validation
exports.validateBookingDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const now = new Date();

  // Validate dates are valid
  if (!(start instanceof Date && !isNaN(start)) || !(end instanceof Date && !isNaN(end))) {
    return { valid: false, error: 'Invalid date format' };
  }

  // Start date cannot be in the past
  if (start < now) {
    return { valid: false, error: 'Start date cannot be in the past' };
  }

  // End date must be after start date
  if (end <= start) {
    return { valid: false, error: 'End date must be after start date' };
  }

  // Maximum rental period (30 days)
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (daysDiff > 30) {
    return { valid: false, error: 'Maximum rental period is 30 days' };
  }

  return { valid: true, days: daysDiff };
};

// Price validation
exports.validatePrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num > 0;
};

// String length validation
exports.validateStringLength = (str, min = 1, max = 255) => {
  const len = str ? str.toString().length : 0;
  return len >= min && len <= max;
};

// Required field validation
exports.validateRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

// URL validation
exports.validateURL = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Credit card validation (Luhn algorithm)
exports.validateCreditCard = (cardNumber) => {
  const digits = cardNumber.replace(/\D/g, '');
  
  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

// Input sanitization
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Validate booking data
exports.validateBookingData = (data) => {
  const errors = [];

  if (!data.vehicleId || !exports.validateRequired(data.vehicleId)) {
    errors.push('Vehicle ID is required');
  }

  if (!data.startDate || !exports.validateDate(data.startDate)) {
    errors.push('Valid start date is required');
  }

  if (!data.endDate || !exports.validateDate(data.endDate)) {
    errors.push('Valid end date is required');
  }

  if (data.startDate && data.endDate) {
    const dateValidation = exports.validateBookingDates(data.startDate, data.endDate);
    if (!dateValidation.valid) {
      errors.push(dateValidation.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Validate review data
exports.validateReviewData = (data) => {
  const errors = [];

  if (!data.bookingId || !exports.validateRequired(data.bookingId)) {
    errors.push('Booking ID is required');
  }

  if (!data.vehicleId || !exports.validateRequired(data.vehicleId)) {
    errors.push('Vehicle ID is required');
  }

  if (!data.rating || isNaN(parseInt(data.rating)) || data.rating < 1 || data.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }

  if (!data.comment || !exports.validateStringLength(data.comment, 10, 500)) {
    errors.push('Comment must be between 10 and 500 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Validate user profile data
exports.validateUserProfile = (data) => {
  const errors = [];

  if (!data.name || !exports.validateStringLength(data.name, 2, 100)) {
    errors.push('Name must be between 2 and 100 characters');
  }

  if (!data.email || !exports.validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (data.phone && !exports.validatePhone(data.phone)) {
    errors.push('Valid phone number is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Validate vehicle data
exports.validateVehicleData = (data) => {
  const errors = [];

  if (!data.name || !exports.validateStringLength(data.name, 2, 100)) {
    errors.push('Vehicle name must be between 2 and 100 characters');
  }

  if (!data.type || !exports.validateRequired(data.type)) {
    errors.push('Vehicle type is required');
  }

  if (!data.pricePerDay || !exports.validatePrice(data.pricePerDay)) {
    errors.push('Valid price per day is required');
  }

  if (data.description && !exports.validateStringLength(data.description, 10, 1000)) {
    errors.push('Description must be between 10 and 1000 characters');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Validate deal data
exports.validateDealData = (data) => {
  const errors = [];

  if (!data.title || !exports.validateStringLength(data.title, 2, 100)) {
    errors.push('Title must be between 2 and 100 characters');
  }

  if (!data.code || !exports.validateStringLength(data.code, 3, 20)) {
    errors.push('Code must be between 3 and 20 characters');
  }

  if (!data.discountValue || !exports.validatePrice(data.discountValue)) {
    errors.push('Valid discount value is required');
  }

  if (!data.validFrom || !exports.validateDate(data.validFrom)) {
    errors.push('Valid start date is required');
  }

  if (!data.validUntil || !exports.validateDate(data.validUntil)) {
    errors.push('Valid end date is required');
  }

  if (new Date(data.validFrom) >= new Date(data.validUntil)) {
    errors.push('End date must be after start date');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

// Aliases for test compatibility
exports.isValidEmail = exports.validateEmail;
exports.isValidPhone = exports.validatePhone;
exports.isValidDate = exports.validateDate;
exports.isValidPrice = exports.validatePrice;

module.exports = exports;
