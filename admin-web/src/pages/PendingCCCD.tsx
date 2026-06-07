import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  X, 
  User, 
  Calendar, 
  AlertCircle,
  Eye,
  Info
} from 'lucide-react';
import api from '../services/api';
import { useAdminStore } from '../store/adminStore';

interface PendingUser {
  id: number;
  fullName: string | null;
  cccd_pending_data: {
    fullName?: string;
    citizenId?: string;
    gender?: string;
    dob?: string;
    hometown?: string;
    address?: any;
    imageUrl?: string;
  } | null;
}

const PendingCCCD: React.FC = () => {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/pending-cccd');
      setUsers(response.data || []);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách CCCD đang chờ duyệt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn PHÊ DUYỆT hồ sơ CCCD này?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/approve/${id}`);
      alert('Đã phê duyệt CCCD thành công!');
      setSelectedUser(null);
      setUsers(prev => prev.filter(u => u.id !== id));
      // Refresh admin stats to update pending cccd count
      useAdminStore.getState().fetchDashboardData(true);
    } catch (err: any) {
      console.error(err);
      alert('Phê duyệt thất bại. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn TỪ CHỐI hồ sơ CCCD này?')) return;
    setActionLoading(true);
    try {
      await api.patch(`/admin/reject/${id}`);
      alert('Đã từ chối hồ sơ CCCD thành công.');
      setSelectedUser(null);
      setUsers(prev => prev.filter(u => u.id !== id));
      // Refresh admin stats to update pending cccd count
      useAdminStore.getState().fetchDashboardData(true);
    } catch (err: any) {
      console.error(err);
      alert('Từ chối thất bại. Vui lòng thử lại.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-slate-400 text-sm">Đang tải hồ sơ chờ duyệt...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-white">Phê duyệt CCCD</h2>
        <p className="text-slate-400 text-xs mt-1">Xác minh danh tính sinh viên thông qua ảnh và thông tin thẻ CCCD.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {users.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 border border-slate-800/80 text-center text-slate-500 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center text-slate-400 border border-slate-800">
            <CreditCard size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-300">Không có hồ sơ nào</h3>
          <p className="text-xs max-w-xs mx-auto">Tất cả các tài khoản sinh viên đã được đối soát hoặc chưa gửi yêu cầu xác minh.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => {
            const data = user.cccd_pending_data || {};
            return (
              <div 
                key={user.id} 
                className="glass-card rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg"
              >
                <div className="p-5 space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                        USER ID #{user.id}
                      </span>
                      <h4 className="text-base font-bold text-slate-200 mt-2">
                        {data.fullName || user.fullName || 'Chưa đặt tên'}
                      </h4>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 flex-shrink-0">
                      <User size={18} />
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="space-y-2 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard size={14} className="text-slate-500" />
                      <span>Số CCCD: <strong className="text-slate-300 font-semibold">{data.citizenId || 'N/A'}</strong></span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-slate-500" />
                      <span>Ngày sinh: <strong className="text-slate-300 font-semibold">{data.dob ? new Date(data.dob).toLocaleDateString('vi-VN') : 'N/A'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/50 border-t border-slate-800/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-600 text-indigo-400 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>Xem đối soát</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Verification Dialog Overlay */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                  <Info size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Đối soát thông tin hồ sơ</h3>
                  <p className="text-xs text-slate-400">Đối chiếu thông tin người dùng gửi với thông tin thật</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Details */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-3">Thông tin chi tiết được gửi</h4>
                  
                  <div className="space-y-4 text-sm bg-slate-950/40 p-4 border border-slate-800/60 rounded-xl">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 text-xs">Họ và tên:</span>
                      <span className="col-span-2 text-slate-200 font-bold">{selectedUser.cccd_pending_data?.fullName || 'N/A'}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 text-xs">Số CCCD:</span>
                      <span className="col-span-2 text-slate-200 font-mono font-bold">{selectedUser.cccd_pending_data?.citizenId || 'N/A'}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 text-xs">Giới tính:</span>
                      <span className="col-span-2 text-slate-200 font-semibold">
                        {selectedUser.cccd_pending_data?.gender === 'male' || selectedUser.cccd_pending_data?.gender === 'Nam' ? 'Nam' : selectedUser.cccd_pending_data?.gender === 'female' || selectedUser.cccd_pending_data?.gender === 'Nữ' ? 'Nữ' : 'Khác'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 text-xs">Ngày sinh:</span>
                      <span className="col-span-2 text-slate-200 font-semibold">
                        {selectedUser.cccd_pending_data?.dob ? new Date(selectedUser.cccd_pending_data.dob).toLocaleDateString('vi-VN') : 'N/A'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 text-xs">Quê quán:</span>
                      <span className="col-span-2 text-slate-300 leading-relaxed text-xs">{selectedUser.cccd_pending_data?.hometown || 'N/A'}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-slate-500 text-xs">Địa chỉ:</span>
                      <span className="col-span-2 text-slate-300 leading-relaxed text-xs">
                        {selectedUser.cccd_pending_data?.address 
                          ? (typeof selectedUser.cccd_pending_data.address === 'object' 
                              ? (selectedUser.cccd_pending_data.address.fullAddress || JSON.stringify(selectedUser.cccd_pending_data.address)) 
                              : selectedUser.cccd_pending_data.address) 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-800/60">
                  <button
                    disabled={actionLoading}
                    onClick={() => handleReject(selectedUser.id)}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all text-sm font-bold border border-rose-500/20 hover:shadow-lg hover:shadow-rose-500/10 disabled:opacity-50 cursor-pointer"
                  >
                    <X size={16} />
                    <span>Từ chối hồ sơ</span>
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedUser.id)}
                    className="flex-1 inline-flex items-center justify-center space-x-1.5 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white transition-all text-sm font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-50 cursor-pointer"
                  >
                    <Check size={16} />
                    <span>Phê duyệt ngay</span>
                  </button>
                </div>
              </div>

              {/* Right Column: CCCD Image */}
              <div className="flex flex-col">
                <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider mb-3">Hình ảnh đính kèm</h4>
                <div className="flex-1 min-h-[250px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative group">
                  {selectedUser.cccd_pending_data?.imageUrl ? (
                    // We must serve from base VITE_API_URL if it is a relative path like /uploads/img.jpg
                    <img 
                      src={
                        selectedUser.cccd_pending_data.imageUrl.startsWith('http') 
                          ? selectedUser.cccd_pending_data.imageUrl 
                          : `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${selectedUser.cccd_pending_data.imageUrl}`
                      } 
                      alt="Ảnh thẻ CCCD" 
                      className="w-full h-full object-contain max-h-[450px]"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-500 space-y-2">
                      <CreditCard size={40} className="mx-auto" />
                      <p className="text-xs">Không có hình ảnh đính kèm</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingCCCD;
