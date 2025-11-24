import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, Ionicons } from "@expo/vector-icons";
import Menu from "../../components/Menu";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, Product } from "../../types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { path } from "../../config";
import "../../global.css";
import { useNotification } from "../Notification/NotificationContext";

const statusTabs = [
  "Đã duyệt",
  "Chờ duyệt",
  "Từ chối",
  "Đã ẩn",
  "Hết hạn",
  "Đã bán",
];

// Danh sách lý do gia hạn
const EXTENSION_REASONS = [
  "Sản phẩm chưa bán được",
  "Sản phẩm đã giảm giá",
  "Muốn làm mới tin đăng",
  "Lý do khác",
];

// Hàm tính toán hạn dùng
const getExpiryMessage = (
  product: Product
): { text: string; color: string } => {
  const statusId = product.productStatus?.id;
  if (statusId === 1) return { text: "Đang chờ duyệt", color: "text-blue-600" };
  if (statusId === 3) return { text: "Đã bị từ chối", color: "text-red-600" };
  if (statusId === 4) return { text: "Đang ẩn", color: "text-gray-600" };
  if (statusId === 5) return { text: "Đã hết hạn", color: "text-red-600" };
  if (statusId === 6) return { text: "Đã bán", color: "text-green-600" };
  // Logic mới: Ưu tiên 'expires_at'
  if (statusId === 2 && product.expires_at) {
    const expiryDate = new Date(product.expires_at);
    const now = new Date();
    const msRemaining = expiryDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

    if (daysRemaining > 1) {
      return {
        text: `Hết hạn sau ${daysRemaining} ngày`,
        color: "text-green-600",
      };
    } else if (daysRemaining === 1) {
      return { text: "Hết hạn trong hôm nay", color: "text-yellow-600" };
    } else if (msRemaining > 0) {
      return { text: "Hết hạn trong hôm nay", color: "text-yellow-600" };
    }
  }

  // Fallback (nếu expires_at = null hoặc đã qua)
  if (statusId === 2) {
    return { text: "Đã duyệt", color: "text-green-600" };
  }

  // Fallback cuối cùng
  return { text: "Không rõ trạng thái", color: "text-gray-500" };
};

const timeSince = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return seconds < 5 ? "vừa xong" : `${seconds} giây trước`;
  let interval = seconds / 31536000;
  if (interval >= 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval >= 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval >= 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval >= 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60;
  return Math.floor(interval) + " phút trước";
};

