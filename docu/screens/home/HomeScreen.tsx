import {
  View,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Text,
  StatusBar,
  FlatList,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Linking,
  Modal,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Menu from "../../components/Menu";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Category, Product, RootStackParamList } from "../../types";
import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import ProductCard from "../../components/ProductCard";
import SearchProduct from "../products/SearchProduct";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "../../global.css";
import { path } from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotification } from "../Notification/NotificationContext";
import React from "react";
import InterestRenewalDialog from "../../components/InterestRenewalDialog";
import SuggestionBottomSheet from "../../components/SuggestionBottomSheet";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
  route: any;
};

const filters = [
  { id: "1", label: "Mới nhất" },
  { id: "2", label: "Gợi ý cho bạn", type: "navigate" },
  { id: "3", label: "Đồ miễn phí" },
  { id: "4", label: "Trao đổi" },
];

export default function HomeScreen({ navigation, route }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("Mới nhất");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const [refreshing, setRefreshing] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const { unreadCount, setUnreadCount, fetchUnreadCount } = useNotification();

  const [isMenuModalVisible, setMenuModalVisible] = useState(false);

  const [expiringInterests, setExpiringInterests] = useState<any[]>([]);
  const [currentInterestIndex, setCurrentInterestIndex] = useState(0);
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestTitle, setSuggestTitle] = useState("");

  useEffect(() => {
    if (route.params?.showSuggestions) {
      setSuggestions(route.params.suggestions || []);
      setSuggestTitle(route.params.suggestTitle || "Gợi ý cho bạn");
      setShowSuggestions(true);
      
      // Clear params to avoid showing again on refocus
      navigation.setParams({ showSuggestions: undefined, suggestions: undefined, suggestTitle: undefined });
    }
  }, [route.params]);

  useEffect(() => {
    const checkExpiringInterests = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (token) {
          const res = await axios.get(`${path}/products/interests/expiring`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data && res.data.length > 0) {
            setExpiringInterests(res.data);
            setCurrentInterestIndex(0);
            setShowRenewalDialog(true);
          }
        }
      } catch (err) {
        console.log("Lỗi check expiring interests:", err);
      }
    };
    checkExpiringInterests();
  }, []);

  const handleRenewInterest = async (keep: boolean) => {
    try {
      const token = await AsyncStorage.getItem("token");
      const currentInterest = expiringInterests[currentInterestIndex];
      if (currentInterest && token) {
        await axios.patch(`${path}/products/${currentInterest.id}/renew-interest`, {
          keepSuggesting: keep
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch(err) {
      console.log("Lỗi gia hạn interest:", err);
    }

    if (currentInterestIndex < expiringInterests.length - 1) {
      setCurrentInterestIndex(prev => prev + 1);
    } else {
      setShowRenewalDialog(false);
    }
  };

  const fetchCategories = () => {
    return axios
      .get(`${path}/categories`)
      .then((res) => {
        const mapped = res.data.map((item: Category) => ({
          id: item.id.toString(),
          name: item.name,
          image: item.image
            ? item.image.startsWith("http")
              ? item.image
              : `${path}${item.image.startsWith("/") ? "" : "/uploads/categories/"}${item.image}`
            : `${path}/uploads/categories/default.png`,
        }));
        setCategories(mapped);
      })
      .catch((err) => {
        console.log("Lỗi khi lấy danh mục:", err.message);
        throw err;
      });
  };

  const fetchProducts = async (filterType?: string): Promise<void> => {
    try {
      let url = `${path}/products`; // mặc định: tất cả sản phẩm

      if (filterType === "Miễn phí") {
        url = `${path}/products/free`; // API lấy đồ miễn phí
      } else if (filterType === "Trao đổi") {
        url = `${path}/products/exchange`; // API lấy đồ trao đổi
      }

      console.log("Fetching URL:", url);

      // 🔹 Gọi API
      const res = await axios.get(url);
      const rawData = Array.isArray(res.data) ? res.data : [res.data];

      // 🔹 Xử lý dữ liệu
      const mapped = rawData.map((item) => {
        // Lấy URL ảnh chính
        const imageUrl = (() => {
          if (!item.thumbnail_url && item.images?.length)
            return item.images[0].image_url;

          const url = item.thumbnail_url || "";
          if (url.startsWith("http")) return url;

          return `${path}${url}`;
        })();

        // Xử lý địa chỉ
        let locationText = "Chưa rõ địa chỉ";
        if (item.address_json) {
          try {
            const addr =
              typeof item.address_json === "string"
                ? JSON.parse(item.address_json)
                : item.address_json;
            if (addr.full) {
              locationText = addr.full;
            } else {
              const parts = [addr.ward, addr.district, addr.province]
                .filter(Boolean)
                .slice(-2);
              locationText =
                parts.length > 0 ? parts.join(", ") : "Chưa rõ địa chỉ";
            }
          } catch (e) {
            console.log("Lỗi parse address cho product", item.id, ":", e);
            locationText = "Chưa rõ địa chỉ";
          }
        }

        // Thời gian đăng
        const createdAt = item.created_at
          ? new Date(new Date(item.created_at).getTime() + 7 * 60 * 60 * 1000)
          : new Date();
        const timeDisplay = timeSince(createdAt);

        // Danh mục
        let tagText = "Không có danh mục";
        const categoryName = item.category?.name || null;
        const subCategoryName = item.subCategory?.name || null;
        if (categoryName && subCategoryName)
          tagText = `${categoryName} - ${subCategoryName}`;
        else if (categoryName) tagText = categoryName;
        else if (subCategoryName) tagText = subCategoryName;

        // 🟢 Trả về đầy đủ dữ liệu sản phẩm
        return {
          id: item.id.toString(),
          image: imageUrl,
          name: item.name || "Không có tiêu đề",
          price: (() => {
            if (item.dealType?.name === "Miễn phí") return "Miễn phí";
            if (item.dealType?.name === "Trao đổi") return "Trao đổi";
            return item.price
              ? `${Number(item.price).toLocaleString("vi-VN")} đ`
              : "Liên hệ";
          })(),
          location: locationText,
          time: timeDisplay,
          tag: tagText,
          authorName: item.user?.fullName || item.user?.name || "Ẩn danh",
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
            item.productModel && item.productModel.name
              ? item.productModel
              : null,
          processor:
            item.processor && item.processor.name ? item.processor : null,
          ramOption:
            item.ramOption && item.ramOption.name ? item.ramOption : null,
          storageType:
            item.storageType && item.storageType.name ? item.storageType : null,
          graphicsCard:
            item.graphicsCard && item.graphicsCard.name
              ? item.graphicsCard
              : null,
          breed: item.breed && item.breed.name ? item.breed : null,
          ageRange: item.ageRange && item.ageRange.name ? item.ageRange : null,
          gender: item.gender && item.gender.name ? item.gender : null,
          engineCapacity:
            item.engineCapacity && item.engineCapacity.name
              ? item.engineCapacity
              : null,
          mileage: item.mileage || null,

          address_json: item.address_json || { full: locationText },
          phone: item.user?.phone || null,
          author: item.author || null,
          year: item.year || null,

          created_at: item.created_at || new Date().toISOString(),
          updated_at: item.updated_at || undefined,

          sub_category_id: item.sub_category_id || null,
          status_id: item.status_id?.toString() || undefined,
          visibility_type: item.visibility_type?.toString() || undefined,
          group_id: item.group_id || null,
        };
      });

      setProducts(mapped);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.response) {
          console.log("Lỗi từ server:", err.response.data);
        } else if (err.request) {
          console.log("Không nhận được phản hồi từ server:", err.request);
        } else {
          console.log("Lỗi khi gọi API:", err.message);
        }
      } else {
        console.error("Lỗi không xác định:", err);
      }
    }
  };
  useEffect(() => {
    const loadProducts = async () => {
      // 1. Bắt đầu loading
      setIsLoading(true);
      //  Xóa list cũ để màn hình trống sạch sẽ trước khi hiện cái mới
      setProducts([]);

      try {
        let apiFilter: string | undefined;
        if (selectedFilter === "Đồ miễn phí") apiFilter = "Miễn phí";
        else if (selectedFilter === "Trao đổi") apiFilter = "Trao đổi";

        // Gọi hàm fetch có sẵn của bạn
        await fetchProducts(apiFilter);
      } catch (error) {
        console.log("Lỗi load tab:", error);
      } finally {
        // 2. Kết thúc loading dù thành công hay thất bại
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [selectedFilter]);

  const fetchFavorites = async () => {
    try {
      const userIdStr = await AsyncStorage.getItem("userId");
      if (!userIdStr) return;
      const userId = parseInt(userIdStr, 10);
      const res = await axios.get(`${path}/favorites/user/${userId}`);
      setFavoriteIds(res.data.productIds || []);
    } catch (err) {
      console.log("Lỗi khi lấy danh sách yêu thích:", err);
      throw err;
    }
  };

  // Gọi các hàm fetch khi component mount lần đầu
  useEffect(() => {
    fetchCategories();
    fetchFavorites();
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const handleToggleFavorite = async (productId: string) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập để yêu thích sản phẩm.");
        return;
      }

      // Gửi token để BE tự nhận diện user
      await axios.post(
        `${path}/favorites/toggle/${productId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Sau khi toggle, lấy lại danh sách favorites
      const userIdStr = await AsyncStorage.getItem("userId");
      if (userIdStr) {
        const res = await axios.get(
          `${path}/favorites/user/${parseInt(userIdStr, 10)}`
        );
        setFavoriteIds(res.data.productIds || []);
      }
    } catch (err: any) {
      console.log("Lỗi toggle yêu thích:", err.response?.data || err.message);
      if (err.response?.status === 401) {
        Alert.alert("Phiên đăng nhập hết hạn", "Vui lòng đăng nhập lại.");
      }
    }
  };

  // --- Hàm tiện ích tính toán khoảng thời gian ---
  const timeSince = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    // Nếu khoảng thời gian < 60 giây, trả về "Vừa đăng" (hoặc "vài giây trước")
    if (seconds < 60) {
      return seconds < 5 ? "vừa xong" : `${seconds} giây trước`;
    }

    let interval = seconds / 31536000;
    if (interval >= 1) {
      return Math.floor(interval) + " năm trước";
    }
    interval = seconds / 2592000;
    if (interval >= 1) {
      return Math.floor(interval) + " tháng trước";
    }
    interval = seconds / 86400;
    if (interval >= 1) {
      return Math.floor(interval) + " ngày trước";
    }
    interval = seconds / 3600;
    if (interval >= 1) {
      return Math.floor(interval) + " giờ trước";
    }
    interval = seconds / 60;
    return Math.floor(interval) + " phút trước";
  };

  const handleBellPress = async () => {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      return navigation.navigate("NotificationScreen");
    }
    try {
      await axios.patch(`${path}/notifications/user/${userId}/mark-all-read`);
      setUnreadCount(0);
    } catch (error) {
      console.error("Lỗi khi mark all as read:", error);
    } finally {
      navigation.navigate("NotificationScreen");
    }
  };

  useEffect(() => {
    const check = async () => {
      const data = await AsyncStorage.getItem("JOIN_GROUP_SUCCESS");
      if (data) {
        const { groupName } = JSON.parse(data);
        Alert.alert(
          "BẠN ĐÃ THAM GIA NHÓM!",
          `Chào mừng bạn đến với ${groupName}!`,
          [
            {
              text: "OK",
              onPress: () => AsyncStorage.removeItem("JOIN_GROUP_SUCCESS"),
            },
          ]
        );
      }
    };
    check();
  }, []);

  // 5. Tạo hàm onRefresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Gọi song song các hàm fetch
      await Promise.all([
        fetchCategories(),
        fetchProducts(selectedFilter),
        fetchFavorites(),
        fetchUnreadCount(),
      ]);
    } catch (error) {
      console.error("Lỗi khi làm mới:", error);
      Alert.alert("Lỗi", "Không thể tải lại dữ liệu. Vui lòng thử lại.");
    } finally {
      setRefreshing(false);
    }
  }, [selectedFilter, fetchUnreadCount]); // fetchUnreadCount là dependency ổn định từ context

  const handleOpenWebsite = () => {
    Alert.alert(
      "Thông báo",
      "Website ttgb.id.vn hiện đang trong giai đoạn phát triển và chưa hoàn thiện 100%. Chúng mình đang nỗ lực hết sức để cập nhật trong thời gian sớm nhất.\n\nRất xin lỗi vì sự bất tiện này và mong bạn thông cảm!\n\nBạn vẫn muốn tiếp tục truy cập để tham khảo trước chứ?",
      [
        {
          text: "Quay lại",
          style: "cancel",
          onPress: () => console.log("Đã hủy"),
        },
        {
          text: "Tiếp tục",
          onPress: () => {
            Linking.openURL("https://ttgb.id.vn").catch((err) =>
              console.error("Không thể mở link:", err)
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" hidden={false} />

      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-[#f8fafc] border-b border-gray-100 z-10">
        {/* Menu Hamburger */}
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-white border border-gray-200/80 items-center justify-center shadow-sm active:scale-95 flex"
          onPress={() => setMenuModalVisible(true)}
        >
          <Feather name="menu" size={18} color="#1a1a1a" />
        </TouchableOpacity>

        {/* Thanh tìm kiếm */}
        <TouchableOpacity
          className="flex-1 mx-3 h-10 bg-white border border-gray-200/80 rounded-full px-4 flex-row items-center shadow-sm active:bg-gray-50/50"
          onPress={() => navigation.navigate("SearchProduct")}
        >
          <Feather name="search" size={14} color="#666" />
          <Text className="text-gray-400 text-xs font-semibold ml-2">Bạn đang tìm đồ cũ gì?</Text>
        </TouchableOpacity>

        {/* Icon trái tim */}
        <TouchableOpacity
          className="w-10 h-10 rounded-full bg-white border border-gray-200/80 items-center justify-center shadow-sm mr-2 active:scale-95 flex"
          onPress={() => navigation.navigate("SavedPostsScreen")}
        >
          <Feather name="heart" size={17} color="#1a1a1a" />
        </TouchableOpacity>

        {/* Icon chuông */}
        <TouchableOpacity 
          className="w-10 h-10 rounded-full bg-white border border-gray-200/80 items-center justify-center shadow-sm relative active:scale-95 flex" 
          onPress={handleBellPress}
        >
          <Feather name="bell" size={17} color="#1a1a1a" />

          {/* Badge */}
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full items-center justify-center border-2 border-white px-1">
              <Text className="text-white text-[8px] font-extrabold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Banner with Double-Bezel Nested Architecture */}
        <View className="p-4 bg-[#f8fafc]">
          <View className="p-1 rounded-[24px] bg-black/[0.02] border border-black/[0.04]">
            <View className="bg-white rounded-[20px] p-5 overflow-hidden relative shadow-sm border border-gray-100 flex-row items-center justify-between">
              {/* Subtle background glow */}
              <View className="absolute -top-12 -right-12 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              
              <View className="flex-1 pr-3">
                <View className="rounded-full px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 self-start mb-2">
                  <Text className="text-blue-600 text-[9px] uppercase tracking-wider font-extrabold">TDC Market</Text>
                </View>
                <Text className="text-lg font-extrabold text-gray-800 leading-tight">
                  Mua bán & Trao đổi đồ cũ sinh viên
                </Text>
                <Text className="text-gray-450 text-[11px] leading-relaxed mt-1">
                  Đăng tin nhanh chóng, định giá tự động bằng trợ lý AI thông minh.
                </Text>
              </View>

              <Image
                source={require("../../assets/banner.png")}
                className="w-24 h-24 rounded-xl"
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Tiêu đề danh mục */}
        <View className="px-5 mt-4 mb-2">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Khám phá danh mục
          </Text>
        </View>

        {/* Danh mục vuốt ngang */}
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="items-center mr-4 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm w-24 hover:border-blue-500/30 flex"
              onPress={() => {
                navigation.navigate("CategoryIndex", {
                  categoryId: item.id.toString(),
                  categoryName: item.name,
                });
              }}
            >
              <View className="w-12 h-12 rounded-full bg-blue-500/5 items-center justify-center mb-2 flex">
                <Image
                  source={{ uri: item.image }}
                  className="w-6 h-6"
                  resizeMode="contain"
                />
              </View>
              <Text
                className="text-[11px] font-bold text-gray-800 text-center leading-tight"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{ width: "100%" }}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Filter Selection Tabs */}
        <View className="px-4 mt-6">
          <FlatList
            data={filters}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = selectedFilter === item.label;
              return (
                <TouchableOpacity
                  className={`px-4 py-2 mr-3 rounded-full border transition-all ${
                    isSelected
                      ? "bg-blue-600 border-blue-600 shadow-sm"
                      : "bg-white border-gray-200/80"
                  }`}
                  onPress={() => {
                    if (item.type === "navigate") {
                      navigation.navigate("SuggestionScreen");
                    } else {
                      setSelectedFilter(item.label);
                    }
                  }}
                >
                  <Text
                    className={`${
                      isSelected ? "text-white font-bold" : "text-gray-600"
                    } text-xs font-semibold`}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
        {/* Danh sách sản phẩm */}
        <View className="px-4 mt-4">
          {isLoading ? (
            <View className="py-20 items-center justify-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-gray-400 mt-2 text-sm">
                Đang tải dữ liệu...
              </Text>
            </View>
          ) : (
            /* 👇 Nếu không load thì hiện FlatList như cũ */
            <FlatList
              data={products.filter((p) => p.productStatus?.id === 2)}
              numColumns={2}
              keyExtractor={(item) => item.id}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              contentContainerStyle={{ paddingBottom: 80 }}
              scrollEnabled={false}
              ListEmptyComponent={
                // Thêm dòng này để báo nếu không có sản phẩm nào
                <Text className="text-center text-gray-500 mt-10">
                  Không tìm thấy sản phẩm nào.
                </Text>
              }
              renderItem={({ item }) => (
                <ProductCard
                  product={item}
                  isFavorite={favoriteIds.includes(String(item.id))}
                  onToggleFavorite={() => handleToggleFavorite(item.id)}
                  onPress={() =>
                    navigation.navigate("ProductDetail", { product: item })
                  }
                  onPressPostType={(pt) => {
                    if (pt.id == "1") navigation.navigate("SellProductScreen");
                    else if (pt.id == "2")
                      navigation.navigate("PurchaseRequestScreen");
                  }}
                />
              )}
            />
          )}
        </View>
      </ScrollView>
      {/* Menu dưới */}
      <Menu />

      {/* 👇 Modal Menu hiển thị từ dưới lên */}
      <Modal
        visible={isMenuModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuModalVisible(false)}
      >
        {/* Vùng background: Đã xóa 'bg-black/50' để trong suốt */}
        <TouchableOpacity
          className="flex-1 justify-end"
          activeOpacity={1}
          onPress={() => setMenuModalVisible(false)}
        >
          {/* Nội dung modal: Thêm shadow-2xl và shadow-black để đổ bóng */}
          <TouchableOpacity
            activeOpacity={1}
            className="bg-white rounded-t-2xl p-6 shadow-2xl shadow-black elevation-10"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="items-center mb-4">
              <View className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </View>

            <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
              Menu mở rộng
            </Text>

            {/* ... (Phần nút bấm giữ nguyên) ... */}

            {/* Link Website */}
            <TouchableOpacity
              className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 active:bg-gray-100"
              onPress={() => {
                setMenuModalVisible(false);
                handleOpenWebsite();
              }}
            >
              <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
                <FontAwesome5 name="globe" size={20} color="#3b82f6" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-800">
                  Truy cập Website
                </Text>
                <Text className="text-xs text-gray-500">ttgb.id.vn</Text>
              </View>
              <Feather name="chevron-right" size={20} color="#9ca3af" />
            </TouchableOpacity>

            {/* Nút Đóng */}
            <TouchableOpacity
              className="bg-gray-200 py-3 rounded-xl items-center"
              onPress={() => setMenuModalVisible(false)}
            >
              <Text className="font-semibold text-gray-700">Đóng</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {expiringInterests.length > 0 && (
        <InterestRenewalDialog
          visible={showRenewalDialog}
          productName={expiringInterests[currentInterestIndex]?.name || "Sản phẩm"}
          onRenew={() => handleRenewInterest(true)}
          onCancel={() => handleRenewInterest(false)}
        />
      )}

      <SuggestionBottomSheet
        visible={showSuggestions}
        suggestions={suggestions}
        onClose={() => setShowSuggestions(false)}
        onItemPress={(item) => {
          setShowSuggestions(false);
          navigation.navigate("ProductDetail", { product: item });
        }}
        title={suggestTitle}
      />
    </SafeAreaView>
  );
}
