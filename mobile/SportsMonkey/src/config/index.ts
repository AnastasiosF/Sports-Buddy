export const config = {
  api: {
    // Your backend server URL - all requests go through backend
    // Use 10.0.2.2 for Android emulator, or your local IP for physical devices
    baseUrl: __DEV__ ? 'http://localhost:3000' : 'https://your-production-api.com',
  },
  app: {
    name: 'SportsMonkey',
    version: '1.0.0',
  },
};

