import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import { path } from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { useFocusEffect } from "@react-navigation/native";
import React from "react";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ArchivedChatsScreen">;
};

export default function ArchivedChatsScreen({ navigation }: Props) {
  const [chatList, setChatList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${path}/chat/list?status=ARCHIVED`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatList(res.data?.data || []);
    } catch (err: any) {
      console.log("Lỗi tải danh sách lưu trữ:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  const handleOpenRoom = async (room: any) => {
    try {
      const tokenValue = await AsyncStorage.getItem("token");
      const currentUserId = await AsyncStorage.getItem("userId");
      const currentUserName = await AsyncStorage.getItem("userName");

      if (!tokenValue || !currentUserId) {
        Alert.alert("Thông báo", "Vui lòng đăng nhập lại để tiếp tục.");
        return;
      }

      navigation.navigate("ChatRoomScreen", {
        roomId: room.room_id,
        product: room.product ?? null,
        otherUserId: room.partner?.id ?? null,
        otherUserName: room.partner?.name ?? "Người dùng",
        otherUserAvatar: room.partner?.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        currentUserId: Number(currentUserId),
        currentUserName: currentUserName || "Tôi",
        token: tokenValue,
      });
    } catch (error) {
      Alert.alert("Lỗi", "Không thể mở phòng chat. Vui lòng thử lại!");
    }
  };

  const handleLongPress = (room: any) => {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const handleRestore = async () => {
    if (!selectedRoom) return;
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.patch(`${path}/chat/room/${selectedRoom.room_id}/status`, { status: "ACTIVE" }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModalVisible(false);
      setSelectedRoom(null);
      fetchChats();
      Alert.alert("Thành công", "Đã khôi phục đoạn chat.");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể khôi phục đoạn chat.");
    }
  };

  const renderTime = (dt?: string) => {
    if (!dt) return "";
    try {
      return new Date(dt).toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <View className="flex-1 bg-[#f5f6fa]">
      <StatusBar style="auto" />
      <View className="flex flex-row mt-14 items-center px-5 pb-2">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <FontAwesome5 name="arrow-left" size={20} color="gray" />
        </TouchableOpacity>
        <Text className="text-xl font-bold">Lưu trữ</Text>
      </View>

      <View className="w-full h-[1px] bg-gray-300 mb-2" />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3366FF" />
          <Text className="mt-2 text-gray-500">Đang tải...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          <View className="mb-20">
            {chatList.length === 0 ? (
              <Text className="text-center text-gray-500 mt-10">
                Không có đoạn chat lưu trữ nào
              </Text>
            ) : (
              chatList.map((room) => {
                const avatarObj = room.partner ?? room.group;
                const displayName = avatarObj?.name ?? "Người dùng ẩn danh";
                const unreadFlag = room?.is_last_unread === true;
                const avatarUri = room.partner?.avatar || room.group?.thumbnail_url || "https://cdn-icons-png.flaticon.com/512/149/149071.png";

                return (
                  <TouchableOpacity
                    key={room.room_id}
                    className="flex flex-row mb-2 px-4 py-3"
                    onPress={() => handleOpenRoom(room)}
                    onLongPress={() => handleLongPress(room)}
                  >
                    <Image
                      className="w-[46px] h-[46px] rounded-full"
                      source={{ uri: avatarUri }}
                    />
                    <View className="w-[88%] pl-3 border-b border-gray-200 pb-3 justify-center">
                      <View className="flex flex-row justify-between items-center">
                        <Text className={`text-lg ${unreadFlag ? "font-extrabold text-black" : "font-semibold"}`} numberOfLines={1}>
                          {displayName}
                        </Text>
                        <Text className="text-gray-400 text-xs ml-2">
                          {renderTime(room.last_message_at)}
                        </Text>
                      </View>
                      <Text className={`${unreadFlag ? "font-bold text-black" : "text-gray-500"} mt-0.5`} numberOfLines={1}>
                        {room.last_message || "(chưa có tin nhắn)"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      )}

      {/* Modal Khôi phục */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View className="bg-white w-[80%] rounded-xl p-5 shadow-lg">
            <Text className="text-lg font-bold text-center mb-5 border-b border-gray-200 pb-3">Tùy chọn đoạn chat</Text>
            
            <TouchableOpacity onPress={handleRestore} className="py-3 flex-row items-center border-b border-gray-100">
              <FontAwesome5 name="undo-alt" size={18} color="#3366FF" className="w-8 text-center" />
              <Text className="text-base text-blue-600 ml-2">Khôi phục đoạn chat</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} className="py-3 flex-row justify-center mt-2">
              <Text className="text-base text-gray-500 font-semibold">Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
