import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../types";
import { path } from "../../../config";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ForYouTabProps = {
  navigation: NativeStackNavigationProp<RootStackParamList>;
};

export default function ForYouTab({
  navigation,
}: ForYouTabProps) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetchData = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId");

      const res = await axios.get(`${path}/groups/public${userId ? `?userId=${userId}` : ''}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setGroups(res.data);
    } catch (err) {
      console.log("❌ Lỗi khi lấy nhóm công khai:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 px-4"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Tất cả các nhóm công khai */}
      <View className="mb-20 mt-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold text-gray-900">
            Tất cả các nhóm TDC
          </Text>
        </View>

        {groups.map((g) => (
          <TouchableOpacity
            key={g.id}
            className="flex-row items-center mb-4 bg-white p-3 rounded-xl border border-gray-100 shadow-sm"
            onPress={() =>
              navigation.navigate("GroupDetailScreen", { groupId: g.id })
            }
          >
            <Image
              source={
                g.image ? { uri: g.image } : require("../../../assets/defaultgroup.png")
              }
              className="w-14 h-14 rounded-full"
            />
            <View className="ml-3 flex-1">
              <Text
                className="font-semibold text-base text-gray-800"
                numberOfLines={1}
              >
                {g.name}
              </Text>
              <Text className="text-gray-500 text-sm mt-0.5">
                {g.memberCount} thành viên
              </Text>
              <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={2}>
                {g.description}
              </Text>
            </View>
            <View className="ml-2">
              {g.joinStatus === "joined" ? (
                <View className="bg-green-50 border border-green-200 px-2 py-1 rounded-md">
                  <Text className="text-green-600 font-bold text-[11px]">
                    Joined
                  </Text>
                </View>
              ) : g.joinStatus === "pending" ? (
                <View className="bg-yellow-50 border border-yellow-200 px-2 py-1 rounded-md">
                  <Text className="text-yellow-600 font-bold text-[11px]">
                    Pending
                  </Text>
                </View>
              ) : (
                <View className="bg-red-50 border border-red-200 px-2 py-1 rounded-md">
                  <Text className="text-red-500 font-bold text-[11px]">
                    Join
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}
