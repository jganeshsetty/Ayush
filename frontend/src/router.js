/**
 * Ayush Router
 * Simple vanilla JS router for SPA navigation
 */

import { auth } from './api.js';

// Route definitions
const routes = {
  '/': 'landing',
  '/login': 'login',
  '/register': 'register',
  '/caretaker': 'caretaker',
  '/senior': 'senior',
  '/senior/:profileCode': 'senior',
  '/privacy': 'privacy',
  '/terms': 'terms',
};

// Current route state
let currentRoute = null;
let currentParams = {};

/**
 * Parse URL and extract route + params
 */
function parseRoute(pathname) {
  // Remove leading/trailing slashes
  const cleanPath = pathname.replace(/^\/+|\/+$/g, '');
  const segments = cleanPath.split('/');

  // Try exact match first
  const exactPath = '/' + cleanPath;
  if (routes[exactPath]) {
    return { name: routes[exactPath], params: {} };
  }

  // Try parameterized routes
  for (const [pattern, name] of Object.entries(routes)) {
    const patternParts = pattern.split('/').filter(Boolean);
    if (patternParts.length !== segments.length) continue;

    const params = {};
    let match = true;
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = segments[i];
      } else if (patternParts[i] !== segments[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      return { name, params };
    }
  }

  // Default to landing
  return { name: 'landing', params: {} };
}

/**
 * Navigate to a route
 */
export function navigate(path) {
  window.history.pushState({}, '', path);
  handleRouteChange();
}

/**
 * Handle route change (popstate or manual navigation)
 */
export function handleRouteChange() {
  const { name, params } = parseRoute(window.location.pathname);
  currentRoute = name;
  currentParams = params;

  // Check auth for protected routes
  const protectedRoutes = ['caretaker', 'senior'];
  const isAuth = auth.isAuthenticated();

  if (protectedRoutes.includes(name) && !isAuth) {
    navigate('/login');
    return;
  }

  // Dispatch route change event
  window.dispatchEvent(new CustomEvent('route:change', {
    detail: { route: name, params },
  }));
}

/**
 * Get current route info
 */
export function getCurrentRoute() {
  return { route: currentRoute, params: currentParams };
}

/**
 * Initialize router
 */
export function initRouter() {
  // Handle browser back/forward
  window.addEventListener('popstate', handleRouteChange);

  // Handle initial load
  handleRouteChange();

  // Intercept link clicks
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[data-path], a[href^="/"]');
    if (!link) return;

    const href = link.getAttribute('href');
    const path = link.getAttribute('data-path');

    if (href && href.startsWith('/') && !href.startsWith('//')) {
      e.preventDefault();
      navigate(href);
    } else if (path) {
      e.preventDefault();
      const pathToRoute = {
        'home': '/',
        'senior-care': '/senior',
        'senior': '/senior',
        'family-circle': '/caretaker',
        'sign-in': '/login',
        'login': '/login',
        'register': '/register',
        'privacy': '/privacy',
        'terms': '/terms',
      };
      if (pathToRoute[path]) {
        navigate(pathToRoute[path]);
      }
    }
  });
}

// Export route names for page components
export const ROUTES = {
  LANDING: 'landing',
  LOGIN: 'login',
  REGISTER: 'register',
  CARETAKER: 'caretaker',
  SENIOR: 'senior',
  PRIVACY: 'privacy',
  TERMS: 'terms',
};