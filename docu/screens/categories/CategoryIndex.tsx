import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Product, RootStackParamList } from "../../types";
import { Feather } from "@expo/vector-icons";
import Menu from "../../components/Menu";
import axios from "axios";
import { path } from "../../config";

type Props = NativeStackScreenProps<RootStackParamList, "CategoryIndex">;

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
  if (interval >= 1) return Math.floor(interval) + " phút trước";
  return Math.floor(seconds) > 5
    ? Math.floor(seconds) + " giây trước"
    : "vừa xong";
};

const CategoryIndex: React.FC<Props> = ({ route, navigation }) => {
  const { categoryId, categoryName } = route.params ?? {};

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setError("Không có ID danh mục");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    axios
      .get(`${path}/products?category_id=${categoryId}`)
      .then((res) => {
        const rawData = Array.isArray(res.data) ? res.data : [res.data];
        const mapped: Product[] = rawData.map((item: any) => {
          const imageUrl = item.thumbnail_url?.startsWith("http")
            ? item.thumbnail_url
            : item.thumbnail_url
              ? `${path}${item.thumbnail_url}`
              : item.images?.[0]?.image_url
                ? `${path}${item.images[0].image_url}`
                : "https://cdn-icons-png.flaticon.com/512/8146/8146003.png";

          let locationText = "Chưa rõ địa chỉ";
          if (item.address_json) {
            try {
              const addr =
                typeof item.address_json === "string"
                  ? JSON.parse(item.address_json)
                  : item.address_json;
              locationText = addr.full
                ? addr.full
                : [addr.ward, addr.district, addr.province]
                    .filter(Boolean)
                    .slice(-2)
                    .join(", ") || "Chưa rõ địa chỉ";
            } catch {
              locationText = "Chưa rõ địa chỉ";
            }
          }

          const createdAt = item.created_at
            ? new Date(new Date(item.created_at).getTime() + 7 * 60 * 60 * 1000)
            : new Date();
          const timeDisplay = timeSince(createdAt);

          const categoryNameItem = item.category?.name || null;
          const subCategoryObj = item.subCategory
            ? {
                id: item.subCategory.id
                  ? parseInt(item.subCategory.id)
                  : undefined,
                name: item.subCategory.name,
                source_table: item.subCategory.source_table,
                source_detail: item.subCategory.source_detail,
              }
            : undefined;

          let tagText = "Không có danh mục";
          if (categoryNameItem && subCategoryObj?.name)
            tagText = `${categoryNameItem} - ${subCategoryObj.name}`;
          else if (categoryNameItem) tagText = categoryNameItem;
          else if (subCategoryObj?.name) tagText = subCategoryObj.name;

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
            authorName: item.user?.nickname || item.user?.name || "Ẩn danh",
            user_id: item.user?.id ?? item.user_id ?? 0,
            category: item.category || null,
            subCategory: item.subCategory || null,
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
        });

        setProducts(mapped);
      })
      .catch((err) => {
        console.error("Lỗi fetch products:", err);
        setError("Không thể tải sản phẩm. Vui lòng thử lại.");
      })
      .finally(() => setLoading(false));
  }, [categoryId]);

  const filtered = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(query.trim().toLowerCase())
      ),
    [products, query]
  );

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500 text-center px-4">{error}</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4">
          <Text className="text-blue-500">Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderProductListItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className="flex-row items-center bg-white rounded-xl p-3 mb-3 shadow-sm border border-gray-100"
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
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
          <Feather name="tag" size={12} color="#6b7280" />
          <Text className="text-xs text-gray-500 ml-1" numberOfLines={1}>
            {item.tag}
          </Text>
        </View>
        <Text className="text-sm font-medium text-indigo-600">
          {item.price}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-white">
      <View className="flex-row items-center px-4 pt-6 pb-3 bg-slate-50">
        <TouchableOpacity
          className="p-2 rounded-lg bg-white shadow"
          onPress={() => navigation.goBack()}
          accessibilityLabel="Quay lại"
        >
          <Feather name="chevron-left" size={22} color="#111827" />
        </TouchableOpacity>

        <View className="flex-row items-center flex-1 bg-white rounded-xl px-3 h-12 ml-3 border border-slate-200">
          <Feather name="search" size={16} color="#6b7280" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Tìm trong ${categoryName ?? "danh mục"}`}
            returnKeyType="search"
            className="ml-3 flex-1 text-sm text-slate-800 p-0"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && (
            <TouchableOpacity
              className="p-2 rounded-full bg-slate-100 ml-2"
              onPress={() => setQuery("")}
            >
              <Feather name="x" size={16} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text className="text-lg font-semibold text-slate-800 px-4 mt-3">
        {categoryName ?? categoryId}
      </Text>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#9D7BFF" />
          <Text className="text-slate-500 mt-2">Đang tải sản phẩm...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
          numColumns={1}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center p-8">
              <Text className="text-center text-slate-500 text-lg mb-2">
                Không tìm thấy sản phẩm
              </Text>
              <Text className="text-center text-slate-400 text-sm">
                Thử tìm kiếm khác hoặc quay lại danh mục chính
              </Text>
            </View>
          }
          renderItem={renderProductListItem}
        />
      )}

      <View className="absolute bottom-0 left-0 right-0">
        <Menu />
      </View>
    </View>
  );
};

export default CategoryIndex;
