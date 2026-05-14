import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

const { width } = Dimensions.get("window");
// Sử dụng API mới ổn định hơn
const API_BASE = "https://esgoo.net/api-tinhthanh";

// Kiểu dữ liệu cho các phần địa chỉ được tách ra
interface InitialAddressParts {
  village: string;
  wardName: string;
  districtName: string;
  provinceName: string;
}

export default function AddressPicker({
  onChange,
  initialValue,
}: {
  onChange: (fullAddress: string) => void;
  initialValue?: string;
}) {
  const [provinces, setProvinces] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<any>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
  const [selectedWard, setSelectedWard] = useState<any>(null); // State cho text hiển thị

  const [provinceText, setProvinceText] = useState("Chọn tỉnh/thành phố");
  const [districtText, setDistrictText] = useState("Chọn quận/huyện");
  const [wardText, setWardText] = useState("Chọn xã/phường");
  const [village, setVillage] = useState(""); // State cho modal

  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false); // State loading

  const [isLoadingProvinces, setIsLoadingProvinces] = useState(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false); // Ref để lưu các phần địa chỉ ban đầu và tránh gọi lại

  const initialParts = useRef<InitialAddressParts | null>(null);
  const isAutoSelecting = useRef(false); // 1. Tách chuỗi initialValue (Chỉ chạy 1 lần)

  useEffect(() => {
    if (initialValue && !initialParts.current) {
      const parts = initialValue.split(",").map((s) => s.trim());
      let parsed: InitialAddressParts | null = null;

      if (parts.length >= 4) {
        // "Thôn/Xóm, Xã, Huyện, Tỉnh"
        parsed = {
          village: parts[0],
          wardName: parts[1],
          districtName: parts[2],
          provinceName: parts[3],
        };
      } else if (parts.length === 3) {
        // "Xã, Huyện, Tỉnh" (Không có thôn/xóm)
        parsed = {
          village: "",
          wardName: parts[0],
          districtName: parts[1],
          provinceName: parts[2],
        };
      }

      if (parsed) {
        initialParts.current = parsed;
        isAutoSelecting.current = true; // Bắt đầu quá trình tự động chọn
        // Cập nhật text hiển thị ngay lập tức
        setVillage(parsed.village);
        setProvinceText(parsed.provinceName);
        setDistrictText(parsed.districtName);
        setWardText(parsed.wardName);
      } else {
        // Nếu không thể tách, giữ nguyên hành vi cũ (dồn vào thôn/xóm)
        setVillage(initialValue);
      }
    }
  }, [initialValue]); // 2. Tải danh sách Tỉnh (Chạy 1 lần)

  useEffect(() => {
    setIsLoadingProvinces(true);
    fetch(`${API_BASE}/1/0.htm`)
      .then((res) => res.json())
      .then((data) => {
        const allProvinces = data.data || [];
        setProvinces(allProvinces); // 3. Tự động chọn Tỉnh (nếu có)

        if (isAutoSelecting.current && initialParts.current) {
          const foundProvince = allProvinces.find(
            (p: any) =>
              p.full_name === initialParts.current?.provinceName ||
              p.name === initialParts.current?.provinceName
          );
          if (foundProvince) {
            handleSelectProvince(foundProvince); // Bắt đầu chuỗi tải
          } else {
            isAutoSelecting.current = false; // Không tìm thấy, dừng lại
          }
        }
      })
      .catch((err) => console.log("Lỗi lấy tỉnh:", err))
      .finally(() => setIsLoadingProvinces(false));
  }, []); // Chỉ chạy 1 lần
  // 4. Hàm chọn Tỉnh

  const handleSelectProvince = async (province: any) => {
    setSelectedProvince(province);
    setProvinceText(province.full_name || province.name);
    setShowProvinceModal(false); // Reset Huyện và Xã

    setSelectedDistrict(null);
    setSelectedWard(null);
    setWards([]);
    if (!isAutoSelecting.current) {
      setDistrictText("Chọn quận/huyện");
      setWardText("Chọn xã/phường");
      setVillage(""); // Xóa thôn/xóm cũ nếu người dùng TỰ CHỌN tỉnh
    }

    setIsLoadingDistricts(true);
    try {
      const res = await axios.get(
        `${API_BASE}/2/${province.id}.htm`
      );
      const allDistricts = res.data.data || [];
      setDistricts(allDistricts); // 5. Tự động chọn Huyện (nếu có)

      if (isAutoSelecting.current && initialParts.current) {
        const foundDistrict = allDistricts.find(
          (d: any) =>
            d.full_name === initialParts.current?.districtName ||
            d.name === initialParts.current?.districtName
        );
        if (foundDistrict) {
          handleSelectDistrict(foundDistrict);
        } else {
          isAutoSelecting.current = false; // Không tìm thấy, dừng lại
        }
      }
    } catch (err) {
      console.log("Lỗi lấy huyện:", err);
      isAutoSelecting.current = false;
    } finally {
      setIsLoadingDistricts(false);
    }
  }; // 6. Hàm chọn Huyện

  const handleSelectDistrict = async (district: any) => {
    setSelectedDistrict(district);
    setDistrictText(district.full_name || district.name);
    setShowDistrictModal(false); // Reset Xã

    setSelectedWard(null);
    if (!isAutoSelecting.current) {
      setWardText("Chọn xã/phường");
    }

    setIsLoadingWards(true);
    try {
      const res = await axios.get(
        `${API_BASE}/3/${district.id}.htm`
      );
      const allWards = res.data.data || [];
      setWards(allWards); // 7. Tự động chọn Xã (nếu có)

      if (isAutoSelecting.current && initialParts.current) {
        const foundWard = allWards.find(
          (w: any) =>
            w.full_name === initialParts.current?.wardName ||
            w.name === initialParts.current?.wardName
        );
        if (foundWard) {
          handleSelectWard(foundWard);
        }
        isAutoSelecting.current = false; // Dừng lại dù tìm thấy hay không
      }
    } catch (err) {
      console.log("Lỗi lấy xã:", err);
      setWards([]);
      isAutoSelecting.current = false;
    } finally {
      setIsLoadingWards(false);
    }
  }; // 8. Hàm chọn Xã

  const handleSelectWard = (ward: any) => {
    setSelectedWard(ward);
    setWardText(ward.full_name || ward.name);
    setShowWardModal(false); // Nếu người dùng tự chọn, dừng autoSelect

    if (isAutoSelecting.current) {
      isAutoSelecting.current = false;
    }
  }; // 9. Gửi trả địa chỉ đầy đủ khi CÓ THAY ĐỔI

  useEffect(() => {
    // Chỉ gọi onChange nếu 3 cấp đều đã được chọn
    if (selectedProvince && selectedDistrict && selectedWard) {
      const parts = [];
      if (village.trim()) {
        parts.push(village.trim());
      }
      parts.push(selectedWard.full_name || selectedWard.name);
      parts.push(selectedDistrict.full_name || selectedDistrict.name);
      parts.push(selectedProvince.full_name || selectedProvince.name);

      const fullAddress = parts.join(", ");
      onChange(fullAddress);
    } else if (
      initialParts.current &&
      village !== initialParts.current.village
    ) {
      // Nếu người dùng chỉ sửa thôn/xóm (và các cấp khác đã được điền từ initialValue)
      const fullAddress = `${village.trim()}, ${
        initialParts.current.wardName
      }, ${initialParts.current.districtName}, ${
        initialParts.current.provinceName
      }`;
      onChange(fullAddress);
    }
  }, [selectedProvince, selectedDistrict, selectedWard, village]); // Xử lý khi người dùng TỰ CHỌN (clear auto-select)

  const handleManualSelectProvince = (province: any) => {
    isAutoSelecting.current = false;
    handleSelectProvince(province);
  };
  const handleManualSelectDistrict = (district: any) => {
    isAutoSelecting.current = false;
    handleSelectDistrict(district);
  };
  const handleManualSelectWard = (ward: any) => {
    isAutoSelecting.current = false;
    handleSelectWard(ward);
  };
  const handleVillageChange = (text: string) => {
    isAutoSelecting.current = false;
    setVillage(text);
  };

  return (
    <View style={styles.container}>
      {/* Chọn tỉnh */}
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setShowProvinceModal(true)}
      >
        <View style={styles.dropdownContent}>
          <Text style={styles.dropdownText}>{provinceText}</Text>
          {isLoadingProvinces ? (
            <ActivityIndicator size="small" color="#3366FF" />
          ) : (
            <Ionicons name="chevron-down" size={20} color="#3366FF" />
          )}
        </View>
      </TouchableOpacity>
      {/* Chọn huyện */}
      <TouchableOpacity
        style={[styles.dropdown, !selectedProvince && styles.dropdownDisabled]}
        onPress={() => setShowDistrictModal(true)}
        disabled={!selectedProvince}
      >
        <View style={styles.dropdownContent}>
          <Text style={styles.dropdownText}>{districtText}</Text>
          {isLoadingDistricts ? (
            <ActivityIndicator size="small" color="#3366FF" />
          ) : (
            <Ionicons name="chevron-down" size={20} color="#3366FF" />
          )}
        </View>
      </TouchableOpacity>
      {/* Chọn xã */}
      <TouchableOpacity
        style={[styles.dropdown, !selectedDistrict && styles.dropdownDisabled]}
        onPress={() => setShowWardModal(true)}
        disabled={!selectedDistrict}
      >
        <View style={styles.dropdownContent}>
          <Text style={styles.dropdownText}>{wardText}</Text>
          {isLoadingWards ? (
            <ActivityIndicator size="small" color="#3366FF" />
          ) : (
            <Ionicons name="chevron-down" size={20} color="#3366FF" />
          )}
        </View>
      </TouchableOpacity>
      {/* Nhập thôn */}
      <TextInput
        style={styles.input}
        placeholder="Số nhà, Tên đường, Thôn/xóm..."
        value={village}
        onChangeText={handleVillageChange}
      />
      {/* === MODALS === */}
      {/* Modal tỉnh */}
      <Modal visible={showProvinceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn tỉnh/thành phố</Text>
              <TouchableOpacity onPress={() => setShowProvinceModal(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {provinces.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handleManualSelectProvince(p)}
                  style={[
                    styles.modalItem,
                    selectedProvince?.id === p.id &&
                      styles.modalItemSelected,
                  ]}
                >
                  <Text style={styles.modalItemText}>
                    {p.full_name || p.name}
                  </Text>
                  {selectedProvince?.id === p.id && (
                    <Ionicons name="checkmark" size={20} color="#3366FF" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Modal huyện */}
      <Modal visible={showDistrictModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn quận/huyện</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {districts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="location" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>
                    Vui lòng chọn Tỉnh/Thành phố trước.
                  </Text>
                </View>
              ) : (
                districts.map((d) => (
                  <TouchableOpacity
                    key={d.id}
                    onPress={() => handleManualSelectDistrict(d)}
                    style={[
                      styles.modalItem,
                      selectedDistrict?.id === d.id &&
                        styles.modalItemSelected,
                    ]}
                  >
                    <Text style={styles.modalItemText}>
                      {d.full_name || d.name}
                    </Text>
                    {selectedDistrict?.id === d.id && (
                      <Ionicons name="checkmark" size={20} color="#3366FF" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Modal xã */}
      <Modal visible={showWardModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn xã/phường</Text>
              <TouchableOpacity onPress={() => setShowWardModal(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {wards.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="location" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyText}>
                    Vui lòng chọn Quận/Huyện trước.
                  </Text>
                </View>
              ) : (
                wards.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    onPress={() => handleManualSelectWard(w)}
                    style={[
                      styles.modalItem,
                      selectedWard?.id === w.id && styles.modalItemSelected,
                    ]}
                  >
                    <Text style={styles.modalItemText}>
                      {w.full_name || w.name}
                    </Text>
                    {selectedWard?.id === w.id && (
                      <Ionicons name="checkmark" size={20} color="#3366FF" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginVertical: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  dropdownDisabled: {
    backgroundColor: "#f8fafc",
    opacity: 0.6,
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: "#334155",
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: "#1e293b",
    backgroundColor: "#fff",
    marginVertical: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: "80%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalItemSelected: {
    backgroundColor: "#f0f9ff",
  },
  modalItemText: {
    fontSize: 16,
    color: "#334155",
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 8,
    textAlign: "center",
  },
});
