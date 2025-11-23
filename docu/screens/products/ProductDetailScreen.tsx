import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  Alert,
  Linking,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import "../../global.css";
import { path } from "../../config";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Comment,
  Product,
  ProductDetailScreenNavigationProp,
  ProductDetailScreenRouteProp,
  ProductImage,
  User,
} from "../../types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const formatPrice = (price: number | string, dealTypeName?: string) => {
  if (dealTypeName === "Miễn phí") return "Miễn phí";
  if (dealTypeName === "Trao đổi") return "Trao đổi";

  const rawPrice = String(price).replace(/[^\d]/g, "");
  const priceNumber = Number(rawPrice);

  if (priceNumber > 0) {
    return `${priceNumber.toLocaleString("vi-VN")} đ`;
  }
  return "Liên hệ";
};

export default function ProductDetailScreen() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null);
  const [soldCount, setSoldCount] = useState(0);

  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem("userId");
      const name = await AsyncStorage.getItem("userName");
      if (id && name) {
        setCurrentUser({ id: Number(id), name });
      }
    })();
  }, []);

  const route = useRoute<ProductDetailScreenRouteProp>();
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();

  const { bottom } = useSafeAreaInsets();

  const { product: routeProduct } = route.params || {};
  const product: Product = routeProduct || ({} as Product);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [comment, setComment] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState<number>(0);

  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  const [showMenuFor, setShowMenuFor] = useState<number | null>(null);

  const openMenu = (commentId: number) => {
    setShowMenuFor(commentId);
  };

  const closeMenu = () => {
    setShowMenuFor(null);
  };

  useEffect(() => {
    const fetchFavoriteData = async () => {
      try {
        const countRes = await axios.get(
          `${path}/favorites/${product.id}/count`
        );
        setFavoriteCount(countRes.data.count || 0);

        if (currentUser?.id) {
          const statusRes = await axios.get(
            `${path}/favorites/check/${product.id}?userId=${currentUser.id}`
          );
          setIsFavorite(statusRes.data.isFavorite || false);
        } else {
          setIsFavorite(false);
        }
      } catch (err) {
        console.log("Lỗi lấy dữ liệu yêu thích:", err);
      }
    };

    const isProductApproved = product.productStatus?.id === 2;

    if (product.id && isProductApproved) {
      fetchFavoriteData();
    }
  }, [product.id, currentUser, product.productStatus?.id]);

  useEffect(() => {
    const fetchRating = async () => {
      try {
        // console.log(product.authorName);
        // console.log(product.user?.avatar);
        // console.log("id", product.user_id);
        const res = await fetch(
          `${path}/users/${product.user_id}/rating-average`
        );
        const data = await res.json();
        setAverageRating(data.average ? parseFloat(data.average) : null);
        setRatingCount(data.count || 0);
      } catch (error) {
        console.error("Lỗi khi lấy đánh giá:", error);
      }
    };

    fetchRating();
  }, [product.user_id]);

  const fetchComments = useCallback(async () => {
    if (!product.id) return; // Thêm kiểm tra
    try {
      setLoadingComments(true);
      const res = await axios.get(`${path}/comments/${product.id}`);
      setComments(res.data);
    } catch (error) {
      console.error("Lỗi khi tải bình luận:", error);
    } finally {
      setLoadingComments(false);
    }
  }, [product.id]); // Phụ thuộc vào product.id

  // Hàm fetch sản phẩm liên quan
  const fetchRelatedProducts = useCallback(async () => {
    if (!product.id) return; // Thêm kiểm tra
    try {
      setLoadingRelated(true);
      const res = await axios.get(`${path}/products/${product.id}/related`);
      const formattedData = (res.data || []).map((item: any) => ({
        ...item,
        authorName: item.author_name || item.authorName || "Người bán",
      }));
      setRelatedProducts(formattedData);
    } catch (error) {
      console.error("Lỗi khi tải sản phẩm liên quan:", error);
    } finally {
      setLoadingRelated(false);
    }
  }, [product.id]); // Phụ thuộc vào product.id

  // Hàm xử lý xóa
  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      if (!currentUser?.id) {
        Alert.alert("Lỗi", "Không thể xác thực người dùng.");
        return;
      }

      try {
        await axios.delete(
          `${path}/comments/${commentId}?user_id=${currentUser.id}`
        );
        Alert.alert("Thành công", "Đã xóa bình luận.");
        fetchComments(); // 👈 GỌI HÀM (BÂY GIỜ ĐÃ HỢP LỆ)
      } catch (err: any) {
        console.error("Lỗi xóa bình luận:", err.response?.data);
        Alert.alert(
          "Lỗi",
          err.response?.data?.message || "Không thể xóa bình luận."
        );
      }
    },
    [currentUser, fetchComments] // Phụ thuộc vào currentUser và fetchComments
  );

  const handleToggleFavorite = async () => {
    if (!currentUser) return;

    // Đổi local state trước
    setIsFavorite((prev) => !prev);
    setFavoriteCount((prev) => prev + (isFavorite ? -1 : 1));

    try {
      const token = await AsyncStorage.getItem("token");
      await axios.post(
        `${path}/favorites/toggle/${product.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Optionally fetch lại count chính xác từ server
      const countRes = await axios.get(`${path}/favorites/${product.id}/count`);
      setFavoriteCount(countRes.data.count || 0);
    } catch (err) {
      // Nếu có lỗi, rollback lại
      setIsFavorite((prev) => !prev);
      setFavoriteCount((prev) => prev + (isFavorite ? 1 : -1));
      console.log("Lỗi toggle yêu thích:", err);
    }
  };

  useEffect(() => {
    const isProductApproved = product.productStatus?.id === 2;

    if (product.id && isProductApproved) {
      fetchComments();
      fetchRelatedProducts();
    }
  }, [
    product.id,
    product.productStatus?.id,
    fetchComments,
    fetchRelatedProducts,
  ]);

  useEffect(() => {}, [product]);

  const [isPhoneVisible, setIsPhoneVisible] = useState(false);

  const handleCall = async () => {
    if (product.phone) {
      // Kiểm tra SĐT có tồn tại không
      try {
        await Linking.openURL(`tel:${product.phone}`);
      } catch (error) {
        Alert.alert("Lỗi", "Không thể thực hiện cuộc gọi.");
      }
    }
  };

  // Hiển thị hết ảnh từ product.images (4 ảnh nếu có), fallback thumbnail nếu rỗng
  const productImages: ProductImage[] =
    product.images && product.images.length > 0
      ? product.images.map((img) => ({
          ...img,
          id: img.id.toString(),
          product_id: img.product_id.toString(),
          // Fix URL: file:// local OK, relative prepend path nếu cần
          image_url:
            img.image_url.startsWith("file://") ||
            img.image_url.startsWith("http")
              ? img.image_url
              : `${path}${img.image_url}`, // Prepend nếu /uploads/...
        })) // Cast string nếu cần
      : [
          {
            id: "1",
            product_id: product.id || "1",
            name: "Default",
            image_url:
              product.image ||
              "https://via.placeholder.com/400x300?text=No+Image", // Thumbnail fallback
            created_at: new Date().toISOString(),
          },
        ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleSend = useCallback(async () => {
    if (isSending || comment.trim() === "") return;

    const userIdStr = await AsyncStorage.getItem("userId");
    if (!userIdStr) {
      Alert.alert("Thông báo", "Bạn phải đăng nhập để bình luận.");
      return;
    }
    const userId = Number(userIdStr);

    try {
      setIsSending(true);

      // 🚀 LOGIC MỚI: KIỂM TRA XEM ĐANG SỬA HAY GỬI MỚI
      if (editingComment) {
        // --- ĐANG SỬA BÌNH LUẬN ---
        await axios.patch(`${path}/comments/${editingComment.id}`, {
          user_id: userId,
          content: comment.trim(),
        });
        setEditingComment(null); // Tắt chế độ sửa
      } else {
        // --- ĐANG GỬI BÌNH LUẬN MỚI (hoặc TRẢ LỜI) ---
        if (!product?.id) {
          Alert.alert("Lỗi", "Không xác định được sản phẩm.");
          setIsSending(false);
          return;
        }
        const payload = {
          product_id: Number(product.id),
          user_id: userId,
          content: comment.trim(),
          parent_id: replyingTo ? String(replyingTo.id) : undefined,
        };
        await axios.post(`${path}/comments`, payload);
        setReplyingTo(null); // Tắt chế độ trả lời
      }

      fetchComments(); // Tải lại toàn bộ bình luận
      setComment(""); // Xóa nội dung ô input
    } catch (error: any) {
      Alert.alert(
        "Lỗi",
        error.response?.data?.message || "Không thể gửi bình luận."
      );
      console.error("Gửi/Sửa bình luận lỗi:", error);
    } finally {
      setIsSending(false);
    }
  }, [
    isSending,
    comment,
    product.id,
    replyingTo,
    editingComment,
    fetchComments,
  ]);

  const goToUserProfile = (userId?: number | string) => {
    if (!userId) {
      Alert.alert("Lỗi", "Không tìm thấy ID người dùng.");
      return;
    }
    const numericId = Number(userId);
    // Dẫn tới màn hình UserDetail, kèm product và flag isOwner
    navigation.navigate("UserInforScreen", {
      userId: product.user_id,
    });
  };

  const renderCommentTree = (comment: Comment, depth: number = 0) => {
    const canDelete =
      currentUser && Number(comment.user?.id) === Number(currentUser.id);
    const userImage = comment.user?.image
      ? comment.user.image.startsWith("http")
        ? comment.user.image
        : `${path}${comment.user.image}`
      : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

    return (
      <View key={comment.id}>
        {/* Render bình luận (cha hoặc con) */}
        <View className="flex-row items-start mb-4">
          <TouchableOpacity
            onPress={() => goToUserProfile(comment.user?.id)}
            activeOpacity={0.7}
          >
            <Image
              source={{ uri: userImage }}
              className="w-10 h-10 rounded-full"
            />
          </TouchableOpacity>

          <View className="ml-3 flex-1 bg-gray-100 px-3 py-2 rounded-2xl">
            <TouchableOpacity
              onPress={() => goToUserProfile(comment.user?.id)}
              activeOpacity={0.7}
            >
              <Text className="font-semibold text-sm">
                {comment.user?.nickname || "Người dùng"}
              </Text>
            </TouchableOpacity>

            <Text className="text-gray-600 text-sm mt-1">
              {comment.content}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">
              {new Date(
                new Date(comment.created_at).getTime() + 7 * 60 * 60 * 1000
              ).toLocaleString("vi-VN", {})}
            </Text>

            {depth === 0 && (
              <TouchableOpacity
                onPress={() => {
                  setReplyingTo(comment);
                  setEditingComment(null);
                  setComment("");
                }}
              >
                <Text className="text-blue-500 text-xs font-semibold mt-1">
                  Trả lời
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Nút "Ba chấm" (Sửa/Xóa) */}
          {canDelete && (
            <TouchableOpacity
              className="p-2 -ml-2"
              onPress={() => openMenu(Number(comment.id))}
            >
              <Ionicons name="ellipsis-vertical" size={18} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {showMenuFor === Number(comment.id) && (
          <Modal
            transparent
            animationType="slide"
            visible={showMenuFor === Number(comment.id)}
            onRequestClose={closeMenu}
          >
            {/* 1. Lớp mờ (Backdrop) */}
            <TouchableOpacity
              className="flex-1 bg-black/40"
              onPress={closeMenu}
              activeOpacity={1}
            />

            <View
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl"
              style={{ paddingBottom: 16 + bottom }}
            >
              {/* Nút Chỉnh sửa */}
              <TouchableOpacity
                className="py-4 border-b border-gray-200"
                onPress={() => {
                  closeMenu();
                  setEditingComment(comment);
                  setComment(comment.content);
                  setReplyingTo(null);
                }}
              >
                <Text className="text-blue-600 font-semibold text-center text-lg">
                  Chỉnh sửa
                </Text>
              </TouchableOpacity>

              {/* Nút Xóa */}
              <TouchableOpacity
                className="py-4"
                onPress={() => {
                  closeMenu();
                  handleDeleteComment(String(comment.id));
                }}
              >
                <Text className="text-red-500 font-semibold text-center text-lg">
                  Xóa
                </Text>
              </TouchableOpacity>

              {/* 3. Nút Hủy (Tách biệt) */}
              <TouchableOpacity
                className="py-4 border-t-2 border-gray-200 mt-2"
                onPress={closeMenu}
              >
                <Text className="text-gray-700 font-bold text-center text-lg">
                  Hủy
                </Text>
              </TouchableOpacity>
            </View>
          </Modal>
        )}

        {/* Render các con (replies) - Tăng độ sâu (depth) lên 1 */}
        {comment.children && comment.children.length > 0 && (
          <View className="ml-8">
            {comment.children.map(
              (reply) => renderCommentTree(reply, depth + 1) // 👈 Truyền depth + 1
            )}
          </View>
        )}
      </View>
    );
  };

  const handleChatPress = async () => {
    try {
      if (!currentUser) {
        Alert.alert("Thông báo", "Bạn cần đăng nhập để chat.");
        return;
      }

      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Không tìm thấy token.");

      // Gửi lên userId của người muốn chat và productId
      const payload = {
        userId: product.user_id,
        productId: product.id,
      };

      const response = await fetch(`${path}/chat/room`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Lỗi khi mở phòng chat");

      const room = await response.json();

      // Xác định thông tin người còn lại
      const otherUserName = product.authorName || "Người bán";
      const otherUserAvatar = sellerAvatar
        ? sellerAvatar.startsWith("http")
          ? sellerAvatar
          : `${path}${sellerAvatar}`
        : "https://cdn-icons-png.flaticon.com/512/149/149071.png";

      // Điều hướng sang ChatRoom
      navigation.navigate("ChatRoomScreen", {
        roomId: room.id,
        product,
        otherUserId: product.user_id,
        otherUserName,
        otherUserAvatar,
        currentUserId: currentUser.id,
        currentUserName: currentUser.name,
        token,
      });
    } catch (error) {
      console.error("s Lỗi mở phòng chat:", error);
      Alert.alert("Lỗi", "Không thể mở phòng chat. Vui lòng thử lại!");
    }
  };

  // Render item ảnh (hiển thị từng ảnh trong array)
  const renderImageItem = ({ item }: { item: ProductImage }) => {
    const imageSource = { uri: item.image_url }; // URL đã fix ở trên
    return (
      <View style={{ width, height: 280 }}>
        <Image
          source={imageSource}
          style={{ width: "100%", height: "100%" }}
          resizeMode="contain"
        />
      </View>
    );
  };
  const getItemLayout = (_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  // 🧩 Gọi API tạo hoặc lấy phòng chat
  async function openOrCreateRoom(
    token: string,
    payload: {
      seller_id: string;
      buyer_id: string;
      room_type: "PAIR";
      product_id?: string;
    }
  ) {
    // console.log("🪙 Token gửi đi:", token);
    // console.log("📤 Payload gửi:", payload);

    try {
      const authHeader = token?.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;

      const res = await axios.post(`${path}/chat/room`, payload, {
        headers: { Authorization: authHeader },
      });
      console.log("🧾 Header gửi đi:", authHeader);

      console.log("💬 Phản hồi từ server:", res.data);
      return res.data; // Có thể là { room: {...} } hoặc {...}
    } catch (err: any) {
      console.log("❌ Lỗi chat:", err.response?.status, err.response?.data);
      throw err;
    }
  }

  const formatAgeRangeName = (text: string) => {
    if (!text) return "";
    const words = text.split(" ");
    const lines = [];
    for (let i = 0; i < words.length; i += 6) {
      lines.push(words.slice(i, i + 6).join(" "));
    }
    return lines.join("\n");
  };
  useEffect(() => {
    const fetchSellerAvatar = async () => {
      // Chỉ chạy khi có product.user_id
      if (!product.user_id) return;

      try {
        // Dùng user_id của sản phẩm để gọi API lấy thông tin người bán
        const res = await axios.get(`${path}/users/${product.user_id}`);

        // Dùng key 'image' (giống hệt trang UserScreen của bạn)
        if (res.data?.image) {
          console.log(res.data?.image);
          setSellerAvatar(res.data.image);
        }
      } catch (err) {
        console.log("Lỗi lấy avatar người bán:", err);
      }
    };

    fetchSellerAvatar();
  }, [product.user_id]);

  useEffect(() => {
    const fetchSellerInfo = async () => {
      // Chỉ chạy khi có product.user_id
      if (!product.user_id) return;

      try {
        // 1. Gọi API lấy thông tin User (Avatar)
        const userRes = await axios.get(`${path}/users/${product.user_id}`);
        if (userRes.data?.image) {
          setSellerAvatar(userRes.data.image);
        }

        // 2. 🚀 Gọi API lấy danh sách bài đăng của người bán để đếm số lượng đã bán
        // (Sử dụng API giống bên màn hình UserInforScreen)
        const productsRes = await axios.get(
          `${path}/products/my-posts/${product.user_id}`
        );
        const listProducts = productsRes.data || [];

        // Lọc ra các sản phẩm có status là 6 (Đã bán)
        const count = listProducts.filter(
          (p: any) => p.productStatus?.id === 6 || p.status_id === 6
        ).length;

        setSoldCount(count); // Cập nhật vào state
      } catch (err) {
        console.log("Lỗi lấy thông tin người bán:", err);
      }
    };

    fetchSellerInfo();
  }, [product.user_id]);

  const renderRelatedItem = ({ item }: { item: Product }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          navigation.push("ProductDetail", {
            product: item,
          })
        }
        className="w-40 bg-white border border-gray-200 rounded-lg shadow-sm mr-3 overflow-hidden"
      >
        <Image
          source={{
            uri:
              item.thumbnail_url ||
              item.image || // Fallback
              "https://via.placeholder.com/160x130?text=No+Image",
          }}
          className="w-full h-32"
          resizeMode="cover"
        />
        <View className="p-2">
          <Text className="text-sm font-medium" numberOfLines={2}>
            {item.name}
          </Text>
          <Text className="text-red-600 font-bold text-sm mt-1">
            {/* 🚀 Tái sử dụng hàm formatPrice */}
            {formatPrice(item.price, item.dealType?.name)}
          </Text>
          <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>
            📍 {item.location || "Việt Nam"}
          </Text>
          <Text
            className="text-blue-600 text-xs font-semibold mt-1"
            numberOfLines={1}
          >
            👤 {item.authorName}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    AsyncStorage.getItem("token").then((token) => {
      fetch(`${path}/products/${product.id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      })
        .then((res) => res.json())
        .then((data) => {
          // console.log("Đây là dữ liệu log ra", data);
        });
    });
  }, [product.id]);

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Ảnh sản phẩm */}
        <View className="relative">
          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            className="absolute top-3 left-3 bg-white p-2 rounded-full z-10 shadow-md"
          >
            <Ionicons name="arrow-back" size={20} color="black" />
          </TouchableOpacity>
          <FlatList
            data={productImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={width}
            decelerationRate="fast"
            keyExtractor={(item) => item.id}
            renderItem={renderImageItem}
            getItemLayout={getItemLayout}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              if (index >= 0 && index < productImages.length) {
                setCurrentImageIndex(index);
              }
            }}
          />
          <View className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex-row items-center">
            {productImages.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${index === currentImageIndex ? "bg-blue-500" : "bg-gray-300"}`}
              />
            ))}
          </View>
          {/* Counter 1/N (1/4 nếu 4 ảnh) */}
          <View className="absolute bottom-2 left-2 bg-black/50 rounded px-2 py-1">
            <Text className="text-white text-sm font-medium">
              {currentImageIndex + 1}/{productImages.length}
            </Text>
          </View>
          {/* Nút Lưu */}
          {product.productStatus?.id === 2 && (
            <TouchableOpacity
              onPress={handleToggleFavorite}
              className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full flex-row items-center border border-gray-300"
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={16}
                color={isFavorite ? "red" : "black"}
              />
              <Text className="ml-1 text-xs text-black">
                {isFavorite ? "Đã lưu" : "Lưu"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="px-4 py-3 pb-12">
          {/* Tiêu đề */}
          <Text className=" text-xl font-bold mb-2">
            {product.name || "Sản phẩm mặc định"}
          </Text>
          <Text
            className="text-gray-800 text-sm font-medium mb-2"
            style={{ flexShrink: 1, flexWrap: "wrap" }}
          >
            {product.tag || "Chưa rõ"}
          </Text>

          <View className="flex-row justify-between items-center mb-2">
            {/* Giá  */}
            <Text className="text-red-600 text-xl font-bold">
              {formatPrice(product.price, product.dealType?.name)}
            </Text>

            {/* Tim */}
            {product.productStatus?.id === 2 && (
              <TouchableOpacity
                className="flex-row items-center"
                onPress={handleToggleFavorite}
              >
                <Text className="mr-1 text-gray-700">{favoriteCount}</Text>
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={20}
                  color={isFavorite ? "red" : "#666"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Địa chỉ */}
          <Text className="text-gray-500 text-sm mb-1">
            📍{" "}
            {product.address_json?.full ||
              product.location ||
              "Chưa rõ địa chỉ"}
          </Text>
          <Text className="text-gray-400 text-xs mb-4">
            {product.created_at
              ? `Đăng ${new Date(product.created_at).toLocaleDateString(
                  "vi-VN",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }
                )}`
              : product.time || "1 tuần trước"}
          </Text>

          {/* Thông tin shop */}
          <TouchableOpacity
            onPress={() => {
              if (product.user_id) {
                navigation.navigate("UserInforScreen", {
                  userId: product.user_id,
                });
              } else {
                Alert.alert("Lỗi", "Không tìm thấy ID người bán.");
              }
            }}
          >
            <View className="flex-row items-center mt-4">
              <Image
                source={{
                  uri: sellerAvatar
                    ? sellerAvatar.startsWith("http")
                      ? sellerAvatar
                      : `${path}${sellerAvatar}`
                    : "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                }}
                className="w-12 h-12 rounded-full"
              />
              <View className="ml-3 flex-1">
                <Text className="font-semibold">
                  {product.authorName || product.user?.name || "Người dùng"}
                </Text>
                <Text className="text-gray-500 text-xs">
                  đã bán {soldCount} lần
                </Text>
              </View>
              <View className="flex-row items-center">
                {/* <Text className="text-yellow-500 font-bold"> ★ </Text>
                <Text className="text-gray-500 text-xs">(14 đánh giá)</Text> */}
                {averageRating !== null ? (
                  <>
                    <Text className="text-sm text-yellow-500 ml-2">
                      {averageRating.toFixed(1)} ★
                    </Text>
                    <Text className="text-gray-500 text-xs ml-2">
                      ({ratingCount} đánh giá)
                    </Text>
                  </>
                ) : (
                  <Text className="text-sm text-gray-400">
                    Chưa có đánh giá
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
          {/* Mô tả chi tiết */}
          <View className="my-3 border-t border-b border-gray-300 px-3 py-3 bg-white rounded-lg">
            <Text className="text-lg font-bold mb-2">Mô tả chi tiết</Text>
            <Text className="text-gray-700 leading-6 text-mb">
              {product.description || "Mô tả sản phẩm..."}
            </Text>
          </View>

          {/* Số điện thoại */}
          <View className="mb-6">
            {product.phone && (
              <View className="flex-row items-center justify-between bg-gray-100 px-4 py-2 rounded-full mt-4 border border-gray-200">
                <Text className="text-sm font-semibold text-gray-800">
                  {isPhoneVisible
                    ? product.phone
                    : `${product.phone.substring(0, 4)}******`}
                </Text>

                <TouchableOpacity
                  onPress={
                    isPhoneVisible ? handleCall : () => setIsPhoneVisible(true)
                  }
                  className="bg-blue-500 px-4 py-1 rounded-full"
                >
                  <Text className="text-sm font-semibold text-white">
                    {isPhoneVisible ? "Gọi ngay" : "Hiện số"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Thông tin chi tiết */}
          <View className="mb-6 px-4">
            <Text className="text-xl font-bold mb-4">Thông tin chi tiết</Text>

            <View className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Tên sản phẩm */}
              <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                <Text className="text-gray-600 text-sm">Tên sản phẩm</Text>
                <Text
                  className="text-gray-800 text-sm font-medium"
                  style={{ flexShrink: 1, flexWrap: "wrap" }}
                >
                  {formatAgeRangeName(product.name || "Chưa rõ")}
                </Text>
              </View>
              <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                <Text className="text-gray-600 text-sm">Loại danh mục</Text>
                <Text
                  className="text-gray-800 text-sm font-medium"
                  style={{ flexShrink: 1, flexWrap: "wrap" }}
                >
                  {formatAgeRangeName(product.tag || "Chưa rõ")}
                </Text>
              </View>

              {/* Giống thú cưng */}
              {product.breed?.name && (
                <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                  <Text className="text-gray-600 text-sm">Giống</Text>
                  <Text
                    className="text-gray-800 text-sm font-medium"
                    style={{ flexShrink: 1, flexWrap: "wrap" }}
                  >
                    {product.breed.name}
                  </Text>
                </View>
              )}

              {/* Độ tuổi */}
              {product.ageRange?.name && (
                <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                  <Text className="text-gray-600 text-sm">Độ tuổi</Text>
                  <Text
                    className="text-gray-800 text-sm font-medium"
                    style={{ flexShrink: 1, flexWrap: "wrap" }}
                  >
                    {formatAgeRangeName(product.ageRange.name)}
                  </Text>
                </View>
              )}

              {/* Giới tính */}
              {product.gender?.name && (
                <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                  <Text className="text-gray-600 text-sm">Giới tính</Text>
                  <Text
                    className="text-gray-800 text-sm font-medium"
                    style={{ flexShrink: 1, flexWrap: "wrap" }}
                  >
                    {product.gender.name}
                  </Text>
                </View>
              )}
              {/* Loại bài đăng */}
              <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                <Text className="text-gray-600 text-sm">Loại bài đăng</Text>
                <Text
                  className="text-gray-800 text-sm font-medium"
                  style={{ flexShrink: 1, flexWrap: "wrap" }}
                >
                  {product.postType?.name || "Chưa rõ"}
                </Text>
              </View>
              {/* Loại giao dịch */}
              <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                <Text className="text-gray-600 text-sm">Loại giao dịch</Text>
                <Text
                  className="text-gray-800 text-sm font-medium"
                  style={{ flexShrink: 1, flexWrap: "wrap" }}
                >
                  {product.dealType?.name ||  "Chưa rõ"}
                </Text>
              </View>

              {/* Danh mục trao đổi */}
              {product?.dealType?.name === "Trao đổi" &&
                !!product?.category_change?.name &&
                !!product?.sub_category_change?.name && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">
                      Danh mục trao đổi
                    </Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {formatAgeRangeName(
                        `${product.category_change?.name || ""} - ${product.sub_category_change?.name || ""}`
                      )}
                    </Text>
                  </View>
                )}

              {/* Loại sản phẩm */}
              {product.productType?.name &&
                product.category?.name !== "Tài liệu khoa" && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Loại sản phẩm</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.productType.name}
                    </Text>
                  </View>
                )}

              {/* Hãng */}
              {product.brand?.name &&
                [38, 39, 40, 46, 60, 61, 62].includes(
                  Number(product.subCategory?.id)
                ) && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Hãng</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.brand.name}
                    </Text>
                  </View>
                )}

              {/* Dòng */}
              {product.productModel?.name && (
                <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                  <Text className="text-gray-600 text-sm">Dòng</Text>
                  <Text
                    className="text-gray-800 text-sm font-medium"
                    style={{ flexShrink: 1, flexWrap: "wrap" }}
                  >
                    {product.productModel.name}
                  </Text>
                </View>
              )}

              {/* Màu sắc */}
              {product.color?.name &&
                [38, 39, 40, 41, 60, 61, 62].includes(
                  Number(product.subCategory?.id)
                ) && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Màu sắc</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.color.name}
                    </Text>
                  </View>
                )}

              {/* Dung lượng */}
              {product.capacity?.name &&
                [38, 39, 40, 41].includes(Number(product.subCategory?.id)) && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Dung lượng</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.capacity.name}
                    </Text>
                  </View>
                )}

              {/* Bảo hành */}
              {product.warranty?.name &&
                [
                  38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 60, 61, 62,
                ].includes(Number(product.subCategory?.id)) && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Bảo hành</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.warranty.name}
                    </Text>
                  </View>
                )}

              {/* Bộ vi xử lý */}
              {product.processor?.name &&
                (product.subCategory?.id == 40 ||
                  product.subCategory?.id == 41) && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Bộ vi xử lý</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.processor.name}
                    </Text>
                  </View>
                )}

              {/* RAM */}
              {product.ramOption?.name &&
                (product.subCategory?.id == 40 ||
                  product.subCategory?.id == 41) && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">RAM</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.ramOption.name}
                    </Text>
                  </View>
                )}

              {/* Loại ổ cứng */}
              {product.storageType?.name &&
                (product.subCategory?.id == 40 ||
                  product.subCategory?.id == 41) && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Loại ổ cứng</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.storageType.name}
                    </Text>
                  </View>
                )}

              {/* Card màn hình */}
              {product.graphicsCard?.name &&
                (product.subCategory?.id == 40 ||
                  product.subCategory?.id == 41) && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Card màn hình</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.graphicsCard.name}
                    </Text>
                  </View>
                )}

              {/* Chất liệu */}
              {product.material?.name &&
                (product.subCategory?.id == 23 ||
                  product.subCategory?.id == 24) && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Chất liệu</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.material.name}
                    </Text>
                  </View>
                )}
              {/* Kích cỡ */}
              {product.size?.name &&
                [25, 39, 40, 41, 44, 53, 54, 55, 56, 57].includes(
                  Number(product.subCategory?.id)
                ) && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Kích cỡ</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.size.name}
                    </Text>
                  </View>
                )}

              {/* Xuất xứ */}
              {product.origin?.name &&
                product.category?.name !== "Tài liệu khoa" && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Xuất xứ</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.origin.name}
                    </Text>
                  </View>
                )}
              {/* Tác giả */}
              {product.category?.name === "Tài liệu khoa" && product.author && (
                <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                  <Text className="text-gray-600 text-sm">
                    Tác giả/ Người biên soạn
                  </Text>
                  <Text
                    className="text-gray-800 text-sm font-medium"
                    style={{ flexShrink: 1, flexWrap: "wrap" }}
                  >
                    {product.author}
                  </Text>
                </View>
              )}
              {/* Dung tích xe (Xe máy) */}
              {product.engineCapacity?.name &&
                product.subCategory?.id == 60 && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Dung tích xe</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.engineCapacity.name}
                    </Text>
                  </View>
                )}

              {/* Số km đã đi (Xe cộ) */}
              {product.mileage != null &&
                [60, 61, 62].includes(Number(product.subCategory?.id)) && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Số km đã đi</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {Number(product.mileage).toLocaleString("vi-VN")} km
                    </Text>
                  </View>
                )}
              {/* Năm xuất bản */}
              {product.year &&
                (product.category?.name === "Tài liệu khoa" || // Tài liệu
                  [60, 61, 62].includes(Number(product.subCategory?.id))) && ( // Xe cộ
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">
                      {product.category?.name === "Tài liệu khoa"
                        ? "Năm xuất bản/ Năm học"
                        : "Năm sản xuất"}
                    </Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.year}
                    </Text>
                  </View>
                )}

              {/* Tình trạng */}
              {product.condition?.name &&
                product.category?.name !== "Thú cưng" && (
                  <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                    <Text className="text-gray-600 text-sm">Tình trạng</Text>
                    <Text
                      className="text-gray-800 text-sm font-medium"
                      style={{ flexShrink: 1, flexWrap: "wrap" }}
                    >
                      {product.condition.name}
                    </Text>
                  </View>
                )}

              {/* Số lượng ảnh */}
              <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                <Text className="text-gray-600 text-sm">Số lượng ảnh</Text>
                <Text
                  className="text-gray-800 text-sm font-medium"
                  style={{ flexShrink: 1, flexWrap: "wrap" }}
                >
                  {product.images?.length || product.imageCount || 0} ảnh
                </Text>
              </View>

              {/* Người đăng */}
              {product.authorName && (
                <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
                  <Text className="text-gray-600 text-sm">Người đăng</Text>
                  <Text
                    className="text-gray-800 text-sm font-medium"
                    style={{ flexShrink: 1, flexWrap: "wrap" }}
                  >
                    {product.authorName}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Bình luận */}
          {product.productStatus?.id === 2 && (
            <View className="mb-6 px-4">
              <Text className="text-lg font-bold mb-3">Bình luận</Text>

              {/* 🚀 SỬ DỤNG HÀM RENDER CÂY MỚI (Thêm , 0) */}
              {loadingComments ? (
                <Text>Đang tải bình luận...</Text>
              ) : comments.length > 0 ? (
                comments.map((c) => renderCommentTree(c, 0)) // 👈 SỬA Ở ĐÂY
              ) : (
                <Text className="text-gray-500 text-sm mb-4">
                  Chưa có bình luận nào. Hãy là người đầu tiên!
                </Text>
              )}

              {/* 🚀 THÊM UI "ĐANG CHỈNH SỬA..." */}
              {editingComment && (
                <View className="flex-row items-center justify-between mb-2 p-2 bg-yellow-100 rounded-lg">
                  <Text className="text-gray-700 text-sm">
                    Đang sửa bình luận...
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingComment(null);
                      setComment("");
                    }}
                  >
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              )}

              {/* UI "ĐANG TRẢ LỜI..." (ẩn đi nếu đang sửa) */}
              {replyingTo && !editingComment && (
                <View className="flex-row items-center justify-between mb-2 p-2 bg-gray-100 rounded-lg">
                  <Text className="text-gray-600 text-sm">
                    Đang trả lời {replyingTo.user?.nickname || "Người dùng"}
                  </Text>
                  <TouchableOpacity onPress={() => setReplyingTo(null)}>
                    <Ionicons name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Ô nhập + nút gửi */}
              <View className="flex-row items-center border border-gray-300 rounded-full px-3 py-2 bg-white">
                <TextInput
                  value={comment}
                  onChangeText={setComment}
                  // 🚀 Sửa placeholder
                  placeholder={
                    editingComment
                      ? "Sửa bình luận..."
                      : replyingTo
                        ? "Viết trả lời..."
                        : "Bình luận..."
                  }
                  editable={!isSending}
                  className="flex-1 px-2 text-sm"
                />
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={isSending}
                  className={`ml-2 px-4 py-2 rounded-full ${
                    isSending ? "bg-gray-400" : "bg-blue-500"
                  }`}
                >
                  {isSending ? (
                    <Text className="text-white font-semibold text-sm">
                      ...
                    </Text>
                  ) : (
                    // 🚀 Sửa text nút
                    <Text className="text-white font-semibold text-sm">
                      {editingComment ? "Cập nhật" : "Gửi"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Sản phẩm liên quan */}
          {product.productStatus?.id === 2 && (
            <View className="px-4">
              <Text className="text-xl font-bold mb-4">Sản phẩm liên quan</Text>
              {loadingRelated ? (
                <ActivityIndicator size="large" color="#3b82f6" />
              ) : relatedProducts.length > 0 ? (
                <FlatList
                  data={relatedProducts}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderRelatedItem} // Dùng hàm render mới
                />
              ) : (
                <Text className="text-gray-500 text-sm">
                  Không tìm thấy sản phẩm liên quan.
                </Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Chỉ hiển thị thanh bar nếu KHÔNG PHẢI sản phẩm của mình */}
      {product.productStatus?.id === 2 &&
        currentUser &&
        Number(product.user_id) !== Number(currentUser.id) && (
          <View className="flex-row border-t border-gray-200 bg-white p-2 shadow-lg">
            {/* Nút Gọi Ngay */}
            <TouchableOpacity
              onPress={handleCall} // Gọi thẳng hàm handleCall
              disabled={!product.phone} // Vô hiệu hóa nếu không có SĐT
              className={`flex-1 flex-row items-center justify-center rounded-lg py-3 mr-1.5 ${
                !product.phone ? "bg-gray-300" : "bg-blue-500"
              }`}
            >
              <Ionicons name="call-outline" size={18} color="white" />
              <Text className="text-white font-bold ml-2 text-base">
                Gọi ngay
              </Text>
            </TouchableOpacity>

            {/* Nút Chat */}
            <TouchableOpacity
              onPress={handleChatPress}
              className="flex-1 flex-row items-center justify-center rounded-lg bg-green-500 py-3 ml-1.5"
            >
              <Ionicons name="chatbubbles-outline" size={18} color="white" />
              <Text className="text-white font-bold ml-2 text-base">Chat</Text>
            </TouchableOpacity>
          </View>
        )}
    </View>
  );
}
