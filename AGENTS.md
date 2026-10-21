# AGENTS.md

Guidelines for AI coding agents working on Nuclear.

**Before you change anything, read [BUGLOG.md](BUGLOG.md).** It lists every bug hit so far and the rule that prevents it. When you finish a change, add a dated section at the top of it with the bugs you hit, even the ones you caught and fixed yourself.

## Project Overview

Nuclear is a free, open-source music player without ads or tracking. Search for any song or artist, build playlists, and start listening. It's a Tauri app (Rust + React) for desktop and Android, organized as a pnpm monorepo managed with Turborepo.

### Packages

- `@nuclearplayer/player` - Main Tauri app (React + Rust)
- `@nuclearplayer/ui` - Shared UI components
- `@nuclearplayer/plugin-sdk` - Shared types only (settings, events, favorites) and the `useSetting` hook. The plugin system itself was removed from this fork
- `@nuclearplayer/model` - Data model
- `@nuclearplayer/themes` - Theming system
- `@nuclearplayer/hifi` - HTML5 audio component (plays local files served over HTTP)
- `@nuclearplayer/tailwind-config` - Shared Tailwind config
- `@nuclearplayer/eslint-config` - Shared linting rules
- `@nuclearplayer/i18n` - Internationalization
- `@nuclearplayer/storybook` - Component demos

## Commands

```bash
# Development
pnpm dev                    # Run player in dev mode
pnpm storybook              # Run Storybook

# Build
pnpm build                  # Build all packages
pnpm tauri build            # Build Tauri app
pnpm android:build          # Build the signed Android APK (see ANDROID.md)

# Quality
pnpm lint                   # Lint all packages
pnpm lint:fix               # Lint and auto-fix
pnpm type-check             # TypeScript checks
pnpm test                   # Run all tests
pnpm test:coverage          # Run tests with coverage
pnpm clean                  # Clean build artifacts

# Package-specific testing
pnpm --filter @nuclearplayer/ui test -- src/components/Badge/Badge.test.tsx
pnpm --filter @nuclearplayer/ui test -- --testNamePattern="renders"

# Update snapshots (run at root for all, or filter to a specific package)

# At root
pnpm test -- -u

# Filtering for a specific package
pnpm --filter @nuclearplayer/ui test -- -u

# After cd'ing into a package
pnpm test -u
```

## Code Style

### General Principles

- Prioritize readability over cleverness
- No comments in code - explain reasoning in chat/commits
- Avoid premature abstractions - start concrete, extract later
- Small, focused changes over large dumps
- Never commit unless explicitly asked

### TypeScript

- Use `type` not `interface` (except when merging is required)
- No magic numbers - extract into named constants
- Strict mode with `noUnusedLocals` and `noUnusedParameters`
- Do not use one-letter variable names.
AVOID: `(b) => b.buildIndexEntry()`
PREFER: `(build) => build.buildIndexEntry()`

### React Components

```tsx
import { cva, VariantProps } from 'class-variance-authority';
import { ComponentProps, FC } from 'react';

import { cn } from '../../utils';

const componentVariants = cva('base-classes', {
  variants: { /* ... */ },
  defaultVariants: { /* ... */ },
});

type ComponentProps = ComponentProps<'div'> &
  VariantProps<typeof componentVariants>;

export const Component: FC<ComponentProps> = ({
  className,
  variant,
  ...props
}) => (
  <div className={cn(componentVariants({ variant, className }))} {...props} />
);
```

- Use `const Component: FC<Props>` not `function Component()`
- Compound components (`Component.Sub`) for complex widgets
- Keep business logic out of UI components

### Adding UI Components

When adding a new component to `@nuclearplayer/ui`:

1. Create component directory: `packages/ui/src/components/MyComponent/`
   - `MyComponent.tsx` - implementation
   - `MyComponent.test.tsx` - tests (aim for 100% coverage)
   - `index.ts` - re-exports
2. Export from `packages/ui/src/components/index.ts`
3. Add Storybook story in `packages/storybook/src/MyComponent.stories.tsx`
4. Include snapshot test(s) covering all variants

### Styling (Tailwind v4)

- CSS-first config in `packages/tailwind-config/global.css`
- Theme colors: `bg-background`, `text-foreground`, `bg-primary`
- Accents: `accent-green`, `accent-yellow`, `accent-purple`, `accent-blue`, `accent-orange`, `accent-cyan`, `accent-red`
- Use `cn()` for conditional classes, `cva()` for variants

