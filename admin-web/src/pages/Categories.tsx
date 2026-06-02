import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  FolderPlus,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  FolderOpen,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import api from '../services/api';

interface SubCategory {
  id: number;
  name: string;
  category_id: number;
  parent_category_id: number;
  productCount: number;
}

interface Category {
  id: number;
  name: string;
  image: string | null;
  productCount: number;
  children: SubCategory[];
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Category forms
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [catImageFile, setCatImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // SubCategory forms
  const [isAddingSub, setIsAddingSub] = useState(false);
  const [newSubName, setNewSubName] = useState('');
  
  const [editingSubId, setEditingSubId] = useState<number | null>(null);
  const [editSubName, setEditSubName] = useState('');

  const fetchCategories = async (selectId?: number) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/categories/with-children');
      const data = response.data || [];
      setCategories(data);
      
      // Update selected category if applicable
      if (data.length > 0) {
        if (selectId) {
          const found = data.find((c: any) => c.id === selectId);
          setSelectedCategory(found || data[0]);
        } else if (!selectedCategory) {
          setSelectedCategory(data[0]);
        } else {
          const found = data.find((c: any) => c.id === selectedCategory.id);
          setSelectedCategory(found || data[0]);
        }
      } else {
        setSelectedCategory(null);
      }
    } catch (err: any) {
      console.error(err);
      setError('Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // --- Category Actions ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const response = await api.post('/categories', { name: newCatName });
      setNewCatName('');
      setIsAddingCat(false);
      await fetchCategories(response.data.id);
    } catch (err: any) {
      console.error(err);
      alert('Không thể thêm danh mục lớn');
    }
  };

