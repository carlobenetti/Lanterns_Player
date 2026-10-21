# Bug log

Every bug hit while changing this project, why it happened, and the rule that keeps it from happening again.

**For agents:** read this file before you change anything. When you finish a change, add a dated section at the top with every bug you hit, including ones you caught and fixed yourself. Keep each entry short: what broke, why, how it was fixed, and the rule.

---

## 2026-10-20 (late night): Lantern suit colors and fabric texture

Palette sampled from Carlo's reference still (the suit in a teal-graded scene). The suit is a very dark petrol green (hue ~185, lightness 0.05–0.30), matte and mottled. Colors live in `packages/tailwind-config/global.css`. Texture variables: `--suit-grain`, `--suit-mottle`, `--suit-sheen`, `--suit-fabric`. Dark mode is now the default (`theme.dark` defaults to `true`).

### 1. The phone was stuck in light mode
- **What:** the code that applies `data-theme="dark"` lived inside `ConnectedThemeController`, the light/dark toggle, which only renders in the desktop sidebar. On the phone it never ran.
- **Fix:** `hooks/useThemeMode.ts`. `useApplyThemeMode()` runs once in the root for both shells, and both toggles use `useThemeMode()`. The phone header got its own toggle. Tests: "starts in dark mode", "switches between dark and light mode from the header".
- **Rule:** effects that change the whole document (theme, language, etc.) go in the root or a hook it calls, never in a component that renders in only one of the two shells.

### 2. The first fabric texture read as stripes
- **What:** a `repeating-linear-gradient` "twill" looked like regular diagonal stripes. The real suit is mottled and uneven, with no pattern.
- **Fix:** replaced it with `--suit-mottle`, a large, soft SVG `feTurbulence` noise.
- **Rule:** judge textures by cropping the same-size area from the reference and from an emulator screenshot, side by side. Don't trust how the CSS reads.

### 3. Texture looked dirty in light mode
- **What:** the dark grain and mottle look like sandpaper and stains on light surfaces.
- **Fix:** light mode only gets `--suit-sheen`. The fabric layers are assigned inside `[data-theme='dark']`.
- **Rule:** check every visual change in both modes.

### 4. Settings test assumed a light default
- **What:** "dark mode toggle persists across restarts" looked for a "Dark mode" button at startup.
- **Fix:** it now switches dark → light and checks that light survives a restart.
- **Rule:** when a default changes, grep the tests for the old default and update them to describe the new behavior.

---

## 2026-10-20 (night): lock-screen and notification media controls

How it works: `services/androidMediaControls.ts` sends the current song to `window.LanternsMedia.update(json)`, a `@JavascriptInterface` that `MainActivity.onWebViewCreate` attaches (`MediaControls.kt`). `PlaybackService` feeds a `MediaSessionCompat` and a `MediaStyle` notification. Buttons call back through `window.__lanternsMediaAction(action, value)`. Verified on the emulator: notification card, lock screen, play/pause/next/previous, progress matching the app.

### 1. Lint: unused destructured variable
- **What:** `({ positionMs: _, ...state }) => state` failed `no-unused-vars`.
- **Fix:** `omit(state, 'positionMs')` from `lodash-es/omit`.
- **Rule:** to drop a key, use lodash `omit`, not a throwaway destructured name.

### 2. False alarm: "pause from the lock screen did nothing"
- **What:** the tap landed after the emulator's screen had timed out, so it only woke the screen. The media session also showed `position=0`, which looked wrong but wasn't: Android stores the position at the last update and extrapolates from `updated` (uptime). The app only sends updates on song, state or seek changes.
- **Rule:** before tapping during emulator tests, run `adb shell svc power stayon true` (restore with `false`). To check the lock-screen position, compute `position + (uptime_ms - updated)` and compare it with the app.

### Do not undo
- `MainActivity.onWebViewCreate` sets `mediaPlaybackRequiresUserGesture = false`. Without it, Play pressed in the notification (no touch inside the page) can be refused by the WebView.
- The bridge only accepts the fixed `MediaAction` ids. Never build the `evaluateJavascript` string from data the web page sent.
- Covers reach Android as file paths: `localPathFromAssetUrl` decodes the `http://asset.localhost/...` URL. Android can't fetch asset-protocol URLs.

