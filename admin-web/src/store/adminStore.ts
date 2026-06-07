import { create } from 'zustand';
import api from '../services/api';

export interface DashboardStats {
  usersCount: number;
  pendingCccdCount: number;
  productsCount: number;
  reportsCount: number;
  groupsCount: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  status_id?: number;
  statusId?: number;
  createdAt: string;
  created_at?: string;
  images?: any[];
  thumbnail_url?: string | null;
  visibility_type?: number;
  group_id?: number | null;
  group?: {
    id: number;
    name: string;
    isPublic: boolean;
  } | null;
  category?: {
    id: number;
    name: string;
  } | null;
  dealType?: {
    id: number;
    name: string;
  } | null;
  user?: {
    id: number;
    nickname: string;
    fullName?: string;
    email?: string;
  };
}

export interface Report {
  id: number;
  reason: string;
  description: string;
  statusId: number;
  createdAt: string;
  reporter?: {
    id: number;
    nickname: string;
    fullName: string;
  };
  reportedUser?: {
    id: number;
    nickname: string;
    fullName: string;
    statusId: number;
  };
  productId?: number;
}

interface AdminState {
  // Stats State
  stats: DashboardStats;
  weeklyPostCounts: { dayName: string; count: number }[];
  dealTypeCounts: { name: string; percentage: number; color: string; count: number }[];
  topCategories: { name: string; percentage: number; count: number }[];
  recentCccds: any[];
  recentReports: any[];
  statsLoading: boolean;
  statsLoaded: boolean;
  statsError: string;

  // Products State
  products: Product[];
  productsLoading: boolean;
  productsLoaded: boolean;
  productsError: string;

  // Reports State
  reports: Report[];
  reportsLoading: boolean;
  reportsLoaded: boolean;
  reportsError: string;

  // Actions
  fetchDashboardData: (force?: boolean) => Promise<void>;
  fetchProducts: (force?: boolean) => Promise<void>;
  fetchReports: (force?: boolean) => Promise<void>;
  
  updateProductStatus: (productId: number, newStatusId: number) => Promise<void>;
  resolveReport: (reportId: number) => Promise<void>;
  deleteReport: (reportId: number) => Promise<void>;
  banUser: (userId: number) => Promise<void>;
  
  // Helpers to force clear cache
  clearCache: () => void;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial State
  stats: {
    usersCount: 0,
    pendingCccdCount: 0,
    productsCount: 0,
    reportsCount: 0,
    groupsCount: 0,
  },
  weeklyPostCounts: [],
  dealTypeCounts: [],
  topCategories: [],
  recentCccds: [],
  recentReports: [],
  statsLoading: false,
  statsLoaded: false,
  statsError: '',

  products: [],
  productsLoading: false,
  productsLoaded: false,
  productsError: '',

  reports: [],
  reportsLoading: false,
  reportsLoaded: false,
  reportsError: '',

  // Fetch Dashboard Stats & calculate metrics
  fetchDashboardData: async (force = false) => {
    if (get().statsLoaded && !force && !get().statsLoading) return;

    set({ statsLoading: true, statsError: '' });
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
        set({ recentCccds: cccdRes.value.data?.slice(0, 3) || [] });
      }

      if (productsRes.status === 'fulfilled') {
        fetchedProducts = productsRes.value.data || [];
        productsCount = fetchedProducts.length;
        // Cache products as well since we fetched them
        set({ products: fetchedProducts, productsLoaded: true });
      }

      if (reportsRes.status === 'fulfilled') {
        const fetchedReports = reportsRes.value.data || [];
        reportsCount = fetchedReports.length;
        set({ 
          recentReports: fetchedReports.slice(0, 3) || [],
          reports: fetchedReports,
          reportsLoaded: true
        });
      }

      if (groupsRes.status === 'fulfilled') {
        groupsCount = groupsRes.value.data?.length || 0;
      }

      const stats = {
        usersCount,
        pendingCccdCount,
        productsCount,
        reportsCount,
        groupsCount
      };

      // Calculate chart structures
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

      fetchedProducts.forEach(p => {
        const createdDate = new Date(p.created_at || p.createdAt || '');
        const matchedDay = last7Days.find(day => day.dateString === createdDate.toDateString());
        if (matchedDay) {
          matchedDay.count += 1;
        }
      });

      const weeklyPostCounts = last7Days.map(d => ({ dayName: d.dayLabel, count: d.count }));

      const dealMap: { [key: string]: number } = {};
      fetchedProducts.forEach(p => {
        const name = p.dealType?.name || 'Khác';
        dealMap[name] = (dealMap[name] || 0) + 1;
      });

      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899'];
      const total = fetchedProducts.length;
      const dealTypeCounts = Object.keys(dealMap).map((name, idx) => ({
        name,
        count: dealMap[name],
        percentage: total > 0 ? Math.round((dealMap[name] / total) * 100) : 0,
        color: colors[idx % colors.length]
      })).sort((a, b) => b.count - a.count);

