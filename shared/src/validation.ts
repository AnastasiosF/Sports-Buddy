// Validation helpers and constants

export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
export const MATCH_STATUSES = ['open', 'full', 'completed', 'cancelled'] as const;
export const PARTICIPANT_STATUSES = ['pending', 'confirmed', 'declined', 'cancelled'] as const;
export const CONNECTION_STATUSES = ['pending', 'accepted', 'blocked'] as const;

// Validation functions
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUsername = (username: string): boolean => {
  // Username should be 3-50 characters, alphanumeric and underscores only
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  return usernameRegex.test(username);
};

export const isValidPassword = (password: string): boolean => {
  // Password should be at least 6 characters
  return password.length >= 6;
};

export const isValidRating = (rating: number): boolean => {
  return rating >= 1 && rating <= 5 && Number.isInteger(rating);
};

export const isValidLocation = (location: { longitude: number; latitude: number }): boolean => {
  return (
    typeof location.longitude === 'number' &&
    typeof location.latitude === 'number' &&
    location.longitude >= -180 &&
    location.longitude <= 180 &&
    location.latitude >= -90 &&
    location.latitude <= 90
  );
};

export const isValidDuration = (duration: number): boolean => {
  // Duration should be between 15 minutes and 8 hours (480 minutes)
  return duration >= 15 && duration <= 480 && Number.isInteger(duration);
};

export const isValidMaxParticipants = (maxParticipants: number): boolean => {
  // Max participants should be between 1 and 50
  return maxParticipants >= 1 && maxParticipants <= 50 && Number.isInteger(maxParticipants);
};

export const isValidAge = (age: number): boolean => {
  // Age should be between 13 and 120
  return age >= 13 && age <= 120 && Number.isInteger(age);
};

// Date validation
export const isValidFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date > now && !isNaN(date.getTime());
};

// Text length validation
export const isValidBioLength = (bio: string): boolean => {
  return bio.length <= 500;
};

export const isValidTitleLength = (title: string): boolean => {
  return title.length >= 3 && title.length <= 100;
};

export const isValidDescriptionLength = (description: string): boolean => {
  return description.length <= 1000;
};

export const isValidMessageLength = (message: string): boolean => {
  return message.length >= 1 && message.length <= 1000;
};

// Sanitization helpers
export const sanitizeString = (input: string): string => {
  return input.trim();
};

export const sanitizeUsername = (username: string): string => {
  return username.toLowerCase().trim();
};