### State Management

- **Zustand** - persistent UI state
- **React state** - local, temporary state
- **TanStack Query v5** - HTTP requests/server state
- **TanStack Router** - client-side routing

### Standardized Libraries

- **Icons**: Lucide React (not heroicons, not font-awesome)
- **Toasts**: Sonner
- **Dates**: Luxon
- **Utilities**: lodash-es (use individual imports: `import isEqual from 'lodash-es/isEqual'`)

### Desktop and Android

`isMobilePlatform()` (`packages/player/src/services/platform.ts`) picks the shell in `routes/__root.tsx`:

- **Desktop** (`DesktopRoot`): the original layout with sidebars, title bar, player bar and keyboard shortcuts. Keep it as is.
- **Android** (`MobileRoot` → `components/mobile/MobileShell`): header (add folder, settings), the routed screen, a mini player and a bottom tab bar (`/dashboard`, `/now-playing`, `/queue`, `/favorites/tracks`, `/history`). Folders are picked with the in-app `FolderBrowserDialog`, and the default library is `/storage/emulated/0/Music`.

Call `isMobilePlatform()` at render time, never at module load: tests switch the platform per test with `vi.mocked(platform).mockReturnValue('android')`. Window APIs (`@tauri-apps/api/window`) are desktop-only. The native Android project lives in `packages/player/src-tauri/gen/android` (committed). `MainActivity.kt` (permissions, system-bar insets, attaches the media bridge), `PlaybackService.kt` (keeps playback alive in the background, owns the `MediaSession` and the media notification) and `MediaControls.kt` (the `window.LanternsMedia` bridge) are hand-written. The web side of the bridge is `services/androidMediaControls.ts`.

### No plugins or integrations

This fork plays local folders only. Plugins, online providers (search, artist/album pages, streaming, discovery, dashboard widgets) and integrations (Nuclear Jam, MCP, MPD, Discord) were removed on purpose. Do not reintroduce them.

### Internationalization

All user-facing strings go through i18n - no hardcoded UI text.

```tsx
import { useTranslation } from '@nuclearplayer/i18n';

const { t } = useTranslation();
<span>{t('navigation.settings')}</span>
```

Add new strings to `packages/i18n/src/locales/en_US.json` only. Other locales come from Crowdin.

## Testing

Tests use Vitest + React Testing Library. Globals enabled (`describe`, `it`, `expect`, `vi`).

- Integration tests over unit tests for user-facing behavior. Render real components and assert on DOM content rather than verifying mock calls.
- Unit tests for utilities - standalone data structures (RingBuffer, parsers) deserve isolated tests. Use them sparingly.
- Test user behavior, not implementation details
- Minimize mocks - only mock external deps (HTTP, FS, Tauri)
- Snapshot tests: prefix with `(Snapshot)`, basic rendering only
- Never use `querySelector` in tests. Prefer RTL queries.
- When semantic queries aren't possible, add `data-testid` attributes. And don't be shy with them
- Don't use defensive measures like try-catch or conditional checks in tests. The test will fail anyway if our assumptions are wrong.

### Test-first for views

When building a new view, write the test wrapper and tests **before** any implementation code. The tests describe what the user sees and does — they define the contract. Then implement to make them pass.

Don't start with unit tests for internal utilities (grouping functions, registries, etc.). Start from the outside: what does the user see on the page? The internal structure is an implementation detail that falls out of making the tests green.

### Test Wrappers for Views

Player views and some components use a `*.test-wrapper.tsx` file that creates a domain-specific abstraction layer over the DOM. This lets tests read like user stories, and if the implementation changes, only the wrapper needs updating.

**Wrapper conventions:**
- Use **getters** for element queries: `get emptyState()`, `get cards()` — not `getEmptyState()`
- Use **nested objects** for interactive elements: `createButton: { get element(), async click() }`
- Use **methods** for multi-step user actions: `async openContextMenu(title: string)`
- Tests should use `Wrapper.emptyState`, `Wrapper.cards`, `Wrapper.createButton.click()` — not bare `screen` queries
- The wrapper is the only place that knows about test IDs, roles, and DOM structure
- Don't use queryX methods in the wrapper - always get or find as appropriate.
- Never use fireEvent. Always use userEvent for interactions.

### Test fixtures

