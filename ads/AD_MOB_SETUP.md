# AdMob handoff notes for Phase Bird

This project currently uses a **mock rewarded ad** so the gameplay flow is ready before the real AdMob SDK is added.

## What is already working

- Game Over shows a **Continue This Run?** button.
- Continue is limited to **once per run**.
- If an ad is unavailable, the UI **fails gracefully** and stays on the Game Over screen.
- A successful reward triggers the revive flow in `game/engine.ts`.

## Your main swap points

### 1) Replace the mock hook implementation

File:
- `ads/useMockRewardedContinueAd.ts`

Keep the same returned API shape if possible:
- `isLoading`
- `isLoaded`
- `isShowing`
- `lastError`
- `loadAd()`
- `showAd()`
- `resetForNextRun()`

That lets `screens/GameScreen.tsx` keep working with minimal or no UI changes.

### 2) Add your AdMob config plugin

This project uses **Expo**, so the usual setup is the Expo config plugin for
`react-native-google-mobile-ads`.

Because `app.json` does not support comments, here is the plugin block you will
need to merge into the `expo.plugins` array in `app.json`.

```json
[
  "react-native-google-mobile-ads",
  {
    "androidAppId": "ca-app-pub-REPLACE_ME~REPLACE_ME",
    "iosAppId": "ca-app-pub-REPLACE_ME~REPLACE_ME",
    "delayAppMeasurementInit": true,
    "userTrackingUsageDescription": "This identifier will be used to deliver personalized ads to you."
  }
]
```

If you also add consent handling later, you may need `expo-build-properties` for
extra Android Proguard rules. See the notes further below.

## IDs you will need from AdMob

You need **two kinds of IDs**:

### A) App IDs
These are configured in the Expo plugin / native config.

- Android App ID
- iOS App ID

These are **not** the same as rewarded ad unit IDs.

### B) Rewarded ad unit IDs
These are used in JavaScript when loading the actual rewarded ad.

- Android Rewarded Ad Unit ID
- iOS Rewarded Ad Unit ID

## Safe development/testing setup

During development, use Google's official **test rewarded ad unit ID**:

- Android test rewarded: `ca-app-pub-3940256099942544/5224354917`
- iOS test rewarded: `ca-app-pub-3940256099942544/1712485313`

Recommended rule:
- use test IDs in development builds
- use your real rewarded unit IDs in production builds

## Important Expo note

`react-native-google-mobile-ads` uses custom native code.
That means:

- it is **not supported in Expo Go**
- you need a **development build** or **EAS build**
- after adding/changing the plugin config, you must make a **fresh native rebuild**

## Suggested package install

```bash
npm install react-native-google-mobile-ads
```

If you later add consent / extra native build config, you may also need:

```bash
npx expo install expo-build-properties
```

## Suggested implementation flow

1. Install `react-native-google-mobile-ads`
2. Add the Expo plugin config in `app.json`
3. Create a development build
4. Replace the mock logic in `ads/useMockRewardedContinueAd.ts`
5. Keep `GameScreen.tsx` mostly unchanged
6. Verify:
   - ad loads
   - ad shows
   - reward callback revives once
   - ad failure leaves user on Game Over

## Consent / privacy notes (for later)

If you add the library's consent flow, the usual JS helper is `AdsConsent` from
`react-native-google-mobile-ads`.

If you go that route later, common tasks are:
- request consent info at app launch
- gather consent before initializing/loading ads when needed
- optionally delay app measurement init

If you use the UMP consent flow in Expo, you may also need to add
`expo-build-properties` with Android `extraProguardRules`.

Example plugin entry:

```json
[
  "expo-build-properties",
  {
    "android": {
      "extraProguardRules": "-keep class com.google.android.gms.internal.consent_sdk.** { *; }"
    }
  }
]
```

## Recommended file responsibilities

- `ads/useMockRewardedContinueAd.ts`
  - replace with real rewarded ad loading/showing logic
- `ads/admobConfig.ts`
  - simple place to store test IDs, production placeholders, and comments
- `screens/GameScreen.tsx`
  - leave the button/UI flow as-is unless your SDK API needs a small tweak
- `game/engine.ts`
  - revive flow already exists; no AdMob logic should live here

## Keep this behavior when you swap to real AdMob

- only one rewarded continue per run
- if ad is not loaded, show a helpful message and stay on Game Over
- if ad fails to show, do not revive
- only revive after the reward is actually earned
- preload the next rewarded ad when helpful

## Optional future improvements

- move from the mock hook name to `useRewardedContinueAd.ts`
- preload on app launch or on gameplay start
- add analytics for:
  - continue button taps
  - ad load success/failure
  - ad show success/failure
  - reward earned
  - revive completed
