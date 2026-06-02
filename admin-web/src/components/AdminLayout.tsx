import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ShoppingBag,
  Flag,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Boxes,
  Layers
} from 'lucide-react';
import logoItTdc from '../assets/logo_it_tdc.jpg';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  const userString = localStorage.getItem('admin_user');
  const user = userString ? JSON.parse(userString) : { nickname: 'Administrator', email: 'admin@market.com' };

  const menuItems = [
    { name: 'Bảng điều khiển', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Người dùng', path: '/users', icon: Users },
    { name: 'CCCD đang chờ', path: '/pending-cccd', icon: CreditCard },
    { name: 'Sản phẩm', path: '/products', icon: ShoppingBag },
    { name: 'Nhóm cộng đồng', path: '/groups', icon: Boxes },
    { name: 'Danh mục sản phẩm', path: '/categories', icon: Layers },
    { name: 'Báo cáo vi phạm', path: '/reports', icon: Flag },
    { name: 'Cài đặt', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/login');
  };

  // Find active title
  const activeItem = menuItems.find(item => {
    if (item.path === '/dashboard' && location.pathname === '/dashboard') return true;
    if (item.path !== '/dashboard' && location.pathname.startsWith(item.path)) return true;
    return false;
  });
  const pageTitle = activeItem ? activeItem.name : 'Chi tiết';

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo / Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/60">
            <Link to="/dashboard" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700/80 shadow-md shadow-indigo-500/10 flex items-center justify-center bg-slate-950 group-hover:scale-105 transition-transform duration-200">
                <img src={logoItTdc} alt="TDC IT Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-base bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent group-hover:text-white transition-colors">
                TDC Market Admin
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = 
                (item.path === '/dashboard' && location.pathname === '/dashboard') ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/10'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-100'
                  }`}
                >
                  <Icon
                    size={20}
                    className={`transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'
                    }`}
                  />
                  <span className="font-medium text-sm">{item.name}</span>
                  {item.path === '/pending-cccd' && (
                    <span className="ml-auto bg-rose-500/20 text-rose-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      !
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info / Logout */}
        <div className="p-4 border-t border-slate-800/60 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User size={18} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-200 truncate">{user.nickname}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors font-medium text-sm group"
          >
            <LogOut size={18} className="transition-transform group-hover:translate-x-1" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold text-slate-100">{pageTitle}</h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <span className="w-2 h-2 rounded-full bg-indigo-400 pulse-dot"></span>
              <span>Chế độ Admin</span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="p-6 md:p-8 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
