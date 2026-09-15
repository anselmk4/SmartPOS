import posthog from 'posthog-js';

export * from './posthog-provider';

/**
 * Capture a custom analytics event in PostHog
 */
export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.capture(eventName, properties);
  }
}

/**
 * Identify a logged-in user in PostHog
 */
export function identifyUser(
  userId: string,
  userProperties?: {
    email?: string;
    name?: string;
    role?: string;
    storeId?: string;
    [key: string]: any;
  }
) {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.identify(userId, userProperties);
  }
}

/**
 * Reset PostHog user session upon logout
 */
export function resetAnalyticsUser() {
  if (typeof window !== 'undefined' && posthog.__loaded) {
    posthog.reset();
  }
}
