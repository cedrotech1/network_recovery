import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/api';
import { useNotification } from '../contexts/NotificationContext';
import { roleLabel } from '../utils/roles';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.changePassword(form);
      if (res.success) {
        showSuccess('Password updated');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        await refreshUser();
      } else showError(res.message || 'Update failed');
    } catch (err) {
      showError(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="m-0 text-xl font-bold text-gray-900">Profile</h1>
        <p className="m-0 mt-1 text-sm text-gray-500">Account details and password</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-2 text-sm">
        <p className="m-0"><span className="text-gray-500">Name:</span> {user?.names}</p>
        <p className="m-0"><span className="text-gray-500">Email:</span> {user?.email}</p>
        <p className="m-0"><span className="text-gray-500">Role:</span> {roleLabel(user?.role)}</p>
      </div>

      <form onSubmit={submit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
        <h2 className="m-0 text-sm font-semibold text-gray-900">Change password</h2>
        {['currentPassword', 'newPassword', 'confirmPassword'].map((key) => (
          <div key={key}>
            <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </label>
            <input
              type="password"
              required
              value={form[key]}
              onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[#00628b] text-white px-4 py-2.5 text-sm font-semibold hover:bg-[#004f70] disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