const mapProductData = (item: any): Product => {
  const imageUrl = (() => {
    if (!item.thumbnail_url && item.images?.length)
      return item.images[0].image_url;
    const url = item.thumbnail_url || "";
    if (url.startsWith("http")) return url;
    return `${path}${url}`;
  })();

  let locationText = "Chưa rõ địa chỉ";
  if (item.address_json) {
    try {
      const addr =
        typeof item.address_json === "string"
          ? JSON.parse(item.address_json)
          : item.address_json;
      if (addr.full) locationText = addr.full;
      else {
        const parts = [addr.ward, addr.district, addr.province]
          .filter(Boolean)
          .slice(-2);
        locationText = parts.length > 0 ? parts.join(", ") : "Chưa rõ địa chỉ";
      }
    } catch {
      locationText = "Chưa rõ địa chỉ";
    }
  }

  const createdAt = item.created_at
    ? new Date(new Date(item.created_at).getTime() + 7 * 60 * 60 * 1000)
    : new Date();
  const timeDisplay = timeSince(createdAt);

  let tagText = "Không có danh mục";
  const categoryName = item.category?.name || null;
  const subCategoryName = item.subCategory?.name || null;
  if (categoryName && subCategoryName)
    tagText = `${categoryName} - ${subCategoryName}`;
  else if (categoryName) tagText = categoryName;
  else if (subCategoryName) tagText = subCategoryName;

  return {
    id: item.id.toString(),
    image: imageUrl,
    name: item.name || "Không có tiêu đề",
    price:
      item.dealType?.name === "Miễn phí"
        ? "Miễn phí"
        : item.dealType?.name === "Trao đổi"
          ? "Trao đổi"
          : item.price
            ? `${Number(item.price).toLocaleString("vi-VN")} đ`
            : "Liên hệ",
    location: locationText,
    time: timeDisplay,
    tag: tagText,
    authorName: item.user?.nickname || item.user?.name || "Ẩn danh",
    user_id: item.user?.id ?? item.user_id ?? 0,
    category: item.category || null,
    subCategory: item.subCategory
      ? {
          id: item.subCategory.id,
          name: item.subCategory.name,
          parent_category_id: item.subCategory.parent_category_id,
          source_table: item.subCategory.source_table,
          source_id: item.subCategory.source_id,
        }
      : null,
    category_change: item.category_change || null,
    sub_category_change: item.sub_category_change || null,
    imageCount: item.images?.length || (imageUrl ? 1 : 0),
    isFavorite: false,
    images: item.images || [],
    description: item.description || "",
    postType: item.postType || null,
    condition: item.condition || null,
    dealType: item.dealType || null,
    productStatus: item.productStatus || null,
    productType:
      item.productType && item.productType.name ? item.productType : null,
    origin: item.origin && item.origin.name ? item.origin : null,
    material: item.material && item.material.name ? item.material : null,
    size: item.size && item.size.name ? item.size : null,
    brand: item.brand && item.brand.name ? item.brand : null,
    color: item.color && item.color.name ? item.color : null,
    capacity: item.capacity && item.capacity.name ? item.capacity : null,
    warranty: item.warranty && item.warranty.name ? item.warranty : null,
    productModel:
      item.productModel && item.productModel.name ? item.productModel : null,
    processor: item.processor && item.processor.name ? item.processor : null,
    ramOption: item.ramOption && item.ramOption.name ? item.ramOption : null,
    storageType:
      item.storageType && item.storageType.name ? item.storageType : null,
    graphicsCard:
      item.graphicsCard && item.graphicsCard.name ? item.graphicsCard : null,
    breed: item.breed && item.breed.name ? item.breed : null,
    ageRange: item.ageRange && item.ageRange.name ? item.ageRange : null,
    gender: item.gender && item.gender.name ? item.gender : null,
    engineCapacity:
      item.engineCapacity && item.engineCapacity.name
        ? item.engineCapacity
        : null,
    mileage: item.mileage ?? null,
    address_json: item.address_json || { full: locationText },
    phone: item.user?.phone || null,
    author: item.author || null,
    year: item.year || null,
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || undefined,
    expires_at: item.expires_at || null,
    sub_category_id: item.sub_category_id || null,
    status_id: item.status_id?.toString() || undefined,
    visibility_type: item.visibility_type?.toString() || undefined,
    group_id: item.group_id || null,
    group: item.group || null,
  };
};

type NavProps = NativeStackNavigationProp<
  RootStackParamList,
  "ManagePostsScreen"
>;

