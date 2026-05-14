import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { path } from "../../config";
import { categoryEndpoints } from "../../src/constants/category-endpoints";

interface SubCategory {
  id: string;
  name: string;
}

export default function ChooseExchangeSubCategoryScreen({ navigation, route }: any) {
  const { category, onSelectSubCategory } = route.params;

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fullUrl = `${path}/sub-categories/by-category/${category.id}`;

    axios.get(fullUrl)
      .then((res) => {
        const data: SubCategory[] = res.data.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
        }));
        setSubCategories(data);
      })
      .catch((err) => {
        console.log("❌ Lỗi khi lấy danh mục con trao đổi:", err.message);
      })
      .finally(() => setLoading(false));
  }, [category]);

  const handleSelectSubCategory = (sub: SubCategory) => {
    onSelectSubCategory?.(sub); // gọi callback đã được truyền từ PostFormScreen
    navigation.goBack(); // về PostFormScreen
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Header */}
      <View style={{ flexDirection: "row", padding: 12, backgroundColor: "#3366FF", justifyContent: "space-between", marginTop: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={{ color: "white", fontWeight: "bold" }}>
          {typeof category.name === "string" ? category.name : "Danh mục"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Danh sách danh mục con */}
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {loading ? (
          <ActivityIndicator size="small" color="#9D7BFF" />
        ) : subCategories.length === 0 ? (
          <Text style={{ textAlign: "center", marginTop: 20 }}>Không có danh mục con.</Text>
        ) : (
          subCategories.map((sub) => (
            <TouchableOpacity
              key={sub.id}
              style={{
                borderWidth: 1,
                borderColor: "#E0E0E0",
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 14,
                marginBottom: 8,
                backgroundColor: "#fff",
              }}
              onPress={() => handleSelectSubCategory(sub)}
            >
              <Text>{sub.name}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
