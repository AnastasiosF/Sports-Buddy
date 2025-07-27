import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Location as LocationType, STORAGE_KEYS, DEFAULT_SEARCH_RADIUS } from '../types';
import { api } from '../utils/api';

interface LocationContextType {
  location: LocationType | null;
  locationName: string | null;
  loading: boolean;
  hasPermission: boolean;
  accuracy: Location.LocationAccuracy;
  lastUpdated: Date | null;
  requestLocation: () => Promise<LocationType | null>;
  updateLocation: () => Promise<void>;
  setSearchRadius: (radius: number) => void;
  searchRadius: number;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState<LocationType | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [accuracy] = useState(Location.LocationAccuracy.Balanced);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchRadius, setSearchRadius] = useState(DEFAULT_SEARCH_RADIUS);

  useEffect(() => {
    checkPermissions();
    loadStoredLocation();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
      
      if (status !== 'granted') {
        // Check if we should show the permission rationale
        const storedPermissionAsked = await AsyncStorage.getItem(STORAGE_KEYS.LOCATION_PERMISSION);
        if (!storedPermissionAsked) {
          await requestPermissions();
        }
      }
    } catch (error) {
      console.error('Error checking location permissions:', error);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      await AsyncStorage.setItem(STORAGE_KEYS.LOCATION_PERMISSION, 'asked');
      
      if (status === 'granted') {
        setHasPermission(true);
        await updateLocation();
        return true;
      } else {
        setHasPermission(false);
        Alert.alert(
          'Location Permission Required',
          'This app needs location access to help you find nearby sports buddies. You can enable this in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Open Settings', 
              onPress: () => Location.requestForegroundPermissionsAsync()
            }
          ]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  };

  const loadStoredLocation = async () => {
    try {
      const storedLocation = await AsyncStorage.getItem('@sports-buddy/last-location');
      if (storedLocation) {
        const locationData = JSON.parse(storedLocation);
        setLocation(locationData.location);
        setLocationName(locationData.locationName);
        setLastUpdated(new Date(locationData.timestamp));
      }
    } catch (error) {
      console.error('Error loading stored location:', error);
    }
  };

  const storeLocation = async (loc: LocationType, name: string | null) => {
    try {
      const locationData = {
        location: loc,
        locationName: name,
        timestamp: new Date().toISOString()
      };
      await AsyncStorage.setItem('@sports-buddy/last-location', JSON.stringify(locationData));
    } catch (error) {
      console.error('Error storing location:', error);
    }
  };

  const requestLocation = async (): Promise<LocationType | null> => {
    if (!hasPermission) {
      const granted = await requestPermissions();
      if (!granted) return null;
    }

    setLoading(true);
    try {
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy,
        // maximumAge: 60000, // 1 minute cache - not supported in this version
        // timeout: 15000, // 15 second timeout - not supported in this version
      });

      const newLocation: LocationType = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
      };

      // Reverse geocoding to get location name
      try {
        const reverseGeocode = await Location.reverseGeocodeAsync(newLocation);
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const name = `${address.city || address.district || address.subregion}, ${address.region || address.country}`;
          setLocationName(name);
          await storeLocation(newLocation, name);
        }
      } catch (geocodeError) {
        console.warn('Reverse geocoding failed:', geocodeError);
      }

      setLocation(newLocation);
      setLastUpdated(new Date());
      return newLocation;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your GPS settings and try again.'
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async () => {
    const newLocation = await requestLocation();
    if (newLocation && locationName) {
      // Update location on the backend
      try {
        await api.put('/api/location/update', {
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
          location_name: locationName,
        });
      } catch (error) {
        console.error('Failed to update location on server:', error);
        // Continue anyway - location is stored locally
      }
    }
  };

  const value = {
    location,
    locationName,
    loading,
    hasPermission,
    accuracy,
    lastUpdated,
    requestLocation,
    updateLocation,
    setSearchRadius,
    searchRadius,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};