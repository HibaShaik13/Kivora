import { fetchApi } from './api';

const authListeners = new Set();

export function addAuthListener(callback) {
  authListeners.add(callback);
  return () => authListeners.delete(callback);
}

function notifyAuthListeners(user) {
  authListeners.forEach((cb) => {
    try {
      cb(user);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

export function decodeTokenPayload(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function getCurrentUser() {
  try {
    const token = localStorage.getItem('kivora_token');
    const userStr = localStorage.getItem('kivora_user');
    if (!token || !userStr) {
      if (token && !userStr) localStorage.removeItem('kivora_token');
      if (!token && userStr) localStorage.removeItem('kivora_user');
      return null;
    }

    const payload = decodeTokenPayload(token);
    // Invalidate expired token
    if (!payload || !payload.exp || payload.exp * 1000 <= Date.now()) {
      localStorage.removeItem('kivora_token');
      localStorage.removeItem('kivora_user');
      localStorage.removeItem('kivora_current_view');
      localStorage.removeItem('kivora_creator_tab');
      return null;
    }

    const user = JSON.parse(userStr);
    // Prevent cross-role session collision: token role must match stored user role
    if (payload.role && user.role && payload.role !== user.role) {
      localStorage.removeItem('kivora_token');
      localStorage.removeItem('kivora_user');
      localStorage.removeItem('kivora_current_view');
      localStorage.removeItem('kivora_creator_tab');
      return null;
    }

    return normalizeUserIdentity(user);
  } catch {
    return null;
  }
}

function normalizeUserIdentity(user) {
  if (!user) return user;
  const updated = { ...user };
  if (
    updated.email === 'elena.rostova@kivora.demo' ||
    updated.id === 'user-creator-1' ||
    updated.profile_id === 'creator-elena-rostova'
  ) {
    updated.display_name = 'Aanya Sharma';
    updated.full_name = 'Aanya Sharma';
  }
  return updated;
}

function setSession(token, user) {
  if (!token) return;
  localStorage.setItem('kivora_token', token);
  const normalizedUser = normalizeUserIdentity(user);
  if (normalizedUser) {
    localStorage.setItem('kivora_user', JSON.stringify(normalizedUser));
  }
  // Clear stale tab memory from previous session
  localStorage.removeItem('kivora_creator_tab');
  notifyAuthListeners(normalizedUser);
}

export const authService = {
  login: async (email, password) => {
    const data = await fetchApi('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.access_token) {
      const user = data.user || {
        id: data.user_id,
        email: data.email,
        role: data.role,
      };
      setSession(data.access_token, user);
    }
    return data;
  },

  register: async (payload) => {
    const data = await fetchApi('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (data.access_token) {
      const user = data.user || {
        id: data.user_id,
        email: data.email,
        role: data.role,
      };
      setSession(data.access_token, user);
    }
    return data;
  },

  verifyOtp: async (email, otpCode) => {
    const data = await fetchApi('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp_code: otpCode }),
    });
    if (data.access_token) {
      const user = data.user || {
        id: data.user_id,
        email: data.email,
        role: data.role,
      };
      setSession(data.access_token, user);
    }
    return data;
  },

  resendOtp: async (email) => {
    return fetchApi('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  forgotPassword: async (email) => {
    return fetchApi('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword: async (email, otpCode, newPassword) => {
    return fetchApi('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email,
        otp_code: otpCode,
        new_password: newPassword,
      }),
    });
  },

  getMe: async () => {
    const user = await fetchApi('/api/auth/me');
    if (user) {
      localStorage.setItem('kivora_user', JSON.stringify(user));
      notifyAuthListeners(user);
    }
    return user;
  },

  logout: () => {
    localStorage.removeItem('kivora_token');
    localStorage.removeItem('kivora_user');
    localStorage.removeItem('kivora_current_view');
    localStorage.removeItem('kivora_creator_tab');
    notifyAuthListeners(null);
  },

  getStoredUser: () => {
    return getCurrentUser();
  },

  getOAuthStatus: async () => {
    return fetchApi('/api/auth/oauth/status').catch(() => ({
      google: { configured: false },
      github: { configured: false },
    }));
  },

  getOAuthAuthorizeUrl: async (provider, role = 'CREATOR') => {
    return fetchApi(`/api/auth/oauth/${provider}/authorize?role=${role}`);
  },

  handleOAuthToken: async (token) => {
    if (!token) return null;
    localStorage.setItem('kivora_token', token);
    const user = await fetchApi('/api/auth/me');
    if (user) {
      setSession(token, user);
    }
    return user;
  },
  changePassword: async (currentPassword, newPassword) => {
    return fetchApi('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword,
      }),
    });
  },
};

export default authService;