To populate the app with testing data, use fixtures. See `packages/player/src/test/fixtures` for examples.

### Wrapper fixtures

Test wrappers can expose a `fixtures` object with factory methods that return pre-configured builders for common test scenarios. This keeps test setup readable and co-located with the wrapper, while the raw fixture data itself lives in `packages/player/src/test/fixtures/`.

```tsx
// Dashboard.test-wrapper.tsx
import { TOP_TRACKS_RADIOHEAD } from '../../test/fixtures/dashboard';

export const DashboardWrapper = {
  // ... mount, getters, etc.

  fixtures: {
    topTracksProvider() {
      return new DashboardProviderBuilder()
        .withCapabilities('topTracks')
        .withFetchTopTracks(async () => TOP_TRACKS_RADIOHEAD);
    },
  },
};

// Dashboard.test.tsx
DashboardWrapper.seedProvider(DashboardWrapper.fixtures.topTracksProvider());
```

### The builder pattern for tests

We use builders to create test data and various entities cleanly. You can see them in `packages/player/src/test/builders`.

- A builder is a class that has an instance of the object it's building
- When the builder is instantiated, it creates a default object with reasonable defaults
- The builder has methods that mutate the object and return `this` for chaining
- The `build()` method returns the final object, which can then be used in tests

```tsx
// Playlists.test-wrapper.tsx
export const PlaylistsWrapper = {
  async mount(): Promise<RenderResult> { /* ... */ },

  get emptyState() {
    return screen.queryByTestId('empty-state');
  },
  get cards() {
    return screen.queryAllByTestId('card');
  },

  createButton: {
    get element() {
      return screen.getByTestId('create-playlist-button');
    },
    async click() {
      await userEvent.click(this.element);
    },
  },
};

// Playlists.test.tsx — reads like a user story
it('shows empty state when no playlists', async () => {
  await PlaylistsWrapper.mount();
  expect(PlaylistsWrapper.emptyState).toBeInTheDocument();
});
```

## File Organization

```
packages/ui/src/components/Badge/
  Badge.tsx           # Implementation
  Badge.test.tsx      # Tests
  index.ts            # Re-exports
  __snapshots__/      # Vitest snapshots
```

## Rust Backend

The Tauri backend lives in `packages/player/src-tauri/src/`. Modules:

- `stream_server.rs` - local HTTP server that serves audio files from disk with CORS + Range support
- `local_library.rs` - scans music folders and reads audio tags/covers (tags are read in parallel with rayon)
- `folder_browser.rs` - lists storage roots and subfolders for the in-app folder browser (Android)
- `history/`, `db.rs` - listening history (SQLite)
- `commands.rs` - flatpak detection
- `net.rs`, `setup.rs`, `logging.rs` - port binding, log plugin config, startup log ring buffer
- `lib.rs` - declares modules, registers all commands, runs `init_*` in `.setup()`. `main.rs` - binary entry, env fixups.

Commands (run from `packages/player/src-tauri/`):

```bash
cargo test          # Rust tests (no clippy/rustfmt configured; run manually)
```

`pnpm dev` runs `tauri dev`; `pnpm build` (in `packages/player`) runs the full `tauri build`.

## Design Philosophy

- Neo-brutalist with premium polish - bold borders, purposeful shadows
- Premium, designed feel
- Animations via `motion` and `tw-animate-css`
- Disable animations during high-friction moments (resize, drag)
- Avoid generic AI patterns (icon-grid cards, stock heroes, "Built with love" badges)

## Tooling Notes

- **pnpm** with workspace protocol for internal deps
- **Turborepo** for task orchestration
- **ESLint + Prettier** run together
- **Husky + lint-staged** for pre-commit hooks

Use centralized configs from eslint-config and tailwind-config packages.

Assume TanStack Router routes regenerate on dev - don't regenerate manually.

## Changelog

`packages/player/changelog.json` is the source of truth for the in-app "What's New" tab. Entries are written in Brazilian Portuguese.

When building a user-facing feature, fix, or improvement, add an entry to the top of the array according to the format you find there.

## Releasing

There is no release pipeline. Build installers locally with `pnpm tauri build` (desktop) and `pnpm android:build` (Android APK). Upstream Nuclear packaging (Flatpak, Snap, AUR, Winget, Homebrew), the npm publishing of the plugin SDK, the website, docs and promo videos were removed on purpose. Do not reintroduce them.
