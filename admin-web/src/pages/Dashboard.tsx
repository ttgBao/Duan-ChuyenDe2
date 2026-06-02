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
  Clock,
  Layers,
  BarChart3,
  PieChart
} from 'lucide-react';
import api from '../services/api';

interface DashboardStats {
  usersCount: number;
  pendingCccdCount: number;
  productsCount: number;
  reportsCount: number;
  groupsCount: number;
}

interface Product {
  id: number;
  name: string;
  created_at?: string;
  createdAt?: string;
  dealType?: { id: number; name: string } | null;
  category?: { id: number; name: string } | null;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    usersCount: 0,
    pendingCccdCount: 0,
    productsCount: 0,
    reportsCount: 0,
    groupsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentCccds, setRecentCccds] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  // Statistics parsed from products
  const [weeklyPostCounts, setWeeklyPostCounts] = useState<{ dayName: string; count: number }[]>([]);
  const [dealTypeCounts, setDealTypeCounts] = useState<{ name: string; percentage: number; color: string; count: number }[]>([]);
  const [topCategories, setTopCategories] = useState<{ name: string; percentage: number; count: number }[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const [usersRes, cccdRes, productsRes, reportsRes, groupsRes] = await Promise.allSettled([
          api.get('/admin/users?limit=1'),
          api.get('/admin/pending-cccd'),
          api.get('/products/admin/all'),
          api.get('/reports'),
          api.get('/admin/groups')
        ]);

        let usersCount = 0;
        let pendingCccdCount = 0;
        let productsCount = 0;
        let reportsCount = 0;
        let groupsCount = 0;
        let fetchedProducts: Product[] = [];

        if (usersRes.status === 'fulfilled') {
          usersCount = usersRes.value.data?.meta?.totalItems || usersRes.value.data?.total || usersRes.value.data?.data?.length || 0;
        }

        if (cccdRes.status === 'fulfilled') {
          pendingCccdCount = cccdRes.value.data?.length || 0;
          setRecentCccds(cccdRes.value.data?.slice(0, 3) || []);
        }

        if (productsRes.status === 'fulfilled') {
          fetchedProducts = productsRes.value.data || [];
          productsCount = fetchedProducts.length;
        }

        if (reportsRes.status === 'fulfilled') {
          reportsCount = reportsRes.value.data?.length || 0;
          setRecentReports(reportsRes.value.data?.slice(0, 3) || []);
        }

        if (groupsRes.status === 'fulfilled') {
          groupsCount = groupsRes.value.data?.length || 0;
        }

        setStats({
          usersCount,
          pendingCccdCount,
          productsCount,
          reportsCount,
          groupsCount
        });

        // Compute metrics from products
        if (fetchedProducts.length > 0) {
          calculateCharts(fetchedProducts);
        }

      } catch (err) {
        console.error('Lỗi khi tải thông tin Dashboard', err);
        setError('Không thể tải toàn bộ dữ liệu. Một số API phản hồi lỗi.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateCharts = (productList: Product[]) => {
    // 1. Weekly Posts Chart (Last 7 Days)
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return {
        dateString: d.toDateString(),
        dayLabel: dayNames[d.getDay()],
        count: 0
      };
    }).reverse();

    productList.forEach(p => {
      const createdDate = new Date(p.created_at || p.createdAt || '');
      const matchedDay = last7Days.find(day => day.dateString === createdDate.toDateString());
      if (matchedDay) {
        matchedDay.count += 1;
      }
    });

    setWeeklyPostCounts(last7Days.map(d => ({ dayName: d.dayLabel, count: d.count })));

    // 2. Deal Type Counts (Pie / Donut Chart)
    const dealMap: { [key: string]: number } = {};
    productList.forEach(p => {
      const name = p.dealType?.name || 'Khác';
      dealMap[name] = (dealMap[name] || 0) + 1;
    });

    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899']; // Indigo, Emerald, Amber, Pink
    const total = productList.length;
    const dealList = Object.keys(dealMap).map((name, idx) => ({
      name,
      count: dealMap[name],
      percentage: total > 0 ? Math.round((dealMap[name] / total) * 100) : 0,
      color: colors[idx % colors.length]
    })).sort((a, b) => b.count - a.count);

    setDealTypeCounts(dealList);

    // 3. Hot Categories
    const catMap: { [key: string]: number } = {};
    productList.forEach(p => {
      const name = p.category?.name || 'Khác';
      catMap[name] = (catMap[name] || 0) + 1;
    });

    const catList = Object.keys(catMap).map(name => ({
      name,
      count: catMap[name],
      percentage: total > 0 ? Math.round((catMap[name] / total) * 100) : 0
    })).sort((a, b) => b.count - a.count).slice(0, 5); // top 5

    setTopCategories(catList);
  };

  const statCards = [
    {
      title: 'Người dùng',
      value: stats.usersCount,
      change: 'Tài khoản hoạt động',
      icon: Users,
      color: 'from-indigo-500/10 to-indigo-600/10 text-indigo-400 border-indigo-500/20',
      link: '/users'
    },
    {
      title: 'Nhóm cộng đồng',
      value: stats.groupsCount,
      change: 'Hội nhóm sinh viên',
      icon: Layers,
      color: 'from-violet-500/10 to-violet-600/10 text-violet-400 border-violet-500/20',
      link: '/groups'
    },
    {
      title: 'Tin sản phẩm',
      value: stats.productsCount,
      change: 'Đang đăng trên sàn',
      icon: ShoppingBag,
      color: 'from-emerald-500/10 to-emerald-600/10 text-emerald-400 border-emerald-500/20',
      link: '/products'
    },
    {
      title: 'Báo cáo vi phạm',
      value: stats.reportsCount,
      change: 'Cần giải quyết gấp',
      icon: Flag,
      color: 'from-rose-500/10 to-rose-600/10 text-rose-400 border-rose-500/20',
      link: '/reports'
    }
  ];

  // SVG Chart Computations
  const maxWeeklyCount = Math.max(...weeklyPostCounts.map(w => w.count), 5); // avoid divide by zero, min height reference
  
  // Donut chart stroke calculations
  let accumulatedPercentage = 0;

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
            Hôm nay hệ thống hoạt động ổn định. Có <span className="text-indigo-400 font-bold">{stats.pendingCccdCount} CCCD</span> cần duyệt xác minh danh tính và <span className="text-rose-455 font-bold">{stats.reportsCount} báo cáo vi phạm</span> chờ xử lý.
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
              className={`glass-card rounded-2xl p-6 border bg-slate-900/60 border-slate-850 hover:border-slate-800 hover:scale-[1.01] transition-all duration-200 block group`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <p className="text-3xl font-extrabold text-white tracking-tight">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.color} group-hover:rotate-3 transition-transform duration-300`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center text-indigo-400 font-medium">
                  <TrendingUp size={12} className="mr-1" />
                  {card.change}
                </span>
                <span className="group-hover:text-indigo-400 transition-colors flex items-center">
                  Quản lý <ArrowRight size={12} className="ml-1 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Interactive Charts Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weekly New Posts Chart (7 columns) */}
        <div className="lg:col-span-7 glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/40 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 size={16} className="text-indigo-400" />
              Lượng tin đăng mới trong tuần
            </h3>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">
              7 Ngày qua
            </span>
          </div>

          <div className="h-56 flex items-end justify-between px-2 pt-6">
            {weeklyPostCounts.map((data, idx) => {
              // Calculate height percentage
              const barHeightPercent = Math.max((data.count / maxWeeklyCount) * 100, 4); // minimum height so bar is visible
              return (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  <div className="relative w-full flex justify-center h-44 items-end">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none bg-slate-950 text-white text-[10px] font-bold px-2 py-1 rounded border border-slate-800 shadow-xl whitespace-nowrap z-10">
                      {data.count} bài đăng
                    </div>
                    {/* Bar */}
                    <div 
                      style={{ height: `${barHeightPercent}%` }}
                      className="w-8 sm:w-10 bg-gradient-to-t from-indigo-600 to-indigo-455 rounded-t-lg group-hover:from-indigo-500 group-hover:to-violet-500 transition-all duration-500 shadow-md shadow-indigo-600/10"
                    ></div>
                  </div>
                  <span className="mt-2.5 text-xs text-slate-500 font-semibold group-hover:text-slate-300 transition-colors">
                    {data.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Types Donut & Hot Categories (5 columns) */}
        <div className="lg:col-span-5 glass-card p-6 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-350 uppercase tracking-wider flex items-center gap-2">
              <PieChart size={16} className="text-indigo-400" />
              Hình thức giao dịch
            </h3>

            {dealTypeCounts.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-xs text-slate-500">
                Không đủ dữ liệu thống kê
              </div>
            ) : (
              <div className="flex items-center gap-6">
                {/* SVG Donut */}
                <div className="relative w-28 h-28 flex-shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    {/* Background track */}
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#1e293b" strokeWidth="3" />
                    
                    {/* Segments */}
                    {dealTypeCounts.map((deal, index) => {
                      const strokeDasharray = `${deal.percentage} ${100 - deal.percentage}`;
                      const strokeDashoffset = 100 - accumulatedPercentage;
                      accumulatedPercentage += deal.percentage;

                      return (
                        <circle
                          key={index}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={deal.color}
                          strokeWidth="3.2"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-500"
                        />
                      );
                    })}
                  </svg>
                  {/* Inside hole */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tổng số</span>
                    <span className="text-lg font-extrabold text-white">{stats.productsCount}</span>
                  </div>
                </div>

                {/* Donut Legend */}
                <div className="flex-1 space-y-2.5">
                  {dealTypeCounts.map((deal, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: deal.color }}></span>
                        <span className="text-slate-400 font-medium">{deal.name}</span>
                      </div>
                      <span className="text-slate-200 font-bold">{deal.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Hot categories list */}
          <div className="border-t border-slate-850 pt-4 space-y-3">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Danh mục hàng đầu</p>
            <div className="space-y-2.5">
              {topCategories.length === 0 ? (
                <p className="text-xs text-slate-600">Không có dữ liệu</p>
              ) : (
                topCategories.map((cat, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-semibold">{cat.name}</span>
                      <span className="text-slate-450 font-bold">{cat.count} tin</span>
                    </div>
                    {/* Custom progress bar */}
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${cat.percentage}%` }}
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lower Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending CCCDs Panel */}
        <div className="glass-card rounded-2xl p-6 border border-slate-850 bg-slate-900/30">
          <div className="flex items-center justify-between mb-6 border-b border-slate-850/60 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
                <Clock size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-250 uppercase tracking-wider">CCCD chờ duyệt</h3>
            </div>
            <Link
              to="/pending-cccd"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center"
            >
              Tất cả <ArrowRight size={12} className="ml-1" />
            </Link>
          </div>

          {recentCccds.length === 0 ? (
            <div className="h-44 border border-dashed border-slate-850 rounded-xl flex items-center justify-center flex-col text-slate-500 space-y-2">
              <CreditCard size={28} />
              <p className="text-xs">Không có yêu cầu xác minh CCCD nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCccds.map((user: any) => (
                <div
                  key={user.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850/60 flex items-center justify-between hover:bg-slate-900/30 transition-colors"
                >
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-200 truncate">{user.fullName || user.nickname}</h4>
                    <p className="text-xs text-slate-500 truncate">{user.email || 'Học sinh/Sinh viên'}</p>
                  </div>
                  <Link
                    to={`/pending-cccd`}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-xs font-semibold border border-indigo-500/15 hover:border-transparent"
                  >
                    Xác minh
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Reports Panel */}
        <div className="glass-card rounded-2xl p-6 border border-slate-850 bg-slate-900/30">
          <div className="flex items-center justify-between mb-6 border-b border-slate-850/60 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-455 border border-rose-500/20">
                <AlertTriangle size={16} />
              </div>
              <h3 className="text-sm font-bold text-slate-250 uppercase tracking-wider">Báo cáo vi phạm gần đây</h3>
            </div>
            <Link
              to="/reports"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center"
            >
              Tất cả <ArrowRight size={12} className="ml-1" />
            </Link>
          </div>

          {recentReports.length === 0 ? (
            <div className="h-44 border border-dashed border-slate-850 rounded-xl flex items-center justify-center flex-col text-slate-500 space-y-2">
              <Flag size={28} />
              <p className="text-xs">Chưa có báo cáo vi phạm nào gần đây</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentReports.map((report: any) => (
                <div
                  key={report.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850/60 flex items-center justify-between hover:bg-slate-900/30 transition-colors"
                >
                  <div className="max-w-[70%]">
                    <span className="inline-block text-[9px] uppercase font-bold text-rose-455 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/10 mb-1.5">
                      Báo cáo #{report.id}
                    </span>
                    <p className="text-xs text-slate-300 line-clamp-1">{report.reason || 'Không rõ lý do'}</p>
                  </div>
                  <Link
                    to="/reports"
                    className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 text-rose-455 hover:bg-rose-500 hover:text-white transition-all text-xs font-semibold border border-rose-500/15 hover:border-transparent"
                  >
                    Xem báo cáo
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
