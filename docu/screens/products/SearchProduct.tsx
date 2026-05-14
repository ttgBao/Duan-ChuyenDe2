import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Keyboard,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import debounce from "lodash.debounce";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../../types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";

type SearchNavProp = NativeStackNavigationProp<RootStackParamList, "SearchProduct">;

const HOT_KEYWORDS_KEY = "HOT_KEYWORDS_2025";

// Ghi lại từ khóa tìm kiếm
const recordSearch = async (keyword: string) => {
  const key = keyword.trim().toLowerCase();
  if (!key) return;
  try {
    const raw = await AsyncStorage.getItem(HOT_KEYWORDS_KEY);
    const stats: Record<string, number> = raw ? JSON.parse(raw) : {};
    stats[key] = (stats[key] || 0) + 1;
    const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 100);
    await AsyncStorage.setItem(HOT_KEYWORDS_KEY, JSON.stringify(Object.fromEntries(sorted)));
  } catch (err) {
    console.log("Error recording hot keyword:", err);
  }
};

// Lấy hot keywords
const getRealtimeHotKeywords = async (limit = 12): Promise<string[]> => {
  try {
    const raw = await AsyncStorage.getItem(HOT_KEYWORDS_KEY);
    if (!raw) return [];
    const stats: Record<string, number> = JSON.parse(raw);
    return Object.keys(stats)
      .sort((a, b) => stats[b] - stats[a])
      .slice(0, limit)
      .map(k => k.charAt(0).toUpperCase() + k.slice(1));
  } catch (err) {
    return [];
  }
};

const SearchProduct = () => {
  const navigation = useNavigation<SearchNavProp>();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hotKeywords, setHotKeywords] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  // Load hot keywords
  useEffect(() => {
    (async () => {
      const realtime = await getRealtimeHotKeywords(12);
      setHotKeywords(realtime.length ? realtime : [
        "iPhone 15", "Tai nghe", "Áo thun", "Giày sneaker", "Laptop", "Điện thoại cũ", "Máy lạnh", "Tủ lạnh"
      ]);
    })();
  }, []);

  // Load lịch sử tìm kiếm
  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("search_history");
      if (saved) setHistory(JSON.parse(saved));
    })();
  }, []);

  // Debounce gợi ý
  const fetchSuggestions = useCallback(
    debounce((text: string) => {
      if (!text.trim()) return setShowSuggestions(false);
      setSuggestions([
        text,
        `${text} chính hãng`,
        `${text} giá rẻ`,
        `${text} cũ đẹp 99%`,
        `${text} mới 100%`,
        `Mua ${text} ở đâu rẻ nhất`,
      ]);
      setShowSuggestions(true);
    }, 300),
    []
  );

  useEffect(() => {
    fetchSuggestions(query);
    return () => fetchSuggestions.cancel();
  }, [query]);

  // Lưu lịch sử
  const saveHistory = async (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) return;
    const newHistory = [trimmed, ...history.filter(h => h !== trimmed)].slice(0, 10);
    setHistory(newHistory);
    await AsyncStorage.setItem("search_history", JSON.stringify(newHistory));
  };

  // Tìm kiếm
  const handleSearch = async (keyword?: string) => {
    const searchText = (keyword || query).trim();
    if (!searchText) return;
    Keyboard.dismiss();
    await saveHistory(searchText);
    await recordSearch(searchText);
    setShowSuggestions(false);
    setQuery("");
    navigation.navigate("SearchResultScreen", { query: searchText });
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem("search_history");
  };

  const handleImageSearch = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Bạn cần cấp quyền truy cập thư viện ảnh để tìm kiếm bằng hình ảnh!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Chuyển sang màn hình kết quả với tham số ảnh AI
      navigation.navigate("SearchResultScreen", { imageUri: result.assets[0].uri, isAiSearch: true });
    }
  };

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      onPress={() => handleSearch(item)}
      style={{ flexDirection: "row", padding: 14, borderBottomWidth: 1, borderBottomColor: "#f2f2f2", alignItems: "center" }}
    >
      <Feather name="search" size={18} color="#888" style={{ marginRight: 12 }} />
      <Text style={{ flex: 1, fontSize: 16, color: "#333" }}>{item}</Text>
      <Feather name="arrow-up-left" size={16} color="#ccc" />
    </TouchableOpacity>
  );

  const hasQuery = query.trim().length > 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }} edges={["top"]}>
      {/* Thanh tìm kiếm */}
      <View style={{ flexDirection: "row", alignItems: "center", padding: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#f5f5f7", borderRadius: 12, paddingHorizontal: 12, marginHorizontal: 12 }}>
          <Feather name="search" size={18} color="#999" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm kiếm sản phẩm, thương hiệu..."
            placeholderTextColor="#aaa"
            style={{ flex: 1, marginLeft: 10, fontSize: 16, paddingVertical: 10 }}
            returnKeyType="search"
            onSubmitEditing={() => hasQuery && handleSearch()}
            autoFocus
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Feather name="x-circle" size={20} color="#aaa" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleImageSearch}>
              <Feather name="camera" size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => hasQuery && handleSearch()}
          style={{ backgroundColor: hasQuery ? "#007AFF" : "#ccc", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 }}
          disabled={!hasQuery}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>Tìm</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {showSuggestions ? (
          <FlatList
            data={suggestions}
            renderItem={renderItem}
            keyExtractor={(_, i) => i.toString()}
            keyboardShouldPersistTaps="handled"
          />
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled">
            {/* Lịch sử */}
            {history.length > 0 && (
              <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Text style={{ fontSize: 17, fontWeight: "600" }}>Tìm kiếm gần đây</Text>
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={{ color: "#FF3B30", fontSize: 14 }}>Xoá tất cả</Text>
                  </TouchableOpacity>
                </View>
                {history.map((h, i) => (
                  <TouchableOpacity key={i} onPress={() => handleSearch(h)} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10 }}>
                    <Feather name="clock" size={16} color="#888" />
                    <Text style={{ marginLeft: 12, fontSize: 15, color: "#333" }}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Hot Keywords */}
            <View style={{ paddingHorizontal: 16, marginTop: history.length ? 20 : 30 }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Feather name="zap" size={22} color="#FF3B30" />
                <Text style={{ fontSize: 17, fontWeight: "600", marginLeft: 8 }}>Đang thịnh hành</Text>
              </View>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {hotKeywords.map((kw, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSearch(kw)}
                    style={{
                      backgroundColor: i < 3 ? "#FFEBEB" : "#EAF4FF",
                      borderWidth: 1,
                      borderColor: i < 3 ? "#FF3B30" : "#007AFF33",
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ color: i < 3 ? "#FF3B30" : "#007AFF", fontWeight: "600" }}>
                      {i < 3 && "TOP "}#{i + 1} {kw}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

export default SearchProduct;
