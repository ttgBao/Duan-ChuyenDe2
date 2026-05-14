import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
  Modal,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import axios from "axios";
import { RootStackParamList } from "../../types";
import { path } from "../../config";
import qs from 'qs';
const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 36) / 2;
const MAX_PRICE = 100_000_000;
type Props = { route: RouteProp<RootStackParamList, "SearchResultScreen"> };

// Định nghĩa Product Entity (giảm bớt các relation không cần thiết để đơn giản hóa)
interface Product {
  id: number;
  name: string;
  price: number;
  thumbnail_url?: string | null;
  category?: { name: string };
  subCategory?: { name: string };
  condition?: { name: string };
  dealType?: { name: string };
  images?: { image_url: string }[];
}

// Interface Product cho việc hiển thị (thêm các trường tính toán)
interface ProductWithDisplay extends Product {
  displayTag: string;
  displayPrice: string;
  image: string;
  postType?: { id: number; name: string } | null;
}
interface ProductWithStatus extends ProductWithDisplay {
  productStatus?: { id: number };
}

// Khắc phục FilterState: Đồng bộ tên điều kiện và sử dụng kiểu string cho postTypes/dealTypes
interface FilterState {
  minPrice: string;
  maxPrice: string;
  category: string;
  // SỬA: Đổi "Mới" sang "Mới 100%" để khớp với backend
  conditions: ("Mới 100%" | "Cũ" | "Đã qua sử dụng")[];
  postTypes: string[];
  dealTypes: string[];
  sortBy: "price" | "created_at";
  sort: "asc" | "desc";
}

const sortOptions: { label: string; sortBy: "price" | "created_at"; sort: "asc" | "desc" }[] = [
  { label: "Mới nhất", sortBy: "created_at", sort: "desc" },
  { label: "Giá thấp → cao", sortBy: "price", sort: "asc" },
  { label: "Giá cao → thấp", sortBy: "price", sort: "desc" },
];

// Map tên hiển thị sang tên API (nếu cần)
const conditionMap: Record<string, string> = { "Mới": "Mới 100%", "Cũ": "Cũ", "Đã qua sử dụng": "Đã qua sử dụng", "Mới 100%": "Mới 100%" };


