import { StatusBar } from "expo-status-bar";
import { Text, View, Alert, Linking, Pressable, TextInput, Image, ScrollView } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import "../../global.css";
import { useState } from "react";
import Button from "../../components/Button";
import FloatingInput from "../../components/FloatingInput";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../types";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { path } from "../../config";
import React from "react";
import { Modal } from "react-native";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "Home">;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isComplaintModalVisible, setIsComplaintModalVisible] = useState(false);
  const [complaintReason, setComplaintReason] = useState("");
  const [isSendingComplaint, setIsSendingComplaint] = useState(false);
  const [bannedMsg, setBannedMsg] = useState("");

 const handleComplaintSubmit = async () => {
    if (complaintReason.trim().length < 10) {
      return Alert.alert("Lỗi", "Vui lòng nhập chi tiết khiếu nại (tối thiểu 10 ký tự).");
    }

    setIsSendingComplaint(true);
    const emailTrim = (email || "").trim().toLowerCase();
    
    try {
      // Bước 1: Lấy ID user (giữ nguyên)
      const userRes = await axios.get(`${path}/users/email/${emailTrim}`);
      const reportedUserId = userRes.data.id; 
      
      // Bước 2: Gửi Report
      const fullReason = `[KHIẾU NẠI MỞ KHÓA] ${bannedMsg}. Lý do chi tiết: ${complaintReason.trim()}`;

      await axios.post(
        `${path}/reports`,
        {
          reason: fullReason,
          reported_user_id: reportedUserId, 
        },
      );

      setIsComplaintModalVisible(false);
      setComplaintReason("");

      Alert.alert(
        "Thành công",
        "Khiếu nại của bạn đã được gửi tới Admin. Vui lòng chờ phản hồi.",
      );
      
    } catch (err: any) {
      // ✅ CẬP NHẬT: HIỂN THỊ THÔNG BÁO LỖI TỪ BACKEND (VÍ DỤ: ĐỢI 24H)
      const serverMsg = err.response?.data?.message;
      
      if (serverMsg && serverMsg.includes("Vui lòng đợi")) {
         Alert.alert("Thông báo", serverMsg); // Hiển thị chính xác câu "Vui lòng đợi X giờ..."
      } else {
         console.error("Lỗi gửi khiếu nại:", serverMsg || err.message);
         Alert.alert("Lỗi", serverMsg || "Gửi khiếu nại thất bại. Vui lòng thử lại sau.");
      }
    } finally {
      setIsSendingComplaint(false);
    }
  };

  const setEmailSafe = (t: string) => {
    if (loginError) setLoginError(null);
    setEmail(t);
  };
  const setPasswordSafe = (t: string) => {
    if (loginError) setLoginError(null);
    setPassword(t);
  };

  const handleLogin = async () => {
    if (isLoading) return;

    const emailTrim = (email || "").trim().toLowerCase();
    const passwordTrim = (password || "").trim();

    if (!emailTrim || !passwordTrim) {
      Alert.alert("Vui lòng nhập đầy đủ thông tin");
      return;
    }
    // Nếu FE muốn khớp rule domain
    if (!emailTrim.endsWith("@fit.tdc.edu.vn")) {
      Alert.alert("Email không hợp lệ", "Chỉ chấp nhận email @fit.tdc.edu.vn");
      return;
    }

    try {
      setIsLoading(true);
      const res = await axios.post(
        `${path}/auth/login`,
        { email: emailTrim, password: passwordTrim },
        { timeout: 15000 }
      );
      console.log(res.data);
      const data = res.data || {};
      const accessToken = data.accessToken || data.token; // linh hoạt tên trường
      console.log(accessToken);
      if (!accessToken) {
        throw new Error("Thiếu access token trong phản hồi.");
      }

      await AsyncStorage.setItem("token", accessToken);
      if (data.nickname)
        await AsyncStorage.setItem("userName", String(data.nickname));
      if (data.id != null)
        await AsyncStorage.setItem("userId", String(data.id));
      if (data.role) await AsyncStorage.setItem("role", String(data.role));

      Alert.alert("Đăng nhập thành công");

      if (String(data.role).toLowerCase() === "admin") {
        navigation.reset({
          index: 0,
          routes: [{ name: "HomeAdminScreen" as any }],
        });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      }
    } catch (err: any) {
      // Ưu tiên message từ server
      const raw =
        err?.response?.data?.message ?? err?.message ?? "Đăng nhập thất bại";
      const msg = Array.isArray(raw) ? raw.join("\n") : String(raw);

      // Nếu tài khoản chưa xác thực → điều hướng Verify
      const lower = msg.toLowerCase();
      const isBanned = lower.includes("bị khóa bởi admin");
      const unverified =
        lower.includes("chưa xác thực") ||
        lower.includes("unverified") ||
        lower.includes("verify");

      if (isBanned) {
        setLoginError(msg);
        setBannedMsg(msg); // ✅ LƯU thông báo bị khóa
        
        // HIỂN THỊ ALERT MỞ MODAL
        Alert.alert(
          "Tài khoản bị khóa",
          `${msg}\n\nNhấn 'Gửi khiếu nại' để gửi yêu cầu mở khóa.`,
          [
            { text: "Hủy", style: "cancel" },
            {
              text: "Gửi khiếu nại",
              onPress: () => {
                setIsComplaintModalVisible(true); // ✅ MỞ MODAL KHIẾU NẠI
              },
            },
          ]
        );
        
      } else if (unverified) {
        setLoginError(msg);
        // điều hướng kèm email để user chỉ cần nhập OTP
        navigation.navigate("VerifyAccountScreen" as any, {
          email: (email || "").trim().toLowerCase(),
        });
      } else {
        setLoginError(
          msg || "Email hoặc mật khẩu chưa đúng.\nVui lòng kiểm tra lại."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient 
      colors={['#3366FF', '#2952CC', '#1F5499']} 
      locations={[0, 0.5, 1]}
      className="flex-1"
    >
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <StatusBar style="light" />
        <View className="flex-row items-center justify-between px-5 pt-14 pb-8">
          <View className="flex-row items-center gap-4">
            <FontAwesome
              onPress={() => navigation.navigate("Home")}
              name="arrow-left"
              size={20}
              color="#fff"
            />
            <Text className="text-3xl font-bold text-white">Đăng nhập</Text>
          </View>
          <Image 
            className="w-[46px] h-[46px] rounded-full bg-white"
            source={require('../../assets/TDC.jpg')}
          />
        </View>

        <View className="flex-1 bg-white rounded-t-[40px] px-5 pt-8 pb-5">
          {loginError && (
            <View className="flex items-center px-2 mb-4">
              <View className="flex-row gap-2 bg-red-100 py-4 justify-center w-full rounded-xl px-3">
                <FontAwesome name="warning" size={16} color="red" />
                <Text>{loginError}</Text>
              </View>
            </View>
          )}

          <View className="mt-2 px-2">
        {/* Email */}
        <FloatingInput
          label="Email"
          value={email}
          onChangeText={setEmailSafe}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          autoComplete="email"
          inputClassName="bg-[#D9D9D9]/30 border-gray-300"
        />

        {/* Password */}
        <FloatingInput
          label="Mật khẩu"
          value={password}
          onChangeText={setPasswordSafe}
          secureTextEntry={!showPassword}
          toggleSecure={() => setShowPassword((v) => !v)}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          autoComplete="password"
          onSubmitEditing={handleLogin}
          returnKeyType="done"
          inputClassName="bg-[#D9D9D9]/30 border-gray-300"
        />

        <Text
          onPress={() => navigation.navigate("ForgotPasswordScreen" as any)}
          className="font-thin text-[12px]"
        >
          Quên mật khẩu?
        </Text>

        <Button
          value="Đăng nhập"
          onPress={handleLogin}
          loading={isLoading}
          disabled={isLoading}
          containerClassName="bg-[#3366FF]"
        />

        <View className="flex flex-row gap-2 justify-center mt-5 items-center ">
          <View className="relative w-full h-[1px] bg-gray-300">
            <View className="absolute right-0 w-[8px] h-[8px] bg-gray-300 rounded-full -top-1" />
          </View>

          <Text className="text-[12px]">Chưa có tài khoản?</Text>
          <Text
            onPress={() => navigation.navigate("RegisterScreen" as any)}
            className="text-blue-500 font-bold text-[12px]"
          >
            Đăng ký tài khoản mới
          </Text>

          <View className="relative w-full h-[1px] bg-gray-300 ">
            <View className="absolute w-[8px] h-[8px] bg-gray-300 rounded-full -top-1" />
          </View>
        </View>
      </View>

      <View className="w-full h-[1px] bg-gray-300 mt-10" />
      <View className="flex flex-row gap-6 justify-center mt-5 mb-10">
        <Text className="text-[12px] border-r pr-5 ">Cao Đẳng CN Thủ Đức</Text>
        <Text className="text-[12px] border-r pr-5">Chính sách bảo mật</Text>
        <Text
          className="text-[12px]"
          onPress={() => Linking.openURL("https://ttgb.id.vn/")}
        >
          Liên hệ hỗ trợ
        </Text>
      </View>

      <Modal
        visible={isComplaintModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsComplaintModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setIsComplaintModalVisible(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-white w-11/12 rounded-xl p-6 shadow-xl"
          >
            <Text className="text-xl font-bold text-gray-800 mb-2">
              Gửi Khiếu Nại Mở Khóa
            </Text>
            <Text className="text-sm text-red-600 mb-4">
              {bannedMsg}
            </Text>

            <TextInput
              className="border border-gray-300 rounded-lg p-3 h-32 text-sm mb-4"
              placeholder="Nhập chi tiết lý do bạn cho rằng tài khoản bị khóa là sai (tối thiểu 10 ký tự)..."
              multiline
              value={complaintReason}
              onChangeText={setComplaintReason}
              style={{ textAlignVertical: "top" }}
              editable={!isSendingComplaint}
            />

            <Button
              value={isSendingComplaint ? "Đang gửi..." : "Gửi Yêu Cầu Mở Khóa"}
              onPress={handleComplaintSubmit}
              loading={isSendingComplaint}
              disabled={isSendingComplaint || complaintReason.trim().length < 10}
            />
          </Pressable>
        </Pressable>
      </Modal>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}
