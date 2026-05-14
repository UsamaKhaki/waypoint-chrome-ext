import posthog from 'posthog-js';

export const PH_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
export const PH_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';

export function initAnalytics() {
  if (!PH_KEY) return;

  posthog.init(PH_KEY, {
    api_host: PH_HOST,

    // SPA — we handle pageviews manually as section changes
    capture_pageview: false,
    capture_pageleave: false,

    // Autocapture catches rage clicks and dead clicks automatically
    autocapture: true,

    // Session replay — critical for rage/dead click visibility
    session_recording: {
      maskAllInputs: false,
      maskInputOptions: {
        password: true,
        // Mask fields likely to contain tokens/API keys
      },
      // Mask inputs that have token-related names/classes
      maskInputFn(text, element) {
        const el = element as HTMLInputElement | undefined;
        const name = (el?.name ?? '').toLowerCase();
        const placeholder = (el?.placeholder ?? '').toLowerCase();
        if (name.includes('token') || name.includes('key') || name.includes('secret') ||
            placeholder.includes('token') || placeholder.includes('key') || placeholder.includes('secret')) {
          return '*'.repeat(text.length);
        }
        return text;
      },
    },

    loaded(ph) {
      // Identify extension context
      ph.register({
        app: 'waypoint-extension',
        app_version: '1.0.0',
        platform: 'chrome_extension',
      });
    },
  });
}

// ── Typed event helpers ────────────────────────────────────────────────────

export const analytics = {
  /** Call once when PostHog loads user identity (e.g. from Google profile) */
  identify(userId: string, traits?: Record<string, unknown>) {
    if (!PH_KEY) return;
    posthog.identify(userId, traits);
  },

  reset() {
    if (!PH_KEY) return;
    posthog.reset();
  },

  /** User navigated to a section */
  sectionViewed(section: string) {
    if (!PH_KEY) return;
    posthog.capture('section_viewed', { section });
  },

  /** User spent time on section then navigated away */
  sectionLeft(section: string, durationMs: number) {
    if (!PH_KEY) return;
    posthog.capture('section_left', {
      section,
      duration_ms: durationMs,
      duration_s: Math.round(durationMs / 1000),
    });
  },

  // ── Integration flows ──────────────────────────────────────────────────

  integrationConnectStarted(integration: string) {
    if (!PH_KEY) return;
    posthog.capture('integration_connect_started', { integration });
  },

  integrationConnectSuccess(integration: string) {
    if (!PH_KEY) return;
    posthog.capture('integration_connect_success', { integration });
  },

  integrationConnectFailed(integration: string, reason: string) {
    if (!PH_KEY) return;
    posthog.capture('integration_connect_failed', { integration, reason });
  },

  integrationDisconnected(integration: string) {
    if (!PH_KEY) return;
    posthog.capture('integration_disconnected', { integration });
  },

  // ── Command palette ────────────────────────────────────────────────────

  commandPaletteOpened(trigger: 'keyboard' | 'click') {
    if (!PH_KEY) return;
    posthog.capture('command_palette_opened', { trigger });
  },

  commandPaletteClosed(query: string, selectedKind: string | null) {
    if (!PH_KEY) return;
    posthog.capture('command_palette_closed', {
      had_query: query.length > 0,
      selected_kind: selectedKind,
    });
  },

  commandRun(commandId: string, commandCategory: string) {
    if (!PH_KEY) return;
    posthog.capture('command_run', { command_id: commandId, category: commandCategory });
  },

  // ── Features ───────────────────────────────────────────────────────────

  bookmarkAdded(category: string) {
    if (!PH_KEY) return;
    posthog.capture('bookmark_added', { category });
  },

  snippetCopied() {
    if (!PH_KEY) return;
    posthog.capture('snippet_copied');
  },

  snippetCreated() {
    if (!PH_KEY) return;
    posthog.capture('snippet_created');
  },

  sessionSaved(tabCount: number) {
    if (!PH_KEY) return;
    posthog.capture('session_saved', { tab_count: tabCount });
  },

  sessionRestored() {
    if (!PH_KEY) return;
    posthog.capture('session_restored');
  },

  tabsBulkClosed(count: number) {
    if (!PH_KEY) return;
    posthog.capture('tabs_bulk_closed', { count });
  },

  // ── Onboarding ─────────────────────────────────────────────────────────

  onboardingStarted() {
    if (!PH_KEY) return;
    posthog.capture('onboarding_started');
  },

  onboardingCompleted() {
    if (!PH_KEY) return;
    posthog.capture('onboarding_completed');
  },

  onboardingAbandoned(step: number) {
    if (!PH_KEY) return;
    posthog.capture('onboarding_abandoned', { step });
  },

  // ── Error events ───────────────────────────────────────────────────────

  errorBoundaryTriggered(boundary: string, errorMessage: string) {
    if (!PH_KEY) return;
    posthog.capture('error_boundary_triggered', { boundary, error_message: errorMessage });
  },

  bugReportSubmitted(category: string) {
    if (!PH_KEY) return;
    posthog.capture('bug_report_submitted', { category });
  },
};
