
// Production constants for treehub.app

export const SITE_CONFIG = {
  name: 'TreeHub',
  domain: 'treehub.app',
  url: 'https://treehub.app',
  description: 'The professional hub for the tree care industry',
  tagline: 'Connect, grow, and succeed in the tree care industry',
};

export const CONTACT_INFO = {
  email: 'support@treehub.app',
  phone: '1-800-TREEHUB',
  phoneNumber: '+18008733482',
  address: 'Nationwide Service',
};

export const SOCIAL_LINKS = {
  twitter: 'https://twitter.com/treehub',
  linkedin: 'https://linkedin.com/company/treehub',
  facebook: 'https://facebook.com/treehub',
};

export const API_ENDPOINTS = {
  auth: '/api/auth',
  jobs: '/api/jobs',
  professionals: '/api/professionals',
  equipment: '/api/equipment',
  weather: '/api/weather',
  marketConquest: '/api/market-conquest',
  aiAgents: '/api/ai-agents',
};

export const ROUTES = {
  home: '/',
  dashboard: '/dashboard',
  jobs: '/jobs',
  professionals: '/professionals',
  equipment: '/equipment',
  emergency: '/emergency',
  marketConquest: '/market-conquest',
  auth: {
    signin: '/auth/signin',
    signup: '/auth/signup',
  },
  admin: '/admin',
};

export const NAVIGATION_ITEMS = [
  { name: 'Dashboard', href: ROUTES.dashboard, icon: 'Briefcase' },
  { name: 'Jobs', href: ROUTES.jobs, icon: 'Briefcase' },
  { name: 'Professionals', href: ROUTES.professionals, icon: 'User' },
  { name: 'Equipment', href: ROUTES.equipment, icon: 'Settings' },
  { name: 'Emergency', href: ROUTES.emergency, icon: 'AlertTriangle', isEmergency: true },
];

export const BUSINESS_HOURS = {
  monday: '8:00 AM - 6:00 PM',
  tuesday: '8:00 AM - 6:00 PM',
  wednesday: '8:00 AM - 6:00 PM',
  thursday: '8:00 AM - 6:00 PM',
  friday: '8:00 AM - 6:00 PM',
  saturday: '9:00 AM - 4:00 PM',
  sunday: 'Emergency Only',
};

export const EMERGENCY_CONTACT = {
  phone: '1-800-TREE-911',
  phoneNumber: '+18008733911',
  email: 'emergency@treehub.app',
  available: '24/7/365',
};
