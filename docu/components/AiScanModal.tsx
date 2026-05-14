import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { path } from "../config";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as ImageManipulator from "expo-image-manipulator";

const { width } = Dimensions.get("window");

export interface AiProductAnalysis {
  name: string;
  category: string;
  condition: string;
  description: string;
}

interface AiScanModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (result: AiProductAnalysis) => void;
}

const CONDITION_MAP: Record<string, string> = {
  "Mới": "Mới",
  "Như mới": "Như mới",
  "Đã qua sử dụng": "Đã qua sử dụng",
  "Cũ": "Cũ",
};

const CATEGORY_ICON: Record<string, string> = {
  "Điện tử": "laptop",
  "Quần áo": "tshirt-crew",
  "Sách vở": "book-open-variant",
  "Đồ gia dụng": "home-variant",
  "Thể thao": "basketball",
  "Mỹ phẩm": "lipstick",
  "Khác": "package-variant",
};

export default function AiScanModal({ visible, onClose, onApply }: AiScanModalProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AiProductAnalysis | null>(null);

  const reset = () => {
    setImageUri(null);
    setResult(null);
    setIsAnalyzing(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const pickImage = async (fromCamera: boolean) => {
    try {
      let pickerResult;
      if (fromCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Cần quyền truy cập", "Vui lòng cấp quyền camera để sử dụng tính năng này.");
          return;
        }
        pickerResult = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      } else {
        pickerResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      }

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        const uri = pickerResult.assets[0].uri;
        setImageUri(uri);
        setResult(null);
        await analyzeImage(uri);
      }
    } catch (e) {
      Alert.alert("Lỗi", "Không thể chọn ảnh. Vui lòng thử lại.");
    }
  };

  const analyzeImage = async (uri: string) => {
    setIsAnalyzing(true);
    try {
      // Giảm độ phân giải xuống 320px và nén mạnh hơn để tránh lỗi quá tải RAM của Ollama (500 Server Error)
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 320 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      const processedUri = manipResult.uri;
      const base64String = manipResult.base64;

      const filename = processedUri.split("/").pop() || "photo.jpg";
      const extension = filename.split(".").pop()?.toLowerCase() || "jpg";
      const mimeType = extension === "png" ? "image/png" : "image/jpeg";

      const payload = {
        imageBase64: base64String,
        mimetype: mimeType,
      };

      const response = await fetch(`${path}/ai/analyze-image-base64`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();

      if (responseData?.success || responseData?.data) {
        setResult(responseData.data);
      } else {
        Alert.alert("Chưa nhận diện được", "AI không thể phân tích ảnh này. Hãy thử ảnh rõ hơn.");
      }
    } catch (err: any) {
      console.error("AI analyze error:", err?.response?.data || err.message);
      Alert.alert(
        "Lỗi phân tích",
        "Không thể phân tích ảnh lúc này. Hãy kiểm tra kết nối hoặc thử lại."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply(result);
    handleClose();
  };

  const conditionColor: Record<string, string> = {
    "Mới": "#10b981",
    "Như mới": "#3b82f6",
    "Đã qua sử dụng": "#f59e0b",
    "Cũ": "#ef4444",
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <MaterialCommunityIcons name="robot-excited" size={22} color="#8b5cf6" />
                <Text style={styles.headerTitle}>Nhận diện bằng AI</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.headerSub}>
              Chụp hoặc chọn ảnh sản phẩm, AI sẽ tự điền thông tin cho bạn
            </Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Pick image area */}
            {!imageUri ? (
              <View style={styles.pickArea}>
                <MaterialCommunityIcons name="image-search" size={64} color="#c4b5fd" />
                <Text style={styles.pickTitle}>Chọn ảnh sản phẩm</Text>
                <View style={styles.pickButtons}>
                  <TouchableOpacity style={[styles.pickBtn, { backgroundColor: "#8b5cf6" }]} onPress={() => pickImage(true)}>
                    <Feather name="camera" size={20} color="#fff" />
                    <Text style={styles.pickBtnText}>Chụp ảnh</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.pickBtn, { backgroundColor: "#6d28d9" }]} onPress={() => pickImage(false)}>
                    <Feather name="image" size={20} color="#fff" />
                    <Text style={styles.pickBtnText}>Thư viện</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.imageContainer}>
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
                {!isAnalyzing && (
                  <TouchableOpacity style={styles.retakeBtn} onPress={() => { setImageUri(null); setResult(null); }}>
                    <Feather name="refresh-cw" size={14} color="#8b5cf6" />
                    <Text style={styles.retakeBtnText}>Đổi ảnh</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Loading */}
            {isAnalyzing && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#8b5cf6" />
                <Text style={styles.loadingText}>AI đang phân tích ảnh...</Text>
                <Text style={styles.loadingSubText}>Có thể mất 10-30 giây</Text>
              </View>
            )}

            {/* Result */}
            {result && !isAnalyzing && (
              <View style={styles.resultBox}>
                <View style={styles.resultHeader}>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#10b981" />
                  <Text style={styles.resultHeaderText}>Đã nhận diện xong!</Text>
                </View>

                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>Tên sản phẩm</Text>
                  <Text style={styles.resultValue}>{result.name || "Chưa xác định"}</Text>
                </View>

                <View style={styles.resultRow}>
                  <View style={[styles.resultCard, { flex: 1, marginRight: 6 }]}>
                    <Text style={styles.resultLabel}>Danh mục</Text>
                    <View style={styles.categoryBadge}>
                      <MaterialCommunityIcons
                        name={(CATEGORY_ICON[result.category] || "package-variant") as any}
                        size={14}
                        color="#6d28d9"
                      />
                      <Text style={styles.categoryText}>{result.category || "Khác"}</Text>
                    </View>
                  </View>
                  <View style={[styles.resultCard, { flex: 1, marginLeft: 6 }]}>
                    <Text style={styles.resultLabel}>Tình trạng</Text>
                    <Text style={[styles.conditionBadge, { color: conditionColor[result.condition] || "#64748b" }]}>
                      ● {result.condition || "Chưa rõ"}
                    </Text>
                  </View>
                </View>

                <View style={styles.resultCard}>
                  <Text style={styles.resultLabel}>Mô tả AI viết</Text>
                  <Text style={styles.resultDescription}>{result.description || ""}</Text>
                </View>

                <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                  <MaterialCommunityIcons name="magic-staff" size={18} color="#fff" />
                  <Text style={styles.applyBtnText}>Áp dụng vào form đăng tin</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: { marginBottom: 16 },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1e293b" },
  headerSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  closeBtn: { padding: 4 },
  pickArea: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#f8f4ff",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#e9d5ff",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  pickTitle: { fontSize: 15, fontWeight: "600", color: "#7c3aed", marginTop: 12, marginBottom: 20 },
  pickButtons: { flexDirection: "row", gap: 12 },
  pickBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  pickBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  imageContainer: { marginBottom: 12, alignItems: "center" },
  previewImage: {
    width: width - 32,
    height: 200,
    borderRadius: 16,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: "#f0f4ff",
    borderRadius: 20,
  },
  retakeBtnText: { fontSize: 13, color: "#8b5cf6", fontWeight: "500" },
  loadingBox: { alignItems: "center", paddingVertical: 24 },
  loadingText: { marginTop: 12, fontSize: 15, fontWeight: "600", color: "#1e293b" },
  loadingSubText: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  resultBox: { marginTop: 8 },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  resultHeaderText: { fontSize: 14, fontWeight: "600", color: "#10b981" },
  resultCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  resultRow: { flexDirection: "row", marginBottom: 0 },
  resultLabel: { fontSize: 11, color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", marginBottom: 4 },
  resultValue: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  categoryText: { fontSize: 14, fontWeight: "600", color: "#6d28d9" },
  conditionBadge: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  resultDescription: { fontSize: 13, color: "#475569", lineHeight: 20 },
  applyBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 6,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  applyBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
