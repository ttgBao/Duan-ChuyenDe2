import { useCallback, useEffect, useRef, useState } from "react";
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
import Menu from "../../components/Menu";
import "../../global.css";
import axios from "axios";
import { path } from "../../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import { useFocusEffect } from "@react-navigation/native";
import { io, Socket } from "socket.io-client";
import React from "react";
import { useChat } from "../../components/ChatContext";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "ChatListScreen">;
};

export default function ChatListScreen({ navigation }: Props) {
  const [chatList, setChatList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserIdRef = useRef<string>("");
  const { socketRef } = useChat();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [headerMenuVisible, setHeaderMenuVisible] = useState(false);

  const handleLongPress = (room: any) => {
    setSelectedRoom(room);
    setModalVisible(true);
  };

  const handleArchive = async () => {
    if (!selectedRoom) return;
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.patch(`${path}/chat/room/${selectedRoom.room_id}/status`, { status: "ARCHIVED" }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModalVisible(false);
      setSelectedRoom(null);
      fetchChats();
      Alert.alert("Thành công", "Đã chuyển đoạn chat vào mục lưu trữ.");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể lưu trữ đoạn chat.");
    }
  };

  const handleDelete = async () => {
    if (!selectedRoom) return;
    try {
      const token = await AsyncStorage.getItem("token");
      await axios.delete(`${path}/chat/room/${selectedRoom.room_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModalVisible(false);
      setSelectedRoom(null);
      fetchChats();
      Alert.alert("Thành công", "Đã xóa đoạn chat.");
    } catch (e) {
      Alert.alert("Lỗi", "Không thể xóa đoạn chat.");
    }
  };

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) return;
      const res = await axios.get(`${path}/chat/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setChatList(res.data?.data || []);
    } catch (err: any) {
      console.log(
        "❌ Lỗi tải danh sách chat:",
        err?.response?.data || err?.message
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Lần đầu + khi quay lại màn hình thì refresh
  useEffect(() => {
    fetchChats();
  }, [fetchChats]);
  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  // 🔴 NEW: Kết nối socket ngay tại ChatList để nhận realtime
useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleReceive = (msg: any) => {
      const me = currentUserIdRef.current;
      const isForMe = String(msg.receiver_id) === String(me);

      setChatList((prev) => {
        const list = [...prev];
        const idx = list.findIndex(
          (r) => Number(r.room_id) === Number(msg.conversation_id)
        );
        const patchFields = {
          last_message: msg.content ?? (msg.media_url ? "[Ảnh]" : ""),
          last_message_at: msg.created_at ?? new Date().toISOString(),
          is_last_unread: isForMe
            ? true
            : list[idx]?.is_last_unread ?? false,
          unread_count: isForMe
            ? Number(list[idx]?.unread_count || 0) + 1
            : list[idx]?.unread_count || 0,
        };

        if (idx >= 0) {
          const updated = { ...list[idx], ...patchFields };
          const rest = list.filter((_, i) => i !== idx);
          const newList = [updated, ...rest];
          newList.sort((a, b) =>
            String(b.last_message_at).localeCompare(String(a.last_message_at))
          );
          return newList;
        }
        return list;
      });
    };

    const handleEdited = (m: any) => {
      setChatList((prev) => {
        const list = [...prev];
        const idx = list.findIndex(
          (r) => Number(r.room_id) === Number(m.conversation_id)
        );
        if (idx < 0) return list;
        const updated = {
          ...list[idx],
          last_message: m.content ?? (m.media_url ? "[Ảnh]" : ""),
          last_message_at: m.updated_at ?? list[idx].last_message_at,
        };
        list[idx] = updated;
        return list.sort((a, b) =>
          String(b.last_message_at).localeCompare(String(a.last_message_at))
        );
      });
    };

    const handleRecalled = () => {
      fetchChats();
    };

    socket.on("receiveMessage", handleReceive);
    socket.on("messageEdited", handleEdited);
    socket.on("messageRecalled", handleRecalled);

    return () => {
      socket.off("receiveMessage", handleReceive);
      socket.off("messageEdited", handleEdited);
      socket.off("messageRecalled", handleRecalled);
    };
  }, [socketRef, fetchChats]);

  /** Mở phòng chat */
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
        otherUserAvatar:
          room.partner?.avatar ||
          "https://cdn-icons-png.flaticon.com/512/149/149071.png",
        currentUserId: Number(currentUserId),
        currentUserName: currentUserName || "Tôi",
        token: tokenValue,
      });
    } catch (error) {
      console.error("chat lỗi:", error);
      Alert.alert("Lỗi", "Không thể mở phòng chat. Vui lòng thử lại!");
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
      <View className="flex flex-row justify-between mt-14 items-center px-5">
        <Text className="text-2xl font-bold">Chat</Text>
        <View className="flex flex-row gap-10">
          <FontAwesome5
            name="search"
            size={20}
            color="gray"
            onPress={() => navigation.navigate("SearchScreen")}
          />
          <FontAwesome5 name="bars" size={20} color="gray" onPress={() => setHeaderMenuVisible(true)} />
        </View>
      </View>

      <View className="w-full h-[1px] bg-gray-300 mt-10" />
      <View className="flex flex-row justify-between px-5 my-5">
        <Text className="text-xl font-bold">Tất cả tin nhắn</Text>
        <Text
          className="text-xl font-bold"
          onPress={() => navigation.navigate("UnreadMessageScreen")}
        >
          Tin chưa đọc
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#555" />
          <Text className="mt-2 text-gray-500">Đang tải tin nhắn...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1">
          <View className="mb-20">
            {chatList.length === 0 ? (
              <Text className="text-center text-gray-500 mt-10">
                Bạn chưa có cuộc trò chuyện nào
              </Text>
            ) : (
              chatList.map((room) => {
                console.log("partner object:", room.partner);

                const avatarObj = room.partner ?? room.group;
                const displayName = avatarObj?.name ?? "Người dùng ẩn danh";
                const unreadFlag = room?.is_last_unread === true;
                const unreadCount: number = Number(room?.unread_count || 0);

                const avatarUri =
                  room.partner?.avatar ||
                  room.group?.thumbnail_url ||
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                return (
                  <TouchableOpacity
                    key={room.room_id}
                    className={`flex flex-row mb-2 px-4 py-3 ${unreadFlag ? "bg-blue-50" : ""}`}
                    onPress={() => handleOpenRoom(room)}
                    onLongPress={() => handleLongPress(room)}
                  >
                    <View className="relative">
                      <Image
                        className="w-[46px] h-[46px] rounded-full"
                        source={{ uri: avatarUri }}
                      />
                      {unreadFlag && (
                        <View className="absolute -top-1 -right-1 bg-blue-500 w-3.5 h-3.5 rounded-full" />
                      )}
                    </View>

                    <View className="w-[88%] pl-3 border-b border-gray-200 pb-3">
                      <View className="flex flex-row justify-between items-center">
                        <Text
                          className={`text-lg ${unreadFlag ? "font-extrabold text-black" : "font-semibold"}`}
                          numberOfLines={1}
                        >
                          {displayName}
                        </Text>
                        <Text className="text-gray-400 text-xs ml-2">
                          {renderTime(room.last_message_at)}
                        </Text>
                      </View>

                      <View className="flex flex-row items-center mt-0.5">
                        <Text
                          className={`${unreadFlag ? "font-bold text-black" : "text-gray-500"} flex-1`}
                          numberOfLines={1}
                        >
                          {room.last_message || "(chưa có tin nhắn)"}
                        </Text>
                        {unreadCount > 0 && (
                          <View className="ml-2 bg-blue-500 px-2 py-[1px] rounded-full">
                            <Text className="text-white text-[11px] font-semibold">
                              {unreadCount > 9 ? "9+" : unreadCount}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
      {/* Modal Item Chat */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          <View className="bg-white w-[80%] rounded-xl p-5 shadow-lg">
            <Text className="text-lg font-bold text-center mb-5 border-b border-gray-200 pb-3">Tùy chọn đoạn chat</Text>
            
            <TouchableOpacity onPress={handleArchive} className="py-3 flex-row items-center border-b border-gray-100">
              <FontAwesome5 name="archive" size={18} color="#3366FF" className="w-8 text-center" />
              <Text className="text-base text-gray-800 ml-2">Lưu trữ đoạn chat</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} className="py-3 flex-row items-center border-b border-gray-100">
              <FontAwesome5 name="trash-alt" size={18} color="#FF3B30" className="w-8 text-center" />
              <Text className="text-base text-red-500 ml-2">Xóa đoạn chat</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} className="py-3 flex-row justify-center mt-2">
              <Text className="text-base text-gray-500 font-semibold">Hủy</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Header Menu */}
      <Modal visible={headerMenuVisible} transparent={true} animationType="fade">
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'flex-end', paddingTop: 80, paddingRight: 20 }} 
          activeOpacity={1} 
          onPress={() => setHeaderMenuVisible(false)}
        >
          <View className="bg-white rounded-lg shadow-xl w-48 overflow-hidden">
            <TouchableOpacity 
              className="px-4 py-3 border-b border-gray-100 flex-row items-center"
              onPress={() => {
                setHeaderMenuVisible(false);
                navigation.navigate("ArchivedChatsScreen" as any);
              }}
            >
              <FontAwesome5 name="archive" size={14} color="#555" />
              <Text className="ml-3 text-gray-700">Đoạn chat lưu trữ</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Menu />
    </View>
  );
}
