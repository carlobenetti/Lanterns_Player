# Lanterns Player on Android

## Build the APK

```bash
pnpm android:build
```

The APK lands in `packages/player/release/LanternsPlayer-<version>.apk`. The script finds Java (Android Studio's bundled JBR), the Android SDK (`%LOCALAPPDATA%\Android\Sdk`) and the newest NDK by itself. It builds for arm64 phones only (any phone from about 2017 on).

One-time setup, already done on Carlo's PC:
- Android Studio installed (provides Java)
- SDK packages: `platform-tools`, `platforms/android-36`, `build-tools/36.0.0`, `ndk/29.0.14206865`
- Rust targets: `rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android`
- Signing key: `%USERPROFILE%\.android\lanterns-player-release.jks`, password in `packages/player/src-tauri/gen/android/keystore.properties` (gitignored). **Back up both files.** Without them, a new APK can't be installed over the old one.

## Install on the phone

1. Copy the APK to the phone (USB cable, Google Drive or Bluetooth) and open it.
2. Android asks to allow installing from that app (Files, Drive...). Allow it once.
3. On the first launch, Android opens "All files access" for Lanterns Player. Turn it on and go back. The app needs it to read your music folders.
4. Allow notifications. The "Lanterns Player" notification keeps the music playing when the screen is off, and it shows the player controls (cover, play/pause, previous, next, progress). The same controls appear on the lock screen. Bluetooth headphone buttons go through the same controls (not tested with real headphones yet).

## Where to put the music

Copy your music to the phone's **Music** folder, one subfolder per playlist (same as `G:\Meu Drive\Music` on the PC):

```
Internal storage/Music/
  Mix - Save Me/
    Artista - Música.mp3
  Mix - Tarzan Boy/
    ...
```

The app loads `Music` by itself on every start and whenever you come back to it. To use another folder (or an SD card), tap the folder button at the top. Pick a folder with songs to add it as one playlist, or a folder of folders to add each subfolder as a playlist.

## Troubleshooting

- **The folder browser is empty or a folder won't open:** "All files access" is off. Go to Android Settings > Apps > Lanterns Player > Permissions (or "Special app access" > "All files access") and turn it on.
- **Music stops when the screen turns off:** make sure notifications are allowed and battery optimization is off for Lanterns Player (Settings > Apps > Lanterns Player > Battery > Unrestricted).
- **"App not installed" when updating:** the new APK was signed with a different key. Uninstall the old app first (this deletes playlists and history on the phone).
