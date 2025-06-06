import Constants from 'expo-constants';

export interface EnvironmentInfo {
  isExpoGo: boolean;
  isDevBuild: boolean;
  isProduction: boolean;
  canUseFirebase: boolean;
  canUseRevenueCat: boolean;
  platform: string;
}

export const getEnvironmentInfo = (): EnvironmentInfo => {
  const isExpoGo = Constants.appOwnership === 'expo';
  const isStandalone = Constants.appOwnership !== 'expo' && Constants.appOwnership !== null;
  const isDevBuild = isStandalone && __DEV__;
  const isProduction = isStandalone && !__DEV__;
  
  return {
    isExpoGo,
    isDevBuild,
    isProduction,
    canUseFirebase: !isExpoGo, // Firebase only works in development/production builds
    canUseRevenueCat: !isExpoGo, // RevenueCat only works in development/production builds
    platform: Constants.platform?.ios ? 'ios' : 'android',
  };
};

export const logEnvironmentInfo = () => {
  const env = getEnvironmentInfo();
  console.log('🌍 Environment Info:', {
    environment: env.isExpoGo ? 'Expo Go' : env.isDevBuild ? 'Development Build' : 'Production',
    firebase: env.canUseFirebase ? 'Enabled' : 'Disabled (Mock Mode)',
    revenueCat: env.canUseRevenueCat ? 'Enabled' : 'Disabled (Mock Mode)',
    platform: env.platform,
  });
  return env;
}; 