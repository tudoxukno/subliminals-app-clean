# Firebase Setup Guide for Subliminals App

This guide will help you set up Firebase for your Subliminals app to enable cloud storage, authentication, and analytics.

## 🚀 Quick Start

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Name it "Subliminals App" (or your preferred name)
4. Enable Google Analytics (recommended)
5. Choose your Analytics account or create a new one

### 2. Add iOS App

1. In your Firebase project, click "Add app" → iOS
2. **iOS bundle ID**: Use your app's bundle identifier from `app.json`
3. **App nickname**: "Subliminals iOS"
4. Download `GoogleService-Info.plist`
5. Add the file to your iOS project in Xcode:
   - Open `ios/SubliminalsApp.xcworkspace` in Xcode
   - Right-click on the project → "Add Files"
   - Select `GoogleService-Info.plist`
   - Make sure it's added to the target

### 3. Add Android App

1. In Firebase Console, click "Add app" → Android
2. **Android package name**: Use your app's package name from `app.json`
3. **App nickname**: "Subliminals Android"
4. Download `google-services.json`
5. Place the file in `android/app/google-services.json`

### 4. Enable Authentication

1. In Firebase Console → Authentication → Sign-in method
2. Enable these providers:
   - **Anonymous** ✅ (for seamless onboarding)
   - **Email/Password** ✅ (for account creation)
   - **Google** (optional, for social login)
   - **Apple** (optional, for iOS social login)

### 5. Set up Firestore Database

1. In Firebase Console → Firestore Database
2. Click "Create database"
3. Choose **"Start in test mode"** for now
4. Select your preferred location (closest to your users)

#### Firestore Security Rules

Replace the default rules with these production-ready rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own saved subliminals
    match /savedSubliminals/{subliminalId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can read/write their own preferences
    match /userPreferences/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. Configure Analytics & Crashlytics

1. **Analytics**: Already enabled when you created the project
2. **Crashlytics**: 
   - In Firebase Console → Crashlytics
   - Click "Enable Crashlytics"
   - Follow the setup instructions

### 7. iOS Configuration

Add to `ios/SubliminalsApp/AppDelegate.mm`:

```objc
#import <Firebase.h>

// Add this to the top of application:didFinishLaunchingWithOptions:
[FIRApp configure];
```

### 8. Android Configuration

The Android configuration should work automatically with the `google-services.json` file.

## 📱 Testing the Setup

### 1. Run the App

```bash
# Install dependencies (already done)
npm install

# iOS
npx expo run:ios

# Android  
npx expo run:android
```

### 2. Test Authentication

1. Open the app
2. Go to Settings
3. You should see "Anonymous account" status
4. Try creating an account with email/password
5. Check Firebase Console → Authentication to see the user

### 3. Test Data Sync

1. Save a subliminal in the app
2. Check Firebase Console → Firestore to see the data
3. Sign out and sign back in
4. Verify your saved subliminals are still there

## 🔧 Advanced Configuration

### Environment Variables

Create `.env` file in your project root:

```env
# Firebase Configuration (optional - using config files instead)
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
```

### Push Notifications (Future)

When ready to add push notifications:

1. Enable Cloud Messaging in Firebase Console
2. Add `@react-native-firebase/messaging` package
3. Configure APNs certificates (iOS) and FCM (Android)

### Cloud Functions (Future)

For server-side logic:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize functions: `firebase init functions`
3. Deploy: `firebase deploy --only functions`

## 🛡️ Security Best Practices

### 1. Firestore Rules

- Never use `allow read, write: if true;` in production
- Always validate user ownership
- Use field-level validation when needed

### 2. Authentication

- Implement proper password requirements
- Consider adding email verification
- Set up password reset functionality

### 3. Data Validation

- Validate data on both client and server
- Use Cloud Functions for server-side validation
- Implement rate limiting for API calls

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **User Engagement**:
   - Daily/Monthly Active Users
   - Session duration
   - Subliminals created per user

2. **Feature Usage**:
   - Most popular archetypes
   - Save/share rates
   - Background generation usage

3. **Performance**:
   - App crashes
   - API response times
   - Error rates

### Custom Events

The app automatically tracks:
- User sign-ups
- Subliminal creations
- Saves and shares
- Background generations

## 🚨 Troubleshooting

### Common Issues

1. **"Default app has not been initialized"**
   - Ensure `GoogleService-Info.plist` (iOS) or `google-services.json` (Android) is properly added
   - Check that Firebase is configured in AppDelegate (iOS)

2. **Authentication not working**
   - Verify sign-in methods are enabled in Firebase Console
   - Check bundle ID/package name matches exactly

3. **Firestore permission denied**
   - Check security rules
   - Ensure user is authenticated
   - Verify user ID matches document ownership

4. **Build errors**
   - Clean build: `npx expo run:ios --clear` or `npx expo run:android --clear`
   - Ensure all native dependencies are properly linked

### Debug Mode

Enable debug logging:

```javascript
// Add to your app initialization
import { setLogLevel } from '@react-native-firebase/app';
setLogLevel('debug');
```

## 📈 Next Steps

1. **Test thoroughly** with the current setup
2. **Monitor usage** in Firebase Console
3. **Optimize performance** based on analytics
4. **Add push notifications** for user engagement
5. **Implement Cloud Functions** for advanced features
6. **Set up CI/CD** for automated deployments

## 🆘 Support

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Console](https://console.firebase.google.com/)

---

**Important**: Keep your Firebase configuration files secure and never commit them to public repositories. Use environment variables for sensitive data in production. 