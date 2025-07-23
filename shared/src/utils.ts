import { Location } from './types';
import { EARTH_RADIUS_KM, DEGREES_TO_RADIANS } from './constants';

// Distance calculation using Haversine formula
export const calculateDistance = (point1: Location, point2: Location): number => {
  const lat1Rad = point1.latitude * DEGREES_TO_RADIANS;
  const lat2Rad = point2.latitude * DEGREES_TO_RADIANS;
  const deltaLatRad = (point2.latitude - point1.latitude) * DEGREES_TO_RADIANS;
  const deltaLngRad = (point2.longitude - point1.longitude) * DEGREES_TO_RADIANS;

  const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c * 1000; // Return distance in meters
};

// Format distance for display
export const formatDistance = (distanceInMeters: number): string => {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`;
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)}km`;
  }
};

// Format date for display
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString();
};

// Format time for display
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format datetime for display
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return `${formatDate(dateString)} at ${formatTime(dateString)}`;
};

// Format duration in minutes to readable string
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hr${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hr${hours !== 1 ? 's' : ''} ${remainingMinutes} min`;
    }
  }
};

// Check if a date is in the future
export const isFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
};

// Check if a date is today
export const isToday = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

// Get relative time string (e.g., "2 hours ago", "in 3 days")
export const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInMinutes = Math.round(diffInMs / (1000 * 60));

  if (diffInMinutes === 0) {
    return 'now';
  } else if (diffInMinutes > 0) {
    // Future
    if (diffInMinutes < 60) {
      return `in ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) { // 24 hours
      const hours = Math.round(diffInMinutes / 60);
      return `in ${hours} hr${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.round(diffInMinutes / 1440);
      return `in ${days} day${days !== 1 ? 's' : ''}`;
    }
  } else {
    // Past
    const absDiffInMinutes = Math.abs(diffInMinutes);
    if (absDiffInMinutes < 60) {
      return `${absDiffInMinutes} min ago`;
    } else if (absDiffInMinutes < 1440) { // 24 hours
      const hours = Math.round(absDiffInMinutes / 60);
      return `${hours} hr${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.round(absDiffInMinutes / 1440);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }
};

// Capitalize first letter of string
export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Generate initials from name
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Generate avatar URL placeholder
export const getAvatarPlaceholder = (name: string): string => {
  const initials = getInitials(name);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=2196F3&color=fff&size=200`;
};

// Debounce function for search inputs
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

// Deep clone object
export const deepClone = <T>(obj: T): T => {
  return JSON.parse(JSON.stringify(obj));
};

// Check if object is empty
export const isEmpty = (obj: object): boolean => {
  return Object.keys(obj).length === 0;
};