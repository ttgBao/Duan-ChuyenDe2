import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  CreditCard, 
  ShoppingBag, 
  Flag, 
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock
} from 'lucide-react';
import api from '../services/api';

interface DashboardStats {
  usersCount: number;
  pendingCccdCount: number;
  productsCount: number;
  reportsCount: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    usersCount: 0,
    pendingCccdCount: 0,
    productsCount: 0,
    reportsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentCccds, setRecentCccds] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [usersRes, cccdRes, productsRes, reportsRes] = await Promise.allSettled([
          api.get('/admin/users?limit=1'),
          api.get('/admin/pending-cccd'),
          api.get('/products/admin/all'),
          api.get('/reports')
        ]);

        let usersCount = 0;
        let pendingCccdCount = 0;
        let productsCount = 0;
        let reportsCount = 0;

        if (usersRes.status === 'fulfilled') {
          // If response has metadata or total count
          // In standard NestJS backend admin service:
          // getAllUsers returns: { data: User[], meta: { totalItems, itemCount, itemsPerPage, totalPages, currentPage } }
          usersCount = usersRes.value.data?.meta?.totalItems || usersRes.value.data?.data?.length || 0;
        }

        if (cccdRes.status === 'fulfilled') {
          pendingCccdCount = cccdRes.value.data?.length || 0;
          setRecentCccds(cccdRes.value.data?.slice(0, 3) || []);
        }

        if (productsRes.status === 'fulfilled') {
          productsCount = productsRes.value.data?.length || 0;
        }

        if (reportsRes.status === 'fulfilled') {
          reportsCount = reportsRes.value.data?.length || 0;
          setRecentReports(reportsRes.value.data?.slice(0, 3) || []);
        }

        setStats({
          usersCount,
          pendingCccdCount,
          productsCount,
          reportsCount
        });

      } catch (err) {
        console.error('Lỗi khi tải thông tin Dashboard', err);
        setError('Không thể tải toàn bộ dữ liệu. Một số API phản hồi lỗi.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Người dùng',
      value: stats.usersCount,
      change: '+12% tuần này',
      icon: Users,
      color: 'from-blue-500/20 to-indigo-500/20',
      iconColor: 'text-blue-400',
      border: 'border-blue-500/20',
      link: '/users'
    },
    {
      title: 'CCCD Chờ duyệt',
      value: stats.pendingCccdCount,
      change: 'Yêu cầu mới',
      icon: CreditCard,
      color: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
      border: 'border-amber-500/20',
      link: '/pending-cccd'
    },
    {
      title: 'Sản phẩm',
      value: stats.productsCount,
      change: 'Tin đăng trên sàn',
      icon: ShoppingBag,
      color: 'from-emerald-500/20 to-teal-500/20',
      iconColor: 'text-emerald-400',
      border: 'border-emerald-500/20',
      link: '/products'
    },
    {
      title: 'Báo cáo vi phạm',
      value: stats.reportsCount,
      change: 'Cần xử lý gấp',
      icon: Flag,
      color: 'from-rose-500/20 to-red-500/20',
      iconColor: 'text-rose-400',
      border: 'border-rose-500/20',
      link: '/reports'
    }
  ];

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium">Đang tải số liệu thống kê...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 space-y-2 max-w-xl">
          <h2 className="text-2xl font-bold text-white">Xin chào, Admin! 👋</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Hôm nay hệ thống hoạt động ổn định. Hãy theo dõi các yêu cầu xác minh danh tính CCCD của sinh viên và kiểm duyệt các bài viết báo cáo vi phạm.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          {error} (Vẫn hiển thị thông tin tải được).
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className={`glass-card rounded-2xl p-6 border ${card.border} hover:scale-[1.02] transition-all duration-300 block group`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-400">{card.title}</p>
                  <p className="text-3xl font-extrabold text-white tracking-tight">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} ${card.iconColor} group-hover:rotate-6 transition-transform`}>
                  <Icon size={24} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800/40 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center text-indigo-400 font-medium">
                  <TrendingUp size={12} className="mr-1" />
                  {card.change}
                </span>
                <span className="group-hover:text-indigo-400 transition-colors flex items-center">
                  Chi tiết <ArrowRight size={12} className="ml-1 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Lower Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending CCCDs Panel */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Clock size={16} />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Yêu cầu CCCD chờ duyệt</h3>
            </div>
            <Link
              to="/pending-cccd"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center"
            >
              Xem tất cả <ArrowRight size={12} className="ml-1" />
            </Link>
          </div>

          {recentCccds.length === 0 ? (
            <div className="h-48 border border-dashed border-slate-800 rounded-xl flex items-center justify-center flex-col text-slate-500 space-y-2">
              <CreditCard size={28} />
              <p className="text-xs">Không có yêu cầu xác minh CCCD nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCccds.map((user: any) => (
                <div
                  key={user.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/40 flex items-center justify-between hover:bg-slate-900 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{user.fullName || user.nickname}</h4>
                    <p className="text-xs text-slate-400">{user.email}</p>
                  </div>
                  <Link
                    to={`/pending-cccd`}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-xs font-semibold"
                  >
                    Duyệt ngay
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reports Panel */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400">
                <AlertTriangle size={16} />
              </div>
              <h3 className="text-lg font-bold text-slate-100">Báo cáo vi phạm gần đây</h3>
            </div>
            <Link
              to="/reports"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center"
            >
              Xem tất cả <ArrowRight size={12} className="ml-1" />
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="h-48 border border-dashed border-slate-800 rounded-xl flex items-center justify-center flex-col text-slate-500 space-y-2">
              <Flag size={28} />
              <p className="text-xs">Chưa có báo cáo vi phạm nào gần đây</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report: any) => (
                <div
                  key={report.id}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/40 flex items-center justify-between hover:bg-slate-900 transition-colors"
                >
                  <div className="max-w-[70%]">
                    <span className="inline-block text-[10px] uppercase font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded mb-1">
                      Mã báo cáo #{report.id}
                    </span>
                    <p className="text-xs text-slate-300 line-clamp-1">{report.reason || 'Không rõ lý do'}</p>
                  </div>
                  <Link
                    to="/reports"
                    className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all text-xs font-semibold"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
