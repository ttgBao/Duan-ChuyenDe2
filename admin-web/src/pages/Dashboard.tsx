import React, { useEffect } from 'react';
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
import { useAdminStore } from '../store/adminStore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950/90 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md">
        <p className="font-bold">{payload[0].value} bài đăng</p>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const {
    stats,
    weeklyPostCounts,
    dealTypeCounts,
    topCategories,
    recentCccds,
    recentReports,
    statsLoading,
    statsError,
    fetchDashboardData
  } = useAdminStore();

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  if (statsLoading) {
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

      {statsError && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          {statsError} (Vẫn hiển thị thông tin tải được).
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

          <div className="h-56 px-2 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyPostCounts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="dayName" 
                  stroke="#64748b" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  style={{ fontSize: '11px', fontWeight: '500' }}
                />
                <YAxis 
                  stroke="#64748b" 
                  tickLine={false} 
                  axisLine={false} 
                  tickMargin={8}
                  allowDecimals={false}
                  style={{ fontSize: '11px', fontWeight: '500' }}
                />
                <ReTooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorPosts)" 
                />
              </AreaChart>
            </ResponsiveContainer>
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
                {/* Recharts Donut */}
                <div className="relative w-28 h-28 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={dealTypeCounts}
                        cx="50%"
                        cy="50%"
                        innerRadius={34}
                        outerRadius={48}
                        paddingAngle={3}
                        dataKey="count"
                      >
                        {dealTypeCounts.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ReTooltip 
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-950/90 text-white text-[10px] px-2 py-1 rounded-lg border border-slate-850 shadow-xl backdrop-blur-sm">
                                <p className="font-semibold">{payload[0].name}: {payload[0].value} bài</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                  {/* Inside hole */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Tổng số</span>
                    <span className="text-base font-extrabold text-white">{stats.productsCount}</span>
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
