import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import * as ImagePicker from "expo-image-picker";
import AddressPicker from "../../components/AddressPicker";
import axios from "axios";
import { path } from "../../config";
import * as ImageManipulator from "expo-image-manipulator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
// (Sửa lại đường dẫn import types của bạn)
import { RootStackParamList, Category, SubCategory } from "../../types";

// 1. Định nghĩa props cho màn hình này
type PostGroupFormProps = NativeStackScreenProps<
  RootStackParamList,
  "PostGroupFormScreen"
>;

// 2. Đổi tên component
const PostGroupFormScreen = ({ navigation, route }: PostGroupFormProps) => {
  // 3. LẤY 'group' TỪ PARAMS (BẮT BUỘC)
  const { group, onPostSuccess } = route.params;
  const { category, subCategory } = (route.params as any) || {};

  // --- TOÀN BỘ STATE (BAO GỒM CẢ STATE CỦA MODAL) ---
  const [title, setTitle] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const userId = await AsyncStorage.getItem("userId");
      const userName = await AsyncStorage.getItem("userName");
      if (userId && userName) {
        setUser({ id: Number(userId), name: userName });
      }
    };
    fetchUser();
  }, []);

  const [conditionId, setConditionId] = useState<number | null>(null);
  const [productTypeId, setProductTypeId] = useState<number | null>(null);
  const [dealTypeId, setDealTypeId] = useState<number | null>(null);
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // === CÁC STATE MODAL MÀ ÔNG BỊ THIẾU ===
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [conditions, setConditions] = useState<{ id: number; name: string }[]>(
    []
  );
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [productTypes, setProductTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<
    number | null
  >(null);
  const [showDealTypeModal, setShowDealTypeModal] = useState(false);
  const [dealTypes, setDealTypes] = useState<{ id: number; name: string }[]>(
    []
  );
  // ======================================

  const [postTypeId, setPostTypeId] = useState<number | null>(null);
  const [postTypes, setPostTypes] = useState<{ id: number; name: string }[]>(
    []
  );
  const [exchangeCategory, setExchangeCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [exchangeSubCategory, setExchangeSubCategory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState<number | null>(null);

  // --- CÁC HÀM LOGIC (GIỮ NGUYÊN) ---
  const handleSelectCondition = (id: number) => {
    setConditionId(id);
    setShowConditionModal(false);
  };
  const handleSelectPostType = (id: number) => {
    setPostTypeId(id);
  };
  const handleSelectProductType = (id: number) => {
    setSelectedProductTypeId(id);
    setProductTypeId(id);
    setShowTypeModal(false);
  };
  const handleSelectDealType = (id: number) => {
    setDealTypeId(id);
    setShowDealTypeModal(false);
    if (id === 1) setIsFree(false);
    else if (id === 2) {
      setPrice("0");
      setIsFree(true);
    } else if (id === 3) {
      setPrice("0");
      setIsFree(false);
    }
  };
  const handleUploadImage = async (useCamera: boolean) => {
    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 4,
        quality: 1,
      });
    }
    if (!result.canceled && result.assets) {
      const selected: string[] = [];
      for (const asset of result.assets) {
        const uri = await convertToJpgIfNeeded(asset.uri);
        selected.push(uri);
      }
      if (images.length + selected.length > 4) {
        alert("Bạn chỉ được chọn tối đa 4 ảnh.");
        return;
      }
      setImages((prev) => [...prev, ...selected]);
    }
  };
  const convertToJpgIfNeeded = async (uri: string) => {
    const ext = uri.split(".").pop()?.toLowerCase();
    if (ext === "heic" || ext === "heif") {
      try {
        const manipResult = await ImageManipulator.manipulateAsync(uri, [], {
          format: ImageManipulator.SaveFormat.JPEG,
          compress: 0.8,
        });
        return manipResult.uri;
      } catch (error) {
        console.error("Lỗi convert HEIC/HEIF:", error);
        return uri;
      }
    }
    return uri;
  };
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") alert("Cần quyền truy cập camera để chụp ảnh");
    })();
  }, []);
  const removeImage = (index: number) => {
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [conditionRes, dealTypeRes, productTypeRes, postTypeRes] =
          await Promise.all([
            axios.get(`${path}/conditions`),
            axios.get(`${path}/deal-types`),
            axios.get(`${path}/product-types`),
            axios.get(`${path}/post-types`),
          ]);
        if (conditionRes.status === 200) {
          setConditions(
            conditionRes.data.map((d: any) => ({
              id: Number(d.id),
              name: d.name,
            }))
          );
        }
        if (dealTypeRes.status === 200) {
          setDealTypes(
            dealTypeRes.data.map((d: any) => ({
              id: Number(d.id),
              name: d.name,
            }))
          );
        }
        if (productTypeRes.status === 200) {
          setProductTypes(
            productTypeRes.data.map((d: any) => ({
              id: Number(d.id),
              name: d.name,
            }))
          );
        }
        if (postTypeRes.status === 200) {
          setPostTypes(
            postTypeRes.data.map((d: any) => ({
              id: Number(d.id),
              name: d.name,
            }))
          );
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
      }
    };
    fetchOptions();
  }, []);

  // --- LOGIC HIỂN THỊ TRƯỜNG ĐẶC THÙ (GIỮ NGUYÊN) ---
  let showProductTypeDropdown = false;
  let showAcademicFields = false;
  const finalCategoryName = (category as any)?.name;
  if (finalCategoryName === "Thời trang, đồ dùng cá nhân")
    showProductTypeDropdown = true;
  else if (finalCategoryName === "Tài liệu khoa") showAcademicFields = true;

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

  // --- HÀM ĐĂNG BÀI (ĐÃ SỬA CHO NHÓM) ---
  const handlePost = async () => {
    if (isLoading) return;

    const finalName = name.trim() || title.trim();
    const finalCategory = category;
    const finalSubCategory = subCategory;

    // (Logic validation... giữ nguyên)
    const missingFields: string[] = [];
    if (!finalCategory) missingFields.push("Danh mục cha");
    if (!finalSubCategory) missingFields.push("Danh mục con");
    if (!finalName) missingFields.push("Tên sản phẩm");
    if (!description || description.trim() === "")
      missingFields.push("Mô tả sản phẩm");
    if (!conditionId) missingFields.push("Tình trạng sản phẩm");
    if (!dealTypeId) missingFields.push("Hình thức giao dịch");
    if (!postTypeId) missingFields.push("Loại bài đăng");
    if (images.length === 0)
      missingFields.push("Hình ảnh sản phẩm (ít nhất 1 ảnh)");
    if (!address || address.trim() === "")
      missingFields.push("Địa chỉ giao dịch");
    if (dealTypeId === 1 && (!price || parseFloat(price) <= 0))
      missingFields.push("Giá bán (phải > 0 nếu bán có giá)");

    if (missingFields.length > 0) {
      Alert.alert(
        "Thiếu thông tin",
        `Vui lòng điền đầy đủ: ${missingFields.join(", ")}.`
      );
      return;
    }

    setIsLoading(true);
    try {
      // Tự động kiểm duyệt ngôn từ bằng AI trước khi đăng bài vào nhóm
      try {
        const textToModerate = `${finalName || ""} ${description || ""}`;
        if (textToModerate.trim()) {
          const moderateRes = await axios.post(`${path}/ai/moderate`, { text: textToModerate });
          if (moderateRes.data && moderateRes.data.success && moderateRes.data.data) {
            const { isSafe } = moderateRes.data.data;
            if (!isSafe) {
              setIsLoading(false);
              Alert.alert(
                "Nội dung không phù hợp",
                "Tiêu đề hoặc mô tả bài đăng chứa từ ngữ vi phạm quy chuẩn cộng đồng (phát hiện bởi AI). Vui lòng điều chỉnh lại."
              );
              return;
            }
          } else {
            setIsLoading(false);
            Alert.alert(
              "Hệ thống bận",
              "Hệ thống kiểm duyệt AI đang bận. Vui lòng bấm đăng lại sau 3-5 giây."
            );
            return;
          }
        }
      } catch (err) {
        console.warn("Lỗi kiểm duyệt nhanh bằng AI:", err);
        setIsLoading(false);
        Alert.alert(
          "Hệ thống bận",
          "Hệ thống kiểm duyệt AI đang bận hoặc gặp sự cố. Vui lòng thử lại sau vài giây."
        );
        return;
      }

      const formData = new FormData();

      // 1. Thêm các trường dữ liệu
      formData.append("name", finalName);
      formData.append("description", description);
      formData.append("price", dealTypeId === 1 ? String(price) : "0");
      formData.append("address_json", JSON.stringify({ full: address }));
      formData.append("user_id", String(user?.id));
      formData.append("post_type_id", String(postTypeId));
      formData.append("deal_type_id", String(dealTypeId));
      formData.append("category_id", String((finalCategory as any)?.id));
      formData.append("sub_category_id", String(finalSubCategory?.id));
      formData.append("condition_id", String(conditionId));
      if (productTypeId)
        formData.append("product_type_id", String(productTypeId));
      if (author) formData.append("author", author);
      if (year) formData.append("year", String(year));
      if (dealTypeId === 3 && exchangeCategory && exchangeSubCategory) {
        formData.append("category_change_id", String(exchangeCategory.id));
        formData.append(
          "sub_category_change_id",
          String(exchangeSubCategory.id)
        );
      }

      // 2. LOGIC ĐĂNG BÀI VÀO NHÓM (BẮT BUỘC)
      formData.append("visibility_type", "1"); // 1 = Chỉ trong nhóm
      formData.append("group_id", String(group.id)); // Gửi ID nhóm

      // 3. Thêm hình ảnh
      images.forEach((uri, index) => {
        const filename = uri.split("/").pop();
        const ext = filename?.split(".").pop();
        const type = ext ? `image/${ext}` : "image/jpeg";
        formData.append("files", {
          uri,
          name: filename || `photo_${index}.jpg`,
          type,
        } as any);
      });

      console.log("FormData sẽ gửi (Đăng nhóm):", formData);

      const response = await axios.post(`${path}/products`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201 || response.status === 200) {
        if (onPostSuccess && typeof onPostSuccess === "function") {
          onPostSuccess();
        }

        Alert.alert("Thành công", "Đăng tin vào nhóm thành công!", [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("GroupDetailScreen", {
                groupId: group.id,
              });
            },
          },
        ]);
      } else {
        Alert.alert("Lỗi", "Không thể đăng tin. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Lỗi khi đăng tin (nhóm):", err);
      if (err.response && err.response.status === 400) {
        Alert.alert(
          "Thông tin không hợp lệ",
          err.response.data.message || "Vui lòng kiểm tra lại."
        );
      } else {
        Alert.alert("Lỗi", "Đã xảy ra lỗi, vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- GIAO DIỆN (JSX) ---
  return (
    // BỌC NGOÀI CÙNG
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-1 bg-[#3366FF] shadow-md mt-5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <MaterialCommunityIcons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-white">Đăng tin</Text>
        <View className="w-6 h-6" />
      </View>

      {/* SCROLLVIEW CHỨA FORM */}
      <ScrollView className="flex-1" contentContainerClassName="pb-5">
        {/* Banner đăng nhóm */}
        <View className="bg-blue-100 border-l-4 border-blue-500 p-4 mx-4 mt-4 rounded-r-lg">
          <Text className="text-sm font-medium text-blue-800">
            Đang đăng bài vào nhóm:
          </Text>
          <Text className="text-base font-bold text-blue-900">
            {group.name}
          </Text>
        </View>

        {/* Danh mục */}
        <View className="bg-white mx-4 my-2 rounded-xl p-4 shadow-sm">
          <TouchableOpacity
            className="mb-2"
            onPress={() =>
              navigation.navigate("ChooseCategoryScreen", {
                group: group, // Truyền 'group' đi
                onPostSuccess: onPostSuccess,
              })
            }
          >
            <Text className="text-sm font-medium text-slate-500 mb-2">
              Danh mục sản phẩm
            </Text>
            <View className="flex-row items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
              <Text
                className="text-base text-slate-700 flex-1"
                numberOfLines={1}
              >
                {category
                  ? `${(category as any).name}${
                      subCategory
                        ? ` - ${(subCategory as any).name || subCategory}`
                        : ""
                    }`
                  : "Chọn danh mục"}
              </Text>
              <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Upload hình ảnh */}
        <View className="bg-white mx-4 my-2 rounded-xl p-4 shadow-sm">
          <Text className="text-sm font-medium text-slate-500 mb-2">
            Hình ảnh sản phẩm
          </Text>
          <View className="flex-row gap-3 my-2">
            <TouchableOpacity
              className="flex-row items-center py-2 px-3 bg-amber-100 rounded-lg border border-amber-300 mb-2"
              onPress={() => handleUploadImage(false)}
            >
              <MaterialCommunityIcons name="image" size={28} color="#f59e0b" />
              <Text className="text-sm text-amber-800 ml-1.5 font-medium">
                Thư viện
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-row items-center py-2 px-3 bg-amber-100 rounded-lg border border-amber-300 mb-2"
              onPress={() => handleUploadImage(true)}
            >
              <MaterialCommunityIcons name="camera" size={28} color="#f59e0b" />
              <Text className="text-sm text-amber-800 ml-1.5 font-medium">
                Chụp ảnh
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row ml-2.5 mt-2.5">
            {images.map((uri, idx) => (
              <View key={idx} className="relative mr-2">
                <Image
                  source={{ uri }}
                  className="w-[60px] h-[60px] rounded-[5px]"
                />
                <TouchableOpacity
                  onPress={() => removeImage(idx)}
                  className="absolute -top-1.5 -right-1.5 bg-white rounded-full"
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={20}
                    color="red"
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Tên sản phẩm */}
        <View className="bg-white mx-4 my-2 rounded-xl p-4 shadow-sm">
          <Text className="text-sm font-medium text-slate-500 mb-2">
            Tên sản phẩm
          </Text>
          <TextInput
            className="border border-slate-200 rounded-xl px-4 py-4 text-base text-slate-800 bg-white shadow-sm"
            placeholder="Tên sản phẩm *"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Tình trạng sản phẩm */}
        <View className="bg-white mx-4 my-2 rounded-xl p-4 shadow-sm">
          <TouchableOpacity
            className="mb-2"
            onPress={() => setShowConditionModal(true)}
          >
            <Text className="text-sm font-medium text-slate-500 mb-2">
              Tình trạng sản phẩm
            </Text>
            <View className="flex-row items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
              <Text className="text-base text-slate-700 flex-1">
                {conditionId
                  ? conditions.find((i) => i.id === conditionId)?.name
                  : "Chọn tình trạng"}
              </Text>
              <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Loại sản phẩm (Nếu có) */}
        {showProductTypeDropdown && (
          <View className="bg-white mx-4 my-2 rounded-xl p-4 shadow-sm">
            <TouchableOpacity
              className="mb-2"
              onPress={() => setShowTypeModal(true)}
            >
              <Text className="text-sm font-medium text-slate-500 mb-2">
                Loại sản phẩm
              </Text>
              <View className="flex-row items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
                <Text className="text-base text-slate-700 flex-1">
                  {selectedProductTypeId
                    ? productTypes.find((t) => t.id === selectedProductTypeId)
                        ?.name
                    : "Chọn loại sản phẩm"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Tài liệu khoa (Nếu có) */}
        {showAcademicFields && (
          <>
            <View className="bg-white mx-4 my-2 rounded-xl p-4 shadow-sm">
              <Text className="text-sm font-medium text-slate-500 mb-2">
                Tác giả/ Người biên soạn
              </Text>
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-4 text-base text-slate-800 bg-white shadow-sm"
                placeholder="Tác giả / Người biên soạn *"
                value={author}
                onChangeText={setAuthor}
              />
            </View>
            <View className="bg-white mx-4 my-2 rounded-xl p-4 shadow-sm">
              <Text className="text-sm font-medium text-slate-500 mb-2">
                Năm xuất bản / Năm học
              </Text>
              <View className="flex-row items-center justify-between py-1.5 px-1.5 bg-slate-50 rounded-lg border border-slate-200">
                <Picker
                  selectedValue={year}
                  onValueChange={(itemValue) => setYear(itemValue)}
                  className="h-[50px] w-full"
                >
                  <Picker.Item label="Chọn năm *" value={null} />
                  {years.map((y) => (
                    <Picker.Item key={y} label={y.toString()} value={y} />
                  ))}
                </Picker>
              </View>
            </View>
          </>
        )}

        {/* Hình thức giao dịch */}
        <View className="bg-white mx-4 my-2 rounded-xl p-4 shadow-sm">
          <TouchableOpacity
            className="mb-2"
            onPress={() => setShowDealTypeModal(true)}
          >
            <Text className="text-sm font-medium text-slate-500 mb-2">
              Hình thức giao dịch
            </Text>
            <View className="flex-row items-center justify-between py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
              <Text className="text-base text-slate-700 flex-1">
                {dealTypeId
                  ? dealTypes.find((i) => i.id === dealTypeId)?.name
                  : "Chọn hình thức"}
              </Text>
              <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
            </View>
          </TouchableOpacity>
          {dealTypeId === 1 && (
            <View className="mt-2">
              <Text className="text-sm font-medium text-slate-500 mb-1">
                Giá bán (VNĐ)
              </Text>
              <TextInput
                className="border border-slate-200 rounded-xl px-4 py-4 text-base text-slate-800 bg-white shadow-sm"
                placeholder="Nhập giá bán mong muốn"
                value={price.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                onChangeText={(text) =>
                  setPrice(text.replace(/\D/g, "").slice(0, 9))
                }
                keyboardType="numeric"
              />
            </View>
          )}
          {dealTypeId === 3 && (
            <TouchableOpacity
              className="bg-white my-2 rounded-xl"
              onPress={() => {
                navigation.navigate("ChooseExchangeCategoryScreen", {
                  onSelectCategory: (cat: Category, sub: SubCategory) => {
                    setExchangeCategory(cat);
                    setExchangeSubCategory({
                      id: String(sub.id),
                      name: sub.name,
                    });
                  },
                });
              }}
            >
              <Text className="text-base text-slate-700">
                {exchangeCategory && exchangeSubCategory
                  ? `${exchangeCategory.name} - ${exchangeSubCategory.name}`
                  : "Chọn danh mục trao đổi"}
              </Text>
              <Text className="text-xs text-slate-400 mt-1">
                Chọn danh mục cha và con bạn muốn đổi
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Mô tả sản phẩm */}
        <View className="bg-white mx-4 my-2 rounded-xl p-4 shadow-sm">
          <Text className="text-sm font-medium text-slate-500 mb-2">
            Mô tả sản phẩm
          </Text>
          <TextInput
            className="border border-slate-200 rounded-xl px-4 py-4 text-base text-slate-800 bg-white shadow-sm h-[100px] text-top"
            placeholder="Mô tả chi tiết sản phẩm *"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Địa chỉ giao dịch */}
        <View className="bg-white mx-4 my-2 rounded-xl p-4 shadow-sm">
          <Text className="text-sm font-medium text-slate-500 mb-2">
            Chọn địa chỉ giao dịch
          </Text>
          <AddressPicker onChange={(fullAddress) => setAddress(fullAddress)} />
        </View>

        {/* Loại bài đăng */}
        <View className="bg-white mx-4 my-2 rounded-xl p-4 shadow-sm">
          <Text className="text-sm font-medium text-slate-500 mb-2">
            Loại bài đăng *
          </Text>
          <View className="flex-row justify-between gap-2.5 mt-2">
            {postTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                className={`flex-1 flex-row items-center justify-between py-3 px-4 rounded-lg border ${
                  Number(postTypeId) === Number(type.id)
                    ? "border-[#3366FF] bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
                onPress={() => handleSelectPostType(Number(type.id))}
              >
                <Text
                  className={`text-[15px] font-medium ${
                    Number(postTypeId) === Number(type.id)
                      ? "text-[#3366FF]"
                      : "text-slate-700"
                  }`}
                >
                  {type.name}
                </Text>
                {Number(postTypeId) === Number(type.id) && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color="#3366FF"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Nút Đăng bài */}
        <View className="flex-row justify-between mx-4 my-5 gap-3">
          <TouchableOpacity
            className={`flex-1 py-4 items-center bg-amber-500 rounded-xl shadow-sm ${
              isLoading && "opacity-70"
            }`}
            onPress={handlePost}
            disabled={isLoading}
          >
            {isLoading ? (
              <View className="flex-row items-center">
                <ActivityIndicator color="#fff" className="mr-2" />
                <Text className="text-base font-semibold text-white">
                  Đang đăng...
                </Text>
              </View>
            ) : (
              <Text className="text-base font-semibold text-white">
                Đăng vào nhóm
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* KẾT THÚC SCROLLVIEW */}

      {/* ======================================================= */}
      {/* === TOÀN BỘ CÁC MODAL NẰM Ở NGOÀI NÀY (ĐÃ SỬA) === */}
      {/* ======================================================= */}

      {/* Menu chọn tình trạng sản phẩm */}
      {showConditionModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
          <View className="bg-white rounded-2xl w-[90%] max-h-[80%] p-5 shadow-lg">
            <Text className="text-sm font-medium text-slate-500 mb-2">
              Chọn tình trạng
            </Text>
            {conditions.map((type) => (
              <TouchableOpacity
                key={type.id}
                className={`py-4 px-4 border-b border-slate-100 ${
                  conditionId === type.id &&
                  "bg-blue-50 border-l-4 border-[#3366FF]"
                }`}
                onPress={() => handleSelectCondition(type.id)}
              >
                <Text className="text-base text-slate-700">{type.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowConditionModal(false)}
              className="mt-4 py-3 items-center"
            >
              <Text className="text-base text-red-500 font-medium">Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn loại sản phẩm */}
      {showTypeModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
          <View className="bg-white rounded-2xl w-[90%] max-h-[80%] p-5 shadow-lg">
            <Text className="text-sm font-medium text-slate-500 mb-2">
              Chọn loại sản phẩm
            </Text>
            {productTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                className={`py-4 px-4 border-b border-slate-100 ${
                  selectedProductTypeId === type.id &&
                  "bg-blue-50 border-l-4 border-[#3366FF]"
                }`}
                onPress={() => handleSelectProductType(type.id)}
              >
                <Text className="text-base text-slate-700">{type.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowTypeModal(false)}
              className="mt-4 py-3 items-center"
            >
              <Text className="text-base text-red-500 font-medium">Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Chọn hình thức giao dịch */}
      {showDealTypeModal && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center z-50">
          <View className="bg-white rounded-2xl w-[90%] max-h-[80%] p-5 shadow-lg">
            <Text className="text-sm font-medium text-slate-500 mb-2">
              Chọn hình thức giao dịch
            </Text>
            {dealTypes.map((option) => (
              <TouchableOpacity
                key={option.id}
                className={`py-4 px-4 border-b border-slate-100 ${
                  dealTypeId === option.id &&
                  "bg-blue-50 border-l-4 border-[#3366FF]"
                }`}
                onPress={() => handleSelectDealType(Number(option.id))}
              >
                <Text className="text-base text-slate-700">{option.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowDealTypeModal(false)}
              className="mt-4 py-3 items-center"
            >
              <Text className="text-base text-red-500 font-medium">Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default PostGroupFormScreen;