---

## 2026-10-20 (later): first run on the Android emulator

Tested on an emulator (`LanternsPhone`, Pixel 7, Android 16, x86_64). Verified there: permissions flow, Music folder auto-loaded, playback, playback continuing in the background and with the screen off, back gesture between screens, folder browser.

### 1. The app icon was Tauri's default logo
- **What:** `tauri android init` creates Android launcher icons from Tauri's own logo, not from `src-tauri/icons`.
- **Fix:** generated the icons with `pnpm tauri icon src-tauri/icons/source.svg -o <temp dir>` and copied only `android/mipmap-*` into `gen/android/app/src/main/res`. The adaptive-icon background is the emblem's dark green (`values/ic_launcher_background.xml`, #0B2E24).
- **Rule:** whenever the icon changes, regenerate the Android mipmaps too, and look at the app in the launcher.

### 2. The adaptive icon was cropped
- **What:** Android masks launcher icons to a circle. The generated foreground filled the whole canvas, so only the ring showed and the two bars were cut off.
- **Fix:** shrank the emblem in every `ic_launcher_foreground.png` to 62% of the canvas, centered (inside the safe zone).
- **Rule:** adaptive-icon foreground artwork must sit inside the central ~66%.

### 3. Song titles were invisible in playlists on the phone
- **What:** in the track table, Artist/Title/Duration share the phone's width equally, and the Title cell also holds two hover-only buttons (add to queue, options). They are invisible on touch screens but still take about 64px, so titles shrank to a dot.
- **Fix:** `ConnectedTrackTable` hides Duration and the queue controls on mobile (`MOBILE_DISPLAY`). Test: "shows song titles without the duration column in a playlist".
- **Rule:** hover-only UI doesn't exist on touch screens. Check every table or row layout at phone width (~400 CSS px).

### 4. Green text was unreadable in light mode
- **What:** `text-accent-green` (active tab, "NOW PLAYING" label) nearly disappears on the light mint background.
- **Fix:** the active tab gets a `bg-primary` pill plus bold text. The label uses normal text at 60% opacity.
- **Rule:** use accent colors for fills and icons, not for small text. Check both light and dark mode.

### 5. Tooling traps while driving the emulator
- `adb shell mkdir -p "/sdcard/Music/Mix - Save Me"` created folders named `Mix`, `-`, `Save`, `Me`: adb joins the arguments into one shell line. Quote inside the remote command: `adb shell "mkdir -p '/sdcard/Music/Mix - Save Me'"`.
- Git Bash rewrites `/sdcard/...` into a Windows path. Run adb with `MSYS_NO_PATHCONV=1`.
- The x86_64 (emulator) and arm64 (phone) builds write to the same output file. Copy each APK away before the next build.

---

## 2026-10-20: Android version, phone layout, faster startup

### 1. Debug builds would crash on Android at launch
- **What:** `lib.rs` exported the TypeScript bindings at startup in every debug build, writing to `CARGO_MANIFEST_DIR/../src/services/tauri/bindings.ts`. That path exists only on the dev PC; on a phone `.expect()` panics.
- **Fix:** export only on desktop: `#[cfg(all(debug_assertions, desktop))]`.
- **Rule:** anything that touches the host's file system or source tree at runtime must be gated with `desktop`. Also gate desktop-only plugins (`tauri_plugin_window_state`) and crates (`fix-path-env`) with `#[cfg(desktop)]` or a desktop-only `[target]` dependency table.

