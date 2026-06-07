import React, { useState, useEffect } from 'react';
import { 
  Flag, 
  Check, 
  AlertTriangle, 
  Trash2,
  Lock, 
  User, 
  Clock, 
  Eye, 
  X,
  ShieldCheck
} from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import type { Report } from '../store/adminStore';

const Reports: React.FC = () => {
  const {
    reports,
    reportsLoading,
    reportsError,
    fetchReports,
    resolveReport,
    deleteReport,
    banUser
  } = useAdminStore();

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleResolveReport = async (reportId: number) => {
    if (!window.confirm('Xác nhận đánh dấu báo cáo này là ĐÃ XỬ LÝ?')) return;
    try {
      await resolveReport(reportId);
      alert('Đã cập nhật trạng thái báo cáo thành công!');
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(prev => prev ? { ...prev, statusId: 2 } : null);
      }
    } catch (err) {
      console.error(err);
      alert('Không thể cập nhật trạng thái báo cáo. Vui lòng thử lại.');
    }
  };

  const handleBanReportedUser = async (userId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn KHÓA tài khoản người dùng bị báo cáo này vĩnh viễn?')) return;
    try {
      await banUser(userId);
      alert('Đã khóa tài khoản thành công!');
      
      if (selectedReport && selectedReport.reportedUser && selectedReport.reportedUser.id === userId) {
        setSelectedReport(prev => {
          if (prev && prev.reportedUser) {
            return {
              ...prev,
              reportedUser: { ...prev.reportedUser, statusId: 3 }
            };
          }
          return prev;
        });
      }
    } catch (err) {
      console.error(err);
      alert('Không thể khóa tài khoản người dùng này.');
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn XÓA báo cáo này khỏi danh sách?')) return;
    try {
      await deleteReport(reportId);
      alert('Đã xóa báo cáo thành công.');
      setSelectedReport(null);
    } catch (err) {
      console.error(err);
      alert('Xóa báo cáo thất bại.');
    }
  };

  if (reportsLoading) {
    return (
      <div className="h-[60vh] flex items-center justify-center flex-col space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
        <p className="text-slate-400 text-sm">Đang tải danh sách báo cáo vi phạm...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-xl font-bold text-white">Quản lý báo cáo vi phạm</h2>
        <p className="text-slate-400 text-xs mt-1">Xử lý các khiếu nại, báo cáo gian lận hoặc toxic từ người dùng.</p>
      </div>

      {reportsError && (
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-center space-x-2">
          <AlertTriangle size={14} />
          <span>{reportsError}</span>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 border border-slate-800/80 text-center text-slate-500 space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center text-slate-400 border border-slate-800">
            <Flag size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-300">Không có báo cáo nào</h3>
          <p className="text-xs">Hệ thống trong sạch. Không có khiếu nại hay báo cáo nào đang chờ xử lý.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Mã BC</th>
                  <th className="px-6 py-4">Lý do</th>
                  <th className="px-6 py-4">Người báo cáo</th>
                  <th className="px-6 py-4">Người bị tố cáo</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-sm text-slate-300">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">#{report.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-200 line-clamp-1">{report.reason}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{report.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-300 font-medium">
                        {report.reporter?.fullName || report.reporter?.nickname || 'Ẩn danh'}
                      </div>
                      {report.reporter && (
                        <div className="text-[10px] text-slate-500">ID #{report.reporter.id}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {report.reportedUser ? (
                        <div>
                          <span className="text-slate-300 font-medium">{report.reportedUser.fullName}</span>
                          <span className="text-xs text-slate-500 block">@{report.reportedUser.nickname}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {report.statusId === 2 ? (
                        <span className="inline-flex items-center text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          Đã xử lý
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full">
                          <Clock size={12} className="mr-1" /> Mới
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedReport(report)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={16} />
                        </button>
                        {report.statusId === 1 && (
                          <button
                            onClick={() => handleResolveReport(report.id)}
                            className="p-1.5 hover:bg-slate-800 text-emerald-400 hover:text-emerald-300 rounded transition-colors"
                            title="Xác nhận đã giải quyết"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-rose-500 rounded transition-colors"
                          title="Xóa báo cáo"
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
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={18} className="text-rose-400" />
                <h3 className="font-bold text-white text-base">Báo cáo vi phạm #{selectedReport.id}</h3>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm text-slate-300">
              <div className="space-y-1">
                <span className="text-xs text-slate-500 block uppercase tracking-wider">Lý do báo cáo</span>
                <span className="text-base font-bold text-slate-100">{selectedReport.reason}</span>
              </div>

              <div className="p-4 bg-slate-950/40 border border-slate-800/60 rounded-xl space-y-1">
                <span className="text-xs text-slate-500 block uppercase tracking-wider">Nội dung giải trình</span>
                <p className="text-slate-300 leading-relaxed leading-normal">{selectedReport.description}</p>
              </div>

              {/* Side by side stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-900 border border-slate-800/40 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Người gửi báo cáo</span>
                  <div className="flex items-center space-x-2">
                    <User size={14} className="text-slate-400" />
                    <span className="text-slate-200 font-semibold">{selectedReport.reporter?.fullName || 'N/A'}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800/40 rounded-lg">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold mb-1">Đối tượng bị báo cáo</span>
                  <div className="flex items-center space-x-2">
                    <User size={14} className="text-rose-400" />
                    <span className="text-slate-200 font-semibold">{selectedReport.reportedUser?.fullName || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {selectedReport.reportedUser && (
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/60">
                  <div>
                    <span className="text-xs text-slate-500">Trạng thái tài khoản đối tượng:</span>
                    <p className="font-semibold mt-0.5 text-xs">
                      {Number(selectedReport.reportedUser.statusId) === 3 ? (
                        <span className="text-rose-400">Đã bị khóa</span>
                      ) : (
                        <span className="text-emerald-400">Đang hoạt động</span>
                      )}
                    </p>
                  </div>
                  {Number(selectedReport.reportedUser.statusId) !== 3 && (
                    <button
                      onClick={() => handleBanReportedUser(selectedReport.reportedUser!.id)}
                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Lock size={12} />
                      <span>Khóa người này</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800/80 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>
              {selectedReport.statusId === 1 && (
                <button
                  onClick={() => handleResolveReport(selectedReport.id)}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <ShieldCheck size={14} />
                  <span>Giải quyết xong</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
