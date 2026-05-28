import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Check, 
  X, 
  Eye, 
  AlertCircle,
  Clock
} from 'lucide-react';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  statusId: number; // 1 = Chờ duyệt, 2 = Đã duyệt, 3 = Từ chối/Bị ẩn
  createdAt: string;
  images?: string[];
  user?: {
    id: number;
    nickname: string;
    fullName: string;
  };
}

const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/products/admin/all');
      setProducts(response.data || []);
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách sản phẩm. Sử dụng chế độ mô phỏng.');
      // Mock data in case API fails
      setProducts([
        {
          id: 1,
          name: 'Laptop Dell Latitude 7490 i5/8G/256G',
          price: 4500000,
          description: 'Máy dùng mượt mà, phù hợp sinh viên học tập code web.',
          statusId: 1,
          createdAt: new Date().toISOString(),
          images: [],
          user: { id: 1, nickname: 'quan_dep_trai', fullName: 'Lê Minh Quân' }
        },
        {
          id: 2,
          name: 'Giáo trình Giải tích 1 & 2 TDC',
          price: 0,
          description: 'Sách giáo trình mới 95%, tặng lại cho bạn nào cần.',
          statusId: 2,
          createdAt: new Date().toISOString(),
          images: [],
          user: { id: 2, nickname: 'ha_kute', fullName: 'Nguyễn Thị Hà' }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleUpdateStatus = async (productId: number, newStatusId: number) => {
    const actionText = newStatusId === 2 ? 'Phê duyệt' : 'Từ chối/Ẩn';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText.toLowerCase()} sản phẩm này?`)) return;

    try {
      // Calls PATCH /products/admin/status/:id with body { product_status_id: newStatusId }
      await api.patch(`/products/admin/status/${productId}`, {
        product_status_id: newStatusId
      });
      alert(`Đã cập nhật trạng thái thành công!`);
      
      // Update local state
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, statusId: newStatusId } : p));
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(prev => prev ? { ...prev, statusId: newStatusId } : null);
      }
    } catch (err: any) {
      console.error(err);
      alert('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-slate-400 text-sm">Đang tải danh sách sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-white">Kiểm duyệt sản phẩm</h2>
        <p className="text-slate-400 text-xs mt-1">Duyệt hoặc gỡ bỏ các bài đăng thanh lý của sinh viên trên sàn.</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center space-x-2">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {products.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 border border-slate-800/80 text-center text-slate-500 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center text-slate-400 border border-slate-800">
            <ShoppingBag size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-300">Không có sản phẩm nào</h3>
          <p className="text-xs">Chưa có bài viết thanh lý sản phẩm nào được đăng.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const img = product.images && product.images.length > 0 ? product.images[0] : '';
            return (
              <div 
                key={product.id}
                className="glass-card rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden hover:border-slate-700 transition-all duration-300"
              >
                {/* Product Image Cover */}
                <div className="h-44 bg-slate-950 flex items-center justify-center border-b border-slate-800 overflow-hidden relative">
                  {img ? (
                    <img src={img} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <ShoppingBag size={32} className="text-slate-700" />
                  )}
                  {/* Status Overlay */}
                  <div className="absolute top-3 right-3">
                    {product.statusId === 2 ? (
                      <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                        Đang hiển thị
                      </span>
                    ) : product.statusId === 1 ? (
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center">
                        <Clock size={10} className="mr-1" /> Chờ duyệt
                      </span>
                    ) : (
                      <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                        Bị ẩn/Từ chối
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                      ID #{product.id}
                    </span>
                    <h4 className="text-sm font-bold text-slate-200 line-clamp-2 pt-1">{product.name}</h4>
                    <p className="text-xs text-indigo-400 font-bold">
                      {product.price === 0 ? 'Miễn phí / Trao đổi' : `${product.price.toLocaleString('vi-VN')} đ`}
                    </p>
                    <p className="text-xs text-slate-400 line-clamp-2 pt-2 leading-relaxed">{product.description}</p>
                  </div>

                  <div className="border-t border-slate-800/60 pt-3 text-[11px] text-slate-500 flex justify-between items-center">
                    <span>Đăng bởi: <strong className="text-slate-300 font-semibold">{product.user?.nickname || 'Ẩn danh'}</strong></span>
                    <span>{new Date(product.createdAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="px-5 py-4 bg-slate-900/50 border-t border-slate-800/40 flex gap-2">
                  <button
                    onClick={() => setSelectedProduct(product)}
                    className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Xem tin</span>
                  </button>
                  {product.statusId === 1 && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(product.id, 3)}
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all border border-rose-500/20 cursor-pointer"
                        title="Từ chối duyệt"
                      >
                        <X size={14} />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(product.id, 2)}
                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white transition-all border border-emerald-500/20 cursor-pointer"
                        title="Phê duyệt"
                      >
                        <Check size={14} />
                      </button>
                    </>
                  )}
                  {product.statusId === 2 && (
                    <button
                      onClick={() => handleUpdateStatus(product.id, 3)}
                      className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 transition-all text-xs font-semibold cursor-pointer"
                    >
                      Gỡ bài đăng
                    </button>
                  )}
                  {product.statusId === 3 && (
                    <button
                      onClick={() => handleUpdateStatus(product.id, 2)}
                      className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 transition-all text-xs font-semibold cursor-pointer"
                    >
                      Duyệt lại bài
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Chi tiết bài viết thanh lý</h3>
              <button 
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Image slideshow (simplified) */}
              <div className="h-64 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative">
                {selectedProduct.images && selectedProduct.images.length > 0 ? (
                  <img src={selectedProduct.images[0]} alt="Ảnh sản phẩm" className="w-full h-full object-contain" />
                ) : (
                  <ShoppingBag size={48} className="text-slate-800" />
                )}
              </div>

              {/* Title, price, description */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded">
                      ID #{selectedProduct.id}
                    </span>
                    <h4 className="text-lg font-bold text-white mt-1.5">{selectedProduct.name}</h4>
                  </div>
                  <span className="text-base font-extrabold text-indigo-400 whitespace-nowrap">
                    {selectedProduct.price === 0 ? 'Miễn phí' : `${selectedProduct.price.toLocaleString('vi-VN')} đ`}
                  </span>
                </div>

                <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mô tả sản phẩm</h5>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800/40">
                  <div>
                    <span className="text-slate-500 block">Đăng bởi</span>
                    <span className="text-slate-300 font-semibold">{selectedProduct.user?.fullName || selectedProduct.user?.nickname || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Thời gian đăng</span>
                    <span className="text-slate-300 font-semibold">{new Date(selectedProduct.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
              {selectedProduct.statusId === 1 && (
                <>
                  <button
                    onClick={() => { handleUpdateStatus(selectedProduct.id, 3); }}
                    className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={() => { handleUpdateStatus(selectedProduct.id, 2); }}
                    className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
                  >
                    Duyệt bài
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