  const handleStartEditCategory = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setCatImageFile(null);
    setImagePreviewUrl(cat.image);
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCatName.trim() || editingCatId === null) return;

    try {
      const formData = new FormData();
      formData.append('name', editCatName);
      if (catImageFile) {
        formData.append('image', catImageFile);
      }

      await api.put(`/categories/${editingCatId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setEditingCatId(null);
      setCatImageFile(null);
      setImagePreviewUrl(null);
      await fetchCategories(editingCatId);
    } catch (err: any) {
      console.error(err);
      alert('Không thể cập nhật danh mục');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('CẢNH BÁO: Xóa danh mục lớn sẽ tự động xóa tất cả các danh mục con và các sản phẩm đăng trong danh mục này! Bạn có chắc chắn muốn xóa?')) {
      return;
    }

    try {
      await api.delete(`/categories/${id}`);
      if (selectedCategory && selectedCategory.id === id) {
        setSelectedCategory(null);
      }
      await fetchCategories();
    } catch (err: any) {
      console.error(err);
      alert('Không thể xóa danh mục');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCatImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- SubCategory Actions ---
  const handleAddSubCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim() || !selectedCategory) return;

    try {
      await api.post('/sub-categories', {
        name: newSubName,
        parent_category_id: selectedCategory.id
      });
      setNewSubName('');
      setIsAddingSub(false);
      await fetchCategories(selectedCategory.id);
    } catch (err: any) {
      console.error(err);
      alert('Không thể thêm danh mục con. Vui lòng thử lại.');
    }
  };

  const handleUpdateSubCategory = async (id: number) => {
    if (!editSubName.trim()) return;

    try {
      await api.put(`/sub-categories/${id}`, {
        name: editSubName,
        parent_category_id: selectedCategory?.id
      });
      setEditingSubId(null);
      await fetchCategories(selectedCategory?.id);
    } catch (err: any) {
      console.error(err);
      alert('Không thể cập nhật danh mục con');
    }
  };

  const handleDeleteSubCategory = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục con này? Tất cả bài đăng thuộc danh mục con này cũng sẽ bị xóa.')) {
      return;
    }

    try {
      await api.delete(`/sub-categories/${id}`);
      await fetchCategories(selectedCategory?.id);
    } catch (err: any) {
      console.error(err);
      alert('Không thể xóa danh mục con');
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-slate-400 text-sm font-medium">Đang tải danh mục sản phẩm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Intro section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FolderOpen className="text-indigo-400 w-5 h-5" />
          Quản lý danh mục & danh mục con
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Thiết lập sơ đồ cây danh mục cho các sản phẩm trao đổi đồ cũ trên sàn giao dịch.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Main Layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Categories List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Danh mục lớn</h3>
              <button
                onClick={() => setIsAddingCat(!isAddingCat)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-xs font-semibold cursor-pointer"
              >
                <Plus size={14} /> Thêm danh mục
              </button>
            </div>

            {/* Add Category Form */}
            {isAddingCat && (
              <form onSubmit={handleAddCategory} className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3 animate-fadeIn">
                <input
                  type="text"
                  placeholder="Tên danh mục mới..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                  autoFocus
                />
                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCat(false);
                      setNewCatName('');
                    }}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-xs font-semibold"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 shadow-md shadow-indigo-600/10"
                  >
                    Lưu lại
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            <div className="space-y-2">
              {categories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                const isEditing = editingCatId === cat.id;

                if (isEditing) {
                  return (
                    <form 
                      key={cat.id} 
                      onSubmit={handleUpdateCategory} 
                      className="p-4 rounded-xl bg-slate-950 border border-indigo-500/40 space-y-3 animate-fadeIn"
                    >
                      <input
                        type="text"
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                        required
                      />
                      
                      {/* Image Preview and Upload */}
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-850 flex items-center justify-center overflow-hidden">
                          {imagePreviewUrl ? (
                            <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="text-slate-650 w-6 h-6" />
                          )}
                        </div>
                        <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer transition-colors">
                          <Upload size={13} />
                          <span>Tải ảnh</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange} 
                            className="hidden" 
                          />
                        </label>
                      </div>

                      <div className="flex justify-end space-x-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(null);
                            setCatImageFile(null);
                            setImagePreviewUrl(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-xs font-semibold"
                        >
                          Hủy
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                        >
                          Cập nhật
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group ${
                      isSelected 
                        ? 'bg-slate-900 border-indigo-500/50 shadow-md shadow-indigo-500/5' 
                        : 'bg-slate-950 border-slate-850 hover:bg-slate-900/40 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Image Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="text-slate-600 w-5 h-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-100 truncate">{cat.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{cat.children?.length || 0} danh mục con • {cat.productCount} sản phẩm</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditCategory(cat);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-850"
                        title="Sửa danh mục"
                      >
                        <Edit3 size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat.id);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:text-white hover:bg-rose-600"
                        title="Xóa danh mục"
                      >
                        <Trash2 size={12} />
                      </button>
                      <ChevronRight size={14} className={`text-slate-600 group-hover:text-slate-400 transition-transform ${isSelected ? 'translate-x-0.5' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Selected Category Subcategories (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedCategory ? (
            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
              <div className="flex items-start justify-between border-b border-slate-850 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {selectedCategory.image ? (
                      <img src={selectedCategory.image} alt={selectedCategory.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-600 w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedCategory.name}</h3>
                    <p className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Danh mục trực thuộc</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAddingSub(!isAddingSub)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all text-xs font-semibold cursor-pointer border border-indigo-500/10"
                >
                  <FolderPlus size={14} /> Thêm danh mục con
                </button>
              </div>

              {/* Add SubCategory Form */}
              {isAddingSub && (
                <form onSubmit={handleAddSubCategory} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn">
                  <div className="text-xs font-semibold text-slate-400">Thêm danh mục con vào {selectedCategory.name}</div>
                  <input
                    type="text"
                    placeholder="Tên danh mục con mới..."
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                    required
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingSub(false);
                        setNewSubName('');
                      }}
                      className="px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-xs font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
                    >
                      Tạo mới
                    </button>
                  </div>
                </form>
              )}

              {/* Subcategories List */}
              {selectedCategory.children && selectedCategory.children.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCategory.children.map((sub) => {
                    const isEditing = editingSubId === sub.id;

                    if (isEditing) {
                      return (
                        <div 
                          key={sub.id} 
                          className="p-4 rounded-xl bg-slate-950 border border-indigo-500/50 flex flex-col justify-between space-y-3 animate-fadeIn"
                        >
                          <input
                            type="text"
                            value={editSubName}
                            onChange={(e) => setEditSubName(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 text-white text-xs focus:outline-none focus:border-indigo-500"
                            required
                            autoFocus
                          />
                          <div className="flex justify-end space-x-1.5">
                            <button
                              onClick={() => setEditingSubId(null)}
                              className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white"
                            >
                              <X size={14} />
                            </button>
                            <button
                              onClick={() => handleUpdateSubCategory(sub.id)}
                              className="p-1 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={sub.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-850/60 hover:border-slate-800 transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{sub.name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{sub.productCount} sản phẩm đăng ký</p>
                        </div>

                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingSubId(sub.id);
                              setEditSubName(sub.name);
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 text-slate-450 hover:text-white hover:bg-slate-800 border border-slate-800"
                            title="Sửa tên"
                          >
                            <Edit3 size={11} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubCategory(sub.id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-450 hover:text-white hover:bg-rose-600 border border-rose-500/10 hover:border-transparent"
                            title="Xóa danh mục con"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-850 bg-slate-900/10 flex flex-col items-center justify-center space-y-2">
                  <FolderOpen className="text-slate-700 w-8 h-8" />
                  <p className="text-slate-400 text-xs">Danh mục này chưa có danh mục con nào. Hãy thêm mới!</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 glass-card p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-500 space-y-2">
              <AlertCircle size={28} className="text-slate-650" />
              <p className="text-sm">Hãy chọn một danh mục lớn để xem và quản lý danh mục con.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Categories;
