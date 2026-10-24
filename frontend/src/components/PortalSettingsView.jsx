import React, { useState, useEffect } from 'react';
import { authService, getCurrentUser } from '../services/authService';
import api from '../services/api';
import { useTheme } from '../utils/themeManager';

export default function PortalSettingsView({
  currentUser,
  profile,
  onOpenEditProfile,
  role = 'CREATOR',
}) {
  const user = currentUser || getCurrentUser();
  const { theme, setTheme } = useTheme();

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [passwordError, setPasswordError] = useState(null);

  // Notification Preferences state
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSuccess, setPrefsSuccess] = useState(null);
  const [prefsError, setPrefsError] = useState(null);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [oppAlertsEnabled, setOppAlertsEnabled] = useState(true);
  const [minBudget, setMinBudget] = useState(500);

  useEffect(() => {
    let isCancelled = false;
    const loadPreferences = async () => {
      try {
        setPrefsLoading(true);
        const data = await api.getAlertPreferences();
        if (!isCancelled && data) {
          setEmailAlerts(data.email_alerts_enabled ?? true);
          setInAppAlerts(data.in_app_alerts_enabled ?? true);
          setOppAlertsEnabled(data.is_enabled ?? true);
          if (typeof data.min_budget === 'number') {
            setMinBudget(data.min_budget);
          }
        }
      } catch (err) {
        console.error('Failed to load alert preferences:', err);
      } finally {
        if (!isCancelled) setPrefsLoading(false);
      }
    };
    loadPreferences();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Current password is required.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      await authService.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password. Please check your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSavePreferences = async (e) => {
    if (e) e.preventDefault();
    setPrefsError(null);
    setPrefsSuccess(null);
    try {
      setPrefsSaving(true);
      await api.updateAlertPreferences({
        email_alerts_enabled: emailAlerts,
        in_app_alerts_enabled: inAppAlerts,
        is_enabled: oppAlertsEnabled,
        min_budget: parseFloat(minBudget) || 0,
      });
      setPrefsSuccess('Notification preferences saved successfully.');
      setTimeout(() => setPrefsSuccess(null), 3500);
    } catch (err) {
      setPrefsError(err.message || 'Failed to update preferences.');
    } finally {
      setPrefsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="portal-header-row">
        <div>
          <span className="text-xs text-neutral-500 font-sans block mb-0.5">Account & Security</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-sans">
            Manage your credentials, notification channels, and account security.
          </p>
        </div>
      </div>

      {/* Profile Shortcut Card */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">👤</span>
            <h3 className="text-base font-bold text-neutral-900">
              {role === 'BRAND' ? 'Brand Company Profile' : 'Creator Profile & Portfolio'}
            </h3>
          </div>
          <p className="text-xs text-neutral-600 mt-1">
            Need to update your bio, social links, creative rates, or portfolio deliverables? Use the dedicated profile editor.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenEditProfile}
          className="portal-btn-secondary whitespace-nowrap flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-neutral-300 hover:border-neutral-400 bg-white text-neutral-800 transition-all shadow-xs"
        >
          <span>✏️</span>
          <span>Edit Profile</span>
        </button>
      </div>

      {/* Change Password Card */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🔒</span>
          <h3 className="text-base font-bold text-neutral-900">Change Password</h3>
        </div>
        <p className="text-xs text-neutral-500 mb-5">
          Ensure your account stays protected by using a secure, unique password.
        </p>

        {passwordSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span>✓</span>
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{passwordError}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Current Password *
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              New Password * (min 6 characters)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">
              Confirm New Password *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 text-xs text-neutral-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition-all"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="portal-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl text-white transition-all shadow-xs disabled:opacity-50"
              style={{ backgroundColor: '#7952EC' }}
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Interface Theme & Appearance Card */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🎨</span>
          <h3 className="text-base font-bold text-neutral-900">Interface Theme &amp; Appearance</h3>
        </div>
        <p className="text-xs text-neutral-500 mb-5">
          Select your preferred visual aesthetic. The theme applies instantly and is saved in your browser.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3.5 ${
              theme === 'light'
                ? 'border-purple-600 bg-purple-50/50 shadow-xs'
                : 'border-neutral-200 bg-[#FAF8F5] hover:border-neutral-300'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center shrink-0 text-amber-500 font-bold">
              ☀️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900">Light Mode (Default)</span>
                {theme === 'light' && (
                  <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Luxury editorial cream &amp; lavender palette with optimal daylight readability.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border-2 text-left transition-all flex items-start gap-3.5 ${
              theme === 'dark'
                ? 'border-purple-600 bg-purple-950/20 shadow-xs'
                : 'border-neutral-200 bg-[#FAF8F5] hover:border-neutral-300'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-700 flex items-center justify-center shrink-0 text-purple-400 font-bold">
              🌙
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900">Dark Obsidian Mode</span>
                {theme === 'dark' && (
                  <span className="text-[10px] bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 mt-1">
                Sleek dark obsidian backdrop with violet accents and reduced eye strain.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Notification Preferences Card */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🔔</span>
          <h3 className="text-base font-bold text-neutral-900">Notification Preferences</h3>
        </div>
        <p className="text-xs text-neutral-500 mb-5">
          Select which activity updates and opportunity alerts you want to receive.
        </p>

        {prefsSuccess && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <span>✓</span>
            <span>{prefsSuccess}</span>
          </div>
        )}

        {prefsError && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{prefsError}</span>
          </div>
        )}

        {prefsLoading ? (
          <div className="py-6 text-center text-xs text-neutral-400">Loading preferences...</div>
        ) : (
          <form onSubmit={handleSavePreferences} className="space-y-4 max-w-xl">
            {/* In-app toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
              <div>
                <span className="text-xs font-bold text-neutral-900 block">In-App Notification Bell</span>
                <span className="text-[11px] text-neutral-500">
                  Receive live alerts inside the portal for messages, pitches, and deliverables.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={inAppAlerts}
                  onChange={(e) => setInAppAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7952EC]"></div>
              </label>
            </div>

            {/* Email toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
              <div>
                <span className="text-xs font-bold text-neutral-900 block">Email Alerts</span>
                <span className="text-[11px] text-neutral-500">
                  Get notified at {user?.email || 'your email'} when contract statuses or discussions update.
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7952EC]"></div>
              </label>
            </div>

            {/* Creator Smart Opportunity Alerts */}
            {role === 'CREATOR' && (
              <>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">AI Opportunity Matching</span>
                    <span className="text-[11px] text-neutral-500">
                      Receive instant alerts when new brand briefs match your verified skills and tools.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={oppAlertsEnabled}
                      onChange={(e) => setOppAlertsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7952EC]"></div>
                  </label>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
                  <label className="block text-xs font-bold text-neutral-900 mb-1">
                    Minimum Campaign Budget Alert (INR ₹)
                  </label>
                  <p className="text-[11px] text-neutral-500 mb-2">
                    Only notify me of campaigns with budgets at or above this amount.
                  </p>
                  <input
                    type="number"
                    min="10000"
                    step="1000"
                    value={minBudget}
                    onChange={(e) => setMinBudget(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-40 px-3 py-1.5 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-800"
                  />
                </div>
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={prefsSaving}
                className="portal-btn-primary px-5 py-2.5 text-xs font-bold rounded-xl text-white transition-all shadow-xs disabled:opacity-50"
                style={{ backgroundColor: '#7952EC' }}
              >
                {prefsSaving ? 'Saving Preferences...' : 'Save Notification Preferences'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Account Info Card */}
      <div className="bg-white border border-[#EAE6DF] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">🛡️</span>
          <h3 className="text-base font-bold text-neutral-900">Account Information</h3>
        </div>
        <p className="text-xs text-neutral-500 mb-4">
          Core account identifiers and security credentials.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
            <span className="text-neutral-400 block mb-0.5 font-medium">Registered Email</span>
            <span className="font-bold text-neutral-800 truncate block">{user?.email || 'Authenticated User'}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
            <span className="text-neutral-400 block mb-0.5 font-medium">Portal Role</span>
            <span className="font-bold text-neutral-800 uppercase tracking-wide block">{role}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DF]">
            <span className="text-neutral-400 block mb-0.5 font-medium">Account ID</span>
            <span className="font-mono text-[11px] text-neutral-600 truncate block">{user?.id || 'Active'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
