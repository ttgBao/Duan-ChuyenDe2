import React, { useEffect, useState, useCallback, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  ScrollView,
  Text,
  View,
  Image,
  useWindowDimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Platform,
  ActionSheetIOS,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { StatusBar } from "expo-status-bar";
import { FontAwesome, MaterialIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { path } from "../../config";
import { useFocusEffect } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";

const DEFAULT_AVATAR = require("../../assets/default.png");
const DEFAULT_COVER = require("../../assets/cover_default.jpg");
interface User {
  id: string;
  name: string;
  image?: string;
  coverImage?: string;
  isFollowing?: boolean;
  followerCount?: number;
  postCount?: number;
  soldCount?: number;
}

// Star Rating Component
const StarRating = ({ rating, editable = false, onChange }: any) => (
  <View className="flex-row gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => editable && onChange?.(star)}
        disabled={!editable}
        className="p-0.5"
      >
        <Ionicons
          name={star <= rating ? "star" : "star-outline"}
          size={14}
          color="#eab308"
        />
      </TouchableOpacity>
    ))}
  </View>
);

// Rating Card Component
const RatingCard = ({ rating }: any) => {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 3600) return "Vừa xong";
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    return `${Math.floor(seconds / 86400)} ngày trước`;
  };

  return (
    <View className="bg-white p-4 rounded-2xl mb-3 border border-slate-100 shadow-xs">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className="p-0.5 rounded-full bg-slate-50 border border-slate-100 mr-2.5">
            <Image
              source={
                rating.reviewer.avatar
                  ? { uri: rating.reviewer.avatar }
                  : DEFAULT_AVATAR
              }
              className="w-9 h-9 rounded-full"
            />
          </View>
          <View>
            <Text className="font-semibold text-xs text-slate-800">
              {rating.reviewer?.name || "Người dùng"}
            </Text>
            <Text className="text-[10px] text-slate-400 mt-0.5">
              {timeAgo(rating.createdAt)}
            </Text>
          </View>
        </View>
        <StarRating rating={rating.stars} editable={false} />
      </View>
      {rating.content && (
        <Text className="text-slate-600 text-xs leading-relaxed pl-1">
          {rating.content}
        </Text>
      )}
    </View>
  );
};

const mapProductData = (item: any) => {
  // Xử lý ảnh thumbnail
  const imageUrl = (() => {
    if (!item.thumbnail_url && item.images?.length)
      return item.images[0].image_url;
    const url = item.thumbnail_url || "";
    if (url.startsWith("http")) return url;
    return `${path}${url}`;
  })();

  return {
    ...item,

    authorName:
      item.author_name ||
      item.user?.name ||
      item.user?.nickname ||
      "Người dùng",

    image: imageUrl,
    price: item.price ? item.price.toString() : "0",
    user: item.user || { id: item.user_id, name: "Người dùng" },
  };
};