export default function ManagePostsScreen({
  navigation,
}: {
  navigation: NavProps;
}) {
  const isFocused = useIsFocused();
  const [activeStatus, setActiveStatus] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allPosts, setAllPosts] = useState<Product[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Product[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const { unreadCount, setUnreadCount } = useNotification();
  const [searchText, setSearchText] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [reasonModalVisible, setReasonModalVisible] = useState(false);

  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  const fetchMyPosts = async (currentUserId: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${path}/products/my-posts/${currentUserId}`
      );
      setAllPosts(response.data.map(mapProductData));
    } catch {
      Alert.alert("Lỗi", "Không thể tải tin đăng của bạn.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      const id = await AsyncStorage.getItem("userId");
      const name = await AsyncStorage.getItem("userName");
      const avatar = await AsyncStorage.getItem("userAvatar");

      if (id) {
        setUserId(id);
        setUserName(name || "Người dùng");
        setUserAvatar(avatar || null);
        if (isFocused) fetchMyPosts(id);
      } else {
        Alert.alert("Lỗi", "Vui lòng đăng nhập để xem tin.");
        navigation.goBack();
        setIsLoading(false);
      }
    };
    loadData();
  }, [isFocused]);

  useEffect(() => {
    const selectedTabName = statusTabs[activeStatus].trim(); // Bước 1: Lọc theo status (tab)

    const postsByStatus = allPosts.filter((p) => {
      if (selectedTabName === "Đã duyệt") return p.productStatus?.id === 2;
      if (selectedTabName === "Chờ duyệt")
        return p.productStatus?.id === 1 || p.productStatus == null;
      if (selectedTabName === "Từ chối") return p.productStatus?.id === 3;
      if (selectedTabName === "Đã ẩn") return p.productStatus?.id === 4;
      if (selectedTabName === "Hết hạn") return p.productStatus?.id === 5;
      if (selectedTabName === "Đã bán") return p.productStatus?.id === 6;
      return false;
    }); // Bước 2: Lọc tiếp theo tên (từ kết quả Bước 1)

    if (searchText.trim() === "") {
      setFilteredPosts(postsByStatus); // Không tìm, dùng kết quả lọc status
    } else {
      const lowerCaseSearch = searchText.toLowerCase().trim();
      const postsByName = postsByStatus.filter((p) =>
        p.name.toLowerCase().includes(lowerCaseSearch)
      );
      setFilteredPosts(postsByName);
    }
  }, [activeStatus, allPosts, searchText]); // ✅ THÊM searchText VÀO ĐÂY

  /** Mở menu 3 chấm */
  const handleOpenMenu = (product: Product, pageY: number) => {
    setSelectedProduct(product); // Lưu cả sản phẩm
    setMenuPosition({ top: pageY - 230, right: 20 });
    setIsMenuVisible(true);
  }; /** Đóng menu 3 chấm */

  const handleCloseMenu = () => {
    setIsMenuVisible(false);
    setSelectedProduct(null);
  };

  /** Xử lý Chỉnh sửa */
  const handleEdit = () => {
    // 💡 SỬA: Điều hướng sang màn hình Edit
    if (!selectedProduct) return;
    navigation.navigate("EditProductScreen", { product: selectedProduct });
    handleCloseMenu();
  };

  /** Xử lý Ẩn tin (chuyển status 2 -> 4) */
  const handleHideProduct = async () => {
    if (!selectedProduct || !userId) return;
    const productId = selectedProduct.id;
    handleCloseMenu();

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập lại");
      await axios.patch(
        `${path}/products/${productId}/hide`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Đã ẩn", "Sản phẩm đã được ẩn đi.");
      fetchMyPosts(userId);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể ẩn tin, vui lòng thử lại.");
    }
  };

  /** Xử lý Đánh dấu đã bán (chuyển status 2 -> 6) */
  const handleMarkAsSold = async () => {
    if (!selectedProduct || !userId) return;
    const productId = selectedProduct.id;
    handleCloseMenu(); // Đóng menu

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập lại");

      await axios.patch(
        `${path}/products/${productId}/sold`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Thành công", "Sản phẩm đã được đánh dấu 'Đã bán'.");
      fetchMyPosts(userId); // Tải lại toàn bộ danh sách
    } catch (err: any) {
      console.error(
        "Lỗi khi đánh dấu đã bán:",
        err.response?.data || err.message
      );
      Alert.alert("Lỗi", "Không thể đánh dấu đã bán, vui lòng thử lại.");
    }
  };

  /** Xử lý Hiện lại tin (Status 4 -> 2) */
  const handleUnhideProduct = async () => {
    if (!selectedProduct || !userId) return;
    const productId = selectedProduct.id;
    handleCloseMenu();

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập lại");
      await axios.patch(
        `${path}/products/${productId}/unhide`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert("Đã hiển thị lại", "Sản phẩm của bạn đã xuất hiện trở lại.");
      fetchMyPosts(userId); // Tải lại

      // 👇 SỬA: Chuyển sang tab "Đã duyệt" (ID 0)
      setActiveStatus(0);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể hiện lại tin, vui lòng thử lại.");
    }
  };

  /** Mở Modal chọn lý do Gia hạn */
  const handleOpenReasonModal = () => {
    if (!selectedProduct) return;
    setIsMenuVisible(false); // Đóng menu 3 chấm
    setReasonModalVisible(true); // Mở modal lý do
    // selectedProduct vẫn được giữ
  };

  /** Gửi yêu cầu gia hạn (Status 5) */
  const handleSendExtensionRequest = async (reason: string) => {
    if (!selectedProduct || !userId) return;
    const productId = selectedProduct.id;
    setReasonModalVisible(false); // Đóng modal lý do

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Vui lòng đăng nhập lại"); // 1. Gửi API và NHẬN LẠI SẢN PHẨM ĐÃ CẬP NHẬT (Status 1)

      const response = await axios.post(
        `${path}/products/${productId}/extension`,
        { reason: reason }, // Gửi lý do
        { headers: { Authorization: `Bearer ${token}` } }
      ); // 2. Dùng hàm mapProductData để chuẩn hóa response

      const updatedProduct = mapProductData(response.data); // 3. Cập nhật State (thay thế tin cũ bằng tin đã cập nhật)

      // Dòng này sẽ khiến tin biến mất khỏi tab "Hết hạn"
      setAllPosts((prevPosts) =>
        prevPosts.map(
          (p) => (p.id === productId ? updatedProduct : p) // 👈 Thay thế bằng sản phẩm thật
        )
      ); // 4. Thông báo (Không tự chuyển tab)

      Alert.alert("Đã gửi", "Yêu cầu đã được chuyển vào tab 'Chờ duyệt'.");
      setSelectedProduct(null); // Đóng menu
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể gửi yêu cầu, vui lòng thử lại.");
      console.error("Lỗi khi yêu cầu gia hạn:", err.message);
    }
  };
  /** HÀM SỬA LẠI: Xử lý Xóa Vĩnh Viễn */

  const handleHardDeleteConfirm = () => {
    if (!selectedProduct) return;
    const productName = selectedProduct.name;
    const productId = selectedProduct.id;
    handleCloseMenu(); // Đóng menu 3 chấm

    Alert.alert(
      "⚠️ Xóa vĩnh viễn ⚠️",
      `Bạn có chắc muốn XÓA VĨNH VIỄN tin "${productName}" không? Hành động này không thể hoàn tác.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa vĩnh viễn",
          style: "destructive",
          onPress: () => hardDeleteProduct(productId), // Gọi hàm thực thi
        },
      ]
    );
  };

  const hardDeleteProduct = async (productId: string) => {
    if (!userId) {
      Alert.alert("Lỗi", "Không thể xác thực người dùng.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Lỗi", "Phiên đăng nhập hết hạn.");
        return;
      } // SỬ DỤNG METHOD DELETE VÀ ĐÚNG ENDPOINT
      await axios.delete(
        `${path}/products/${productId}`, // Endpoint của hardDelete
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Đã xóa", "Sản phẩm đã được xóa vĩnh viễn.");
      setAllPosts((prev) => prev.filter((p) => p.id !== productId));
      setFilteredPosts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err: any) {
      console.error("Lỗi khi xóa vĩnh viễn:", err.message);
      Alert.alert("Lỗi", "Không thể xóa. Vui lòng thử lại.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between h-14 px-4 bg-indigo-50 shadow-sm">
        <Text className="text-lg font-semibold text-gray-800">
          Quản lý đăng tin
        </Text>
      </View>

      <FlatList
        ListHeaderComponent={
          <>
            {/* Profile */}
            <View className="px-5 pt-5">
              <TouchableOpacity
                className="flex-row items-center mb-5"
                onPress={() => {
                  if (userId) {
                    navigation.navigate("UserInforScreen", { userId });
                  } else {
                    Alert.alert("Lỗi", "Không xác định được người dùng."); // Xử lý khi null
                  }
                }}
              >
                <View className="flex-row items-center mb-5">
                  <Image
                    source={
                      userAvatar
                        ? { uri: userAvatar }
                        : require("../../assets/default.png")
                    }
                    className="w-14 h-14 rounded-full"
                  />

                  <View className="ml-3">
                    <Text className="text-base font-semibold text-gray-800">
                      {userName || "Người dùng"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Status Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-3 px-5"
            >
              {statusTabs.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setActiveStatus(index)}
                  className={`mr-3 px-4 py-2 rounded-full ${
                    index === activeStatus ? "bg-indigo-600" : "bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      index === activeStatus ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Search Input */}
            <View className="flex-row items-center bg-white rounded-lg px-4 w-full mx-2 h-12 mb-4">
              <View className="flex-row items-center flex-1 border border-gray-200 rounded-md h-full px-3">
                <Feather name="search" size={20} color="#9ca3af" />
                <TextInput
                  placeholder="Tìm theo tên"
                  placeholderTextColor="#9ca3af"
                  className="flex-1 ml-3 text-base text-gray-800"
                  value={searchText}
                  onChangeText={setSearchText}
                />
              </View>
            </View>

            {/* Loading */}
            {isLoading && (
              <ActivityIndicator
                size="large"
                color="#6366f1"
                className="mt-10"
              />
            )}
          </>
        }
        data={filteredPosts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={async () => {
              if (userId) await fetchMyPosts(userId);
            }}
            colors={["#6366f1"]} // màu của spinner (tím indigo)
            tintColor="#6366f1"
          />
        }
        ListEmptyComponent={
          isLoading ? null : (
            <View className="items-center mt-10">
              <Text className="text-base font-semibold text-gray-800 mb-1">
                Không tìm thấy tin đăng
              </Text>
              <Text className="text-sm text-gray-500 text-center mb-4">
                Bạn hiện tại không có tin đăng nào cho trạng thái này
              </Text>
              <TouchableOpacity
                className="bg-amber-400 px-6 py-2 rounded-lg shadow"
                onPress={() => navigation.navigate("ChooseCategoryScreen")}
              >
                <Text className="font-semibold text-sm text-gray-800">
                  Đăng tin
                </Text>
              </TouchableOpacity>
            </View>
          )
        }
        renderItem={({ item }) => {
          const expiryInfo = getExpiryMessage(item);
          return (
            <View className="flex-row items-center bg-white rounded-xl p-3 mb-3 shadow-sm border border-gray-100">
              <TouchableOpacity
                className="flex-1 flex-row items-center"
                onPress={() =>
                  navigation.navigate("ProductDetail", {
                    product: item,
                  })
                }
              >
                <Image
                  source={{ uri: item.image }}
                  className="w-20 h-20 rounded-lg"
                  resizeMode="cover"
                />
                <View className="flex-1 ml-3">
                  <Text
                    className="text-base font-semibold text-gray-800 mb-1"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <View className="flex-row items-center mb-1">
                    <Feather 
                      name={item.group ? "users" : "globe"} 
                      size={12} 
                      color="#6b7280" 
                    />
                    <Text className="text-xs text-gray-500 ml-1">
                      {item.group && item.group.name 
                        ? item.group.name 
                        : "Toàn trường"}
                    </Text>
                  </View>
                  <View className="flex-row items-center mb-1">
                    <Feather name="tag" size={12} color="#6b7280" />
                    <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
                      {item.tag}
                    </Text>
                  </View>
                  <Text className="text-sm font-medium text-indigo-600 mb-1">
                    {item.price}
                  </Text>
                  <Text className={`text-xs font-medium ${expiryInfo.color}`}>
                    {expiryInfo.text}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* More options */}
              <TouchableOpacity
                onPress={(event) =>
                  handleOpenMenu(item, event.nativeEvent.pageY)
                }
                className="p-2"
              >
                <Feather name="more-vertical" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <Menu />

      {/* Options Menu Modal */}
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
            className="bg-white rounded-lg shadow-xl border border-gray-100 w-44"
            onStartShouldSetResponder={() => true}
          >
            {selectedProduct && (
              <>
                {/* Edit */}
                {(selectedProduct.productStatus?.id === 1 ||
                  selectedProduct.productStatus?.id === 2 ||
                  selectedProduct.productStatus?.id === 3) && (
                  <TouchableOpacity
                    className="flex-row items-center p-3"
                    onPress={handleEdit}
                  >
                    <Feather name="edit-2" size={18} color="#4b5563" />
                    <Text className="ml-2 text-base text-gray-700">
                      Chỉnh sửa
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Hide */}
                {selectedProduct.productStatus?.id === 2 && (
                  <TouchableOpacity
                    className="flex-row items-center p-3"
                    onPress={handleHideProduct}
                  >
                    <Feather name="eye-off" size={18} color="#4b5563" />
                    <Text className="ml-2 text-base text-gray-700">Ẩn tin</Text>
                  </TouchableOpacity>
                )}
                {/* Mark as Sold */}
                {selectedProduct.productStatus?.id === 2 && (
                  <TouchableOpacity
                    className="flex-row items-center p-3"
                    onPress={handleMarkAsSold}
                  >
                    <Feather name="check-circle" size={18} color="#16a34a" />
                    <Text className="ml-2 text-base text-green-700">
                      Đánh dấu đã bán
                    </Text>
                  </TouchableOpacity>
                )}
                {/* Unhide */}
                {selectedProduct.productStatus?.id === 4 && (
                  <TouchableOpacity
                    className="flex-row items-center p-3"
                    onPress={handleUnhideProduct}
                  >
                    <Feather name="eye" size={18} color="#4b5563" />
                    <Text className="ml-2 text-base text-gray-700">
                      Hiện lại
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Extend */}
                {selectedProduct.productStatus?.id === 5 && (
                  <TouchableOpacity
                    className="flex-row items-center p-3"
                    onPress={handleOpenReasonModal}
                  >
                    <Feather name="clock" size={18} color="#4b5563" />
                    <Text className="ml-2 text-base text-gray-700">
                      Gia hạn
                    </Text>
                  </TouchableOpacity>
                )}
                <View className="h-px bg-gray-100" />
                {/* Delete */}
                <TouchableOpacity
                  className="flex-row items-center p-3"
                  onPress={handleHardDeleteConfirm}
                >
                  <Feather name="trash-2" size={18} color="#ef4444" />
                  <Text className="ml-2 text-base text-red-600">
                    Xóa vĩnh viễn
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Extension Reason Modal */}
      <Modal
        transparent={true}
        visible={reasonModalVisible}
        animationType="fade"
        onRequestClose={() => setReasonModalVisible(false)}
      >
        <Pressable
          className="flex-1 justify-center items-center bg-black/50"
          onPress={() => setReasonModalVisible(false)}
        >
          <Pressable
            className="w-4/5 bg-white rounded-lg p-5 shadow-lg max-w-sm"
            onStartShouldSetResponder={() => true}
          >
            <Text className="text-lg font-semibold text-gray-800 mb-4">
              Chọn lý do gia hạn
            </Text>

            {EXTENSION_REASONS.map((reason, index) => (
              <TouchableOpacity
                key={index}
                className="py-3 border-b border-gray-100"
                onPress={() => handleSendExtensionRequest(reason)}
              >
                <Text className="text-base text-gray-700">{reason}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              className="mt-4 bg-gray-100 py-3 rounded-lg items-center"
              onPress={() => setReasonModalVisible(false)}
            >
              <Text className="text-base font-medium text-gray-800">Hủy</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