export default function SearchResultScreen({ route }: Props) {
  const { query } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [products, setProducts] = useState<ProductWithDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [priceError, setPriceError] = useState(""); // Khắc phục lỗi thiếu state

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [filters, setFilters] = useState<FilterState>({
    minPrice: "",
    maxPrice: "",
    category: "",
    conditions: [],
    postTypes: [],
    dealTypes: [],
    sortBy: "created_at",
    sort: "desc",
  });

  const fadeIn = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  };

  // Logic xử lý Input Giá
  const handlePriceChange = (text: string, type: 'minPrice' | 'maxPrice') => {
    let val = text.replace(/[^0-9]/g, "");
    setPriceError("");

    const numVal = Number(val);
    if (numVal < 0) {
      setPriceError("Giá không được âm");
      val = "";
    } else if (numVal > MAX_PRICE) {
      setPriceError(`Giá không được vượt quá ${MAX_PRICE.toLocaleString("vi-VN")}₫`);
      val = MAX_PRICE.toString();
    }

    setFilters(p => ({ ...p, [type]: val }));
  };


  // Khắc phục lỗi query params: Sử dụng Axios params object
  const fetchProducts = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (!isRefresh && loading) return;

    const minPriceNum = Number(filters.minPrice);
    const maxPriceNum = Number(filters.maxPrice);

    if (minPriceNum > maxPriceNum && maxPriceNum > 0) {
      Alert.alert("Lỗi Bộ lọc", "Giá tối thiểu không được lớn hơn giá tối đa.");
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      !isRefresh && setLoading(true);
      setError("");

      // Map condition sang tên API
      const apiConditions = filters.conditions.map(c => conditionMap[c]);

      // Chuẩn bị params
      const queryParams: any = {
        name: (query || "").trim(),
        page: pageNum.toString(),
        limit: "20",
        sortBy: filters.sortBy,
        sort: filters.sort,
        condition: apiConditions.length > 0 ? apiConditions : undefined,
        postType: filters.postTypes.length > 0 ? filters.postTypes : undefined,
        dealType: filters.dealTypes.length > 0 ? filters.dealTypes : undefined,
      };

      if (minPriceNum > 0) queryParams.minPrice = minPriceNum;
      if (maxPriceNum > 0) queryParams.maxPrice = maxPriceNum;
      if (filters.category) queryParams.category = filters.category;

      // Sử dụng qs để serialize mảng cho backend
      const res = await axios.get(`${path}/products/search`, {
        params: queryParams,
        paramsSerializer: params => qs.stringify(params, { arrayFormat: "repeat" }),
      });

      const { data, meta } = res.data;
      

      const mapped = data.map((item: any) => {
        // Ảnh
        const imageUrl =
          item.thumbnail_url ||
          item.images?.[0]?.image_url ||
          "https://cdn-icons-png.flaticon.com/512/4076/4076505.png";

        // Vị trí
        let locationText = "Chưa rõ địa chỉ";
        if (item.address_json) {
          try {
            const addr = typeof item.address_json === "string" ? JSON.parse(item.address_json) : item.address_json;
            if (addr.full) locationText = addr.full;
            else {
              const parts = [addr.ward, addr.district, addr.province].filter(Boolean).slice(-2);
              locationText = parts.length > 0 ? parts.join(", ") : "Chưa rõ địa chỉ";
            }
          } catch { }
        }

        // Thời gian
        const createdAt = item.created_at ? new Date(new Date(item.created_at).getTime() + 7 * 60 * 60 * 1000) : new Date();
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
          return Math.floor(interval / 60) + " phút trước";
        };
        const timeDisplay = timeSince(createdAt);

        // Tag
        let tagText = "Không có danh mục";
        const categoryName = item.category?.name || null;
        const subCategoryName = item.subCategory?.name || null;
        if (categoryName && subCategoryName) tagText = `${categoryName} - ${subCategoryName}`;
        else if (categoryName) tagText = categoryName;
        else if (subCategoryName) tagText = subCategoryName;

        // Price
        const priceText =
          item.dealType?.name === "Miễn phí" ? "Miễn phí" :
            item.dealType?.name === "Trao đổi" ? "Trao đổi" :
              item.price ? `${Number(item.price).toLocaleString("vi-VN")} đ` : "Liên hệ";

        return {
          id: item.id.toString(),
          image: imageUrl,
          name: item.name || "Không có tiêu đề",
          price: priceText,
          location: locationText,
          time: timeDisplay,
          tag: tagText,
          authorName: item.user?.fullName || item.user?.name || "Ẩn danh",
           postType: item.postType?.name || item.dealType?.name || "Đăng bán", // loại bài đăng 
          user_id: item.user?.id ?? item.user_id ?? 0,
          category: item.category || null,
          subCategory: item.subCategory || null,
          condition: item.condition || null,
          dealType: item.dealType || null,
          images: item.images || [],
          imageCount: item.images?.length || (imageUrl ? 1 : 0),
          description: item.description || "",
          productStatus: item.productStatus || null,
        };
      })
      const filtered = mapped
  .filter((p: ProductWithDisplay) =>  
  p.postType?.id === 1 || p.postType?.id === 2
)
  .filter((p: ProductWithStatus) => p.productStatus?.id === 2); // ✅ Lọc sản phẩm active
      setProducts(isRefresh || pageNum === 1 ? mapped : prev => [...prev, ...filtered]);
      setTotal(meta.total || 0);
      setHasMore(mapped.length === 20);
      setPage(pageNum);
      fadeIn();
    } catch (err: any) {
      console.error(err);
      setError("Không thể tải sản phẩm. Vui lòng thử lại.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      
    }
    
  }, [query, filters]);


  useEffect(() => { setProducts([]); setPage(1); setHasMore(true); fetchProducts(1, true); }, [query, filters]);


  const handleLoadMore = () => { if (hasMore && !loading) fetchProducts(page + 1); };
  const handleRefresh = () => { setRefreshing(true); fetchProducts(1, true); };
  const applyFilters = () => { setShowFilter(false); /* useEffect sẽ trigger fetchProducts khi filters thay đổi */ };

  const resetFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      category: "",
      conditions: [],
      postTypes: [],
      dealTypes: [],
      sortBy: "created_at",
      sort: "desc",
    });
    setPriceError("");
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("ProductDetail", { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardContent}>
        <Text style={{ fontSize: 12, color: "#999" }}>{item.time}</Text>
        <Text numberOfLines={2} style={styles.productName}>{item.name}</Text>
        <Text style={styles.productTag}>{item.tag}</Text>
        {item.condition && <Text style={styles.productCondition}>{item.condition.name}</Text>}
         {/* Thêm loại bài đăng */}
      <Text style={styles.postTypeText}>{item.postType}</Text>
        <Text style={[styles.productPrice, { color: item.price === "Miễn phí" ? "#FF3B30" : "#007AFF" }]}>{item.price}</Text>
        <Text style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{item.location}</Text>
        
         
      <Text style={styles.authorName}>{item.authorName}</Text>
      </View>
    </TouchableOpacity>
  );


  // Component phụ cho nút filter/sort
  const FilterButton = ({ label, isSelected, onPress }: { label: string, isSelected: boolean, onPress: () => void }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterButton, isSelected && styles.filterButtonSelected]}
    >
      <Text style={[styles.filterButtonText, { color: isSelected ? "#fff" : "#333" }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 6 }}>
            <Feather name="arrow-left" size={22} color="#333" />
          </TouchableOpacity>
          <Text numberOfLines={1} style={styles.headerTitle}>Kết quả cho “{query}” {total > 0 && `(${total})`}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowFilter(true)} style={{ padding: 6 }}>
          <Feather name="sliders" size={22} color="#333" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.centeredView}><Feather name="alert-circle" size={48} color="#FF3B30" /><Text style={styles.errorText}>{error}</Text></View>
      ) : products.length === 0 && loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : products.length === 0 && !loading ? (
        <View style={styles.centeredView}><Image source={{ uri: "https://cdn-icons-png.flaticon.com/512/4076/4076505.png" }} style={styles.noResultImage} /><Text style={styles.noResultText}>Không tìm thấy sản phẩm nào</Text></View>
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <FlatList
            data={products}
            numColumns={2}
            keyExtractor={item => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ padding: 8 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
            ListFooterComponent={hasMore && loading && page > 1 ? <ActivityIndicator style={{ marginVertical: 20 }} /> : null}
          />
        </Animated.View>
      )}

      {/* Modal Filter */}
      <Modal visible={showFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bộ lọc & Sắp xếp</Text>
              <TouchableOpacity onPress={() => setShowFilter(false)}><Feather name="x" size={24} color="#666" /></TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {/* Khoảng giá */}
              <Text style={styles.filterSectionTitle}>Khoảng giá</Text>
              <View style={styles.priceInputsContainer}>
                <TextInput placeholder="Từ" keyboardType="numeric" value={filters.minPrice} onChangeText={t => handlePriceChange(t, 'minPrice')} style={styles.priceInput} />
                <TextInput placeholder="Đến" keyboardType="numeric" value={filters.maxPrice} onChangeText={t => handlePriceChange(t, 'maxPrice')} style={styles.priceInput} />
              </View>
              {priceError ? <Text style={styles.priceErrorText}>{priceError}</Text> : null}

              {/* Danh mục */}
              <Text style={styles.filterSectionTitle}>Danh mục</Text>
              <TextInput placeholder="VD: Điện thoại, Xe máy..." value={filters.category} onChangeText={t => setFilters(p => ({ ...p, category: t }))} style={styles.textInput} />

              {/* Tình trạng */}
              <Text style={styles.filterSectionTitle}>Tình trạng</Text>
              <View style={styles.filterButtonRow}>
                {["Mới 100%", "Cũ", "Đã qua sử dụng"].map(c => ( // SỬA: Dùng "Mới 100%"
                  <FilterButton
                    key={c}
                    label={c}
                    isSelected={filters.conditions.includes(c as any)}
                    onPress={() => setFilters(p => ({ ...p, conditions: p.conditions.includes(c as any) ? p.conditions.filter(x => x !== c) : [...p.conditions, c as any] }))}
                  />
                ))}
              </View>

              {/* Loại bài đăng (Giả định postType) */}
              <Text style={styles.filterSectionTitle}>Loại bài đăng</Text>
              <View style={styles.filterButtonRow}>
                {["Đăng bán", "Đăng mua"].map(pt => (
                  <FilterButton
                    key={pt}
                    label={pt}
                    isSelected={filters.postTypes.includes(pt)}
                    onPress={() => setFilters(p => ({ ...p, postTypes: p.postTypes.includes(pt) ? p.postTypes.filter(x => x !== pt) : [...p.postTypes, pt] }))}
                  />
                ))}
              </View>

              {/* Hình thức giao dịch (Giả định dealType) */}
              <Text style={styles.filterSectionTitle}>Hình thức giao dịch</Text>
              <View style={styles.filterButtonRow}>
                {["Có giá", "Miễn phí", "Trao đổi"].map(dt => (
                  <FilterButton
                    key={dt}
                    label={dt}
                    isSelected={filters.dealTypes.includes(dt)}
                    onPress={() => setFilters(p => ({ ...p, dealTypes: p.dealTypes.includes(dt) ? p.dealTypes.filter(x => x !== dt) : [...p.dealTypes, dt] }))}
                  />
                ))}
              </View>

              {/* Sắp xếp */}
              <Text style={styles.filterSectionTitle}>Sắp xếp theo</Text>
              {sortOptions.map(opt => (
                <TouchableOpacity key={opt.label} onPress={() => setFilters(p => ({ ...p, sortBy: opt.sortBy, sort: opt.sort }))} style={[styles.sortOption, filters.sortBy === opt.sortBy && filters.sort === opt.sort && styles.sortOptionSelected]}>
                  <Text style={{ color: filters.sortBy === opt.sortBy && filters.sort === opt.sort ? "#fff" : "#333" }}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Footer Apply/Reset */}
            <View style={styles.modalFooter}>
              <TouchableOpacity onPress={() => { resetFilters(); applyFilters(); }} style={styles.resetButton}><Text style={styles.resetButtonText}>Đặt lại</Text></TouchableOpacity>
              <TouchableOpacity onPress={applyFilters} style={styles.applyButton}><Text style={styles.applyButtonText}>Áp dụng</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafafa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
    backgroundColor: "#fff",
    elevation: 2,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  headerTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  errorText: {
    color: "#FF3B30",
    marginTop: 10
  },
  noResultImage: {
    width: 120,
    height: 120,
    opacity: 0.8
  },
  noResultText: {
    color: "#555",
    marginTop: 10
  },
  card: {
    width: CARD_WIDTH,
    margin: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 160,
    backgroundColor: "#f5f5f5"
  },
  cardContent: {
    padding: 10
  },
  productName: {
    fontSize: 14,
    fontWeight: "600"
  },
  productTag: {
    marginTop: 4,
    color: "#555",
    fontSize: 13
  },
  productCondition: {
    marginTop: 4,
    backgroundColor: "#28a745",
    color: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: "600",
    alignSelf: 'flex-start'
  },
  productPrice: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700"
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  filterSectionTitle: {
    fontWeight: "600",
    marginTop: 20,
    marginBottom: 8,
  },
  priceInputsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  priceErrorText: {
    color: "#FF3B30",
    marginTop: 4,
  },
  filterButtonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f0f0f0"
  },
  filterButtonSelected: {
    backgroundColor: "#007AFF"
  },
  filterButtonText: {
    fontWeight: "500"
  },
  sortOption: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    marginBottom: 8,
  },
  sortOptionSelected: {
    backgroundColor: "#007AFF"
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "#eee"
  },
  resetButton: {
    flex: 1,
    padding: 16,
    backgroundColor: "#ddd",
    borderRadius: 10,
  },
  resetButtonText: {
    textAlign: "center",
    fontWeight: "600",
  },
  applyButton: {
    flex: 1,
    padding: 16,
    backgroundColor: "#007AFF",
    borderRadius: 10,
  },
  applyButtonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
  },
  authorName: {
  marginTop: 4,
  fontSize: 12,
  color: "#555"
},
postTypeText: {
  marginTop: 2,
  backgroundColor: "#FFA500",
  color: "#fff",
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 6,
  fontSize: 11,
  fontWeight: "600",
  alignSelf: "flex-start"
},

});