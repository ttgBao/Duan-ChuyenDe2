// screens/FeedbackScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { path } from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

export default function FeedbackScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [givenRatings, setGivenRatings] = useState<any[]>([]);
  const [receivedRatings, setReceivedRatings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeedback = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      const res = await axios.get(`${path}/users/feedback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // console.log(res.data);
      setGivenRatings(res.data.given || []);
      setReceivedRatings(res.data.received || []);
    } catch (err: any) {
      Alert.alert("Lỗi", "Không thể tải đánh giá");
      console.log(err.response?.data || err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchFeedback(true);
  }, []);

  const handleDeleteRating = (userId: number) => {
    Alert.alert("Xóa đánh giá", "Bạn có chắc muốn xóa đánh giá này?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem("token");
            await axios.delete(`${path}/users/${userId}/rate`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            Alert.alert("Thành công", "Đã xóa đánh giá");
            fetchFeedback(); // reload lại danh sách
          } catch (err) {
            Alert.alert("Lỗi", "Không thể xóa đánh giá");
          }
        },
      },
    ]);
  };

  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Hôm nay";
    if (days < 7) return `${days} ngày trước`;
    if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
    return `${Math.floor(days / 30)} tháng trước`;
  };

  const renderGivenRating = ({ item }: { item: any }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-md border border-gray-100">
      <View className="flex-row items-center justify-between mb-3">
        <TouchableOpacity
          className="flex-row items-center flex-1"
          onPress={() =>
            navigation.navigate("UserInforScreen", {
              userId: item.ratedUser.id,
            })
          }
        >
          <Image
            source={
              item.ratedUser?.image
                ? {
                    uri: item.ratedUser.image.startsWith("http")
                      ? item.ratedUser.image
                      : `${path}${item.ratedUser.image}`,
                  }
                : require("../../assets/khi.png")
            }
            className="w-12 h-12 rounded-full mr-3"
          />
          <View>
            <Text className="font-semibold text-base">
              {item.ratedUser?.fullName}
            </Text>
            <Text className="text-xs text-gray-500">
              {timeAgo(item.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Nút xóa */}
        <TouchableOpacity
          onPress={() => handleDeleteRating(item.ratedUser.id)}
          className="p-2"
        >
          <MaterialIcons name="delete" size={22} color="#f87171" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= item.stars ? "star" : "star-outline"}
            size={18}
            color="#fbbf24"
          />
        ))}
        <Text className="ml-2 text-sm text-gray-600">Bạn đã đánh giá</Text>
      </View>

      {item.content && (
        <Text className="text-gray-700 text-sm leading-5">{item.content}</Text>
      )}
    </View>
  );

  const renderReceivedRating = ({ item }: { item: any }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-md border border-gray-100">
      <View className="flex-row items-center mb-3">
        <Image
          source={
            item.reviewer?.avatar
              ? {
                  uri: item.reviewer.avatar.startsWith("http")
                    ? item.reviewer.avatar
                    : `${path}${item.reviewer.avatar}`,
                }
              : require("../../assets/khi.png")
          }
          className="w-12 h-12 rounded-full mr-3"
        />
        <View>
          <Text className="font-semibold text-base">{item.reviewer?.name}</Text>
          <Text className="text-xs text-gray-500">
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= item.stars ? "star" : "star-outline"}
            size={18}
            color="#fbbf24"
          />
        ))}
        <Text className="ml-2 text-sm text-gray-600">Đánh giá về bạn</Text>
      </View>

      {item.content && (
        <Text className="text-gray-700 text-sm leading-5">{item.content}</Text>
      )}
    </View>
  );

  const renderEmpty = (text: string) => (
    <View className="items-center py-10">
      <Ionicons name="star-outline" size={48} color="#f59e0b" />
      <Text className="text-gray-600 text-center px-10 mt-2">{text}</Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 py-4 flex-row items-center justify-between border-b border-gray-200">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold">Đánh giá</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={null}
          ListHeaderComponent={
            <View>
              {/* Section: Tôi đã đánh giá người khác */}
              <Text className="text-lg font-bold px-4 mt-4 mb-2">
                Tôi đã đánh giá
              </Text>
              <FlatList
                data={givenRatings}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderGivenRating}
                ListEmptyComponent={renderEmpty("Bạn chưa đánh giá ai")}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              />

              {/* Section: Người khác đánh giá tôi */}
              <Text className="text-lg font-bold px-4 mt-6 mb-2">
                Người khác đánh giá tôi
              </Text>
              <FlatList
                data={receivedRatings}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderReceivedRating}
                ListEmptyComponent={renderEmpty("Chưa có ai đánh giá bạn")}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              />
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}