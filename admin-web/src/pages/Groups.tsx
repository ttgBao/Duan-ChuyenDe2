import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Trash2, 
  Users, 
  ShoppingBag, 
  ShieldAlert,
  Globe, 
  Lock,
  Layers,
  Calendar,
  User
} from 'lucide-react';
import api from '../services/api';

interface GroupOwner {
  id: number;
  nickname: string;
  fullName: string | null;
  email: string;
}

interface Group {
  id: number;
  name: string;
  description: string | null;
  thumbnail_url: string | null;
  isPublic: boolean;
  mustApprovePosts: boolean;
  created_at: string;
  memberCount: number;
  productCount: number;
  owner: GroupOwner | null;
}

const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/groups');
      setGroups(response.data || []);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách nhóm cộng đồng');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleDeleteGroup = async (id: number) => {
    try {
      await api.delete(`/admin/groups/${id}`);
      setGroups(prev => prev.filter(g => g.id !== id));
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error(err);
      alert('Có lỗi xảy ra khi xóa nhóm. Vui lòng thử lại.');
    }
  };

  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (group.owner && group.owner.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium">Đang tải danh sách nhóm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="text-indigo-400 w-5 h-5" />
            Quản lý nhóm cộng đồng
          </h2>
          <p className="text-slate-400 text-sm">
            Quản lý các hội nhóm, câu lạc bộ trao đổi đồ cũ trong toàn trường.
          </p>
        </div>
        
        {/* Search Input */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhóm, mô tả, hoặc trưởng nhóm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all duration-200"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {filteredGroups.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/20 flex flex-col items-center justify-center space-y-3">
          <Layers className="text-slate-600 w-10 h-10" />
          <p className="text-slate-400 text-sm">Không tìm thấy nhóm cộng đồng nào phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div 
              key={group.id} 
              className="glass-card rounded-2xl border border-slate-800 hover:border-slate-700/80 transition-all duration-300 flex flex-col justify-between overflow-hidden group shadow-md hover:shadow-indigo-500/5"
            >
              {/* Group Banner / Cover */}
              <div className="relative h-28 bg-slate-850 overflow-hidden border-b border-slate-800/50">
                {group.thumbnail_url ? (
                  <img 
                    src={group.thumbnail_url} 
                    alt={group.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-900 to-indigo-950/40 flex items-center justify-center">
                    <Layers className="text-slate-700 w-8 h-8" />
                  </div>
                )}
                
                {/* Privacy Badge */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-sm">
                  {group.isPublic ? (
                    <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <Globe size={11} /> Công khai
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 border-amber-500/20 px-2 py-0.5 rounded-full">
                      <Lock size={11} /> Riêng tư
                    </span>
                  )}
                </div>
              </div>

              {/* Group Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-indigo-400 transition-colors">
                    {group.name}
                  </h3>
                  <p className="text-slate-400 text-xs line-clamp-2 min-h-[2rem]">
                    {group.description || 'Chưa có mô tả cho nhóm này.'}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 py-3 px-4 rounded-xl bg-slate-900/60 border border-slate-800/50 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <Users size={14} className="text-indigo-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Thành viên</p>
                      <p className="font-semibold text-slate-200">{group.memberCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <ShoppingBag size={14} className="text-indigo-400" />
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Tin đăng</p>
                      <p className="font-semibold text-slate-200">{group.productCount}</p>
                    </div>
                  </div>
                </div>

                {/* Owner info & creation date */}
                <div className="space-y-2 text-xs border-t border-slate-850 pt-3">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={12} className="text-slate-500" /> Trưởng nhóm:
                    </span>
                    <span className="font-semibold text-slate-200 truncate max-w-[120px]">
                      {group.owner ? (group.owner.fullName || group.owner.nickname) : 'Hệ thống'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} className="text-slate-500" /> Ngày tạo:
                    </span>
                    <span>
                      {new Date(group.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Group Footer / Action */}
              <div className="px-5 py-3.5 bg-slate-900/35 border-t border-slate-800/60 flex items-center justify-end">
                {deleteConfirmId === group.id ? (
                  <div className="flex items-center space-x-2 w-full">
                    <div className="flex items-center space-x-1 text-[10px] font-medium text-rose-400 mr-auto">
                      <ShieldAlert size={12} />
                      <span>Xóa nhóm & bài viết?</span>
                    </div>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all shadow-md shadow-rose-600/10"
                    >
                      Xác nhận
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(group.id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer border border-rose-500/10 hover:border-transparent"
                  >
                    <Trash2 size={13} />
                    <span>Xóa nhóm</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Groups;
