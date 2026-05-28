import React, { useState } from 'react';
import { User, Shield, Info, CheckCircle2 } from 'lucide-react';

const Settings: React.FC = () => {
  const userString = localStorage.getItem('admin_user');
  const user = userString ? JSON.parse(userString) : { nickname: 'Administrator', email: 'admin@market.com' };
  
  const [nickname, setNickname] = useState(user.nickname || '');
  const [email, setEmail] = useState(user.email || '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    const updatedUser = { ...user, nickname, email };
    localStorage.setItem('admin_user', JSON.stringify(updatedUser));
    setSuccessMsg('Cập nhật hồ sơ admin thành công!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    if (!password || !newPassword) {
      alert('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới');
      return;
    }
    setSuccessMsg('Đã mô phỏng đổi mật khẩu thành công!');
    setPassword('');
    setNewPassword('');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-white">Cài đặt hệ thống</h2>
        <p className="text-slate-400 text-xs mt-1">Quản lý hồ sơ Admin hiện tại và cấu hình hoạt động hệ thống.</p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center space-x-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar settings sections */}
        <div className="md:col-span-1 space-y-2">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center space-x-3 text-slate-300">
            <User size={18} className="text-indigo-400" />
            <span className="text-sm font-semibold">Tài khoản Admin</span>
          </div>
          <div className="p-4 bg-slate-900/40 border border-slate-800/40 rounded-xl flex items-center space-x-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
            <Shield size={18} />
            <span className="text-sm font-semibold">Bảo mật & Quyền</span>
          </div>
          <div className="p-4 bg-slate-900/40 border border-slate-800/40 rounded-xl flex items-center space-x-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
            <Info size={18} />
            <span className="text-sm font-semibold">Thông tin phiên bản</span>
          </div>
        </div>

        {/* Configurations Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <User size={16} className="text-indigo-400" />
              <span>Thông tin tài khoản</span>
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Nickname</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Email quản trị</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Shield size={16} className="text-indigo-400" />
              <span>Đổi mật khẩu</span>
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full glass-input"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-all border border-slate-800 cursor-pointer"
                >
                  Cập nhật mật khẩu
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
