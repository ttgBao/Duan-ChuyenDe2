import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import api from '../services/api';
import logoItTdc from '../assets/logo_it_tdc.jpg';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if there was an error passed from ProtectedRoute redirect
  useEffect(() => {
    const stateError = (location.state as any)?.error;
    if (stateError) {
      setError(stateError);
    }
  }, [location]);

  // If already logged in, go to dashboard
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const userString = localStorage.getItem('admin_user');
    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        if (Number(user.roleId) === 1 || user.role === 'admin' || user.role === 'Admin') {
          navigate('/dashboard');
        }
      } catch (e) {
        localStorage.clear();
      }
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Vui lòng điền đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { token, role, nickname, id } = response.data;
      
      // Look at role/roleId
      // Standard AdminGuard check is on roleId === 1. But let's check what the API returns.
      // The auth service returns: role: user.role?.name, nickname, id, token, tokenType: 'Bearer'
      // We will fetch the user detail or assume it is admin if they can log in.
      // Wait, can a non-admin log in here? Yes, they can log in, but then their role name won't be admin / roleId !== 1.
      // Let's call /admin/users or verify the role in the login response first.
      
      // Let's store token temporarily, verify role, then redirect or throw error.
      localStorage.setItem('admin_token', token);
      
      // Let's fetch details of this user to see roleId or double check. Or check the role name returned.
      // If role name is not admin/Admin, we should block.
      // Let's look at role name: response.data.role
      const userRole = role || '';
      const isRoleAdmin = userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'administrator';
      
      // Let's store user info.
      const userData = {
        id,
        nickname,
        email,
        role: userRole,
        roleId: isRoleAdmin ? 1 : 2
      };
      
      localStorage.setItem('admin_user', JSON.stringify(userData));
      
      // Try to call an admin API to verify permissions
      try {
        await api.get('/admin/pending-cccd');
        // Success, indeed Admin!
        navigate('/dashboard');
      } catch (err: any) {
        // If it returns 403, this means the user is not an admin
        localStorage.clear();
        setError('Tài khoản của bạn không có quyền truy cập trang quản trị');
      }
      
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || 'Kết nối máy chủ thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden px-4">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-2xl p-8 transition-all duration-300 hover:shadow-indigo-500/5">
        {/* Brand logo header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-full overflow-hidden border border-slate-700/80 shadow-xl shadow-indigo-500/20 mb-4 bg-slate-950 hover:scale-105 transition-transform duration-300">
            <img src={logoItTdc} alt="TDC IT Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">TDC Market</h2>
          <p className="text-slate-400 text-sm">Hệ thống quản trị viên sàn đồ cũ</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start space-x-3 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Email đăng nhập
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 glass-input focus:outline-none"
                placeholder="admin@tdc.edu.vn"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 glass-input focus:outline-none"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang đăng nhập...</span>
              </>
            ) : (
              <span>Đăng nhập hệ thống</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-500">
          Dành riêng cho ban quản trị TDC Market. Bảo mật tuyệt đối.
        </div>
      </div>
    </div>
  );
};

export default Login;
