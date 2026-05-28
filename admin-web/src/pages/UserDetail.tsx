import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Lock, 
  Unlock,
  AlertCircle,
  Tag
} from 'lucide-react';
import api from '../services/api';

interface UserDetailData {
  id: number;
  fullName: string | null;
  nickname: string | null;
  email: string;
  phone: string | null;
  gender: string;
  dob: string | null;
  hometown: string | null;
  address_json: any;
  is_cccd_verified: boolean;
  verifiedAt: string | null;
  image: string | null;
  coverImage: string | null;
  statusId: number;
  createdAt: string;
  products?: {
    id: number;
    name: string;
    price: number;
    statusId: number;
    images?: string[];
  }[];
}

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUserDetail = async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/admin/users/${id}`);
      setUserData(response.data);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải chi tiết người dùng này. Có thể người dùng không tồn tại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetail();
  }, [id]);

  const handleToggleLock = async () => {
    if (!userData) return;
    const isLocked = Number(userData.statusId) === 3;
    const newStatusId = isLocked ? 1 : 3;
    const actionText = isLocked ? 'Mở khóa' : 'Khóa';

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText.toLowerCase()} tài khoản này?`)) {
      return;
    }

    try {
      await api.patch(`/reports/user/${userData.id}/status`, { statusId: newStatusId });
      setUserData(prev => prev ? { ...prev, statusId: newStatusId } : null);
      alert(`${actionText} tài khoản thành công`);
    } catch (err) {
      console.error(err);
      alert('Không thể thực hiện hành động. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-slate-400 text-sm">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate('/users')} className="flex items-center text-sm text-indigo-400 hover:text-indigo-300">
          <ArrowLeft size={16} className="mr-1" /> Quay lại danh sách
        </button>
        <div className="glass-card rounded-xl p-8 text-center text-slate-400 border border-slate-800">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">Đã xảy ra lỗi</h3>
          <p className="text-sm mt-1">{error || 'Không tìm thấy người dùng'}</p>
        </div>
      </div>
    );
  }

  // Address parsing
  let parsedAddress = 'Chưa thiết lập';
  if (userData.address_json) {
    if (typeof userData.address_json === 'string') {
      try {
        const addrObj = JSON.parse(userData.address_json);
        parsedAddress = addrObj.fullAddress || addrObj.address || userData.address_json;
      } catch {
        parsedAddress = userData.address_json;
      }
    } else if (typeof userData.address_json === 'object') {
      parsedAddress = (userData.address_json as any).fullAddress || (userData.address_json as any).address || JSON.stringify(userData.address_json);
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Navigation */}
      <div>
        <Link to="/users" className="inline-flex items-center text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
          <ArrowLeft size={16} className="mr-1.5" /> Quay lại danh sách người dùng
        </Link>
      </div>

      {/* Main Profile Header */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden relative">
        <div className="h-32 bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 border-b border-slate-800/60 relative">
          {/* Status Label */}
          <div className="absolute top-4 right-4">
            {Number(userData.statusId) === 3 ? (
              <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-bold">
                Tài khoản bị khóa
              </span>
            ) : (
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                Hoạt động bình thường
              </span>
            )}
          </div>
        </div>

        {/* User basic stats */}
        <div className="px-8 pb-8 pt-0 relative flex flex-col md:flex-row md:items-end md:justify-between gap-6 -mt-10">
          <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-6">
            <div className="w-24 h-24 rounded-2xl bg-slate-800 border-4 border-slate-950 shadow-xl overflow-hidden flex items-center justify-center text-slate-400 text-3xl font-bold">
              {userData.image ? (
                <img src={userData.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} />
              )}
            </div>
            <div className="text-center md:text-left space-y-1">
              <h3 className="text-2xl font-bold text-white">{userData.fullName || userData.nickname || 'Chưa đặt tên'}</h3>
              <p className="text-slate-400 text-sm">@{userData.nickname || 'nickname'}</p>
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2">
                {userData.is_cccd_verified ? (
                  <span className="inline-flex items-center text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded">
                    CCCD Xác minh
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded">
                    Chưa xác minh CCCD
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-center md:justify-end gap-3">
            <button
              onClick={handleToggleLock}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                Number(userData.statusId) === 3
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500 hover:text-white'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500 hover:text-white'
              }`}
            >
              {Number(userData.statusId) === 3 ? (
                <>
                  <Unlock size={16} />
                  <span>Mở khóa tài khoản</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Khóa tài khoản này</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Details Panel */}
        <div className="lg:col-span-1 glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <h4 className="text-base font-bold text-slate-100 pb-3 border-b border-slate-800/80">Thông tin chi tiết</h4>
          
          <div className="space-y-4 text-sm">
            <div className="flex items-start space-x-3 text-slate-300">
              <Mail size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <div className="overflow-hidden">
                <span className="text-xs text-slate-500 block">Email</span>
                <span className="break-all font-semibold">{userData.email}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-300">
              <Phone size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Số điện thoại</span>
                <span className="font-semibold">{userData.phone || 'Chưa thiết lập'}</span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-300">
              <Calendar size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Ngày sinh / Giới tính</span>
                <span className="font-semibold">
                  {userData.dob ? new Date(userData.dob).toLocaleDateString('vi-VN') : 'N/A'} (
                  {userData.gender === 'male' || userData.gender === 'Nam' ? 'Nam' : userData.gender === 'female' || userData.gender === 'Nữ' ? 'Nữ' : 'Khác'}
                  )
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3 text-slate-300">
              <MapPin size={16} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-xs text-slate-500 block">Quê quán / Nơi ở</span>
                <p className="font-semibold text-xs leading-relaxed">{userData.hometown || 'Chưa cập nhật'}</p>
                <p className="font-semibold text-xs text-indigo-400 mt-1 leading-relaxed">{parsedAddress}</p>
              </div>
            </div>
          </div>
        </div>

        {/* History Postings Panel */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <h4 className="text-base font-bold text-slate-100">Các bài đăng thanh lý</h4>
            <span className="bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {userData.products?.length || 0} bài đăng
            </span>
          </div>

          {!userData.products || userData.products.length === 0 ? (
            <div className="h-64 border border-dashed border-slate-800/80 rounded-xl flex items-center justify-center flex-col text-slate-500 space-y-2">
              <Tag size={32} />
              <span className="text-sm">Người dùng này chưa đăng sản phẩm nào</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userData.products.map((product) => {
                const img = product.images && product.images.length > 0 ? product.images[0] : '';
                return (
                  <div key={product.id} className="p-3 bg-slate-900 border border-slate-800/60 rounded-xl flex space-x-3 hover:border-slate-700 transition-colors">
                    <div className="w-16 h-16 rounded bg-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center text-slate-600 text-xs">
                      {img ? (
                        <img src={img} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>No Image</span>
                      )}
                    </div>
                    <div className="overflow-hidden flex flex-col justify-between py-0.5">
                      <div>
                        <h5 className="text-xs font-bold text-slate-200 line-clamp-1">{product.name}</h5>
                        <p className="text-xs text-indigo-400 font-bold mt-0.5">
                          {product.price === 0 ? 'Miễn phí' : `${product.price.toLocaleString('vi-VN')} đ`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          product.statusId === 2 
                            ? 'bg-emerald-500/15 text-emerald-400' 
                            : product.statusId === 1 
                            ? 'bg-amber-500/15 text-amber-400' 
                            : 'bg-rose-500/15 text-rose-400'
                        }`}>
                          {product.statusId === 2 ? 'Đã duyệt' : product.statusId === 1 ? 'Chờ duyệt' : 'Từ chối/Ẩn'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetail;
