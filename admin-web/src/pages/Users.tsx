import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Trash2, 
  Lock, 
  Unlock, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon
} from 'lucide-react';
import api from '../services/api';

interface User {
  id: number;
  fullName: string | null;
  nickname: string | null;
  email: string;
  phone: string | null;
  is_cccd_verified: boolean;
  statusId: number;
  createdAt: string;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, verified, unverified
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/users', {
        params: {
          page,
          limit,
          search,
          status: statusFilter
        }
      });
      // Backend response: { data: users, total, page, last_page }
      setUsers(response.data.data || []);
      setTotalItems(response.data.total || 0);
      setLastPage(response.data.last_page || 1);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleLock = async (userId: number, currentStatusId: number) => {
    const isLocked = Number(currentStatusId) === 3;
    const newStatusId = isLocked ? 1 : 3; // 1 = Active, 3 = Locked
    const actionText = isLocked ? 'Mở khóa' : 'Khóa';

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText.toLowerCase()} người dùng này?`)) {
      return;
    }

    try {
      // Calls PATCH /reports/user/:userId/status with body { statusId }
      await api.patch(`/reports/user/${userId}/status`, { statusId: newStatusId });
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, statusId: newStatusId } : u));
      alert(`${actionText} tài khoản thành công`);
    } catch (err: any) {
      console.error(err);
      alert(`Không thể ${actionText.toLowerCase()} tài khoản. Vui lòng thử lại.`);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('CẢNH BÁO: Bạn có chắc chắn muốn XÓA VĨNH VIỄN người dùng này và toàn bộ dữ liệu liên quan? Hành động này không thể hoàn tác!')) {
      return;
    }

    try {
      // Calls DELETE /admin/users/:id
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      setTotalItems(prev => prev - 1);
      alert('Đã xóa người dùng thành công');
    } catch (err: any) {
      console.error(err);
      alert('Không thể xóa người dùng. Vui lòng thử lại.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Quản lý người dùng</h2>
          <p className="text-slate-400 text-xs mt-1">Xem, tìm kiếm, khóa hoặc xóa vĩnh viễn tài khoản người dùng.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, email hoặc số điện thoại..."
            className="w-full pl-10 pr-20 py-2 bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
          >
            Tìm
          </button>
        </form>

        <div className="flex items-center space-x-3">
          <label className="text-xs font-medium text-slate-400 whitespace-nowrap">Bộ lọc CCCD:</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="all">Tất cả</option>
            <option value="verified">Đã xác minh</option>
            <option value="unverified">Chưa xác minh</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card rounded-xl border border-slate-800/80 overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center flex-col space-y-3">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
            <span className="text-slate-500 text-xs">Đang tải dữ liệu...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="h-64 flex items-center justify-center flex-col space-y-2 text-slate-500">
            <UsersIcon size={32} />
            <span className="text-sm">Không tìm thấy người dùng nào phù hợp</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Thành viên</th>
                  <th className="px-6 py-4">Liên hệ</th>
                  <th className="px-6 py-4">Xác minh CCCD</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{user.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200">
                        {user.fullName || user.nickname || 'Chưa cập nhật'}
                      </div>
                      <div className="text-xs text-slate-500">@{user.nickname || 'no_nickname'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{user.email}</div>
                      <div className="text-xs text-slate-500">{user.phone || 'Chưa cấu hình SĐT'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_cccd_verified ? (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          <CheckCircle size={12} className="mr-1" /> Đã duyệt
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full">
                          <XCircle size={12} className="mr-1" /> Chưa duyệt
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {Number(user.statusId) === 3 ? (
                        <span className="inline-flex items-center text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full">
                          Bị khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          Đang hoạt động
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/users/${user.id}`}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </Link>
                        <button
                          onClick={() => handleToggleLock(user.id, user.statusId)}
                          className={`p-1.5 hover:bg-slate-800 rounded transition-colors ${
                            Number(user.statusId) === 3
                              ? 'text-amber-500 hover:text-amber-400'
                              : 'text-slate-400 hover:text-rose-500'
                          }`}
                          title={Number(user.statusId) === 3 ? 'Mở khóa' : 'Khóa tài khoản'}
                        >
                          {Number(user.statusId) === 3 ? <Unlock size={16} /> : <Lock size={16} />}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {!loading && users.length > 0 && (
          <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Hiển thị từ <span className="font-semibold text-slate-200">{((page - 1) * limit) + 1}</span> đến{' '}
              <span className="font-semibold text-slate-200">
                {Math.min(page * limit, totalItems)}
              </span>{' '}
              trong tổng số <span className="font-semibold text-slate-200">{totalItems}</span> người dùng
            </div>
            <div className="flex items-center space-x-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                className="p-1.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="px-3 py-1.5 rounded bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-semibold">
                {page} / {lastPage}
              </span>
              <button
                disabled={page >= lastPage}
                onClick={() => setPage(prev => Math.min(prev + 1, lastPage))}
                className="p-1.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
