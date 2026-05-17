import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { path } from "../../config";

interface Category {
  id: string;
  name: string;
  image: string;
}

export default function ChooseCategoryScreen({ navigation, route }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const { group, onPostSuccess } = route.params || {};

  useEffect(() => {
    axios
      .get(`${path}/categories`)
      .then((res) => {
        const mapped = res.data.map((item: Category) => ({
          id: item.id.toString(),
          name: item.name,
          image: item.image
    ? item.image.startsWith("http") // Trường hợp 1: Link Cloudinary hoặc link tuyệt đối
        ? item.image
        : `${path}${item.image.startsWith("/") ? "" : "/uploads/categories/"}${item.image}` // Trường hợp 2: Ảnh lưu local (có hoặc không có dấu / ở đầu)
    : `${path}/uploads/categories/default.png`, // Trường hợp 3: Không có ảnh
        }));
        setCategories(mapped);
      })
      .catch((err) => {
        console.log("Lỗi khi lấy danh mục:", err.message);
      });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đăng tin</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>Chọn danh mục</Text>
      </View>

      {/* Danh sách danh mục */}
      <ScrollView contentContainerStyle={styles.body}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.categoryItem}
            onPress={() =>
              navigation.navigate("ChooseSubCategoryScreen", {
                category: item,
                group: group,
                onPostSuccess: onPostSuccess, 
              })
            }
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image
                source={{ uri: item.image }}
                style={{
                  width: 34,
                  height: 34,
                  marginRight: 10,
                  borderRadius: 6,
                }}
              />
              <Text style={styles.categoryText}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#3366FF" },
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  header: {
    height: 56,
    backgroundColor: "#3366FF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  sectionHeader: {
    backgroundColor: "#F3F3F3",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EDEDED",
  },
  sectionHeaderText: { fontSize: 16, fontWeight: "600", color: "#111" },
  body: { paddingHorizontal: 16, paddingVertical: 12 },
  categoryItem: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  categoryText: { fontSize: 15, fontWeight: "500", color: "#333" },
});