const RenderProductItem = ({ item, navigation }: any) => {
  const imageUrl =
    item.thumbnail_url ||
    (item.images?.length ? item.images[0].image_url : null);
  const finalImage = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : `${path}${imageUrl}`
    : null;

  const displayPrice =
    item.dealType?.name === "Miễn phí"
      ? "Miễn phí"
      : item.dealType?.name === "Trao đổi"
        ? "Trao đổi"
        : item.price
          ? `${Number(item.price).toLocaleString("vi-VN")} đ`
          : "Liên hệ";

  return (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-2xl p-3 mb-3 shadow-xs border border-slate-100 mx-4"
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    >
      <View className="p-0.5 rounded-xl bg-slate-50 border border-slate-100">
        <Image
          source={
            finalImage ? { uri: finalImage } : require("../../assets/default.png")
          }
          className="w-20 h-20 rounded-lg bg-slate-100"
          resizeMode="cover"
        />
      </View>
      <View className="flex-1 ml-3.5 justify-center">
        {/* Tên sản phẩm */}
        <Text
          className="text-sm font-bold text-slate-800 mb-1.5"
          numberOfLines={1}
        >
          {item.name}
        </Text>

        {/* Tên nhóm / Toàn trường */}
        <View className="flex-row items-center mb-1">
          <Ionicons
            name={item.group ? "people-outline" : "globe-outline"}
            size={13}
            color="#94a3b8"
          />
          <Text className="text-xs text-slate-500 ml-1">
            {item.group && item.group.name ? item.group.name : "Toàn trường"}
          </Text>
        </View>

        {/* Tag danh mục */}
        <View className="flex-row items-center mb-2.5">
          <Ionicons name="pricetag-outline" size={13} color="#94a3b8" />
          <Text className="text-xs text-slate-500 ml-1" numberOfLines={1}>
            {item.tag || item.category?.name || "Khác"}
          </Text>
        </View>

        {/* Giá tiền */}
        <Text className="text-sm font-bold text-blue-600">
          {displayPrice}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default function UserInforScreen({ navigation, route }: any) {
  const layout = useWindowDimensions();
  // const route = useRoute<any>();
  // 1. Lấy userId từ route params
  const { userId: profileUserId } = route.params as { userId: string | number };
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [myRating, setMyRating] = useState<any>(null);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedStars, setSelectedStars] = useState(0);
  const [ratingContent, setRatingContent] = useState("");
  const [ratingMenuVisible, setRatingMenuVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [reportReason, setReportReason] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);
  const [reportVisible, setReportVisible] = useState(false);

  const [displayingProducts, setDisplayingProducts] = useState<any[]>([]);
  const [soldProducts, setSoldProducts] = useState<any[]>([]);

  const [reportDescription, setReportDescription] = useState("");
  const [isSendingReport, setIsSendingReport] = useState(false);

  const [activeTab, setActiveTab] = useState<"displaying" | "sold">("displaying");

  // States
  const [showMore, setShowMore] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const descriptionRef = useRef<TextInput>(null);

  // Check if current user is viewing their own profile
  const isOwnProfile = currentUserId === profileUserId?.toString();

  // 2. Fetch current user id (người đang đăng nhập)
  useEffect(() => {
    AsyncStorage.getItem("userId").then(setCurrentUserId);
  }, []);

  // Data Fetching
  // Data Fetching
  // Data Fetching
  const fetchAllData = useCallback(async () => {
    const token = await AsyncStorage.getItem("token");
    const storedCurrentUserId = await AsyncStorage.getItem("userId");

    if (!profileUserId) return;

    try {
      // Gọi song song tất cả các API cần thiết
      const [
        profileRes,
        ratingsRes,
        avgRes,
        checkRes,
        productsRes,
        // 👇 THÊM 2 API NÀY ĐỂ LẤY SỐ LIỆU FOLLOW
        followerCountRes,
        followingCountRes,
      ] = await Promise.all([
        // 1. Thông tin cơ bản
        axios.get(`${path}/users/${profileUserId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }),
        // 2. Danh sách đánh giá
        axios.get(`${path}/users/${profileUserId}/ratings`),
        // 3. Điểm đánh giá trung bình
        axios.get(`${path}/users/${profileUserId}/rating-average`),
        // 4. Kiểm tra mình đã đánh giá chưa
        token && storedCurrentUserId !== profileUserId.toString()
          ? axios
              .get(`${path}/users/${profileUserId}/check-rating`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .catch(() => ({ data: { hasRated: false } }))
          : Promise.resolve({ data: { hasRated: false } }),
        // 5. Danh sách bài đăng
        axios.get(`${path}/products/my-posts/${profileUserId}`),

        // 6. 👇 LẤY SỐ NGƯỜI THEO DÕI (follower-count)
        axios.get(`${path}/follow/${profileUserId}/follower-count`),

        // 7. 👇 LẤY SỐ NGƯỜI ĐANG THEO DÕI (following-count)
        axios.get(`${path}/follow/${profileUserId}/following-count`),
      ]);

      // --- Kiểm tra trạng thái "Đã theo dõi" hay chưa ---
      let isFollowingStatus = false;
      if (
        token &&
        storedCurrentUserId &&
        storedCurrentUserId !== profileUserId.toString()
      ) {
        try {
          const followRes = await axios.get(`${path}/follow/status`, {
            params: {
              followerId: Number(storedCurrentUserId),
              followingId: Number(profileUserId),
            },
            headers: { Authorization: `Bearer ${token}` },
          });
          isFollowingStatus = followRes.data.isFollowing;
        } catch (e) {
          console.log("Lỗi check follow:", e);
        }
      }

      // --- CẬP NHẬT STATE USER ---
      setUser({
        ...profileRes.data,
        isFollowing: isFollowingStatus,
        // 👇 Gán số liệu lấy được vào đây
        followerCount: followerCountRes.data.count,
        followingCount: followingCountRes.data.count,
      });

      // Các phần còn lại giữ nguyên...
      setAvatar(profileRes.data.image || null);
      setCoverImage(profileRes.data.coverImage || null);

      setRatings(ratingsRes.data || []);
      setAverageRating(
        avgRes.data.average ? Number(avgRes.data.average) : null
      );
      setRatingCount(avgRes.data.count || 0);

      if (checkRes.data.hasRated) {
        setMyRating(checkRes.data);
        setSelectedStars(checkRes.data.stars);
        setRatingContent(checkRes.data.content || "");
      } else {
        setMyRating(null);
        setSelectedStars(0);
        setRatingContent("");
      }

      const rawProducts = productsRes?.data;
      const allProducts = Array.isArray(rawProducts)
        ? rawProducts.map(mapProductData)
        : [];

      const active = allProducts.filter(
        (p: any) => p.productStatus?.id === 2 || p.status_id === 2
      );
      const sold = allProducts.filter(
        (p: any) => p.productStatus?.id === 6 || p.status_id === 6
      );

      setDisplayingProducts(active);
      setSoldProducts(sold);
    } catch (err: any) {
      console.log("Lỗi khi lấy dữ liệu:", err.message);
      Alert.alert("Lỗi", "Không thể tải thông tin người dùng.");
    }
  }, [profileUserId, currentUserId]);

  useFocusEffect(
    useCallback(() => {
      fetchAllData();
    }, [fetchAllData])
  );

  // Helper Function
  function timeSince(dateString: string) {
    if (!dateString) return "Mới tham gia";
    const diff = Date.now() - new Date(dateString).getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years > 0)
      return `${years} năm ${remainingMonths > 0 ? remainingMonths + " tháng" : ""}`;
    if (months > 0) return `${months} tháng`;
    return "Mới tham gia";
  }

  // Follow Function (chỉ thực hiện khi xem hồ sơ người khác)

  // Rating Functions (chỉ cho phép khi xem hồ sơ người khác)
  const handleSubmitRating = async () => {
    if (isOwnProfile || selectedStars === 0)
      return Alert.alert("Lỗi", "Vui lòng chọn số sao");
    const token = await AsyncStorage.getItem("token");
    if (!token) return Alert.alert("Lỗi", "Vui lòng đăng nhập để đánh giá.");

    try {
      const endpoint = `${path}/users/${user.id}/rate`;
      await axios.post(
        endpoint,
        { stars: selectedStars, content: ratingContent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert(
        "Thành công",
        myRating ? "Cập nhật thành công" : "Đánh giá thành công"
      );
      setRatingModalVisible(false);
      fetchAllData();
    } catch (err: any) {
      Alert.alert("Lỗi", err.response?.data?.message || "Gửi thất bại");
    }
  };

  const deleteMyRating = async () => {
    if (isOwnProfile) return;
    Alert.alert("Xóa đánh giá", "Bạn có chắc chắn?", [
      { text: "Hủy" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          const token = await AsyncStorage.getItem("token");
          if (!token) return;
          try {
            await axios.delete(`${path}/users/${user.id}/rate`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setMyRating(null);
            fetchAllData();
          } catch (error) {
            Alert.alert("Lỗi", "Không thể xóa đánh giá.");
          }
        },
      },
    ]);
  };

  const handleSendReport = async () => {
    // 0. Cấu hình giới hạn ký tự
    const MAX_LENGTH = 200;

    // 1. Kiểm tra độ dài trước (Tránh lỗi spam hoặc quá tải)
    if (reportDescription.length > MAX_LENGTH) {
      Alert.alert(
        "Nội dung quá dài",
        `Vui lòng nhập tối đa ${MAX_LENGTH} ký tự. Hiện tại: ${reportDescription.length} ký tự.`
      );
      return;
    }

    // 2. Kiểm tra chưa chọn lý do
    if (!reportReason) {
      Alert.alert("Thông báo", "Vui lòng chọn lý do báo cáo.");
      return;
    }

    // 3. Kiểm tra riêng: Nếu chọn "Lý do khác" thì bắt buộc phải nhập chữ
    if (reportReason === "Lý do khác" && !reportDescription.trim()) {
      Alert.alert(
        "Thông báo",
        "Với 'Lý do khác', bạn vui lòng nhập chi tiết vi phạm."
      );
      return;
    }

    const token = await AsyncStorage.getItem("token");
    if (!token || !currentUserId) {
      Alert.alert("Lỗi", "Bạn cần đăng nhập để báo cáo.");
      return;
    }

    try {
      setIsSendingReport(true);

      const finalReason = reportDescription.trim()
        ? `${reportReason}: ${reportDescription}`
        : reportReason;

      const payload = {
        reporter_id: Number(currentUserId),
        reported_user_id: Number(user.id),
        reason: finalReason,
      };

      await axios.post(`${path}/reports`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert("Thành công", "Đã gửi báo cáo tới ban quản trị.");

      setReportReason(null);
      setReportDescription("");
      setReportVisible(false);
    } catch (error: any) {
      console.log("Report Error:", error.response?.data || error);
      const msg =
        error.response?.data?.message || "Có lỗi xảy ra khi gửi báo cáo.";
      Alert.alert("Thất bại", msg);
    } finally {
      setIsSendingReport(false);
    }
  };
  // --- HÀM 1: UPLOAD ẢNH LÊN CLOUDINARY VÀ SERVER ---
  const uploadImage = async (
    field: "image" | "coverImage",
    fileUri: string
  ) => {
    if (!fileUri) return alert("Lỗi: Không có đường dẫn ảnh!");
    const userId = await AsyncStorage.getItem("userId");
    const token = await AsyncStorage.getItem("token");
    if (!userId || !token) return alert("Vui lòng đăng nhập!");
    setIsUploading(true);

    try {
      // 1️⃣ Upload lên Cloudinary
      const cloudinaryUrl =
        "https://api.cloudinary.com/v1_1/dagyeu6h2/image/upload";
      const formData = new FormData();
      formData.append("file", {
        uri: fileUri,
        name: "photo.jpg",
        type: "image/jpeg",
      } as any);
      formData.append("upload_preset", "products");

      const cloudinaryResponse = await axios.post(cloudinaryUrl, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = cloudinaryResponse.data.secure_url;
      if (!imageUrl) throw new Error("Không nhận được URL từ Cloudinary");

      // 2️ Gửi URL lên server của bạn
      const serverResponse = await axios.patch(
        `${path}/users/${userId}`,
        { [field]: imageUrl },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedUser = serverResponse.data;
      if (!updatedUser)
        return alert("Upload thành công nhưng không nhận được dữ liệu user!");

      // 3️ Cập nhật state local
      if (field === "image") setAvatar(updatedUser.image);
      if (field === "coverImage") setCoverImage(updatedUser.coverImage);
      setUser(updatedUser);
      alert("Cập nhật ảnh thành công!");
    } catch (err: any) {
      console.log("Upload Error:", err.response?.data || err.message || err);
      alert("Upload thất bại! Kiểm tra kết nối hoặc cấu hình Cloudinary.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- HÀM 2: PICK OR TAKE PHOTO ---
  const pickAndUpload = async (
    field: "image" | "coverImage",
    source: "camera" | "library"
  ) => {
    try {
      let result;
      const options: ImagePicker.ImagePickerOptions = {
        allowsEditing: true,
        quality: 0.8,
        aspect: field === "image" ? [1, 1] : [16, 9],
        mediaTypes: "images",
      };

      if (source === "camera") {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) return alert("Cần quyền camera để chụp ảnh!");
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        const { granted } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!granted) return alert("Cần quyền truy cập thư viện ảnh!");
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (result.canceled || !result.assets?.[0]?.uri) return;
      const uri = result.assets[0].uri;
      await uploadImage(field, uri);
    } catch (err) {
      console.log("Picker error:", err);
      alert("Lỗi khi chọn/chụp ảnh!");
    }
  };

  // --- HÀM 3: XOÁ ẢNH ---
  const deleteImage = async (field: "image" | "coverImage") => {
    const userId = await AsyncStorage.getItem("userId");
    const token = await AsyncStorage.getItem("token");
    if (!userId) return alert("Vui lòng đăng nhập trước!");
    if (isUploading) return;
    setIsUploading(true);

    try {
      const res = await axios.patch(
        `${path}/users/${userId}`,
        { [field]: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const updatedUser = res.data;
      if (field === "image") setAvatar(updatedUser.image);
      if (field === "coverImage") setCoverImage(updatedUser.coverImage);
      setUser(updatedUser);
      alert("Đã xoá ảnh thành công!");
    } catch (err: any) {
      console.log("Delete Error:", err.response?.data || err);
      alert("Xoá ảnh thất bại!");
    } finally {
      setIsUploading(false);
    }
  };

  // --- HÀM 4: HIỂN THỊ MENU CHỌN ẢNH ---
  const handleImageOptions = (field: "image" | "coverImage") => {
    if (isUploading) return;
    const options = [
      "Chụp ảnh",
      "Chọn ảnh từ thư viện",
      "Xoá ảnh hiện tại",
      "Hủy",
    ];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 3,
          destructiveButtonIndex: 2,
        },
        (index) => {
          if (index === 0) pickAndUpload(field, "camera");
          if (index === 1) pickAndUpload(field, "library");
          if (index === 2) deleteImage(field);
        }
      );
    } else {
      Alert.alert("Chọn hành động", "", [
        { text: "Chụp ảnh", onPress: () => pickAndUpload(field, "camera") },
        {
          text: "Chọn ảnh từ thư viện",
          onPress: () => pickAndUpload(field, "library"),
        },
        {
          text: "Xoá ảnh hiện tại",
          onPress: () => deleteImage(field),
          style: "destructive",
        },
        { text: "Hủy", style: "cancel" },
      ]);
    }
  };

  // Copy Link
  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(`${path}/users/${user?.id}`);
    Alert.alert("Thành công", "Liên kết đã được sao chép");
    setMenuVisible(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8fafc" }} edges={["top", "left", "right"]}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View className="flex flex-row items-center px-4 py-3 bg-white border-b border-slate-100 justify-between">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full active:bg-slate-100"
          >
            <Ionicons name="arrow-back" size={22} color="#1e293b" />
          </TouchableOpacity>
          <Text className="text-base font-bold text-slate-800">
            {user?.nickname || "Đang tải..."}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          className="p-2 rounded-full active:bg-slate-100"
        >
          <Ionicons name="ellipsis-vertical" size={20} color="#1e293b" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 bg-slate-50/50" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Cover Photo Container */}
        <View className="w-full h-[150px] relative bg-slate-200">
          <Image
            key={coverImage}
            className="w-full h-full object-cover"
            source={
              coverImage
                ? {
                    uri: coverImage.startsWith("http")
                      ? coverImage
                      : `${path}/${coverImage.replace(/\\/g, "/")}`,
                  }
                : DEFAULT_COVER
            }
            style={{ backgroundColor: "#e2e8f0" }}
          />

          {isOwnProfile && (
            <TouchableOpacity
              onPress={() => handleImageOptions("coverImage")}
              disabled={isUploading}
              className="absolute right-4 bottom-4 bg-black/60 p-2 rounded-full border border-white/15"
            >
              <Ionicons name="camera" size={18} color="white" />
            </TouchableOpacity>
          )}

          {isUploading && (
            <View className="absolute inset-0 bg-black/35 flex items-center justify-center">
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
        </View>

        {/* Profile Header Details Section */}
        <View className="px-6 pt-12 pb-5 bg-white border-b border-slate-100 flex flex-col relative" style={{ zIndex: 10 }}>
          {/* Double-Bezel Avatar (Matching UserScreen) */}
          <View className="absolute -top-10 left-6 p-1 rounded-full bg-slate-100/90 border border-slate-200/80 shadow-md" style={{ zIndex: 20 }}>
            <View className="w-20 h-20 rounded-full bg-white border-2 border-white overflow-hidden justify-center items-center relative">
              <Image
                key={avatar}
                className="w-full h-full rounded-full"
                source={
                  avatar
                    ? {
                        uri: avatar.startsWith("http")
                          ? avatar
                          : `${path}/${avatar.replace(/\\/g, "/")}`,
                      }
                    : DEFAULT_AVATAR
                }
                style={{ backgroundColor: "#e2e8f0" }}
              />
            </View>
            {isOwnProfile && (
              <TouchableOpacity
                onPress={() => handleImageOptions("image")}
                disabled={isUploading}
                className="absolute right-0 bottom-0 bg-blue-600 rounded-full p-1.5 border border-white shadow-sm active:bg-blue-700"
                style={{ zIndex: 30 }}
              >
                <Ionicons name="camera" size={12} color="white" />
              </TouchableOpacity>
            )}
          </View>
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-4">
              <View className="flex-row items-center gap-1.5 flex-wrap">
                <Text className="font-extrabold text-xl text-slate-900">
                  {user?.nickname || "..."}
                </Text>
                {user?.is_cccd_verified && (
                  <Ionicons name="checkmark-circle" size={18} color="#2563eb" />
                )}
              </View>

              <View className="flex-row items-center mt-2.5">
                {averageRating !== null ? (
                  <>
                    <StarRating rating={Math.round(averageRating)} />
                    <Text className="text-xs text-slate-500 ml-1.5 font-medium">
                      {averageRating.toFixed(1)} ({ratingCount} đánh giá)
                    </Text>
                  </>
                ) : (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="star-outline" size={13} color="#94a3b8" />
                    <Text className="text-xs text-slate-400 font-medium">Chưa có đánh giá</Text>
                  </View>
                )}
              </View>

              <View className="flex-row items-center gap-3 mt-3.5">
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-bold text-slate-800">
                    {user?.followerCount || 0}
                  </Text>
                  <Text className="text-xs text-slate-500">người theo dõi</Text>
                </View>
                <View className="w-1 h-1 rounded-full bg-slate-350" />
                <View className="flex-row items-center gap-1">
                  <Text className="text-xs font-bold text-slate-800">
                    {user?.followingCount || 0}
                  </Text>
                  <Text className="text-xs text-slate-500">đang theo dõi</Text>
                </View>
              </View>
            </View>

            {/* Follow / Edit Button */}
            {!isOwnProfile && (
              <TouchableOpacity
                onPress={async () => {
                  if (!user) return;
                  const token = await AsyncStorage.getItem("token");
                  if (!token || !currentUserId) {
                    return Alert.alert("Lỗi", "Vui lòng đăng nhập để theo dõi.");
                  }
                  try {
                    const res = await axios.post(
                      `${path}/follow/toggle`,
                      {
                        followerId: Number(currentUserId),
                        followingId: Number(user.id),
                      },
                      { headers: { Authorization: `Bearer ${token}` } }
                    );
                    const { isFollowing, followerCount } = res.data;
                    setUser((prev: any) => ({
                      ...prev,
                      isFollowing: isFollowing,
                      followerCount: followerCount,
                    }));
                  } catch (err: any) {
                    console.log("Lỗi Follow:", err);
                    Alert.alert("Lỗi", "Không thể thực hiện thao tác.");
                  }
                }}
                className={`py-2 px-4 rounded-full flex-row items-center gap-1.5 border shadow-sm ${
                  user?.isFollowing
                    ? "bg-slate-50 border-slate-200 active:bg-slate-100"
                    : "bg-blue-600 border-blue-600 active:bg-blue-700"
                }`}
              >
                <Ionicons
                  name={user?.isFollowing ? "checkmark" : "person-add"}
                  size={14}
                  color={user?.isFollowing ? "#475569" : "white"}
                />
                <Text
                  className={`font-semibold text-xs ${
                    user?.isFollowing ? "text-slate-600" : "text-white"
                  }`}
                >
                  {user?.isFollowing ? "Đang theo dõi" : "Theo dõi"}
                </Text>
              </TouchableOpacity>
            )}

            {isOwnProfile && (
              <TouchableOpacity
                onPress={() => navigation.navigate("EditProfileScreen")}
                className="py-2 px-4 rounded-full bg-slate-50 border border-slate-200 active:bg-slate-100 flex-row items-center gap-1.5 shadow-sm"
              >
                <Ionicons name="create-outline" size={14} color="#475569" />
                <Text className="font-semibold text-xs text-slate-600">
                  Chỉnh sửa
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Personal Info Card */}
        <View className="mx-4 mt-6 bg-white rounded-[22px] border border-slate-100 p-5 shadow-xs">
          <Text className="text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
            Thông tin cá nhân
          </Text>

          <View className="flex flex-col gap-4">
            {/* Joining Date */}
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                <Ionicons name="time-outline" size={16} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] text-slate-400">Tham gia hệ thống</Text>
                <Text className="text-xs font-semibold text-slate-700 mt-0.5">
                  {timeSince(user?.createdAt)}
                </Text>
              </View>
            </View>

            {/* Location / Address */}
            <View className="flex-row items-center gap-3">
              <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                <Ionicons name="location-outline" size={16} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] text-slate-400">Địa chỉ hiện tại</Text>
                <Text className="text-xs font-semibold text-slate-700 mt-0.5" numberOfLines={2}>
                  {user?.address_json?.full || "Chưa cung cấp"}
                </Text>
              </View>
            </View>

            {/* CCCD Student Verification (ONLY FOR OWNER) */}
            {isOwnProfile && (
              <View className="flex-row items-center gap-3 border-t border-slate-50 pt-3">
                <View className="w-8 h-8 rounded-full bg-blue-50 items-center justify-center">
                  <Ionicons name="shield-checkmark-outline" size={16} color="#2563eb" />
                </View>
                <View className="flex-1 flex-row items-center justify-between">
                  <View>
                    <Text className="text-[10px] text-slate-400">Trạng thái sinh viên</Text>
                    <Text className={`text-xs font-semibold mt-0.5 ${user?.is_cccd_verified ? "text-emerald-600" : "text-amber-600"}`}>
                      {user?.is_cccd_verified ? "Đã xác thực sinh viên" : "Chưa xác thực"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate("VerifyStudentScreen")}
                    className={`py-1 px-3 rounded-full border ${
                      user?.is_cccd_verified
                        ? "border-slate-200 bg-slate-50 active:bg-slate-100"
                        : "border-blue-600 bg-blue-50 active:bg-blue-100"
                    }`}
                  >
                    <Text className={`text-xs font-semibold ${user?.is_cccd_verified ? "text-slate-500" : "text-blue-600"}`}>
                      {user?.is_cccd_verified ? "Xác thực lại" : "Xác thực ngay"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* View More Toggle */}
          <TouchableOpacity
            className="mt-4 pt-3 border-t border-slate-50 flex-row items-center justify-center gap-1"
            onPress={() => setShowMore(!showMore)}
          >
            <Text className="text-xs text-blue-600 font-semibold">
              {showMore ? "Thu gọn thông tin" : "Xem thêm thông tin"}
            </Text>
            <Ionicons
              name={showMore ? "chevron-up" : "chevron-down"}
              size={14}
              color="#2563eb"
            />
          </TouchableOpacity>

          {/* Collapsible Info Section */}
          {showMore && (
            <View className="flex flex-col gap-3 mt-4 pt-3 border-t border-slate-50">
              {/* Quê quán */}
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
                  <Ionicons name="home-outline" size={16} color="#64748b" />
                </View>
                <View className="flex-1 flex-row justify-between items-center">
                  <Text className="text-xs text-slate-500">Quê quán</Text>
                  <Text className="text-xs font-semibold text-slate-700">
                    {user?.hometown || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>

              {/* Số điện thoại */}
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
                  <Ionicons name="call-outline" size={16} color="#64748b" />
                </View>
                <View className="flex-1 flex-row justify-between items-center">
                  <Text className="text-xs text-slate-500">Số điện thoại</Text>
                  <Text className="text-xs font-semibold text-slate-700">
                    {user?.phone || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>

              {/* Họ và tên */}
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
                  <Ionicons name="person-outline" size={16} color="#64748b" />
                </View>
                <View className="flex-1 flex-row justify-between items-center">
                  <Text className="text-xs text-slate-500">Họ và tên</Text>
                  <Text className="text-xs font-semibold text-slate-700">
                    {user?.fullName || "Chưa cập nhật"}
                  </Text>
                </View>
              </View>

              {/* CCCD (CHỈ HIỂN THỊ TRÊN HỒ SƠ CỦA MÌNH) */}
              {isOwnProfile && (
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
                    <Ionicons name="card-outline" size={16} color="#64748b" />
                  </View>
                  <View className="flex-1 flex-row justify-between items-center">
                    <Text className="text-xs text-slate-500">Số CCCD / CMND</Text>
                    <Text className="text-xs font-semibold text-slate-700">
                      {user?.citizenId
                        ? "******" + user.citizenId.slice(-4)
                        : "Chưa cập nhật"}
                    </Text>
                  </View>
                </View>
              )}

              {/* Giới tính */}
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
                  <Ionicons name="transgender-outline" size={16} color="#64748b" />
                </View>
                <View className="flex-1 flex-row justify-between items-center">
                  <Text className="text-xs text-slate-500">Giới tính</Text>
                  <Text className="text-xs font-semibold text-slate-700">
                    {user?.gender === 1 || user?.gender === "Nam"
                      ? "Nam"
                      : user?.gender === 2 || user?.gender === "Nữ"
                        ? "Nữ"
                        : user?.gender === 3 || user?.gender === "Khác"
                          ? "Khác"
                          : "Chưa cập nhật"}
                  </Text>
                </View>
              </View>

              {/* Ngày sinh */}
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-slate-50 items-center justify-center">
                  <Ionicons name="gift-outline" size={16} color="#64748b" />
                </View>
                <View className="flex-1 flex-row justify-between items-center">
                  <Text className="text-xs text-slate-500">Ngày sinh</Text>
                  <Text className="text-xs font-semibold text-slate-700">
                    {user?.dob
                      ? new Date(user.dob).toLocaleDateString("vi-VN")
                      : "Chưa cập nhật"}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Reviews Section */}
        <View className="mx-4 mt-6">
          {/* Write Review Button (only for other profiles when logged in) */}
          {!isOwnProfile && currentUserId && (
            <TouchableOpacity
              onPress={() =>
                myRating
                  ? setRatingMenuVisible(true)
                  : setRatingModalVisible(true)
              }
              className={`py-3.5 rounded-2xl flex-row justify-center items-center gap-2 border shadow-sm ${
                myRating
                  ? "bg-white border-blue-600 active:bg-blue-50"
                  : "bg-blue-600 border-blue-600 active:bg-blue-700"
              }`}
            >
              <Ionicons
                name={myRating ? "star" : "star-outline"}
                size={16}
                color={myRating ? "#2563eb" : "white"}
              />
              <Text
                className={`text-center font-semibold text-sm ${
                  myRating ? "text-blue-600" : "text-white"
                }`}
              >
                {myRating ? "Đánh giá của bạn" : "Viết đánh giá"}
              </Text>
            </TouchableOpacity>
          )}

          {ratings.length > 0 && (
            <View className="mt-4">
              <Text className="text-sm font-bold text-slate-800 mb-3 ml-1">
                Đánh giá từ người dùng ({ratingCount})
              </Text>
              {ratings.map((rating) => (
                <RatingCard key={rating.id} rating={rating} />
              ))}
            </View>
          )}
        </View>

        {/* Product Tabs (Inline State Switcher) */}
        <View className="mt-8 bg-white border-b border-slate-100 flex-row px-4">
          <TouchableOpacity
            onPress={() => setActiveTab("displaying")}
            className={`flex-1 py-3.5 items-center border-b-2 ${
              activeTab === "displaying" ? "border-blue-600" : "border-transparent"
            }`}
          >
            <Text
              className={`font-semibold text-xs ${
                activeTab === "displaying" ? "text-blue-600" : "text-slate-400"
              }`}
            >
              Đang hiển thị ({displayingProducts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("sold")}
            className={`flex-1 py-3.5 items-center border-b-2 ${
              activeTab === "sold" ? "border-blue-600" : "border-transparent"
            }`}
          >
            <Text
              className={`font-semibold text-xs ${
                activeTab === "sold" ? "text-blue-600" : "text-slate-400"
              }`}
            >
              Đã bán ({soldProducts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Items List */}
        <View className="bg-slate-50/40 pt-4 pb-6">
          {activeTab === "displaying" ? (
            displayingProducts.length > 0 ? (
              displayingProducts.map((item) => (
                <RenderProductItem
                  key={item.id}
                  item={item}
                  navigation={navigation}
                />
              ))
            ) : (
              <View className="items-center py-10">
                <Ionicons name="cube-outline" size={40} color="#cbd5e1" />
                <Text className="text-slate-400 mt-2 text-xs font-medium">
                  Chưa có sản phẩm nào đang hiển thị
                </Text>
              </View>
            )
          ) : (
            soldProducts.length > 0 ? (
              soldProducts.map((item) => (
                <RenderProductItem
                  key={item.id}
                  item={item}
                  navigation={navigation}
                />
              ))
            ) : (
              <View className="items-center py-10">
                <Ionicons name="receipt-outline" size={40} color="#cbd5e1" />
                <Text className="text-slate-400 mt-2 text-xs font-medium">
                  Chưa có sản phẩm nào đã bán
                </Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      {/* Modal Rating (Dành cho hồ sơ người khác) */}
      <Modal
        visible={ratingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/45 justify-center items-center"
          onPress={() => setRatingModalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-[320px] rounded-3xl p-6 shadow-xl"
          >
            <Text className="text-base font-bold text-center mb-5 text-slate-800">
              {myRating ? "Chỉnh sửa đánh giá" : "Đánh giá người dùng"}
            </Text>
            <View className="items-center mb-5">
              <StarRating
                rating={selectedStars}
                onChange={setSelectedStars}
                editable
              />
            </View>
            <TextInput
              className="border border-slate-200 focus:border-blue-600 rounded-2xl p-4 h-28 text-sm text-slate-850 bg-slate-50/50 mb-5"
              placeholder="Nhận xét của bạn (tùy chọn)"
              multiline
              value={ratingContent}
              onChangeText={setRatingContent}
              style={{ textAlignVertical: "top" }}
            />
            <TouchableOpacity
              onPress={handleSubmitRating}
              disabled={selectedStars === 0}
              className={`py-3.5 rounded-2xl mb-3 shadow-xs flex-row justify-center ${
                selectedStars === 0 ? "bg-slate-200" : "bg-blue-600 active:bg-blue-700"
              }`}
            >
              <Text
                className={`text-center font-bold text-sm ${
                  selectedStars === 0 ? "text-slate-400" : "text-white"
                }`}
              >
                {myRating ? "Cập nhật" : "Gửi đánh giá"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setRatingModalVisible(false)}
              className="bg-slate-50 border border-slate-100 py-3 rounded-2xl active:bg-slate-100"
            >
              <Text className="text-center text-slate-650 font-bold text-sm">Hủy</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Rating Menu (Dành cho hồ sơ người khác) */}
      <Modal
        visible={ratingMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRatingMenuVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/45 justify-center items-center"
          onPress={() => setRatingMenuVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-xl w-72 overflow-hidden border border-slate-100"
          >
            <TouchableOpacity
              onPress={() => {
                setRatingMenuVisible(false);
                setRatingModalVisible(true);
              }}
              className="px-5 py-4.5 flex-row items-center gap-3 border-b border-slate-100 active:bg-slate-50"
            >
              <Ionicons name="create-outline" size={20} color="#475569" />
              <Text className="text-sm font-semibold text-slate-700">Chỉnh sửa đánh giá</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setRatingMenuVisible(false);
                deleteMyRating();
              }}
              className="px-5 py-4.5 flex-row items-center gap-3 active:bg-slate-50"
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text className="text-sm font-semibold text-red-500">Xóa đánh giá</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Menu 3 chấm */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/45 justify-center items-center"
          onPress={() => setMenuVisible(false)}
        >
          <View className="bg-white w-72 rounded-3xl shadow-xl overflow-hidden border border-slate-100">
            {isOwnProfile && (
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  navigation.navigate("EditProfileScreen");
                }}
                className="px-5 py-4 flex-row items-center gap-3 border-b border-slate-100 active:bg-slate-50"
              >
                <Ionicons name="create-outline" size={18} color="#475569" />
                <Text className="text-sm font-semibold text-slate-750">
                  Chỉnh sửa thông tin
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={handleCopyLink}
              className="px-5 py-4 flex-row items-center gap-3 border-b border-slate-100 active:bg-slate-50"
            >
              <Ionicons name="copy-outline" size={18} color="#475569" />
              <Text className="text-sm font-semibold text-slate-750">
                Sao chép liên kết
              </Text>
            </TouchableOpacity>

            {!isOwnProfile && (
              <TouchableOpacity
                onPress={() => {
                  setMenuVisible(false);
                  setReportVisible(true);
                }}
                className="px-5 py-4 flex-row items-center gap-3 active:bg-slate-50"
              >
                <Ionicons name="flag-outline" size={18} color="#ef4444" />
                <Text className="text-sm font-semibold text-red-500">
                  Báo cáo vi phạm
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Modal Report (Chỉ cho hồ sơ người khác) */}
      <Modal
        visible={reportVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReportVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/45 justify-center items-center px-4"
          onPress={() => setReportVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl"
          >
            <Text className="text-base font-bold text-center mb-5 text-slate-800">
              Báo cáo vi phạm
            </Text>

            <View className="gap-2">
              {[
                "Hình ảnh không phù hợp",
                "Thông tin sai lệch",
                "Lừa đảo/Gian lận",
                "Quấy rối/Spam",
                "Lý do khác",
              ].map((item, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setReportReason(item)}
                  className={`py-3 px-4 rounded-xl border ${
                    reportReason === item
                      ? "bg-red-50/50 border-red-400"
                      : "bg-slate-50 border-slate-100 active:bg-slate-100"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-xs font-semibold ${
                        reportReason === item
                          ? "text-red-600"
                          : "text-slate-650"
                      }`}
                    >
                      {item}
                    </Text>
                    {reportReason === item && (
                      <Ionicons name="checkmark" size={16} color="#ef4444" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {reportReason && (
              <View className="mt-4">
                <View className="flex-row justify-between mb-1 ml-1">
                  <Text className="text-xxs text-slate-400 font-bold uppercase tracking-wider">
                    {reportReason === "Lý do khác"
                      ? "Chi tiết vi phạm (Bắt buộc):"
                      : "Chi tiết thêm (Tùy chọn):"}
                  </Text>
                  <Text
                    className={`text-xxs ${reportDescription.length > 200 ? "text-red-500" : "text-slate-400"}`}
                  >
                    {reportDescription.length}/200
                  </Text>
                </View>

                <TextInput
                  className={`bg-slate-50 border rounded-2xl p-3 h-24 text-xs text-slate-800 ${
                    reportReason === "Lý do khác" && !reportDescription.trim()
                      ? "border-red-200"
                      : "border-slate-150 focus:border-blue-500"
                  }`}
                  placeholder={
                    reportReason === "Lý do khác"
                      ? "Vui lòng nhập rõ lý do..."
                      : "Mô tả rõ hơn về vi phạm này..."
                  }
                  multiline
                  textAlignVertical="top"
                  value={reportDescription}
                  onChangeText={setReportDescription}
                  maxLength={200}
                />
              </View>
            )}

            <View className="mt-6 gap-3">
              <TouchableOpacity
                onPress={handleSendReport}
                disabled={
                  !reportReason ||
                  isSendingReport ||
                  (reportReason === "Lý do khác" && !reportDescription.trim())
                }
                className={`py-3.5 rounded-2xl flex-row justify-center items-center shadow-xs ${
                  !reportReason ||
                  (reportReason === "Lý do scandals" && !reportDescription.trim()) ||
                  (reportReason === "Lý do khác" && !reportDescription.trim())
                    ? "bg-slate-200"
                    : "bg-red-500 active:bg-red-650"
                }`}
              >
                {isSendingReport ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="text-center text-white font-bold text-sm">
                    Gửi báo cáo
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setReportVisible(false);
                  setReportReason(null);
                  setReportDescription("");
                }}
                className="py-3.5 rounded-2xl bg-slate-50 border border-slate-100 active:bg-slate-100"
              >
                <Text className="text-center text-slate-650 font-bold text-sm">
                  Hủy bỏ
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
