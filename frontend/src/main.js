/**
 * Ayush - Main Entry Point
 * Initializes the app, router, and renders pages based on route
 */

import './style.css';
import { initRouter, getCurrentRoute, ROUTES, navigate } from './router.js';
import { auth } from './api.js';
import { renderLanding } from './pages/landing.js';
import { renderLogin } from './pages/login.js';
import { renderRegister } from './pages/register.js';
import { renderCaretaker } from './pages/caretaker.js';
import { renderSenior } from './pages/senior.js';

// Page renderer map
const pageRenderers = {
  [ROUTES.LANDING]: renderLanding,
  [ROUTES.LOGIN]: renderLogin,
  [ROUTES.REGISTER]: renderRegister,
  [ROUTES.CARETAKER]: renderCaretaker,
  [ROUTES.SENIOR]: renderSenior,
};

// Global state
const state = {
  user: null,
  profile: null,
  language: 'en',
  fontScale: 'normal',
  highContrast: false,
};

/**
 * Apply global UI state (language, font scale, contrast)
 */
function applyGlobalState() {
  const html = document.documentElement;
  const body = document.body;

  // Font scale
  body.classList.remove('font-scale-normal', 'font-scale-large', 'font-scale-xlarge');
  body.classList.add(`font-scale-${state.fontScale}`);

  // High contrast
  if (state.highContrast) {
    html.classList.add('high-contrast');
  } else {
    html.classList.remove('high-contrast');
  }

  // Language
  body.classList.remove('lang-en', 'lang-kn', 'lang-hi');
  body.classList.add(`lang-${state.language}`);

  // Persist to localStorage
  localStorage.setItem('ayush_ui_state', JSON.stringify({
    language: state.language,
    fontScale: state.fontScale,
    highContrast: state.highContrast,
  }));
}

/**
 * Load persisted UI state
 */
function loadUIState() {
  const saved = localStorage.getItem('ayush_ui_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.language = parsed.language || 'en';
      state.fontScale = parsed.fontScale || 'normal';
      state.highContrast = parsed.highContrast || false;
    } catch {
      // Ignore parse errors
    }
  }
  applyGlobalState();
}

/**
 * Update global UI state
 */
export function setUIState(updates) {
  Object.assign(state, updates);
  applyGlobalState();
}

/**
 * Get current UI state
 */
export function getUIState() {
  return { ...state };
}

/**
 * Render current page
 */
async function renderPage() {
  const { route, params } = getCurrentRoute();
  const renderer = pageRenderers[route];

  const app = document.getElementById('app');
  if (!app) return;

  // Show loading state
  app.innerHTML = `
    <div class="min-h-screen flex items-center justify-center bg-surface">
      <div class="flex flex-col items-center gap-4">
        <div class="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p class="text-on-surface-variant font-body text-body-lg">Loading...</p>
      </div>
    </div>
  `;

  try {
    if (renderer) {
      await renderer(app, params, state);
    } else {
      app.innerHTML = '<div class="p-8 text-center text-on-surface-variant">Page not found</div>';
    }
  } catch (error) {
    console.error('Page render error:', error);
    app.innerHTML = `
      <div style="padding:2rem;text-align:center;color:#6f331a;font-family:sans-serif;">
        <h2 style="margin-bottom:1rem;">Something went wrong</h2>
        <pre style="background:#fff3ee;padding:1rem;border-radius:8px;text-align:left;white-space:pre-wrap;font-size:13px;">${error.stack || error.message}</pre>
        <button onclick="window.location.reload()" style="margin-top:1rem;padding:0.75rem 2rem;background:#6f331a;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">
          Reload Page
        </button>
      </div>
    `;
  }
}

/**
 * Handle auth state changes
 */
function handleAuthChange() {
  const authState = auth.getState();
  state.user = authState.user;
  renderPage();
}

/**
 * Handle route change events from router
 */
function handleRouteChangeEvent() {
  renderPage();
}

/**
 * Initialize app
 */
async function initApp() {
  // Load UI preferences
  loadUIState();

  // Expose globals BEFORE render so inline handlers work immediately
  window.navigate = navigate;
  window.setUIState = setUIState;
  window.getUIState = getUIState;

  // Listen for route/auth changes
  window.addEventListener('auth:logout', handleAuthChange);
  window.addEventListener('route:change', handleRouteChangeEvent);

  // Initialize router and render initial page
  initRouter();
  await renderPage();
}

// Start app
initApp();

// Export for debugging
window.Ayush = {
  state,
  navigate,
  setUIState,
  getUIState,
};