import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { RootStackParamList } from "../../types";
import axios from "axios";
import { path } from "../../config";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
// Cần cài đặt: npm install dayjs
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

dayjs.extend(relativeTime);
dayjs.locale("vi");

// --- TYPES (Dựa trên JSON mẫu và Backend) ---
type ReportStatus = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};
// Cần đảm bảo UserBase ở đây khớp với dữ liệu từ API (bao gồm statusId của User Entity)
type UserBase = {
  id: string;
  nickname: string;
  email: string;
  fullName: string | null;
  statusId: string;
};
type Report = {
  id: number;
  product: { id: number; name?: string } | null; // Có thể có tên sản phẩm
  reporter: UserBase;
  reported_user: UserBase;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
};

type NavProps = NativeStackNavigationProp<
  RootStackParamList,
  "HomeAdminScreen"
>;

// Trạng thái lọc báo cáo
const REPORT_STATUSES = {
  ALL: "Tất cả",
  PENDING: "Chờ duyệt",
  PROCESSED: "Đã xử lý",
  BANNED: "Đã khóa TK", // Thêm filter cho người dùng đã bị khóa
};

export default function ManageReportsScreen() {
  const navigation = useNavigation<NavProps>();
  const isFocused = useIsFocused();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);

  // States cho Lọc và Tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState(REPORT_STATUSES.ALL);

  // States cho Modal chi tiết
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Helper để map dữ liệu trả về từ API
  const mapReportData = (data: any[]): Report[] => {
    return data.map((item) => {
      const safeMapUser = (user: any) => {
        if (!user) {
          // Trả về đối tượng UserBase mặc định nếu dữ liệu là null
          return {
            id: "0",
            nickname: "Người dùng đã bị xóa",
            email: "",
            fullName: null,
            statusId: "0",
          };
        }
        return {
          ...user,
          statusId: String(user.statusId),
        };
      };

      return {
        ...item,
        id: Number(item.id),
        reporter: safeMapUser(item.reporter),
        reported_user: safeMapUser(item.reported_user),
      };
    }) as Report[];
  };

  const fetchAllReports = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Lỗi", "Vui lòng đăng nhập Admin.");
        return;
      }

      const response = await axios.get(`${path}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const mappedData = mapReportData(response.data);
      setAllReports(mappedData);
    } catch (error: any) {
      console.error("Lỗi tải báo cáo:", error.response?.data || error.message);
      Alert.alert("Lỗi", "Không thể tải danh sách báo cáo.");
      setAllReports([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      setIsLoading(true);
      fetchAllReports();
    }
  }, [isFocused]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllReports();
  }, []);

  // 1. Logic Tìm kiếm và Lọc
  useEffect(() => {
    let tempReports = allReports;
    const lowerCaseSearch = searchTerm.toLowerCase();

    if (activeFilter === REPORT_STATUSES.PENDING) {
      tempReports = tempReports.filter((r) => r.status.id === "1");
    } else if (activeFilter === REPORT_STATUSES.PROCESSED) {
      tempReports = tempReports.filter((r) => r.status.id === "2");
    }
    // Lọc theo trạng thái User Bị báo cáo: (Status ID 3)
    else if (activeFilter === REPORT_STATUSES.BANNED) {
      // Khi chọn "Đã khóa TK", chỉ giữ lại các báo cáo mà người bị báo cáo đã bị khóa
      tempReports = tempReports.filter((r) => r.reported_user.statusId === "3");
    }

    if (searchTerm) {
      tempReports = tempReports.filter(
        (r) =>
          r.reason.toLowerCase().includes(lowerCaseSearch) ||
          r.reported_user.nickname.toLowerCase().includes(lowerCaseSearch) ||
          r.reported_user.id.toString().includes(lowerCaseSearch)
      );
    }

    setFilteredReports(tempReports);
  }, [activeFilter, searchTerm, allReports]);

  // 2. Hàm xử lý Cập nhật Trạng thái Báo cáo (Đặt là Đã xử lý)
  const handleUpdateReportStatus = async (
    reportId: number,
    newStatusId: number
  ) => {
    setIsModalVisible(false); // Đóng modal trước khi xử lý
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.patch(
        `${path}/reports/${reportId}/status`,
        { statusId: newStatusId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAllReports(); // Tải lại dữ liệu
      Alert.alert("Thành công", "Đã cập nhật trạng thái báo cáo.");
    } catch (err: any) {
      console.error("Lỗi cập nhật trạng thái báo cáo:", err.response?.data);
      Alert.alert(
        "Lỗi",
        err.response?.data?.message || "Cập nhật trạng thái báo cáo thất bại."
      );
    }
  };

  // 3. Hàm xử lý Khóa/Mở khóa User (Sử dụng API thực tế)
  const handleToggleUserStatus = async (userId: string, isBanned: boolean) => {
    setIsModalVisible(false); // Đóng modal trước khi xử lý

    const newStatusId = isBanned ? 1 : 3; // 1=Active, 3=Banned
    const action = isBanned ? "mở khóa" : "khóa";

    Alert.alert(
      `Xác nhận ${action}`,
      `Bạn có chắc chắn muốn ${action} người dùng ID ${userId}?`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: action.toUpperCase(),
          style: isBanned ? "default" : "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              await axios.patch(
                `${path}/reports/user/${userId}/status`, // ✅ SỬ DỤNG API CONTROLLER ĐÃ TẠO
                { statusId: newStatusId },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              await fetchAllReports(); // Tải lại để cập nhật trạng thái
              Alert.alert("Thành công", `Đã ${action} người dùng ${userId}.`);
            } catch (err: any) {
              console.error(`Lỗi ${action} người dùng:`, err.response?.data);
              Alert.alert(
                "Lỗi",
                err.response?.data?.message || `${action} người dùng thất bại.`
              );
            }
          },
        },
      ]
    );
  };

  const handleDeleteReport = async (reportId: number) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa báo cáo này không? Hành động này không thể hoàn tác.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              if (!token) return;

              // Gọi API Delete
              await axios.delete(`${path}/reports/${reportId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              // Đóng modal và tải lại danh sách
              setIsModalVisible(false);
              await fetchAllReports();
              
              Alert.alert("Thành công", "Đã xóa báo cáo.");
            } catch (err: any) {
              console.error("Lỗi xóa báo cáo:", err.response?.data);
              Alert.alert("Lỗi", "Không thể xóa báo cáo này.");
            }
          },
        },
      ]
    );
  };

  // Mở modal chi tiết
  const handleOpenDetailModal = (item: Report) => {
    setSelectedReport(item);
    setIsModalVisible(true);
  };

  // Item hiển thị trong FlatList
  const renderReportItem = ({ item }: { item: Report }) => {
    const isBanned = item.reported_user.statusId === "3";

    // Kiểm tra xem có đang ở tab "Đã khóa TK" hay không
    const isBannedFilter = activeFilter === REPORT_STATUSES.BANNED;

    return (
      <TouchableOpacity
        className="bg-white mx-4 my-2 rounded-xl p-4 shadow-md border border-gray-100"
        onPress={() => handleOpenDetailModal(item)}
      >
        <View className="flex-row justify-between items-start mb-2">
          {/* ID và Trạng thái báo cáo */}
          <View className="flex-row items-center">
            <Text className="text-lg font-extrabold text-red-600 mr-2">
              #{item.id}
            </Text>
            <Text
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                item.status.id === "2"
                  ? "bg-green-100 text-green-700"
                  : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {item.status.name}
            </Text>
          </View>
        </View>

     
        {!isBannedFilter && (
          <View className="mb-2 border-l-2 border-gray-300 pl-3 py-1">
            <Text
              className="text-base font-medium text-gray-800"
              numberOfLines={2}
            >
              {item.reason}
            </Text>
          </View>
        )}

        {/* Thông tin người bị báo cáo */}
        <View className="flex-row items-center justify-between mt-1">
          <View className="flex-row items-center">
            <Feather
              name="user-x"
              size={14}
              color={isBanned ? "#ef4444" : "#f59e0b"}
            />
            <Text className="text-sm ml-2">
              Bị báo cáo:
              <Text className="font-semibold text-red-600">
                {` ${item.reported_user.nickname}`}
              </Text>
            </Text>
          </View>

          <Text
            className={`text-xs font-bold ${
              isBanned ? "text-red-500" : "text-green-500"
            }`}
          >
            {isBanned ? "BỊ KHÓA" : "ACTIVE"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center h-14 px-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-800">
          Quản lý Báo Cáo ({filteredReports.length}/{allReports.length})
        </Text>
        <View className="w-6" />
      </View>

      {/* 4. Giao diện Tìm kiếm và Lọc */}
      <View className="bg-white p-4 border-b border-gray-200">
        {/* Tìm kiếm */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-700"
            placeholder="Tìm theo lý do hoặc nickname"
            placeholderTextColor="#9ca3af"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Lọc theo Trạng thái */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.values(REPORT_STATUSES).map((status) => (
            <TouchableOpacity
              key={status}
              className={`px-4 py-1.5 rounded-full mr-2 border ${
                activeFilter === status
                  ? "bg-indigo-600 border-indigo-600"
                  : "bg-white border-gray-300"
              }`}
              onPress={() => setActiveFilter(status)}
            >
              <Text
                className={`text-sm font-medium ${activeFilter === status ? "text-white" : "text-gray-700"}`}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Danh sách báo cáo */}
      {isLoading ? (
        <ActivityIndicator
          size="large"
          color="#3366FF"
          className="flex-1 mt-10"
        />
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderReportItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10">
              Không tìm thấy báo cáo nào phù hợp.
            </Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* 5. Modal Chi tiết Báo cáo & Xử lý */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setIsModalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-11/12 rounded-xl p-6 shadow-xl"
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-800">
                  Chi tiết Báo cáo #{selectedReport?.id}
                </Text>
                
                {/* Nút Thùng rác */}
                <TouchableOpacity 
                  onPress={() => selectedReport && handleDeleteReport(selectedReport.id)}
                  className="p-2 bg-gray-100 rounded-full"
                >
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>

              {selectedReport && (
                <View className="space-y-4">
                  {/* Lý do */}
                  <View>
                    <Text className="text-sm font-semibold text-gray-600">
                      Lý do báo cáo:
                    </Text>
                    <Text className="text-base text-gray-900 border border-red-200 p-2 rounded-lg mt-1 bg-red-50">
                      {selectedReport.reason}
                    </Text>
                  </View>

                  {/* Thông tin Chung */}
                  <View className="border-t border-gray-200 pt-3 space-y-2">
                    <Text className="text-base font-semibold text-gray-700">
                      Thông tin chung
                    </Text>
                    <Text className="text-sm text-gray-700">
                      Trạng thái Báo cáo:
                      <Text
                        className={`font-semibold ${selectedReport.status.id === "2" ? "text-green-600" : "text-yellow-600"}`}
                      >
                        {` ${selectedReport.status.name}`}
                      </Text>
                    </Text>
                    <Text className="text-sm text-gray-700">
                      Thời gian:{" "}
                      {dayjs(selectedReport.createdAt).format(
                        "HH:mm DD/MM/YYYY"
                      )}
                    </Text>
                  </View>

                  {/* Người Báo cáo */}
                  <View className="border-t border-gray-200 pt-3 space-y-2">
                    <Text className="text-base font-semibold text-gray-700">
                      Người Báo cáo (Reporter)
                    </Text>
                    <Text className="text-sm text-gray-700">
                      Nickname: {selectedReport.reporter.nickname}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      ID: {selectedReport.reporter.id}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      Email: {selectedReport.reporter.email}
                    </Text>
                  </View>

                  {/* Người Bị báo cáo */}
                  <View className="border-t border-gray-200 pt-3 space-y-2">
                    <Text className="text-base font-semibold text-gray-700">
                      Người Bị báo cáo
                    </Text>
                    <Text className="text-sm text-gray-700">
                      Nickname: {selectedReport.reported_user.nickname}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      ID: {selectedReport.reported_user.id}
                    </Text>
                    <Text className="text-sm text-gray-700">
                      Email: {selectedReport.reported_user.email}
                    </Text>
                    <Text className="text-sm text-gray-700 font-bold">
                      Trạng thái TK:
                      <Text
                        className={
                          selectedReport.reported_user.statusId === "3"
                            ? "text-red-600"
                            : "text-green-600"
                        }
                      >
                        {selectedReport.reported_user.statusId === "3"
                          ? " BỊ KHÓA"
                          : " ACTIVE"}
                      </Text>
                    </Text>
                  </View>
                </View>
              )}

              {/* Nút Hành động */}
              <View className="flex-row mt-6 space-x-3 border-t border-gray-200 pt-4">
                {/* 3. Nút Khóa / Mở khóa tài khoản */}
                <TouchableOpacity
                  className={`flex-1 py-3 rounded-xl items-center ${
                    selectedReport?.reported_user.statusId === "3"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                  onPress={() =>
                    handleToggleUserStatus(
                      selectedReport!.reported_user.id,
                      selectedReport?.reported_user.statusId === "3"
                    )
                  }
                >
                  <Text className="text-white font-semibold">
                    {selectedReport?.reported_user.statusId === "3"
                      ? "Mở khóa TK"
                      : "Khóa TK"}
                  </Text>
                </TouchableOpacity>

                {/* 2. Nút Đánh dấu Đã xử lý (Chỉ khi đang Chờ duyệt) */}
                {selectedReport?.status.id === "1" && (
                  <TouchableOpacity
                    className="flex-1 py-3 bg-indigo-500 rounded-xl items-center"
                    onPress={() =>
                      handleUpdateReportStatus(selectedReport!.id, 2)
                    }
                  >
                    <Text className="text-white font-semibold">
                      Đánh dấu Đã xử lý
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
