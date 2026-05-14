import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons"; // Thêm Feather
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { Product, ManageProductsUserScreenNavigationProp } from "../../types";
import axios from "axios";
import { path } from "../../config";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Tabs
const TABS = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Bị từ chối",
  HIDDEN: "Đã ẩn",
  EXPIRED: "Hết hạn",
  SOLD: "Đã bán",
};

type NavProps = ManageProductsUserScreenNavigationProp;

// Map product
const mapProductData = (item: any): Product => {
  const imageUrl = item.images?.[0]?.image_url || item.thumbnail_url || "";
  return {
    ...item,
    id: item.id.toString(),
    image: imageUrl.startsWith("http") ? imageUrl : `${path}${imageUrl}`,
    authorName: item.user?.fullName || item.user?.name || "Người dùng",
    product_status_id: item.product_status_id
      ? parseInt(item.product_status_id, 10)
      : 1,
  } as Product;
};

export default function ManageProductsUserScreen() {
  const navigation = useNavigation<NavProps>();
  const isFocused = useIsFocused();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [allPosts, setAllPosts] = useState<Product[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState(TABS.PENDING);

  // --- STATE CHO MENU 3 CHẤM ---
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const fetchAllPosts = async () => {
    try {
      const response = await axios.get(`${path}/products/admin/all`);
      // Lọc visibility_type = 0 (Toàn trường)
      const publicPosts = response.data.filter(
        (item: any) => Number(item.visibility_type || 0) === 0
      );
      const mappedData = publicPosts.map(mapProductData);
      setAllPosts(mappedData);
    } catch (error: any) {
      console.error("Lỗi tải tin đăng (admin):", error.message);
      Alert.alert("Lỗi", "Không thể tải danh sách tin đăng.");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      setIsLoading(true);
      fetchAllPosts();
    }
  }, [isFocused]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAllPosts();
  }, []);

  // Logic lọc
  useEffect(() => {
    let posts: Product[] = [];
    if (activeTab === TABS.PENDING)
      posts = allPosts.filter((p) => p.productStatus?.id == 1);
    else if (activeTab === TABS.APPROVED)
      posts = allPosts.filter((p) => p.productStatus?.id == 2);
    else if (activeTab === TABS.REJECTED)
      posts = allPosts.filter((p) => p.productStatus?.id == 3);
    else if (activeTab === TABS.HIDDEN)
      posts = allPosts.filter((p) => p.productStatus?.id == 4);
    else if (activeTab === TABS.EXPIRED)
      posts = allPosts.filter((p) => p.productStatus?.id == 5);
    else if (activeTab === TABS.SOLD)
      posts = allPosts.filter((p) => p.productStatus?.id == 6);
    setFilteredPosts(posts);
  }, [activeTab, allPosts]);

  // --- XỬ LÝ MENU 3 CHẤM ---
  const handleOpenMenu = (product: Product, pageY: number) => {
    setSelectedProduct(product); // Lưu cả sản phẩm
    setMenuPosition({ top: pageY - 100, right: 20 });
    setIsMenuVisible(true);
  }; /** Đóng menu 3 chấm */

  const handleCloseMenu = () => {
    setIsMenuVisible(false);
    setSelectedProduct(null);
  };

  // 1. Xóa Vĩnh Viễn
  // Tìm hàm này và thay thế nội dung bên trong
  const handleHardDelete = async () => {
    if (!selectedProduct) return;
    const id = selectedProduct.id;
    handleCloseMenu();

    Alert.alert("Admin xóa tin", "Bạn chắc chắn muốn xóa vĩnh viễn tin này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            // 👇 THÊM LOG Ở ĐÂY
            console.log("------------------------------------------------");
            console.log("LOG: DELETE PRODUCT");
            console.log("1. Token hiện tại:", token);
            console.log("2. URL gọi API:", `${path}/products/${id}`);

            await axios.delete(`${path}/products/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            console.log("3. Kết quả: Thành công");
            Alert.alert("Đã xóa", "Sản phẩm đã bị xóa vĩnh viễn.");
            fetchAllPosts();
          } catch (err: any) {
            // 👇 THÊM LOG LỖI CHI TIẾT
            console.log("3. Kết quả: THẤT BẠI");
            console.log("   - Lỗi:", err.message);
            console.log("   - Status Code:", err.response?.status);
            console.log("   - Server trả về:", err.response?.data);

            Alert.alert(
              "Lỗi",
              `Server báo: ${JSON.stringify(err.response?.data?.message || "Lỗi không xác định")}`
            );
          }
        },
      },
    ]);
  };

  // 3. Ẩn / Hiện tin
  // Tìm hàm này và thay thế nội dung bên trong
  const handleToggleHide = async () => {
    if (!selectedProduct) return;
    handleCloseMenu();
    try {
      const token = await AsyncStorage.getItem("token");
      const isHidden = selectedProduct.productStatus?.id === 4;
      const endpoint = isHidden ? "unhide" : "hide";

      // 👇 THÊM LOG Ở ĐÂY
      console.log("------------------------------------------------");
      console.log(`LOG: ${endpoint.toUpperCase()} PRODUCT`);
      console.log("1. Token hiện tại:", token);
      console.log(
        "2. URL gọi API:",
        `${path}/products/${selectedProduct.id}/${endpoint}`
      );

      await axios.patch(
        `${path}/products/${selectedProduct.id}/${endpoint}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("3. Kết quả: Thành công");
      Alert.alert("Thành công", `Đã ${isHidden ? "hiện" : "ẩn"} tin đăng.`);
      fetchAllPosts();
    } catch (err: any) {
      // 👇 THÊM LOG LỖI CHI TIẾT
      console.log("3. Kết quả: THẤT BẠI");
      console.log("   - Lỗi:", err.message);
      console.log("   - Status Code:", err.response?.status);
      console.log("   - Server trả về:", err.response?.data);

      Alert.alert(
        "Lỗi",
        `Server báo: ${JSON.stringify(err.response?.data?.message || "Lỗi không xác định")}`
      );
    }
  };

  // 4. Duyệt / Từ chối (Logic cũ)
  const handleUpdateStatus = async (product: Product, isApproved: boolean) => {
    const newStatus = { product_status_id: isApproved ? 2 : 3 };
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.patch(
        `${path}/products/admin/status/${product.id}`,
        newStatus,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAllPosts();
      Alert.alert("Thành công", `Đã ${isApproved ? "duyệt" : "từ chối"} tin.`);
    } catch (err: any) {
      Alert.alert("Lỗi", "Cập nhật thất bại.");
    }
  };

  // 5. Duyệt Gia Hạn
  const handleApproveExtension = async (product: Product) => {
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.patch(
        `${path}/products/${product.id}/approve-extension`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchAllPosts();
      Alert.alert("Thành công", "Đã duyệt gia hạn.");
    } catch (err: any) {
      Alert.alert("Lỗi", "Duyệt gia hạn thất bại.");
    }
  };

const renderProductItem = ({ item }: { item: Product }) => {
  // Xác định loại hiển thị (Visibility Type) và Tên danh mục
  const visibilityType = "Toàn trường"; // Màn hình này chỉ load tin Toàn trường
  
  const categoryName = item.category?.name;
  const subCategoryName = item.subCategory?.name;
  const categoryDisplay = 
    categoryName && subCategoryName 
    ? `${categoryName} - ${subCategoryName}` 
    : categoryName || subCategoryName || "Chưa rõ danh mục";

  return (
    <View className="flex-row bg-white mx-4 my-2 rounded-lg p-3 shadow border border-gray-100">
      <TouchableOpacity
        className="flex-1 flex-row"
        onPress={() => navigation.navigate("ProductDetail", { product: item })}
      >
        <Image
          source={{ uri: item.image }}
          className="w-20 h-20 rounded-md bg-gray-200"
        />
        <View className="flex-1 ml-3 justify-between">
          <Text
            className="text-base font-semibold text-gray-800"
            numberOfLines={2}
          >
            {item.name}
          </Text>
          {/* 1. HIỂN THỊ LOẠI HIỂN THỊ (Toàn trường) */}
          <Text className="text-sm text-indigo-600 font-medium">
            {visibilityType}
          </Text>
          {/* 2. HIỂN THỊ DANH MỤC */}
          <Text className="text-xs text-gray-500 mt-0.5">
            Danh mục: {categoryDisplay}
          </Text>
          <Text className="text-sm text-gray-500">
            Đăng bởi:{" "}
            <Text className="font-medium text-indigo-600">
              {item.authorName}
            </Text>
          </Text>
          <Text className="text-sm font-bold text-red-600 mt-1">
            {item.dealType?.name === "Miễn phí"
              ? "Miễn phí"
              : item.dealType?.name === "Trao đổi"
                ? "Trao đổi"
                : item.price
                  ? `${Number(item.price).toLocaleString("vi-VN")} đ`
                  : "Liên hệ"}
          </Text>

          {/* Nút Duyệt nhanh cho tab Chờ Duyệt */}
          {activeTab === TABS.PENDING && (
            <View className="flex-row mt-2 space-x-2">
              <TouchableOpacity
                className="flex-1 py-1.5 bg-green-500 rounded items-center"
                onPress={() => handleUpdateStatus(item, true)}
              >
                <Text className="text-white font-semibold text-xs">Duyệt</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-1.5 bg-red-500 rounded items-center"
                onPress={() => handleUpdateStatus(item, false)}
              >
                <Text className="text-white font-semibold text-xs">
                  Từ chối
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Nút Duyệt gia hạn */}
          {activeTab === TABS.EXPIRED && (
            <TouchableOpacity
              className="mt-2 py-1.5 bg-blue-500 rounded items-center self-start px-4"
              onPress={() => handleApproveExtension(item)}
            >
              <Text className="text-white font-semibold text-xs">
                Duyệt Gia Hạn
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>

      {/* MENU 3 CHẤM */}
      <TouchableOpacity
        className="p-2 -mr-2"
        onPress={(e) => handleOpenMenu(item, e.nativeEvent.pageY)}
      >
        <Feather name="more-vertical" size={24} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );
};

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center h-14 px-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-800">
          Duyệt Tin Công Khai
        </Text>
        <View className="w-6" />
      </View>

      <View className="bg-white py-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          {Object.values(TABS).map((tabName) => (
            <TouchableOpacity
              key={tabName}
              className={`px-4 py-2 rounded-full mr-2 ${
                activeTab === tabName ? "bg-indigo-600" : "bg-gray-100"
              }`}
              onPress={() => setActiveTab(tabName)}
            >
              <Text
                className={`text-sm font-medium ${activeTab === tabName ? "text-white" : "text-gray-700"}`}
              >
                {tabName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color="#3366FF"
          className="flex-1 mt-10"
        />
      ) : (
        <FlatList
          data={filteredPosts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderProductItem}
          contentContainerStyle={{ paddingBottom: 80, paddingTop: 10 }}
          ListEmptyComponent={
            <Text className="text-center text-gray-500 mt-10">
              Không có tin đăng nào.
            </Text>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* MODAL MENU 3 CHẤM */}
      <Modal
        transparent={true}
        visible={isMenuVisible}
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        <Pressable className="flex-1" onPress={handleCloseMenu}>
          <View
            style={{
              position: "absolute",
              top: menuPosition.top,
              right: menuPosition.right,
            }}
            className="bg-white rounded-lg shadow-xl border border-gray-100 w-48 py-1"
          >
            {/* Hide/Unhide */}
            {(selectedProduct?.productStatus?.id === 2 ||
              selectedProduct?.productStatus?.id === 4) && (
              <TouchableOpacity
                className="flex-row items-center p-3 border-b border-gray-50"
                onPress={handleToggleHide}
              >
                <Feather
                  name={
                    selectedProduct?.productStatus?.id === 4 ? "eye" : "eye-off"
                  }
                  size={18}
                  color="#4b5563"
                />
                <Text className="ml-3 text-gray-700 font-medium">
                  {selectedProduct?.productStatus?.id === 4
                    ? "Hiện tin"
                    : "Ẩn tin"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Delete */}
            <TouchableOpacity
              className="flex-row items-center p-3"
              onPress={handleHardDelete}
            >
              <Feather name="trash-2" size={18} color="#ef4444" />
              <Text className="ml-3 text-red-600 font-medium">
                Xóa vĩnh viễn
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
