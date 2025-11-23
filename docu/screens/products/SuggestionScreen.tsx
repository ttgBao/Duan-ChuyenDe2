import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList, Product } from "../../types";
import { Feather } from "@expo/vector-icons";
import axios from "axios";
import { path } from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SuggestionFeedItem = {
  subCategory: { id: number; name: string };
  sellingSuggestions: Product[];
  buyingSuggestions: Product[];
};

type SuggestionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "SuggestionScreen"
>;

type Props = {
  navigation: SuggestionScreenNavigationProp;
};

const fetchSuggestionFeed = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("Chưa đăng nhập");
  const res = await axios.get(`${path}/products/suggestions/my-feed`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export default function SuggestionScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState("sell");
  const [feedData, setFeedData] = useState<SuggestionFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedSubCatId, setSelectedSubCatId] = useState<number | null>(null);

  const fetchFavorites = async () => {
    try {
      const userIdStr = await AsyncStorage.getItem("userId");
      if (!userIdStr) return;
      const userId = parseInt(userIdStr, 10);
      const res = await axios.get(`${path}/favorites/user/${userId}`);
      setFavoriteIds(res.data.productIds || []);
    } catch (err) {
      console.log("Lỗi khi lấy danh sách yêu thích:", err);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [feedResult] = await Promise.all([fetchSuggestionFeed(), fetchFavorites()]);
        const mappedFeedData = feedResult.map((feedItem: SuggestionFeedItem) => ({
          ...feedItem,
          sellingSuggestions: feedItem.sellingSuggestions.map(mapProductData),
          buyingSuggestions: feedItem.buyingSuggestions.map(mapProductData),
        }));
        setFeedData(mappedFeedData);
      } catch (err: any) {
        console.error("Lỗi lấy feed gợi ý:", err.message);
        Alert.alert("Lỗi", "Không thể tải gợi ý. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const filterCategories = useMemo(() => {
    const categories = feedData.map((item) => ({
      id: item.subCategory.id,
      name: item.subCategory.name,
    }));
    return [{ id: 0, name: "Tất cả" }, ...categories];
  }, [feedData]);

  const filteredFeedData = useMemo(() => {
    if (!selectedSubCatId || selectedSubCatId === 0) return feedData;
    return feedData.filter((item) => item.subCategory.id === selectedSubCatId);
  }, [feedData, selectedSubCatId]);

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
      if (!item.thumbnail_url && item.images?.length) return item.images[0].image_url;
      const url = item.thumbnail_url || "";
      return url.startsWith("http") ? url : `${path}${url}`;
    })();

    let locationText = "Chưa rõ địa chỉ";
    if (item.address_json) {
      try {
        const addr = typeof item.address_json === "string" ? JSON.parse(item.address_json) : item.address_json;
        if (addr.full) {
          locationText = addr.full;
        } else {
          const parts = [addr.ward, addr.district, addr.province].filter(Boolean).slice(-2);
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
    if (categoryName && subCategoryName) tagText = `${categoryName} - ${subCategoryName}`;
    else if (categoryName) tagText = categoryName;
    else if (subCategoryName) tagText = subCategoryName;

    const priceDisplay = (() => {
      if (item.dealType?.name === "Miễn phí") return "Miễn phí";
      if (item.dealType?.name === "Trao đổi") return "Trao đổi";
      return item.price ? `${Number(item.price).toLocaleString("vi-VN")} đ` : "Liên hệ";
    })();

    return {
      id: item.id.toString(),
      image: imageUrl,
      name: item.name || "Không có tiêu đề",
      price: priceDisplay,
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
      productType: item.productType || null,
      origin: item.origin || null,
      material: item.material || null,
      size: item.size || null,
      brand: item.brand || null,
      color: item.color || null,
      capacity: item.capacity || null,
      warranty: item.warranty || null,
      productModel: item.productModel || null,
      processor: item.processor || null,
      ramOption: item.ramOption || null,
      storageType: item.storageType || null,
      graphicsCard: item.graphicsCard || null,
      breed: item.breed || null,
      ageRange: item.ageRange || null,
      gender: item.gender || null,
      engineCapacity: item.engineCapacity || null,
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
  };

  const renderFilterBar = () => (
    <View className="py-3 bg-white border-b border-gray-100">
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={filterCategories}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => {
          const isSelected = selectedSubCatId === item.id || (item.id === 0 && selectedSubCatId === null);
          return (
            <TouchableOpacity
              onPress={() => setSelectedSubCatId(item.id)}
              className={`mr-3 px-4 py-2 rounded-full border ${
                isSelected ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"
              }`}
            >
              <Text className={`font-medium ${isSelected ? "text-white" : "text-gray-600"}`}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );

  const renderSuggestionSection = (item: SuggestionFeedItem) => {
    const dataList = activeTab === "sell" ? item.sellingSuggestions : item.buyingSuggestions;

    return (
      <View key={item.subCategory.id} className="mb-6 bg-white pb-4 border-b border-gray-100">
        <View className="flex-row justify-between items-center px-4 mb-3">
          <Text className="text-lg font-bold text-gray-800">{item.subCategory.name}</Text>
        </View>

        <View className="px-4">
          {dataList.length > 0 ? (
            <FlatList
              data={dataList}
              numColumns={1}
              scrollEnabled={false}
              keyExtractor={(product) => product.id.toString()}
              renderItem={renderSimpleProductItem}
            />
          ) : (
            <View className="bg-gray-50 p-4 rounded-lg items-center justify-center">
              <Text className="text-gray-500 text-center italic">
                {activeTab === "sell"
                  ? "Chưa có ai đăng cần mua sản phẩm này."
                  : "Chưa có ai đăng bán sản phẩm này."}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderSimpleProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-xl p-3 mb-3 shadow-sm border border-gray-100"
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    >
      <Image source={{ uri: item.image }} className="w-20 h-20 rounded-lg" resizeMode="cover" />
      <View className="flex-1 ml-3">
        <Text className="text-base font-semibold text-gray-800 mb-1" numberOfLines={1}>
          {item.name}
        </Text>
        <View className="flex-row items-center mb-1">
          <Feather name="tag" size={12} color="#6b7280" />
          <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
            {item.tag}
          </Text>
        </View>
        <Text className="text-sm font-medium text-indigo-600">{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-bold ml-4">Gợi ý dành cho bạn</Text>
      </View>

      <View className="flex-row">
        <TouchableOpacity
          onPress={() => setActiveTab("sell")}
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === "sell" ? "border-blue-500" : "border-gray-300"
          }`}
        >
          <Text className={`font-bold ${activeTab === "sell" ? "text-blue-500" : "text-gray-500"}`}>
            Gợi ý Bán (Tìm người Mua)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("buy")}
          className={`flex-1 py-3 items-center border-b-2 ${
            activeTab === "buy" ? "border-blue-500" : "border-gray-300"
          }`}
        >
          <Text className={`font-bold ${activeTab === "buy" ? "text-blue-500" : "text-gray-500"}`}>
            Gợi ý Mua (Tìm người Bán)
          </Text>
        </TouchableOpacity>
      </View>

      {!loading && feedData.length > 0 && renderFilterBar()}

      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" className="mt-20" />
      ) : (
        <ScrollView className="flex-1 mt-4">
          {filteredFeedData.length > 0 ? (
            filteredFeedData.map(renderSuggestionSection)
          ) : (
            <Text className="text-center text-gray-500 mt-20 px-4">
              Bạn chưa đăng tin nào, hãy đăng tin để chúng tôi cá nhân hoá gợi ý cho bạn nhé!
            </Text>
          )}
          <View className="h-10" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}