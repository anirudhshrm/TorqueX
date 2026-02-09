/**
 * Helper functions for the application
 */

// Format date to readable string (e.g., "June 15, 2023")
exports.formatDate = (dateString) => {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Format date with time (e.g., "June 15, 2023, 2:30 PM")
exports.formatDateTime = (dateString) => {
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

// Calculate duration between two dates in days
exports.calculateDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return duration;
};

// Format currency (e.g., "$100.00")
exports.formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Truncate text with ellipsis
exports.truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Generate random string (for IDs, etc.)
exports.generateRandomString = (length = 10) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Get status badge class based on status
exports.getStatusBadgeClass = (status) => {
  const statusClasses = {
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'CONFIRMED': 'bg-green-100 text-green-800',
    'CANCELLED': 'bg-red-100 text-red-800',
    'COMPLETED': 'bg-blue-100 text-blue-800'
  };
  
  return statusClasses[status] || 'bg-gray-100 text-gray-800';
};

// Calculate average rating
exports.calculateAverageRating = (reviews) => {
  if (!reviews || reviews.length === 0) return 0;
  
  const sum = reviews.reduce((total, review) => total + review.rating, 0);
  return (sum / reviews.length).toFixed(1);
};

// Check if a date is in the past
exports.isPastDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date < today;
};

// Check if a date is in the future
exports.isFutureDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date > today;
};