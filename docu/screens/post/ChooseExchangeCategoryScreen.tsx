import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { path } from "../../config";

interface Category {
  id: string;
  name: string;
  image: string;
}
interface SubCategory {
  id: string;
  name: string;
}
export default function ChooseExchangeCategoryScreen({ navigation, route }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const { onSelect } = route.params;

  useEffect(() => {
    axios.get(`${path}/categories`)
      .then((res) => {
        const mapped = res.data.map((item: Category) => ({
          id: item.id.toString(),
          name: item.name,
          image:
            item.image && item.image.startsWith("/uploads")
              ? `${path}${item.image}`
              : item.image
                ? `${path}/uploads/categories/${item.image}`
                : `${path}/uploads/categories/default.png`,
        }));
        setCategories(mapped);
      })
      .catch((err) => {
        console.log("Lỗi khi lấy danh mục trao đổi:", err.message);
      });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", padding: 12, backgroundColor: "#3366FF", justifyContent: "space-between", marginTop: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={{ color: "white", fontWeight: "bold" }}>Chọn danh mục trao đổi</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {categories.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={{
              borderWidth: 1,
              borderColor: "#E0E0E0",
              borderRadius: 8,
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginBottom: 8,
              backgroundColor: "#fff"
            }}
            onPress={() =>
              navigation.navigate("ChooseExchangeSubCategoryScreen", {
                category: item,
                onSelectSubCategory: (sub: SubCategory) => {
                  // Gọi callback trực tiếp từ PostFormScreen
                  route.params.onSelectCategory?.(item, sub);
                  navigation.goBack(); // back về PostFormScreen
                },
              })
            }
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Image source={{ uri: item.image }} style={{ width: 34, height: 34, marginRight: 10, borderRadius: 6 }} />
            <Text>{item.name}</Text>
            </View>
            
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}