      const catMap: { [key: string]: number } = {};
      fetchedProducts.forEach(p => {
        const name = p.category?.name || 'Khác';
        catMap[name] = (catMap[name] || 0) + 1;
      });

      const topCategories = Object.keys(catMap).map(name => ({
        name,
        count: catMap[name],
        percentage: total > 0 ? Math.round((catMap[name] / total) * 100) : 0
      })).sort((a, b) => b.count - a.count).slice(0, 5);

      set({
        stats,
        weeklyPostCounts,
        dealTypeCounts,
        topCategories,
        statsLoaded: true,
        statsLoading: false
      });
    } catch (err: any) {
      console.error('Error fetching dashboard stats', err);
      set({ statsError: 'Không thể tải toàn bộ dữ liệu thống kê.', statsLoading: false });
    }
  },

  // Fetch all products
  fetchProducts: async (force = false) => {
    if (get().productsLoaded && !force && !get().productsLoading) return;
    
    set({ productsLoading: true, productsError: '' });
    try {
      const response = await api.get('/products/admin/all');
      set({
        products: response.data || [],
        productsLoaded: true,
        productsLoading: false
      });
    } catch (err) {
      console.error('Error fetching products', err);
      set({ productsError: 'Không thể tải danh sách sản phẩm.', productsLoading: false });
    }
  },

  // Fetch all reports
  fetchReports: async (force = false) => {
    if (get().reportsLoaded && !force && !get().reportsLoading) return;
    
    set({ reportsLoading: true, reportsError: '' });
    try {
      const response = await api.get('/reports');
      set({
        reports: response.data || [],
        reportsLoaded: true,
        reportsLoading: false
      });
    } catch (err) {
      console.error('Error fetching reports', err);
      set({ reportsError: 'Không thể tải danh sách báo cáo.', reportsLoading: false });
    }
  },

  // Update product status
  updateProductStatus: async (productId: number, newStatusId: number) => {
    try {
      await api.patch(`/products/admin/status/${productId}`, {
        product_status_id: newStatusId
      });
      
      // Update products list locally
      const updatedProducts = get().products.map(p => {
        if (p.id === productId) {
          return { ...p, status_id: newStatusId, statusId: newStatusId };
        }
        return p;
      });

      set(state => ({
        products: updatedProducts,
        stats: {
          ...state.stats,
          productsCount: updatedProducts.length
        }
      }));
    } catch (err) {
      console.error('Error updating product status', err);
      throw err;
    }
  },

  // Resolve report status
  resolveReport: async (reportId: number) => {
    try {
      await api.patch(`/reports/${reportId}/status`, { statusId: 2 });
      
      const updatedReports = get().reports.map(r => 
        r.id === reportId ? { ...r, statusId: 2 } : r
      );

      const recentReports = get().recentReports.map(r =>
        r.id === reportId ? { ...r, statusId: 2 } : r
      );

      set(state => ({
        reports: updatedReports,
        recentReports,
        stats: {
          ...state.stats,
          reportsCount: updatedReports.filter(r => r.statusId === 1).length
        }
      }));
    } catch (err) {
      console.error('Error resolving report', err);
      throw err;
    }
  },

  // Delete report
  deleteReport: async (reportId: number) => {
    try {
      await api.delete(`/reports/${reportId}`);
      
      const updatedReports = get().reports.filter(r => r.id !== reportId);
      const recentReports = get().recentReports.filter(r => r.id !== reportId);
      
      set(state => ({
        reports: updatedReports,
        recentReports,
        stats: {
          ...state.stats,
          reportsCount: updatedReports.filter(r => r.statusId === 1).length
        }
      }));
    } catch (err) {
      console.error('Error deleting report', err);
      throw err;
    }
  },

  // Ban reported user
  banUser: async (userId: number) => {
    try {
      await api.patch(`/reports/user/${userId}/status`, { statusId: 3 });
      
      // Update status in loaded reports
      const updateReportUserStatus = (r: Report) => {
        if (r.reportedUser && r.reportedUser.id === userId) {
          return {
            ...r,
            reportedUser: { ...r.reportedUser, statusId: 3 }
          };
        }
        return r;
      };

      const updatedReports = get().reports.map(updateReportUserStatus);
      const recentReports = get().recentReports.map(updateReportUserStatus);

      set({
        reports: updatedReports,
        recentReports
      });
    } catch (err) {
      console.error('Error banning user', err);
      throw err;
    }
  },

  // Clear cache
  clearCache: () => {
    set({
      statsLoaded: false,
      productsLoaded: false,
      reportsLoaded: false
    });
  }
}));
