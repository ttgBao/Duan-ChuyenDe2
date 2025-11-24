
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { path } from "../../config";

// Định nghĩa kiểu dữ liệu sau khi parse CCCD
// Chứa tất cả thông tin trích xuất được từ mã QR hoặc dữ liệu ảnh
// Cho phép thêm key linh hoạt bằng [k: string]: any

type ParsedCCCD = {
  fullName?: string;
  dob?: string;
  citizenId?: string;
  gender?: string;
  placeOfOrigin?: string;
  hometown?: string;
  raw?: string;
  [k: string]: any;
};
// Component chính dùng để xác thực CCCD
export default function VerifyCCCDScreen({ navigation }: any) {
  // Quyền camera
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedRaw, setScannedRaw] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCCCD | null>(null);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [loading, setLoading] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<any>(null);

  // Request Camera Permission
  useEffect(() => {
    (async () => {
      if (!permission || !permission.granted) {
        await requestPermission();
      }
    })();
  }, [permission]);

  /** Parse raw CCCD/QR data */
  const parseRawData = (raw: string): ParsedCCCD => {
    const out: ParsedCCCD = {};

    // 1️ Try JSON
    try {
      const j = JSON.parse(raw);
      if (typeof j === "object" && j !== null) {
        out.fullName = j.name || j.fullName || j.hoten || j["ho_ten"];
        out.dob = j.birth || j.dateOfBirth || j.dob || j.ngaysinh || j["ngay_sinh"];
        out.citizenId = j.id || j.cccd || j.citizenId || j.CCCD || j["so_CCCD"];
        out.gender = j.gender || j.gioi_tinh || j["gioi_tinh"] || j.sex || j.gioitinh;
        out.placeOfOrigin = j.placeOfOrigin || j.queQuan || j.quan || j["que_quan"] || j.quequan || j.noisinh;

        // BỔ SUNG: Thêm logic cho hometown/address (vì UI và Block 2 có hỗ trợ)
        out.hometown = j.hometown || j.address || j.thuongtru || j.noi_thuong_tru || j.diachi || j["dia_chi"];

        return out;
      }
    } catch (e) { }

    // 2️ Key:value parsing
    const keyValRegex = /([^:;|=]+)[:=]\s*([^;|]+)/g;
    for (const match of raw.matchAll(keyValRegex)) {
      const keyRaw = match[1].trim();
      const key = keyRaw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // remove diacritics
      const val = match[2].trim();
      if (/name|hoten|ho ?ten/i.test(key) || /ten/i.test(keyRaw)) out.fullName = val;
      else if (/dob|birth|ngaysinh|ngay ?sinh/i.test(key)) out.dob = val;
      else if (/cccd|cmnd|id|so[_ ]?cccd|so[_ ]?cmnd/i.test(key)) out.citizenId = val;
      else if (/gender|sex|gioi.?tinh|gioitinh/i.test(key)) out.sex = val, out.gender = val;
      else if (/place|que|que.?quan|quequan|noisinh|noi._?thuong_tru|diachi|dia.?chi/i.test(key)) {
        // ưu tiên placeOfOrigin nếu key ám chỉ quê quán, else hometown/address
        if (/que|que.?quan|quequan|noisinh/i.test(key)) out.placeOfOrigin = val;
        else out.hometown = val;
      } else {
        // giữ các key thô khác (cần thiết cho debug)
        out[keyRaw] = val;
      }
    }
    if (Object.keys(out).length > 0) return out;


    // 3️⃣ Pipe-separated heuristic
    const parts = raw.split("|").map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const maybeId = parts.find((p) => /^\d{9,15}$/.test(p));
      if (maybeId) {
        out.citizenId = maybeId;
        out.fullName = parts.find((p) => p !== maybeId && isNaN(Number(p))) || "";
        out.dob = parts.find((p) => p !== maybeId && p !== out.fullName) || "";
      } else {
        out.fullName = parts[0];
        out.citizenId = parts[1];
        out.dob = parts[2];
      }
      out.gender = parts[3] || "";
      out.placeOfOrigin = parts[4] || parts[5] || "";

      return out;
    }

    // fallback
    out.raw = raw;
    return out;
  };

  /** Handle QR/Barcode scanned */
  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!data) return;
    setScannedRaw(data);
    const p = parseRawData(data);
    console.log("PARSED DATA SAU KHI QUÉT:", p);
    setParsed(p);

    Alert.alert("Đã quét", "Kiểm tra dữ liệu trước khi xác nhận.", [
      { text: "Quét lại", onPress: () => { setScannedRaw(null); setParsed(null); } },
      { text: "Xác nhận dữ liệu", style: "default" },
    ]);
  };

  /** Capture photo fallback */
  const handleCapturePhoto = async () => {
    try {
      const req = await ImagePicker.requestCameraPermissionsAsync();
      if (!req.granted) return Alert.alert("Thiếu quyền camera");
      const res = await ImagePicker.launchCameraAsync({ quality: 0.9, allowsEditing: false });
      if (res.canceled || !res.assets?.[0]?.uri) return;
      setPhotoUri(res.assets[0].uri);
      Alert.alert("Ảnh chụp", "Ảnh đã sẵn sàng để gửi cùng dữ liệu.");
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "Chụp ảnh thất bại");
    }
  };

  /** Send parsed & optional photo to server */
 const handleSendToServer = async () => {
  if (!parsed && !photoUri) {
    return Alert.alert("Lỗi", "Chưa có dữ liệu để gửi");
  }

  try {
    setLoading(true);

    // 1. Lấy token & userId
    const token = await AsyncStorage.getItem("token");
    const userIdStr = await AsyncStorage.getItem("userId");
    const userId = Number(userIdStr);

    if (!token || !userId) {
      return Alert.alert("Lỗi", "Vui lòng đăng nhập lại");
    }

    // 2. Lấy thông tin user mới nhất từ server (rất quan trọng!)
    const userRes = await axios.get(`${path}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const userInfo = userRes.data;

    // 3. Xác định đúng lần quét đầu hay lần 2 trở đi
    const hasPending = !!userInfo.cccd_pending_data;
    const isFirstTime = !userInfo.is_cccd_verified && !hasPending;

    // Dù lần 1 hay lần 2 → đều dùng chung 1 endpoint
    const endpoint = `${path}/users/${userId}/verify-cccd`;

    // 4. Chuẩn hóa ngày sinh
    let dobIso: string | undefined;
    if (parsed?.dob) {
      if (/^\d{8}$/.test(parsed.dob)) {
        const day = parsed.dob.slice(0, 2);
        const month = parsed.dob.slice(2, 4);
        const year = parsed.dob.slice(4, 8);
        dobIso = `${year}-${month}-${day}`;
      } else {
        dobIso = parsed.dob;
      }
    }

    // 5. Tạo FormData
    const form = new FormData();
    
    if (photoUri) {
      form.append("citizenCard", {
        uri: photoUri,
        name: "cccd.jpg",
        type: "image/jpeg",
      } as any);
    }

    if (parsed) {
      const payload = {
        ...parsed,
        hometown: parsed.hometown || parsed.placeOfOrigin || undefined,
        gender: parsed.gender,
        dob: dobIso,
      };
      form.append("parsed", JSON.stringify(payload));
    }

    // 6. Gửi lên server (luôn dùng POST + cùng 1 endpoint)
    const response = await axios.post(endpoint, form, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    });

    // 7. Cập nhật lại userInfo trong AsyncStorage (lấy từ server mới nhất)
    await AsyncStorage.setItem("userInfo", JSON.stringify(response.data.user || userInfo));

    // 8. Thông báo đúng theo trường hợp
    if (isFirstTime) {
      Alert.alert(
        "Xác thực thành công",
        "Thông tin CCCD của bạn đã được xác minh tự động!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } else if (hasPending) {
      Alert.alert(
        "Đã có yêu cầu chờ duyệt",
        "Bạn đã gửi yêu cầu cập nhật trước đó. Vui lòng chờ admin duyệt.",
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Đã gửi yêu cầu cập nhật",
        "Thông tin CCCD mới đã được gửi. Vui lòng chờ admin phê duyệt.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }

  } catch (err: any) {
  console.log("Lỗi gửi CCCD:", err.response?.data);

  // Đặc biệt xử lý trường hợp đang có pending
  if (err.response?.status === 400) {
    const msg = err.response.data?.message || "";
    if (msg.includes("đang chờ admin duyệt") || msg.includes("đang chờ")) {
      Alert.alert(
        "Đã gửi rồi!",
        "Bạn đã gửi yêu cầu cập nhật CCCD trước đó.\nVui lòng chờ Admin phê duyệt nhé!",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }
  }

  // Các lỗi khác
  const message = err.response?.data?.message || "Không thể gửi dữ liệu. Vui lòng thử lại.";
  Alert.alert("Lỗi", message);
  } finally {
    setLoading(false);
  }
};

  /** UI - Permission check */
  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 12 }}>Đang yêu cầu quyền camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 12 }}>Ứng dụng cần quyền camera</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.primaryBtn}>
          <Text style={styles.primaryText}>Cấp quyền camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /** UI */
  return (
    <View style={styles.container}>
      {!scannedRaw && !photoUri ? (
        <View style={styles.cameraWrapper}>
          <CameraView
            style={styles.camera}
            facing={facing}
            onBarcodeScanned={handleBarcodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "ean13", "upc_a"] }}
            ref={cameraRef}
          >
            <View style={styles.cameraTop}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.smallBtn}>
                <Text style={styles.smallBtnText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setFacing(f => f === "back" ? "front" : "back")} style={styles.smallBtn}>
                <MaterialIcons name="flip-camera-ios" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.scanArea}>
              <Text style={styles.hintText}>Giữ mã QR/CCCD trong khung để quét</Text>
            </View>
          </CameraView>
        </View>
      ) : (
        <View style={styles.resultWrap}>
          <Text style={styles.title}>Kết quả trích xuất</Text>
          {parsed && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLine}><Text style={styles.label}>Họ tên:</Text> {parsed.fullName || "-"}</Text>
              <Text style={styles.infoLine}><Text style={styles.label}>Số CCCD:</Text> {parsed.citizenId || "-"}</Text>
              <Text style={styles.infoLine}><Text style={styles.label}>Ngày sinh:</Text> {parsed.dob || "-"}</Text>
              <Text style={styles.infoLine}><Text style={styles.label}>Giới tính:</Text> {parsed.gender || "-"}</Text>
              <Text style={styles.infoLine}><Text style={styles.label}>Quê quán:</Text> {parsed.placeOfOrigin || "-"}</Text>
              <Text style={styles.infoLine}><Text style={styles.label}>Raw:</Text> <Text style={{ fontSize: 12, color: '#444' }}>{scannedRaw}</Text></Text>
            </View>
          )}

          {photoUri && !parsed && (
            <Text style={{ marginTop: 8, textAlign: "center" }}>Ảnh chụp sẵn sàng: {photoUri}</Text>
          )}

          <View style={{ flexDirection: "row", marginTop: 16 }}>
            <TouchableOpacity onPress={() => { setScannedRaw(null); setParsed(null); setPhotoUri(null); }} style={[styles.secondaryBtn, { marginRight: 8 }]}>
              <Text style={styles.secondaryText}>Quét lại</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSendToServer} style={styles.primaryBtn}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Xác thực & Gửi</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  cameraWrapper: { flex: 1, alignItems: "center", justifyContent: "center" },
  camera: {
    width: Platform.OS === "web" ? 720 : "92%",
    height: 420,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  cameraTop: { position: "absolute", top: 12, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between", zIndex: 10 },
  cameraBottom: { position: "absolute", bottom: 18, left: 12, right: 12, alignItems: "center", zIndex: 10 },
  smallBtn: { backgroundColor: "rgba(0,0,0,0.45)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  smallBtnText: { color: "#fff", fontWeight: "600" },
  scanArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  hintText: { color: "#fff", fontSize: 16, backgroundColor: "rgba(0,0,0,0.35)", padding: 8, borderRadius: 8 },
  resultWrap: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  infoBox: { backgroundColor: "#f8fafc", padding: 12, borderRadius: 10 },
  infoLine: { marginVertical: 6, color: "#111" },
  label: { fontWeight: "700", color: "#111" },
  primaryBtn: { backgroundColor: "#007AFF", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: "center" },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { backgroundColor: "#f1f5f9", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignItems: "center" },
  secondaryText: { color: "#1f2937", fontWeight: "700" },
});

