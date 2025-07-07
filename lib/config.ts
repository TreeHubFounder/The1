
// Production configuration utilities for treehub.app

export const config = {
  // Domain configuration
  domain: process.env.NEXT_PUBLIC_DOMAIN || 'treehub.app',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://treehub.app',
  
  // Environment
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // API configuration
  apiUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://treehub.app',
  
  // Feature flags
  features: {
    marketConquest: process.env.ENABLE_MARKET_CONQUEST === 'true',
    aiAgents: process.env.ENABLE_AI_AGENTS === 'true',
    weatherMonitoring: process.env.ENABLE_WEATHER_MONITORING === 'true',
    analytics: process.env.ENABLE_ANALYTICS === 'true',
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  // Email configuration
  email: {
    support: 'support@treehub.app',
    noreply: 'noreply@treehub.app',
    contact: 'contact@treehub.app',
  },
  
  // Social media
  social: {
    twitter: '@treehub',
    linkedin: 'company/treehub',
  },
  
  // SEO
  seo: {
    siteName: 'TreeHub',
    tagline: 'Professional Tree Care Network',
    description: 'Connect, grow, and succeed in the tree care industry',
  },
};

// Utility functions
export const getApiUrl = (path: string) => {
  const baseUrl = config.apiUrl;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getAppUrl = (path: string = '') => {
  const baseUrl = config.appUrl;
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const isFeatureEnabled = (feature: keyof typeof config.features) => {
  return config.features[feature];
};
