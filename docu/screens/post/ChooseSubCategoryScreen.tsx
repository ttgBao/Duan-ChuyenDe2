import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { path } from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function ChooseSubCategoryScreen({ navigation, route }: any) {
  const { category, group, onPostSuccess } = route.params;
  interface SubCategory {
    id: number;
    name: string;
  }

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        const res = await axios.get(
          `${path}/sub-categories/by-category/${category.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSubCategories(res.data);
      } catch (err: any) {
        Alert.alert(
          "Lỗi",
          err.response?.data?.message || "Không tải danh mục con"
        );
        setSubCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSubCategories();
  }, [category.id]);

  const handleSelectSubCategory = (sub: SubCategory) => {
    if (group) {
      navigation.navigate("PostGroupFormScreen", {
        group: group,
        category: category,
        subCategory: sub,
        onPostSuccess: onPostSuccess,
      });
    } else {
      navigation.navigate("PostFormScreen", {
        category: category,
        subCategory: sub,
      });
    }
  };
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        {/* HIỂN THỊ category.name */}
        <Text style={styles.headerTitle}>{category.name}</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Home")}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Danh sách danh mục */}
      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <ActivityIndicator size="small" color="#9D7BFF" />
        ) : subCategories.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            Không có danh mục con.
          </Text>
        ) : (
          subCategories.map((sub, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.categoryItem}
              onPress={() => handleSelectSubCategory(sub)}
            >
              <Text style={styles.categoryText}>{sub.name}</Text>
            </TouchableOpacity>
          ))
        )}
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
  iconPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: "#EEE",
    marginRight: 10,
  },
  categoryText: { fontSize: 15, fontWeight: "500", color: "#333" },
});
