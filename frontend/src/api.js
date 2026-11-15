/**
 * Ayush API Client
 * Fetches against VITE_API_URL (default: http://localhost:8000/api/v1)
 * JWT token stored in localStorage under 'ayush_token'
 */

const API_BASE = (import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:8000/api/v1';
const TOKEN_KEY = 'ayush_token';
const USER_KEY = 'ayush_user';

/**
 * Get stored JWT token
 */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Set JWT token and user data
 */
function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Clear auth data
 */
function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Get stored user data
 */
function getUser() {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!getToken();
}

/**
 * Core fetch wrapper with auth header
 */
async function fetchApi(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // Handle FormData (for file uploads)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']; // Let browser set multipart boundary
    config.body = options.body;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  // Handle 401 - token expired/invalid
  if (response.status === 401) {
    clearAuth();
    window.dispatchEvent(new CustomEvent('auth:logout'));
    throw new Error('Session expired. Please sign in again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.message || `API error: ${response.status}`);
  }

  return data;
}

/**
 * Auth API
 */
export const auth = {
  /**
   * Register a new user
   * @param {Object} params - { email, password, role: 'caretaker'|'elderly', display_name }
   * @returns {Promise<{token: string, user: Object, profile_code?: string}>}
   */
  async register({ email, password, role, display_name }) {
    const data = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, role, display_name }),
    });
    if (data.token) {
      setAuth(data.token, data.user);
    }
    return data;
  },

  /**
   * Login user
   * @param {Object} params - { email, password }
   * @returns {Promise<{token: string, user: Object, profile_code?: string}>}
   */
  async login({ email, password }) {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token) {
      setAuth(data.token, data.user);
    }
    return data;
  },

  /**
   * Logout current user
   */
  logout() {
    clearAuth();
    window.dispatchEvent(new CustomEvent('auth:logout'));
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return isAuthenticated();
  },

  /**
   * Get current auth state
   */
  getState() {
    return {
      token: getToken(),
      user: getUser(),
      isAuthenticated: isAuthenticated(),
    };
  },
};

/**
 * Profiles API
 */
export const profiles = {
  /**
   * Get current user's profile + linked elderly profiles
   * @returns {Promise<Object>}
   */
  async getMe() {
    return fetchApi('/profiles/me');
  },

  /**
   * Get profile by code (public lookup for join flow)
   * @param {string} profileCode - 6-character profile code
   * @returns {Promise<Object>}
   */
  async getByCode(profileCode) {
    return fetchApi(`/profiles/${profileCode}`);
  },
};

/**
 * Medications API
 */
export const medications = {
  /**
   * List medications for a profile
   * @param {string} profileId
   * @returns {Promise<Array>}
   */
  async list(profileId) {
    return fetchApi(`/medications?profile_id=${encodeURIComponent(profileId)}`);
  },

  /**
   * Create a new medication
   * @param {Object} data - { profile_id, name, dosage, frequency, times, instructions, photo_url? }
   * @returns {Promise<Object>}
   */
  async create(data) {
    return fetchApi('/medications', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update a medication
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    return fetchApi(`/medications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete a medication
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await fetchApi(`/medications/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Mark medication as taken
   * @param {string} id
   * @param {string} [takenAt] - ISO timestamp
   * @returns {Promise<Object>}
   */
  async take(id, takenAt) {
    return fetchApi(`/medications/${id}/take`, {
      method: 'POST',
      body: JSON.stringify({ taken_at: takenAt || new Date().toISOString() }),
    });
  },

  /**
   * Mark medication as skipped
   * @param {string} id
   * @param {string} [reason]
   * @returns {Promise<Object>}
   */
  async skip(id, reason) {
    return fetchApi(`/medications/${id}/skip`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

/**
 * Appointments API
 */
export const appointments = {
  /**
   * List appointments for a profile
   * @param {string} profileId
   * @returns {Promise<Array>}
   */
  async list(profileId) {
    return fetchApi(`/appointments?profile_id=${encodeURIComponent(profileId)}`);
  },

  /**
   * Create a new appointment
   * @param {Object} data - { profile_id, doctor_name, clinic, date, time, notes?, reminder_24h?, reminder_2h? }
   * @returns {Promise<Object>}
   */
  async create(data) {
    return fetchApi('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update an appointment
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    return fetchApi(`/appointments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete an appointment
   * @param {string} id
   * @returns {Promise<void>}
   */
  async delete(id) {
    await fetchApi(`/appointments/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Dashboard API
 */
export const dashboard = {
  /**
   * Get dashboard data for a profile
   * @param {string} profileId
   * @returns {Promise<{streak, adherence_pct, today, upcoming_appointments, alerts}>}
   */
  async get(profileId) {
    return fetchApi(`/dashboard?profile_id=${encodeURIComponent(profileId)}`);
  },
};

/**
 * AI API
 */
export const ai = {
  /**
   * Parse prescription from image
   * @param {File} file - Image file
   * @returns {Promise<{medication_name, dosage, frequency, times, instructions}>}
   */
  async parsePrescription(file) {
    const formData = new FormData();
    formData.append('file', file);
    return fetchApi('/ai/parse-prescription', {
      method: 'POST',
      body: formData,
    });
  },

  /**
   * Safety check for medication interactions
   * @param {string} profileId
   * @param {string} [medicationId]
   * @returns {Promise<{safe: boolean, interactions: Array}>}
   */
  async safetyCheck(profileId, medicationId) {
    return fetchApi('/ai/safety-check', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profileId, medication_id: medicationId }),
    });
  },

  /**
   * Voice check-in parsing
   * @param {string} profileId
   * @param {string} text - Transcribed voice text
   * @returns {Promise<{dose_marked_taken?, symptom_flagged?, summary, action}>}
   */
  async voiceCheckin(profileId, text) {
    return fetchApi('/ai/voice-checkin', {
      method: 'POST',
      body: JSON.stringify({ profile_id: profileId, text }),
    });
  },
};

/**
 * Voice API
 */
export const voice = {
  /**
   * Get speech audio stream
   * @param {string} text - Text to speak
   * @param {string} lang - Language code (en|kn|hi)
   * @returns {Promise<Blob>} - Audio blob (mpeg)
   */
  async speak(text, lang = 'en') {
    const token = getToken();
    const params = new URLSearchParams({ text, lang });
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}/voice/speak?${params}`, { headers });
    if (!response.ok) {
      throw new Error('Failed to generate speech');
    }
    return response.blob();
  },

  /**
   * Create an audio URL for playback
   * @param {string} text
   * @param {string} lang
   * @returns {Promise<string>} - Object URL for audio element
   */
  async createAudioUrl(text, lang = 'en') {
    const blob = await this.speak(text, lang);
    return URL.createObjectURL(blob);
  },
};

/**
 * Notifications API
 */
export const notifications = {
  /**
   * Send test email
   * @param {string} [to] - Optional recipient email
   * @returns {Promise<{sent: boolean, message_id: string}>}
   */
  async testEmail(to) {
    return fetchApi('/notifications/test-email', {
      method: 'POST',
      body: JSON.stringify({ to }),
    });
  },
};

// Export all APIs
export default {
  auth,
  profiles,
  medications,
  appointments,
  dashboard,
  ai,
  voice,
  notifications,
  // Helpers
  getToken,
  setAuth,
  clearAuth,
  getUser,
  isAuthenticated,
  API_BASE,
};