### 2. Desktop default library path lost its backslashes
- **What:** `DESKTOP_LIBRARY_ROOTS` was written as `'G:\Meu Drive\Music'`. In JS that string is `G:Meu DriveMusic`, so the desktop library would not have loaded on startup.
- **Why:** the file was written with a Bash heredoc, and the Bash tool collapsed `\\` into `\`.
- **Caught by:** `pnpm lint` (`no-useless-escape`). A regression test now pins the path (`DashboardFolders.test.tsx`, "uses the Google Drive music folder as the default library on desktop").
- **Rule:** write files that contain backslashes (Windows paths, regexes) with the Write/Edit tools, never a heredoc. Always run `pnpm lint` and `pnpm type-check` before you say you're done.

### 3. Python edits turned LF files into CRLF
- **What:** files edited with `open(path, 'w')` came back with CRLF endings. Git warned `CRLF will be replaced by LF` and every line showed up as changed.
- **Why:** Python's text mode on Windows writes `\r\n`.
- **Rule:** in Python use `open(path, 'w', encoding='utf8', newline='')` (or `newline='\n'`). Check with `git ls-files --eol <file>`: the working copy must say `w/lf`.

### 4. A multi-line heredoc silently wrote nothing
- **What:** a Bash heredoc holding Kotlin and XML failed with `unexpected EOF while looking for matching '`. Nothing was written, including the files before the bad one.
- **Rule:** create multi-line source files with the Write tool, then list the folder to confirm they exist.

### 5. `sdkmanager` said "Package not found" for every package
- **What:** `sdkmanager.bat "platforms;android-36"` split the name at `;`.
- **Rule:** with the current command-line tools, use the slash form: `platforms/android-36`, `build-tools/36.0.0`, `ndk/29.0.14206865`.

### 6. Route code-splitting broke tests that act right after `render()`
- **What:** with `autoCodeSplitting`, the router waits for a screen's chunk before mounting anything. Tests that pressed keys or looked for a view right after `render(<App />)` found nothing.
- **Fix:** wait for the first screen (`await screen.findByTestId('dashboard-view')`). Wrappers use `find*` for anything that appears after navigation (`PlaylistsWrapper.findDetailView()`).
- **Rule:** never interact right after `render(<App />)`; await a view first. After a click that navigates, use `find*`, not `get*`/`query*`.

### 7. Vite refused to build with code-splitting enabled
- **What:** `Plugin order error: '@vitejs/plugin-react' is placed before '@tanstack/router-plugin'`.
- **Rule:** in `vite.config.ts`, `tanstackRouter(...)` must come before `react()`.

### 8. Rewriting a JSON file reformatted all of it
- **What:** `json.dump` on `changelog.json` expanded every `"contributors": ["..."]` onto several lines: an 86-line diff for a 28-line change.
- **Rule:** insert new entries as text, matching the file's style. Check that `git diff --stat` only shows your lines. Prettier is only run through ESLint here, so `npx prettier` is not available.

### Android pitfalls handled (do not undo)
- **Audio server needs cleartext on localhost.** Release builds block `http://` unless `res/xml/network_security_config.xml` allows it. It allows only `127.0.0.1` and `localhost`. Don't delete it and don't turn on cleartext for everything.
- **No native folder picker on Android.** The Storage Access Framework returns `content://` URIs that Rust `std::fs` can't open. The phone uses the in-app `FolderBrowserDialog` (Rust `list_folder` / `storage_roots`) plus the "All files access" permission requested in `MainActivity.kt`. Don't switch Android to `plugin-dialog` `open({ directory: true })`.
- **Window APIs are desktop-only.** `getCurrentWindow().show()/setDecorations()/setFullscreen()` and the title bar live in `DesktopRoot` only. Never call them from shared or mobile code.
- **No Web Audio graph on the phone.** Wry calls `WebView.onPause()` when the app goes to the background. A plain `<audio>` element keeps playing, but audio routed through an `AudioContext` may not. So the phone's Now Playing doesn't render `SpectrumVisualizer`/`StarfieldBackground`, and nothing on mobile may call `audioAnalyser.get()`.
- **Edge-to-edge.** With `targetSdk` 36, Android draws the app under the status and navigation bars. `MainActivity.keepContentInsideSystemBars()` pads the content by the system bar and keyboard insets. Don't remove it, or the header and tab bar end up under the bars.
- **Signing.** Release APKs are signed with `%USERPROFILE%\.android\lanterns-player-release.jks` (password in the gitignored `gen/android/keystore.properties`). If that key is lost, a new APK can't be installed over the old one; you have to uninstall first, which wipes the app's data.

### Still to verify on a real phone
- Background playback and the back gesture work on the emulator (see the later entry). Still to confirm on a real phone with battery optimization on.
- Lock-screen and notification controls were added later the same day (see the "night" entry). Bluetooth headphone buttons are still untested.
