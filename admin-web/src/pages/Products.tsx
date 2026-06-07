import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Check, 
  X, 
  Eye, 
  AlertCircle,
  Clock,
  Layers,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import type { Product } from '../store/adminStore';

const Products: React.FC = () => {
  const {
    products,
    productsLoading,
    productsError,
    fetchProducts,
    updateProductStatus
  } = useAdminStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Tabs: 0 = Public (Toàn trường), 1 = Group (Trong nhóm)
  const [activeTab, setActiveTab] = useState<number>(0);
  // Status filter: 'all', '1' (Chờ duyệt), '2' (Đã duyệt), '3' (Bị ẩn/Từ chối)
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, statusFilter, searchQuery]);

  const handleUpdateStatus = async (productId: number, newStatusId: number) => {
    const actionText = newStatusId === 2 ? 'Phê duyệt' : 'Từ chối/Ẩn';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText.toLowerCase()} sản phẩm này?`)) return;

    try {
      await updateProductStatus(productId, newStatusId);
      
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(prev => prev ? { ...prev, status_id: newStatusId, statusId: newStatusId } : null);
      }
    } catch (err: any) {
      console.error(err);
      alert('Không thể cập nhật trạng thái. Vui lòng thử lại.');
    }
  };

  // Get image URL safely
  const getProductImage = (product: Product): string => {
    if (product.thumbnail_url) return product.thumbnail_url;
    if (product.images && product.images.length > 0) {
      const first = product.images[0];
      if (typeof first === 'string') return first;
      if (first && typeof first === 'object' && first.image_url) return first.image_url;
    }
    return '';
  };

  // Filter products based on active tab, status filter, and search query
  const filteredProducts = products.filter(product => {
    // 1. Filter by visibility_type (0 = Public, 1 = Group)
    const visibility = product.visibility_type ?? 0;
    if (visibility !== activeTab) return false;

    // 2. Filter by status
    const statusVal = product.status_id ?? product.statusId ?? 1;
    if (statusFilter !== 'all' && statusVal.toString() !== statusFilter) return false;

    // 3. Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const nameMatch = product.name.toLowerCase().includes(query);
      const descMatch = product.description.toLowerCase().includes(query);
      const authorMatch = product.user?.nickname?.toLowerCase().includes(query) || false;
      const groupMatch = product.group?.name?.toLowerCase().includes(query) || false;
      return nameMatch || descMatch || authorMatch || groupMatch;
    }

    return true;
  });

  // Paginated products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (productsLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium">Đang tải danh sách sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="text-indigo-400 w-5 h-5" />
            Kiểm duyệt tin đăng sản phẩm
          </h2>
          <p className="text-slate-400 text-sm">
            Phê duyệt hoặc gỡ bỏ tin thanh lý của sinh viên trên toàn trường hoặc trong nhóm.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-450" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, người bán..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
      </div>

      {productsError && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center space-x-2">
          <AlertCircle size={14} />
          <span>{productsError}</span>
        </div>
      )}

      {/* Main Tabs and Status Filters row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        {/* Visibility Tabs */}
        <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-800/60 max-w-fit">
          <button
            onClick={() => setActiveTab(0)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 0 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tin Toàn Trường
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 1 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tin Trong Nhóm
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-2">
          {['all', '1', '2', '3'].map((status) => {
            const label = status === 'all' ? 'Tất cả' : status === '1' ? 'Chờ duyệt' : status === '2' ? 'Đã duyệt' : 'Bị ẩn/Từ chối';
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-250'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid List */}
      {filteredProducts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 border border-slate-800/80 text-center text-slate-500 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center text-slate-400 border border-slate-800">
            <ShoppingBag size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-350">Không có sản phẩm nào</h3>
          <p className="text-xs">Chưa có bài đăng nào khớp với bộ lọc hiện tại.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedProducts.map((product) => {
              const img = getProductImage(product);
              const statusVal = product.status_id ?? product.statusId ?? 1;
              const creationDate = product.created_at ?? product.createdAt;

              return (
                <div 
                  key={product.id}
                  className="glass-card rounded-2xl border border-slate-800 flex flex-col justify-between overflow-hidden hover:border-slate-750 transition-all duration-300 group shadow-md hover:shadow-indigo-500/5"
                >
                  {/* Image Cover */}
                  <div className="h-44 bg-slate-950 flex items-center justify-center border-b border-slate-800 overflow-hidden relative">
                    {img ? (
                      <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                    ) : (
                      <ShoppingBag size={32} className="text-slate-750" />
                    )}

                    {/* Status Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                      {statusVal === 2 ? (
                        <span className="bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Đang hiển thị
                        </span>
                      ) : statusVal === 1 ? (
                        <span className="bg-amber-500/10 text-amber-450 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center">
                          <Clock size={10} className="mr-1" /> Chờ duyệt
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 text-rose-455 border border-rose-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Bị ẩn/Từ chối
                        </span>
                      )}

                      {/* Group Badge */}
                      {product.group && (
                        <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                          <Layers size={10} /> {product.group.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">
                          ID #{product.id}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-200 line-clamp-2 pt-1 group-hover:text-indigo-400 transition-colors">
                        {product.name}
                      </h4>
                      <p className="text-xs text-indigo-455 font-bold">
                        {product.price === 0 ? 'Miễn phí / Trao đổi' : `${product.price.toLocaleString('vi-VN')} đ`}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2 pt-1 leading-relaxed">{product.description}</p>
                    </div>

                    <div className="border-t border-slate-800/60 pt-3 text-[11px] text-slate-500 flex justify-between items-center">
                      <span>Đăng bởi: <strong className="text-slate-350 font-semibold">{product.user?.fullName || product.user?.nickname || 'Ẩn danh'}</strong></span>
                      <span>{creationDate ? new Date(creationDate).toLocaleDateString('vi-VN') : ''}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-3.5 bg-slate-900/40 border-t border-slate-800/60 flex gap-2">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="flex-1 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs font-semibold flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>Xem chi tiết</span>
                    </button>

                    {statusVal === 1 && (
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
                          className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-450 hover:text-white transition-all border border-emerald-500/20 cursor-pointer"
                          title="Phê duyệt"
                        >
                          <Check size={14} />
                        </button>
                      </>
                    )}
                    {statusVal === 2 && (
                      <button
                        onClick={() => handleUpdateStatus(product.id, 3)}
                        className="px-3 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-455 hover:text-white border border-rose-500/20 transition-all text-xs font-semibold cursor-pointer"
                      >
                        Gỡ bài đăng
                      </button>
                    )}
                    {statusVal === 3 && (
                      <button
                        onClick={() => handleUpdateStatus(product.id, 2)}
                        className="px-3 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-455 hover:text-white border border-emerald-500/20 transition-all text-xs font-semibold cursor-pointer"
                      >
                        Duyệt lại bài
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Client-side Pagination Bar */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-400">
              <div>
                Hiển thị từ <span className="font-semibold text-slate-200">{((currentPage - 1) * itemsPerPage) + 1}</span> đến{' '}
                <span className="font-semibold text-slate-200">
                  {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                </span>{' '}
                trong tổng số <span className="font-semibold text-slate-200">{filteredProducts.length}</span> sản phẩm
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-1.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-3 py-1.5 rounded bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 font-semibold">
                  {currentPage} / {totalPages}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-1.5 rounded bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
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
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-850 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Image slideshow */}
              <div className="h-64 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative">
                {getProductImage(selectedProduct) ? (
                  <img src={getProductImage(selectedProduct)} alt="Ảnh sản phẩm" className="w-full h-full object-contain" />
                ) : (
                  <ShoppingBag size={48} className="text-slate-800" />
                )}
              </div>

              {/* Info */}
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

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800/40">
                  <div>
                    <span className="text-slate-500 block">Đăng bởi</span>
                    <span className="text-slate-300 font-semibold">{selectedProduct.user?.fullName || selectedProduct.user?.nickname || 'Ẩn danh'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Thời gian đăng</span>
                    <span className="text-slate-300 font-semibold">{new Date(selectedProduct.created_at ?? selectedProduct.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Nơi hiển thị</span>
                    <span className="text-slate-300 font-semibold flex items-center gap-1">
                      {selectedProduct.visibility_type === 1 ? (
                        <>
                          <Layers size={11} className="text-indigo-400" />
                          <span>Trong nhóm ({selectedProduct.group?.name || 'Chưa rõ'})</span>
                        </>
                      ) : (
                        <span>Toàn trường</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
              
              {selectedProduct.status_id === 1 && (
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
