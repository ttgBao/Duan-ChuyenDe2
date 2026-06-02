import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import Menu from "../../components/Menu";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import axios from "axios";
import { path } from "../../config";
import React from "react";
import { useChat } from "../../components/ChatContext";

export default function UserScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { socketRef, setUnreadCount } = useChat();  // 👈 LẤY TỪ ChatContext

  // GỘP USER VÀO 1 OBJECT
  const [user, setUser] = useState<{
    id: string;
    name: string;
    avatar: string | null;
    roleId: string | null;
  }>({
    id: "",
    name: "",
    avatar: null,
    roleId: null,
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        const token = await AsyncStorage.getItem("token");

        if (!userId || !token) {
          const localName = await AsyncStorage.getItem("userName");
          const localAvatar = await AsyncStorage.getItem("userAvatar");
          const localRoleId = await AsyncStorage.getItem("role_id");

          setUser({
            id: userId || "",
            name: localName || "",
            avatar: localAvatar || null,
            roleId: localRoleId || null,
          });
          return;
        }

        const res = await axios.get(`${path}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const nickname = res.data.nickname || res.data.name || "";
        const image = res.data.image || null;
        const apiRoleId =
          res.data.roleId != null ? String(res.data.roleId) : null;

        setUser({
          id: userId,
          name: nickname,
          avatar: image,
          roleId: apiRoleId,
        });

        await AsyncStorage.multiSet([
          ["userName", nickname],
          ["userAvatar", image || ""],
          ["role_id", apiRoleId || ""],
        ]);
      } catch (err) {
        console.log("Lỗi fetchUser:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#faf9f6" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#faf9f6" />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Profile Header Block */}
        <View className="items-center pt-8 pb-6">
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("UserInforScreen", { userId: user.id })
            }
            className="p-1 rounded-full bg-black/[0.02] border border-black/[0.04] shadow-sm"
          >
            <View className="w-24 h-24 rounded-full bg-gray-250 border-4 border-white overflow-hidden justify-center items-center">
              <Image
                source={
                  user.avatar
                    ? {
                        uri: user.avatar.startsWith("http")
                          ? user.avatar
                          : `${path}${user.avatar}`,
                      }
                    : require("../../assets/default.png")
                }
                className="w-full h-full rounded-full"
              />
            </View>
          </TouchableOpacity>

          <Text className="text-lg font-extrabold text-gray-850 mt-3.5">
            {user.name || "Đang tải..."}
          </Text>
          <Text className="text-gray-400 text-xs font-medium mt-0.5">Sinh viên trường TDC</Text>
        </View>

        {/* Utilities Panel */}
        <View className="px-4">
          <Text className="text-xs font-bold text-gray-450 uppercase tracking-wider mb-2.5 ml-2">
            Tiện ích hệ thống
          </Text>

          <View className="bg-white rounded-[22px] border border-gray-100/80 overflow-hidden shadow-sm">
            <UtilityItem
              icon="person-outline"
              title="Tài khoản của tôi"
              onPress={() =>
                navigation.navigate("UserInforScreen", { userId: user.id })
              }
            />

            {user.roleId === "1" && (
              <UtilityItem
                icon="shield-checkmark-outline"
                title="Quản lý Admin"
                color="#6366f1"
                onPress={() => navigation.navigate("HomeAdminScreen")}
              />
            )}

            <UtilityItem
              icon="newspaper-outline"
              title="Quản lý tin đăng"
              onPress={() => navigation.navigate("ManagePostsScreen")}
            />
            
            <UtilityItem
              icon="heart-outline"
              title="Tin đăng đã thích"
              onPress={() => navigation.navigate("SavedPostsScreen")}
            />
            
            <UtilityItem
              icon="star-outline"
              title="Đánh giá của tôi"
              onPress={() => navigation.navigate("FeedbackScreen")}
            />
            
            <UtilityItem
              icon="log-out-outline"
              title="Đăng xuất"
              isLast
              color="#ef4444"
              onPress={async () => {
                try {
                  const socket = socketRef.current;
                  if (socket) {
                    socket.emit("logout");
                    socket.disconnect();
                    socketRef.current = null;
                  }

                  setUnreadCount(0);

                  await AsyncStorage.multiRemove([
                    "token",
                    "userId",
                    "userName",
                    "userAvatar",
                    "role_id",
                  ]);

                  navigation.reset({
                    index: 0,
                    routes: [{ name: "LoginScreen" }],
                  });
                } catch (err) {
                  console.log("Lỗi logout:", err);
                }
              }}
            />
          </View>
        </View>
      </ScrollView>
      <Menu />
    </SafeAreaView>
  );
}

function UtilityItem({
  icon,
  title,
  isLast = false,
  onPress,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  isLast?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const iconColor = color || "#4b5563";
  const textColor = color || "#1f2937";

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`flex-row items-center justify-between p-4 active:bg-gray-50/50 ${
        isLast ? "" : "border-b border-gray-50"
      }`}
      activeOpacity={0.65}
    >
      <View className="flex-row items-center">
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text 
          className="ml-3.5 text-[14px] font-bold"
          style={{ color: textColor }}
        >
          {title}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#d1d5db" />
    </TouchableOpacity>
  );
}
