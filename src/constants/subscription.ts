export type Plan = 'free' | 'pro' | 'team';

export const PLAN_CONFIG = {
  free: { name: 'Free', monthlyPrice: 0, yearlyPrice: 0 },
  pro: { name: 'Pro', monthlyPrice: 5, yearlyPrice: 45 },
  team: { name: 'Team', monthlyPrice: 8, yearlyPrice: 72 },
} as const;

export const PRO_FEATURES = {
  UNLIMITED_SNIPPETS: 'unlimited_snippets',
  SNIPPET_VARIABLES: 'snippet_variables',
  CLOUD_SYNC: 'cloud_sync',
  LINEAR_WIDGET: 'linear_widget',
} as const;

export type ProFeature = (typeof PRO_FEATURES)[keyof typeof PRO_FEATURES];

export const SNIPPET_FREE_LIMIT = 20;
export const SESSION_FREE_LIMIT = 3;

// Lemon Squeezy checkout URLs (stubbed — replace when account is set up)
export const CHECKOUT_URLS = {
  pro_monthly: 'https://waypoint.lemonsqueezy.com/checkout/pro-monthly',
  pro_yearly: 'https://waypoint.lemonsqueezy.com/checkout/pro-yearly',
  team_monthly: 'https://waypoint.lemonsqueezy.com/checkout/team-monthly',
  team_yearly: 'https://waypoint.lemonsqueezy.com/checkout/team-yearly',
} as const;
