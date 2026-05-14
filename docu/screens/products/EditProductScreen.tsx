import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  RootStackParamList,
  Product,
  ProductImage as ProductImageType,
  Category,
  SubCategory,
} from "../../types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import "../../global.css";

// Định nghĩa kiểu
type EditNavProp = NativeStackNavigationProp<
  RootStackParamList,
  "EditProductScreen"
>;
type EditRouteProp = RouteProp<RootStackParamList, "EditProductScreen">;

// Kiểu dữ liệu cho ảnh (để phân biệt cũ/mới/xóa)
type ImageStateType = {
  id: string | null; // null nếu là ảnh mới
  uri: string;
  isNew: boolean;
};

const { width } = Dimensions.get("window");

export default function EditProductScreen() {
  const navigation = useNavigation<EditNavProp>();
  const route = useRoute<EditRouteProp>();
  const { product } = route.params; // 🚀 LẤY SẢN PHẨM TỪ ROUTE

  // === KHỞI TẠO STATE TỪ PRODUCT ===
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);

  // Xử lý giá
  const getInitialPrice = () => {
    // Sửa lỗi so sánh string vs number
    if (
      Number(product.dealType?.id) === 2 ||
      Number(product.dealType?.id) === 3
    )
      return "0";
    // Xóa " đ" và ","
    const priceString = product.price || "";
    return priceString.replace(/\D/g, "");
  };
  const [price, setPrice] = useState(getInitialPrice());

  // Xử lý ảnh
  const [images, setImages] = useState<ImageStateType[]>(
    product.images.map((img: ProductImageType) => ({
      id: img.id, // Lưu ID của ảnh cũ
      uri: img.image_url,
      isNew: false,
    }))
  );
  const [imageIdsToDelete, setImageIdsToDelete] = useState<string[]>([]); // Lưu ID ảnh để xóa

  const [address, setAddress] = useState(product.address_json?.full || "");
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);

  const [groups, setGroups] = useState<{ id: number; name: string }[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(
    product.group_id ? Number(product.group_id) : null
  );
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Hàm xử lý chọn nhóm
  const handleSelectGroup = (id: number | null) => {
    setSelectedGroupId(id);
    setShowGroupModal(false);
  };

  // ID
  const [conditionId, setConditionId] = useState<number | null>(
    product.condition ? Number(product.condition.id) : null
  );
  const [productTypeId, setProductTypeId] = useState<number | null>(
    product.productType ? Number(product.productType.id) : null
  );
  const [dealTypeId, setDealTypeId] = useState<number | null>(
    product.dealType ? Number(product.dealType.id) : null
  );
  const [postTypeId, setPostTypeId] = useState<number | null>(
    product.postType ? Number(product.postType.id) : null
  );
  const [originId, setOriginId] = useState<number | null>(
    product.origin ? Number(product.origin.id) : null
  );
  const [materialId, setMaterialId] = useState<number | null>(
    product.material ? Number(product.material.id) : null
  );
  const [sizeId, setSizeId] = useState<number | null>(
    product.size ? Number(product.size.id) : null
  );
  const [brandId, setBrandId] = useState<number | null>(
    product.brand ? Number(product.brand.id) : null
  );
  const [productModelId, setProductModelId] = useState<number | null>(
    product.productModel ? Number(product.productModel.id) : null
  );
  const [colorId, setColorId] = useState<number | null>(
    product.color ? Number(product.color.id) : null
  );
  const [capacityId, setCapacityId] = useState<number | null>(
    product.capacity ? Number(product.capacity.id) : null
  );
  const [warrantyId, setWarrantyId] = useState<number | null>(
    product.warranty ? Number(product.warranty.id) : null
  );
  const [processorId, setProcessorId] = useState<number | null>(
    product.processor ? Number(product.processor.id) : null
  );
  const [ramOptionId, setRamOptionId] = useState<number | null>(
    product.ramOption ? Number(product.ramOption.id) : null
  );
  const [storageTypeId, setStorageTypeId] = useState<number | null>(
    product.storageType ? Number(product.storageType.id) : null
  );
  const [graphicsCardId, setGraphicsCardId] = useState<number | null>(
    product.graphicsCard ? Number(product.graphicsCard.id) : null
  );
  const [breedId, setBreedId] = useState<number | null>(
    product.breed ? Number(product.breed.id) : null
  );
  const [ageRangeId, setAgeRangeId] = useState<number | null>(
    product.ageRange ? Number(product.ageRange.id) : null
  );
  const [genderId, setGenderId] = useState<number | null>(
    product.gender ? Number(product.gender.id) : null
  );
  const [engineCapacityId, setEngineCapacityId] = useState<number | null>(
    product.engineCapacity ? Number(product.engineCapacity.id) : null
  );

  const [mileage, setMileage] = useState(product.mileage?.toString() || "");
  const [author, setAuthor] = useState(product.author || "");
  const [year, setYear] = useState(product.year || null);

  const [isLoading, setIsLoading] = useState(false);
  const [conditions, setConditions] = useState<{ id: number; name: string }[]>(
    []
  );
  const [postTypes, setPostTypes] = useState<{ id: number; name: string }[]>(
    []
  );
  const [productTypes, setProductTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [origins, setOrigins] = useState<{ id: number; name: string }[]>([]);
  const [materials, setMaterials] = useState<{ id: number; name: string }[]>(
    []
  );
  const [sizes, setSizes] = useState<{ id: number; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [productModels, setProductModels] = useState<
    { id: number; name: string }[]
  >([]);
  const [colors, setColors] = useState<{ id: number; name: string }[]>([]);
  const [capacities, setCapacities] = useState<{ id: number; name: string }[]>(
    []
  );
  const [warranties, setWarranties] = useState<{ id: number; name: string }[]>(
    []
  );
  const [processors, setProcessors] = useState<{ id: number; name: string }[]>(
    []
  );
  const [ramOptions, setRamOptions] = useState<{ id: number; name: string }[]>(
    []
  );
  const [storageTypes, setStorageTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [graphicsCards, setGraphicsCards] = useState<
    { id: number; name: string }[]
  >([]);
  const [breeds, setBreeds] = useState<{ id: number; name: string }[]>([]);
  const [ageRanges, setAgeRanges] = useState<{ id: number; name: string }[]>(
    []
  );
  const [genders, setGenders] = useState<{ id: number; name: string }[]>([]);
  const [engineCapacities, setEngineCapacities] = useState<
    { id: number; name: string }[]
  >([]);
  const [dealTypes, setDealTypes] = useState<{ id: number; name: string }[]>(
    []
  );

  const [selectedConditionId, setSelectedConditionId] = useState<number | null>(
    conditionId
  );
  const [selectedProductTypeId, setSelectedProductTypeId] = useState<
    number | null
  >(productTypeId);
  const [selectedOriginId, setSelectedOriginId] = useState<number | null>(
    originId
  );
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
    materialId
  );
  const [selectedSizeId, setSelectedSizeId] = useState<number | null>(sizeId);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(
    brandId
  );
  const [selectedProductModelId, setSelectedProductModelId] = useState<
    number | null
  >(productModelId);
  const [selectedColorId, setSelectedColorId] = useState<number | null>(
    colorId
  );
  const [selectedCapacityId, setSelectedCapacityId] = useState<number | null>(
    capacityId
  );
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<number | null>(
    warrantyId
  );
  const [selectedProcessorId, setSelectedProcessorId] = useState<number | null>(
    processorId
  );
  const [selectedRamOptionId, setSelectedRamOptionId] = useState<number | null>(
    ramOptionId
  );
  const [selectedStorageTypeId, setSelectedStorageTypeId] = useState<
    number | null
  >(storageTypeId);
  const [selectedGraphicsCardId, setSelectedGraphicsCardId] = useState<
    number | null
  >(graphicsCardId);
  const [selectedBreedId, setSelectedBreedId] = useState<number | null>(
    breedId
  );
  const [selectedAgeRangeId, setSelectedAgeRangeId] = useState<number | null>(
    ageRangeId
  );
  const [selectedGenderId, setSelectedGenderId] = useState<number | null>(
    genderId
  );
  const [selectedEngineCapacityId, setSelectedEngineCapacityId] = useState<
    number | null
  >(engineCapacityId);

  // Modals (giữ nguyên)
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showPostTypeModal, setShowPostTypeModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showOriginModal, setShowOriginModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showProductModelModal, setShowProductModelModal] = useState(false);
  const [showColorModal, setShowColorModal] = useState(false);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [showProcessorModal, setShowProcessorModal] = useState(false);
  const [showRamOptionModal, setShowRamOptionModal] = useState(false);
  const [showStorageTypeModal, setShowStorageTypeModal] = useState(false);
  const [showGraphicsCardModal, setShowGraphicsCardModal] = useState(false);
  const [showBreedModal, setShowBreedModal] = useState(false);
  const [showAgeRangeModal, setShowAgeRangeModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showEngineCapacityModal, setShowEngineCapacityModal] = useState(false);
  const [showDealTypeModal, setShowDealTypeModal] = useState(false);

  // Loaders (giữ nguyên)
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingProductTypes, setIsLoadingProductTypes] = useState(false);
  const [isLoadingOrigins, setIsLoadingOrigins] = useState(false);
  const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
  const [isLoadingSizes, setIsLoadingSizes] = useState(false);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [isLoadingColors, setIsLoadingColors] = useState(false);
  const [isLoadingCapacities, setIsLoadingCapacities] = useState(false);
  const [isLoadingWarranties, setIsLoadingWarranties] = useState(false);
  const [isLoadingProcessors, setIsLoadingProcessors] = useState(false);
  const [isLoadingRamOptions, setIsLoadingRamOptions] = useState(false);
  const [isLoadingStorageTypes, setIsLoadingStorageTypes] = useState(false);
  const [isLoadingGraphicsCards, setIsLoadingGraphicsCards] = useState(false);
  const [isLoadingBreeds, setIsLoadingBreeds] = useState(false);
  const [isLoadingAgeRanges, setIsLoadingAgeRanges] = useState(false);
  const [isLoadingGenders, setIsLoadingGenders] = useState(false);
  const [isLoadingEngineCapacities, setIsLoadingEngineCapacities] =
    useState(false);

  // Exchange (giữ nguyên)
  const [exchangeCategory, setExchangeCategory] = useState<Category | null>(
    product.category_change ?? null
  );
  const [exchangeSubCategory, setExchangeSubCategory] =
    useState<SubCategory | null>(product.sub_category_change ?? null);

  // === HÀM GIỮ NGUYÊN TỪ POSTFORMSCREEN ===

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

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user?.id) return;
      try {
        const res = await axios.get(`${path}/groups/my-public-joined`, {
          params: { userId: user.id },
        });
        if (Array.isArray(res.data)) {
          setGroups(res.data);
        }
      } catch (err: any) {
        console.error("Lỗi tải nhóm:", err.message);
      }
    };
    fetchGroups();
  }, [user]);

  const handleSelectCondition = (id: number) => {
    setSelectedConditionId(id);
    setConditionId(id);
    setShowConditionModal(false);
  };
  const handleSelectPostType = (id: number) => {
    setPostTypeId(id);
    setShowPostTypeModal(false);
  };
  const handleSelectProductType = (id: number) => {
    setSelectedProductTypeId(id);
    setProductTypeId(id);
    setShowTypeModal(false);
  };
  const handleSelectOrigin = (id: number) => {
    setSelectedOriginId(id);
    setOriginId(id);
    setShowOriginModal(false);
  };
  const handleSelectMaterial = (id: number) => {
    setSelectedMaterialId(id);
    setMaterialId(id);
    setShowMaterialModal(false);
  };
  const handleSelectSize = (id: number) => {
    setSelectedSizeId(id);
    setSizeId(id);
    setShowSizeModal(false);
  };
  const handleSelectBrand = (id: number) => {
    setSelectedBrandId(id);
    setShowBrandModal(false);
    if (id !== brandId) {
      setBrandId(id);
      // reset model
      setSelectedProductModelId(null);
      setProductModelId(null);
    }
  };
  const handleSelectProductModel = (id: number) => {
    setSelectedProductModelId(id);
    setProductModelId(id);
    setShowProductModelModal(false);
  };
  const handleSelectColor = (id: number) => {
    setSelectedColorId(id);
    setColorId(id);
    setShowColorModal(false);
  };
  const handleSelectCapacity = (id: number) => {
    setSelectedCapacityId(id);
    setCapacityId(id);
    setShowCapacityModal(false);
  };
  const handleSelectWarranty = (id: number) => {
    setSelectedWarrantyId(id);
    setWarrantyId(id);
    setShowWarrantyModal(false);
  };
  const handleSelectProcessor = (id: number) => {
    setSelectedProcessorId(id);
    setProcessorId(id);
    setShowProcessorModal(false);
  };
  const handleSelectRamOption = (id: number) => {
    setSelectedRamOptionId(id);
    setRamOptionId(id);
    setShowRamOptionModal(false);
  };
  const handleSelectStorageType = (id: number) => {
    setSelectedStorageTypeId(id);
    setStorageTypeId(id);
    setShowStorageTypeModal(false);
  };
  const handleSelectGraphicsCard = (id: number) => {
    setSelectedGraphicsCardId(id);
    setGraphicsCardId(id);
    setShowGraphicsCardModal(false);
  };
  const handleSelectBreed = (id: number) => {
    setSelectedBreedId(id);
    setBreedId(id);
    setShowBreedModal(false);
  };
  const handleSelectAgeRange = (id: number) => {
    setSelectedAgeRangeId(id);
    setAgeRangeId(id);
    setShowAgeRangeModal(false);
  };
  const handleSelectGender = (id: number) => {
    setSelectedGenderId(id);
    setGenderId(id);
    setShowGenderModal(false);
  };
  const handleSelectEngineCapacity = (id: number) => {
    setSelectedEngineCapacityId(id);
    setEngineCapacityId(id);
    setShowEngineCapacityModal(false);
  };
  const handleSelectDealType = (id: number) => {
    setDealTypeId(id);
    setShowDealTypeModal(false);

    if (id === 1) {
      // Giá bán
      setPrice(getInitialPrice() === "0" ? "" : getInitialPrice());
      setExchangeCategory(null);
      setExchangeSubCategory(null);
    } else if (id === 3) {
      // Trao đổi
      setPrice("0");
      // giữ nguyên nếu đã chọn trước đó
    } else {
      // Miễn phí
      setPrice("0");
      setExchangeCategory(null);
      setExchangeSubCategory(null);
    }
  };

  // Hàm xử lý ảnh (giữ nguyên)
  const processImageForUpload = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.error("Lỗi khi xử lý ảnh:", error);
      return uri;
    }
  };

  // === HÀM UPLOAD ẢNH ===
  const handleUploadImage = async (useCamera: boolean) => {
    if (images.length >= 4) {
      alert("Bạn chỉ được đăng tối đa 4 ảnh.");
      return;
    }

    let result;
    if (useCamera) {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 4 - images.length, // 👈 Giới hạn số lượng còn lại
        quality: 1,
      });
    }

    if (!result.canceled && result.assets) {
      setIsLoading(true); // Bật loading
      console.log("Bắt đầu xử lý nén ảnh...");

      const newImages: ImageStateType[] = [];
      for (const asset of result.assets) {
        const processedUri = await processImageForUpload(asset.uri);
        newImages.push({
          id: null, // Ảnh mới
          uri: processedUri,
          isNew: true, // Đánh dấu là ảnh mới
        });
      }

      console.log("Đã xử lý ảnh xong.");
      setIsLoading(false); // Tắt loading
      setImages((prev) => [...prev, ...newImages]);
    }
  };

  // === HÀM XÓA ẢNH ===
  const removeImage = (index: number) => {
    const imageToRemove = images[index];

    // Nếu là ảnh cũ (có ID), thêm ID vào danh sách cần xóa
    if (imageToRemove.id && !imageToRemove.isNew) {
      setImageIdsToDelete((prev) => [...prev, imageToRemove.id!]);
    }

    // Xóa ảnh khỏi state (cả cũ và mới)
    const updatedImages = [...images];
    updatedImages.splice(index, 1);
    setImages(updatedImages);
  };

  // === HÀM CẬP NHẬT ===
  const handleUpdate = async () => {
    if (isLoading) return;

    const finalName = name.trim();
    const missingFields: string[] = [];
    if (!finalName) missingFields.push("Tên sản phẩm");
    if (!description || description.trim() === "")
      missingFields.push("Mô tả sản phẩm");
    if (product.category?.name !== "Thú cưng" && !conditionId) {
      missingFields.push("Tình trạng sản phẩm");
    }

    if (showProductTypeDropdown && !productTypeId)
      missingFields.push("Loại sản phẩm");
    if (showMaterialDropdown && !materialId) missingFields.push("Chất liệu");
    if (showSizeDropdown && !sizeId) missingFields.push("Kích cỡ");
    if (showBrandDropdown && !brandId) missingFields.push("Hãng");
    if (showProductModelDropdown && !productModelId) missingFields.push("Dòng");
    if (showColorDropdown && !colorId) missingFields.push("Màu sắc");
    if (showCapacityDropdown && !capacityId) missingFields.push("Dung lượng");
    if (showWarrantyDropdown && !warrantyId) missingFields.push("Bảo hành");
    if (showOriginDropdown && !originId) missingFields.push("Xuất xứ");
    if (showProcessorDropdown && !processorId)
      missingFields.push("Bộ vi xử lý");
    if (showRamOptionDropdown && !ramOptionId) missingFields.push("RAM");
    if (showStorageTypeDropdown && !storageTypeId)
      missingFields.push("Loại ổ cứng");
    if (showGraphicsCardDropdown && !graphicsCardId)
      missingFields.push("Card màn hình");
    if (showBreedDropdown && !breedId) missingFields.push("Giống");
    if (showAgeRangeDropdown && !ageRangeId) missingFields.push("Độ tuổi");
    if (showGenderDropdown && !genderId) missingFields.push("Giới tính");
    if (showEngineCapacityDropdown && !engineCapacityId)
      missingFields.push("Dung tích xe");
    if (showMileageInput && !mileage) missingFields.push("Số km đã đi");
    if (showAuthorField && !author) missingFields.push("Tác giả");
    if (showYearField && !year) missingFields.push("Năm sản xuất");
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
        `Vui lòng điền đầy đủ các trường bắt buộc: ${missingFields.join(", ")}.`,
        [{ text: "OK" }]
      );
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();

      // 1. Gửi các trường text/number
      formData.append("name", finalName);
      formData.append("description", description);
      formData.append("price", dealTypeId === 1 ? String(price) : "0");
      formData.append("address_json", JSON.stringify({ full: address }));

      // Không gửi user_id, category_id, sub_category_id
      // Backend sẽ dùng user_id từ token

      formData.append("post_type_id", String(postTypeId));
      formData.append("deal_type_id", String(dealTypeId));
      if (conditionId) {
        formData.append("condition_id", String(conditionId));
      }

      if (productTypeId)
        formData.append("product_type_id", String(productTypeId));
      if (materialId) formData.append("material_id", String(materialId));
      if (sizeId) formData.append("size_id", String(sizeId));
      if (brandId) formData.append("brand_id", String(brandId));
      if (productModelId)
        formData.append("product_model_id", String(productModelId));
      if (colorId) formData.append("color_id", String(colorId));
      if (capacityId) formData.append("capacity_id", String(capacityId));
      if (warrantyId) formData.append("warranty_id", String(warrantyId));
      if (originId) formData.append("origin_id", String(originId));
      if (author) formData.append("author", author);
      if (year) formData.append("year", String(year));
      if (processorId) formData.append("processor_id", String(processorId));
      if (ramOptionId) formData.append("ram_option_id", String(ramOptionId));
      if (storageTypeId)
        formData.append("storage_type_id", String(storageTypeId));
      if (graphicsCardId)
        formData.append("graphics_card_id", String(graphicsCardId));
      if (breedId) formData.append("breed_id", String(breedId));
      if (ageRangeId) formData.append("age_range_id", String(ageRangeId));
      if (genderId) formData.append("gender_id", String(genderId));
      if (engineCapacityId)
        formData.append("engine_capacity_id", String(engineCapacityId));
      if (mileage) formData.append("mileage", mileage.replace(/\D/g, ""));
      if (dealTypeId === 3 && exchangeCategory && exchangeSubCategory) {
        formData.append("category_change_id", String(exchangeCategory.id));
        formData.append(
          "sub_category_change_id",
          String(exchangeSubCategory.id)
        );
      }
      if (selectedGroupId) {
        formData.append("group_id", String(selectedGroupId));
        formData.append("visibility_type", "1");
      } else {
        formData.append("visibility_type", "0");
        // formData.append("group_id", "");
      }
      // 2. Gửi danh sách ID ảnh cần xóa
      if (imageIdsToDelete.length > 0) {
        formData.append("imageIdsToDelete", JSON.stringify(imageIdsToDelete));
      }

      // 3. Gửi file ảnh MỚI
      images.forEach((img, index) => {
        if (img.isNew) {
          const filename = img.uri.split("/").pop();
          const ext = filename?.split(".").pop();
          const type = ext ? `image/${ext}` : "image/jpeg";
          formData.append("files", {
            uri: img.uri,
            name: filename || `photo_${index}.jpg`,
            type,
          } as any);
        }
      });

      const token = await AsyncStorage.getItem("token");
      console.log("FormData sẽ gửi (PATCH):", formData);

      const response = await axios.patch(
        `${path}/products/${product.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        Alert.alert("Thành công", "Sửa tin thành công. Đang chờ duyệt lại.");
        navigation.navigate("ManagePostsScreen");
      } else {
        Alert.alert("Lỗi", "Không thể sửa tin. Vui lòng thử lại.");
      }
    } catch (err: any) {
      console.error("Lỗi khi sửa tin:", err.response?.data || err.message);
      if (err.response && err.response.status === 400) {
        Alert.alert(
          "Thông tin không hợp lệ",
          err.response.data.message ||
            "Vui lòng kiểm tra lại các trường đã nhập."
        );
      } else if (err.message === "Network Error") {
        Alert.alert("Lỗi mạng", "Không thể kết nối đến server.");
      } else {
        Alert.alert("Lỗi máy chủ", "Đã xảy ra lỗi, vui lòng thử lại sau.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        alert("Cần quyền truy cập camera để chụp ảnh");
      }
    })();
  }, []);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      try {
        const [conditionRes, dealTypeRes, postTypeRes] = await Promise.all([
          axios.get(`${path}/conditions`),
          axios.get(`${path}/deal-types`),
          axios.get(`${path}/post-types`),
        ]);
        if (conditionRes.status === 200) setConditions(conditionRes.data);
        if (dealTypeRes.status === 200) setDealTypes(dealTypeRes.data);
        if (postTypeRes.status === 200) setPostTypes(postTypeRes.data);
      } catch (err) {
        console.error("Lỗi tải dữ liệu:", err);
        Alert.alert("Lỗi", "Không thể tải các tùy chọn cơ bản.");
      } finally {
        setIsLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);

  const categoryId = product.category?.id; // 🚀 Lấy từ product
  const subCategoryId = product.subCategory?.id; // 🚀 Lấy từ product

  const [showProductTypeDropdown, setShowProductTypeDropdown] = useState(false);
  const [showAuthorField, setShowAuthorField] = useState(false);
  const [showYearField, setShowYearField] = useState(false);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showProductModelDropdown, setShowProductModelDropdown] =
    useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showCapacityDropdown, setShowCapacityDropdown] = useState(false);
  const [showWarrantyDropdown, setShowWarrantyDropdown] = useState(false);
  const [showProcessorDropdown, setShowProcessorDropdown] = useState(false);
  const [showRamOptionDropdown, setShowRamOptionDropdown] = useState(false);
  const [showStorageTypeDropdown, setShowStorageTypeDropdown] = useState(false);
  const [showGraphicsCardDropdown, setShowGraphicsCardDropdown] =
    useState(false);
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const [showAgeRangeDropdown, setShowAgeRangeDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showEngineCapacityDropdown, setShowEngineCapacityDropdown] =
    useState(false);
  const [showMileageInput, setShowMileageInput] = useState(false);

  useEffect(() => {
    // Reset exchange category/subCategory khi dealType != 3
    if (Number(product.dealType?.id) !== 3) {
      setExchangeCategory(null);
      setExchangeSubCategory(null);
    } else {
      setExchangeCategory(product.category_change ?? null);
      setExchangeSubCategory(product.sub_category_change ?? null);
    }

    setPrice(
      Number(product.dealType?.id) === 1
        ? (product.price?.toString() ?? "")
        : "0"
    );
  }, [product]);

  useEffect(() => {
    // --- HÀM FETCH LOẠI SẢN PHẨM ---
    const fetchProductTypes = async () => {
      if (!categoryId) return;
      setIsLoadingProductTypes(true);
      if (subCategoryId) {
        try {
          const res = await fetch(
            `${path}/product-types/by-sub-category/${subCategoryId}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setProductTypes(data);
              setShowTypeModal(false);
              setShowProductTypeDropdown(true);
              setIsLoadingProductTypes(false);
              return;
            }
          }
        } catch (err) {}
      }
      try {
        const res = await fetch(
          `${path}/product-types/by-category/${categoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setProductTypes(data);
            setShowTypeModal(false);
            setShowProductTypeDropdown(true);
          } else {
            setShowProductTypeDropdown(false);
          }
        }
      } catch (err) {
        setShowProductTypeDropdown(false);
      } finally {
        setIsLoadingProductTypes(false);
      }
    }; // --- HÀM FETCH XUẤT XỨ ---
    const fetchOrigins = async () => {
      if (!categoryId) return;
      setIsLoadingOrigins(true);
      if (subCategoryId) {
        try {
          const res = await fetch(
            `${path}/origins/by-sub-category/${subCategoryId}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setOrigins(data);
              setShowOriginModal(false);
              setShowOriginDropdown(true);
              setIsLoadingOrigins(false);
              return;
            }
          }
        } catch (err) {}
      }
      try {
        const res = await fetch(`${path}/origins/by-category/${categoryId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setOrigins(data);
            setShowOriginModal(false);
            setShowOriginDropdown(true);
          } else {
            setShowOriginDropdown(false);
          }
        }
      } catch (err) {
        setShowOriginDropdown(false);
      } finally {
        setIsLoadingOrigins(false);
      }
    }; // --- HÀM FETCH CHẤT LIỆU ---
    const fetchMaterials = async () => {
      if (!categoryId) return;
      setIsLoadingMaterials(true);
      if (subCategoryId) {
        try {
          const res = await fetch(
            `${path}/materials/by-sub-category/${subCategoryId}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setMaterials(data);
              setShowMaterialModal(false);
              setShowMaterialDropdown(true);
              setIsLoadingMaterials(false);
              return;
            }
          }
        } catch (err) {}
      }
      try {
        const res = await fetch(`${path}/materials/by-category/${categoryId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setMaterials(data);
            setShowMaterialModal(false);
            setShowMaterialDropdown(true);
          } else {
            setShowMaterialDropdown(false);
          }
        }
      } catch (err) {
        setShowMaterialDropdown(false);
      } finally {
        setIsLoadingMaterials(false);
      }
    }; // --- HÀM FETCH KÍCH CỠ ---
    const fetchSizes = async () => {
      if (!subCategoryId) return;
      setIsLoadingSizes(true);
      try {
        const res = await fetch(
          `${path}/sizes/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setSizes(data);
            setShowSizeModal(false);
            setShowSizeDropdown(true);
          } else {
            setShowSizeDropdown(false);
          }
        }
      } catch (err) {
        setShowSizeDropdown(false);
      } finally {
        setIsLoadingSizes(false);
      }
    }; // --- HÀM FETCH HÃNG ---
    const fetchBrands = async () => {
      if (!subCategoryId) return;
      setIsLoadingBrands(true);
      try {
        const res = await fetch(
          `${path}/brands/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setBrands(data);
            setShowBrandModal(false);
            setShowBrandDropdown(true);
          } else {
            setShowBrandDropdown(false);
          }
        }
      } catch (err) {
        setShowBrandDropdown(false);
      } finally {
        setIsLoadingBrands(false);
      }
    }; // --- HÀM FETCH MÀU SẮC ---
    const fetchColors = async () => {
      if (!subCategoryId) return;
      setIsLoadingColors(true);
      try {
        const res = await fetch(
          `${path}/colors/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setColors(data);
            setShowColorModal(false);
            setShowColorDropdown(true);
          } else {
            setShowColorDropdown(false);
          }
        }
      } catch (err) {
        setShowColorDropdown(false);
      } finally {
        setIsLoadingColors(false);
      }
    }; // --- HÀM FETCH DUNG LƯỢNG ---
    const fetchCapacities = async () => {
      if (!subCategoryId) return;
      setIsLoadingCapacities(true);
      try {
        const res = await fetch(
          `${path}/capacities/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setCapacities(data);
            setShowCapacityModal(false);
            setShowCapacityDropdown(true);
          } else {
            setShowCapacityDropdown(false);
          }
        }
      } catch (err) {
        setShowCapacityDropdown(false);
      } finally {
        setIsLoadingCapacities(false);
      }
    }; // --- HÀM FETCH BẢO HÀNH ---
    const fetchWarranties = async () => {
      if (!subCategoryId) return;
      setIsLoadingWarranties(true);
      try {
        const res = await fetch(
          `${path}/warranties/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setWarranties(data);
            setShowWarrantyModal(false);
            setShowWarrantyDropdown(true);
          } else {
            setShowWarrantyDropdown(false);
          }
        }
      } catch (err) {
        setShowWarrantyDropdown(false);
      } finally {
        setIsLoadingWarranties(false);
      }
    }; // --- HÀM FETCH BỘ VI XỬ LÝ ---
    const fetchProcessors = async () => {
      if (!subCategoryId) return;
      setIsLoadingProcessors(true);
      try {
        const res = await fetch(
          `${path}/processors/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setProcessors(data);
            setShowProcessorModal(false);
            setShowProcessorDropdown(true);
          } else {
            setShowProcessorDropdown(false);
          }
        }
      } catch (err) {
        setShowProcessorDropdown(false);
      } finally {
        setIsLoadingProcessors(false);
      }
    }; // --- HÀM FETCH RAM ---
    const fetchRamOptions = async () => {
      if (!subCategoryId) return;
      setIsLoadingRamOptions(true);
      try {
        const res = await fetch(
          `${path}/ram-options/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setRamOptions(data);
            setShowRamOptionModal(false);
            setShowRamOptionDropdown(true);
          } else {
            setShowRamOptionDropdown(false);
          }
        }
      } catch (err) {
        setShowRamOptionDropdown(false);
      } finally {
        setIsLoadingRamOptions(false);
      }
    }; // --- HÀM FETCH LOẠI Ổ CỨNG ---
    const fetchStorageTypes = async () => {
      if (!subCategoryId) return;
      setIsLoadingStorageTypes(true);
      try {
        const res = await fetch(
          `${path}/storage-types/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setStorageTypes(data);
            setShowStorageTypeModal(false);
            setShowStorageTypeDropdown(true);
          } else {
            setShowStorageTypeDropdown(false);
          }
        }
      } catch (err) {
        setShowStorageTypeDropdown(false);
      } finally {
        setIsLoadingStorageTypes(false);
      }
    }; // --- HÀM FETCH CARD MÀN HÌNH ---
    const fetchGraphicsCards = async () => {
      if (!subCategoryId) return;
      setIsLoadingGraphicsCards(true);
      try {
        const res = await fetch(
          `${path}/graphics-cards/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setGraphicsCards(data);
            setShowGraphicsCardModal(false);
            setShowGraphicsCardDropdown(true);
          } else {
            setShowGraphicsCardDropdown(false);
          }
        }
      } catch (err) {
        setShowGraphicsCardDropdown(false);
      } finally {
        setIsLoadingGraphicsCards(false);
      }
    }; // --- HÀM FETCH GIỐNG THÚ CƯNG ---
    const fetchBreeds = async () => {
      if (!subCategoryId) return;
      setIsLoadingBreeds(true);
      try {
        const res = await fetch(
          `${path}/breeds/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setBreeds(data);
            setShowBreedModal(false);
            setShowBreedDropdown(true);
          } else {
            setShowBreedDropdown(false);
          }
        }
      } catch (err) {
        setShowBreedDropdown(false);
      } finally {
        setIsLoadingBreeds(false);
      }
    }; // --- HÀM FETCH ĐỘ TUỔI ---
    const fetchAgeRanges = async () => {
      if (!subCategoryId) return;
      setIsLoadingAgeRanges(true);
      try {
        const res = await fetch(
          `${path}/age-ranges/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setAgeRanges(data);
            setShowAgeRangeModal(false);
            setShowAgeRangeDropdown(true);
          } else {
            setShowAgeRangeDropdown(false);
          }
        }
      } catch (err) {
        setShowAgeRangeDropdown(false);
      } finally {
        setIsLoadingAgeRanges(false);
      }
    }; // --- HÀM FETCH GIỚI TÍNH ---
    const fetchGenders = async () => {
      if (!subCategoryId) return;
      setIsLoadingGenders(true);
      try {
        const res = await fetch(
          `${path}/genders/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setGenders(data);
            setShowGenderModal(false);
            setShowGenderDropdown(true);
          } else {
            setShowGenderDropdown(false);
          }
        }
      } catch (err) {
        setShowGenderDropdown(false);
      } finally {
        setIsLoadingGenders(false);
      }
    }; // --- HÀM FETCH DUNG TÍCH XE ---
    const fetchEngineCapacities = async () => {
      if (!subCategoryId) return;
      setIsLoadingEngineCapacities(true);
      try {
        const res = await fetch(
          `${path}/engine-capacities/by-sub-category/${subCategoryId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setEngineCapacities(data);
            setShowEngineCapacityModal(false);
            setShowEngineCapacityDropdown(true);
          } else {
            setShowEngineCapacityDropdown(false);
          }
        }
      } catch (err) {
        setShowEngineCapacityDropdown(false);
      } finally {
        setIsLoadingEngineCapacities(false);
      }
    }; // 1. Reset VISIBILITY

    setShowAuthorField(false);
    setShowYearField(false);
    setShowProductTypeDropdown(false);
    setShowOriginDropdown(false);
    setShowMaterialDropdown(false);
    setShowSizeDropdown(false);
    setShowBrandDropdown(false);
    setShowColorDropdown(false);
    setShowCapacityDropdown(false);
    setShowWarrantyDropdown(false);
    setShowProcessorDropdown(false);
    setShowRamOptionDropdown(false);
    setShowStorageTypeDropdown(false);
    setShowGraphicsCardDropdown(false);
    setShowBreedDropdown(false);
    setShowAgeRangeDropdown(false);
    setShowGenderDropdown(false);
    setShowEngineCapacityDropdown(false);
    setShowMileageInput(false); // 2. Chạy logic fetch

    if (product.category?.name === "Tài liệu khoa") {
      setShowAuthorField(true);
      setShowYearField(true);
    } else if (product.category?.name === "Thú cưng") {
      const petSubIds = [53, 54, 55, 56, 57];
      if (petSubIds.includes(Number(subCategoryId))) {
        fetchBreeds();
        fetchAgeRanges();
        fetchGenders();
      }
    } // 3. Nếu là danh mục khác
    else {
      const subIdNum = Number(subCategoryId); // Chạy chung
      fetchProductTypes();
      fetchOrigins(); // (Copy y hệt logic if/else của PostFormScreen)
      if ([23, 24].includes(subIdNum)) {
        fetchMaterials();
      }
      if ([25, 39, 40, 41, 62].includes(subIdNum)) {
        fetchSizes();
      }
      if ([38, 39, 40, 46, 60, 61, 62].includes(subIdNum)) {
        fetchBrands();
      }
      if ([38, 39, 40, 41, 60, 61, 62].includes(subIdNum)) {
        fetchColors();
        fetchWarranties();
      }
      if ([38, 39, 40, 41].includes(subIdNum)) {
        fetchCapacities();
      }
      if ([42, 43, 44, 45, 46, 47, 48].includes(subIdNum)) {
        fetchWarranties();
      }
      if ([40, 41].includes(subIdNum)) {
        fetchProcessors();
        fetchRamOptions();
        fetchStorageTypes();
        fetchGraphicsCards();
      }
      if ([60, 61, 62].includes(subIdNum)) {
        setShowYearField(true);
        if (subIdNum === 60) {
          setShowMileageInput(true);
          fetchEngineCapacities();
        }
      }
    }
  }, [categoryId, subCategoryId, product.category]);

  // Hàm fetchProductModels
  const fetchProductModels = useCallback(
    async (currentBrandId: number | null) => {
      setShowProductModelDropdown(false);
      if (!currentBrandId) return;
      setIsLoadingModels(true);
      try {
        const res = await fetch(
          `${path}/product-models/by-brand/${currentBrandId}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setProductModels(data);
            setShowProductModelModal(false);
            setShowProductModelDropdown(true);
          } else {
            setShowProductModelDropdown(false);
          }
        } else {
          setShowProductModelDropdown(false);
        }
      } catch (err) {
        setShowProductModelDropdown(false);
      } finally {
        setIsLoadingModels(false);
      }
    },
    [path]
  );

  useEffect(() => {
    if (brandId) {
      // Chỉ fetch khi brandId có
      fetchProductModels(brandId);
    }
  }, [brandId, fetchProductModels]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 60 }, (_, i) => currentYear - i);

  return (
    <View style={styles.container}>
      {/* Header (Sửa tiêu đề) */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()} // 🚀 Sửa thành goBack
          style={styles.headerIcon}
        >
          <MaterialCommunityIcons name="close" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa tin</Text>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ================================== */}
        {/* PHẦN BỊ KHÓA             */}
        {/* ================================== */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dropdown}
            // 🚀 VÔ HIỆU HÓA
            onPress={() =>
              Alert.alert(
                "Không thể sửa",
                "Bạn không thể thay đổi danh mục của tin đã đăng."
              )
            }
          >
            <Text style={styles.dropdownLabel}>
              Danh mục sản phẩm (Không thể sửa)
            </Text>
            <View style={[styles.dropdownContent, styles.disabledDropdown]}>
              <Text
                style={[styles.dropdownText, styles.disabledDropdownText]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {product.category
                  ? `${product.category.name}${
                      product.subCategory
                        ? ` - ${product.subCategory.name}`
                        : ""
                    }`
                  : "Chọn danh mục"}
              </Text>
              <FontAwesome6 name="lock" size={18} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ================================== */}
        {/* CÁC PHẦN CÒN LẠI (Y HỆT)     */}
        {/* ================================== */}

        {/* Upload hình ảnh */}
        <View style={styles.section}>
          <Text style={styles.dropdownLabel}>Hình ảnh sản phẩm</Text>
          <View style={{ flexDirection: "row", gap: 12, marginVertical: 8 }}>
            {/* Nút chọn từ thư viện */}
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => handleUploadImage(false)}
              disabled={images.length >= 4} // 🚀 Disable nếu đủ 4 ảnh
            >
              <MaterialCommunityIcons name="image" size={28} color="#f59e0b" />
              <Text style={styles.uploadText}>
                Thêm ảnh ({images.length}/4)
              </Text>
            </TouchableOpacity>

            {/* Nút chụp ảnh */}
            <TouchableOpacity
              style={styles.uploadBox}
              onPress={() => handleUploadImage(true)}
              disabled={images.length >= 4} // 🚀 Disable nếu đủ 4 ảnh
            >
              <MaterialCommunityIcons name="camera" size={28} color="#f59e0b" />
              <Text style={styles.uploadText}>Chụp ảnh</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helperText}>Ảnh đầu tiên sẽ là ảnh chính.</Text>

          <View style={styles.imageRow}>
            {images.map((img, idx) => (
              <View key={idx} style={{ position: "relative", marginRight: 8 }}>
                <Image source={{ uri: img.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  onPress={() => removeImage(idx)} // 🚀 Dùng hàm remove mới
                  style={styles.removeButton} // 🚀 Style mới
                >
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={22}
                    color="#ef4444" // Đổi màu đỏ
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {isLoading && ( // 🚀 Thêm loading khi xử lý ảnh
            <ActivityIndicator
              size="small"
              color="#3366FF"
              style={{ marginTop: 10 }}
            />
          )}
        </View>

        {/* Tên sản phẩm */}
        <View style={styles.section}>
          <Text style={styles.dropdownLabel}>Tên sản phẩm</Text>
          <TextInput
            style={styles.input}
            placeholder="Tên sản phẩm *"
            value={name} // 🚀 Đã có state
            onChangeText={setName}
          />
          <Text style={styles.helperText}>Nhập tên sản phẩm của bạn</Text>
        </View>

        {/* Tình trạng sản phẩm */}
        {!isLoadingOptions && product.category?.name !== "Thú cưng" && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowConditionModal(true)}
            >
              <Text style={styles.dropdownLabel}>Tình trạng sản phẩm</Text>
              <View style={styles.dropdownContent}>
                <Text style={styles.dropdownText}>
                  {conditionId
                    ? conditions.find((item) => Number(item.id) === conditionId)
                        ?.name || "Không xác định"
                    : "Chọn tình trạng"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Chọn tình trạng sản phẩm của bạn
            </Text>
          </View>
        )}

        {/* Loading Giống */}
        {isLoadingBreeds && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải danh sách giống...</Text>
          </View>
        )}
        {/* Giống (Thú cưng) */}
        {showBreedDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowBreedModal(true)}
            >
              <Text style={styles.dropdownLabel}>Giống thú cưng</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedBreedId
                    ? (breeds.find((t) => Number(t.id) === selectedBreedId)
                        ?.name ?? "Không xác định")
                    : "Chọn giống"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn giống của thú cưng</Text>
          </View>
        )}

        {/* Loading Độ tuổi */}
        {isLoadingAgeRanges && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải độ tuổi...</Text>
          </View>
        )}
        {/* Độ tuổi (Thú cưng) */}
        {showAgeRangeDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowAgeRangeModal(true)}
            >
              <Text style={styles.dropdownLabel}>Độ tuổi</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedAgeRangeId
                    ? (ageRanges.find(
                        (t) => Number(t.id) === selectedAgeRangeId
                      )?.name ?? "Không xác định")
                    : "Chọn độ tuổi"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn độ tuổi của thú cưng</Text>
          </View>
        )}

        {/* Loading Giới tính */}
        {isLoadingGenders && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải giới tính...</Text>
          </View>
        )}
        {/* Giới tính (Thú cưng) */}
        {showGenderDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowGenderModal(true)}
            >
              <Text style={styles.dropdownLabel}>Giới tính</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedGenderId
                    ? (genders.find((t) => Number(t.id) === selectedGenderId)
                        ?.name ?? "Không xác định")
                    : "Chọn giới tính"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn giới tính của thú cưng</Text>
          </View>
        )}

        {/* Loading Loại sản phẩm */}
        {isLoadingProductTypes && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải loại sản phẩm...</Text>
          </View>
        )}
        {/* Loại sản phẩm */}
        {showProductTypeDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowTypeModal(true)}
            >
              <Text style={styles.dropdownLabel}>Loại sản phẩm</Text>
              <View style={styles.dropdownContent}>
                <ScrollView>
                  <Text style={styles.dropdownText}>
                    {selectedProductTypeId
                      ? (productTypes.find(
                          (t) => Number(t.id) === selectedProductTypeId
                        )?.name ?? "Không xác định")
                      : "Chọn loại sản phẩm"}
                  </Text>
                </ScrollView>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn loại sản phẩm của bạn</Text>
          </View>
        )}

        {/* Loading Hãng */}
        {isLoadingBrands && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải danh sách hãng...</Text>
          </View>
        )}
        {/* Hãng */}
        {showBrandDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowBrandModal(true)}
            >
              <Text style={styles.dropdownLabel}>Hãng</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedBrandId
                    ? (brands.find((t) => Number(t.id) === selectedBrandId)
                        ?.name ?? "Không xác định")
                    : "Chọn hãng"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn hãng sản xuất</Text>
          </View>
        )}

        {/* Loading Dòng */}
        {isLoadingModels && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải dòng...</Text>
          </View>
        )}
        {/* Dòng */}
        {showProductModelDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowProductModelModal(true)}
            >
              <Text style={styles.dropdownLabel}>Dòng</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedProductModelId
                    ? (productModels.find(
                        (t) => Number(t.id) === selectedProductModelId
                      )?.name ?? "Không xác định")
                    : "Chọn dòng"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn dòng (model)</Text>
          </View>
        )}
        {/* Loading Dung tích xe */}
        {isLoadingEngineCapacities && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải dung tích xe...</Text>
          </View>
        )}
        {/* Dung tích xe */}
        {showEngineCapacityDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowEngineCapacityModal(true)}
            >
              <Text style={styles.dropdownLabel}>Dung tích xe</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedEngineCapacityId
                    ? (engineCapacities.find(
                        (t) => Number(t.id) === selectedEngineCapacityId
                      )?.name ?? "Không xác định")
                    : "Chọn dung tích xe (cc)"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn dung tích (cc) của xe</Text>
          </View>
        )}

        {/* Số km đã đi (TextInput) */}
        {showMileageInput && (
          <View style={styles.section}>
            <Text style={styles.dropdownLabel}>Số km đã đi (Odometer)</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập số km đã đi (ví dụ: 15000)"
              value={mileage}
              onChangeText={(text) => {
                const numeric = text.replace(/\D/g, "").slice(0, 9); // Bỏ dấu chấm
                setMileage(numeric);
              }}
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>Nhập số km xe đã di chuyển</Text>
          </View>
        )}
        {/* ===== BẮT ĐẦU THÊM 4 JSX MỚI (LAPTOP) ===== */}

        {/* Loading Bộ vi xử lý */}
        {isLoadingProcessors && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải bộ vi xử lý...</Text>
          </View>
        )}
        {/* Bộ vi xử lý */}
        {showProcessorDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowProcessorModal(true)}
            >
              <Text style={styles.dropdownLabel}>Bộ vi xử lý</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedProcessorId
                    ? (processors.find(
                        (t) => Number(t.id) === selectedProcessorId
                      )?.name ?? "Không xác định")
                    : "Chọn bộ vi xử lý"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn bộ vi xử lý (CPU)</Text>
          </View>
        )}

        {/* Loading RAM */}
        {isLoadingRamOptions && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải tùy chọn RAM...</Text>
          </View>
        )}
        {/* RAM */}
        {showRamOptionDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowRamOptionModal(true)}
            >
              <Text style={styles.dropdownLabel}>RAM</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedRamOptionId
                    ? (ramOptions.find(
                        (t) => Number(t.id) === selectedRamOptionId
                      )?.name ?? "Không xác định")
                    : "Chọn dung lượng RAM"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn dung lượng RAM</Text>
          </View>
        )}

        {/* Loading Loại ổ cứng */}
        {isLoadingStorageTypes && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải loại ổ cứng...</Text>
          </View>
        )}
        {/* Loại ổ cứng */}
        {showStorageTypeDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowStorageTypeModal(true)}
            >
              <Text style={styles.dropdownLabel}>Loại ổ cứng</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedStorageTypeId
                    ? (storageTypes.find(
                        (t) => Number(t.id) === selectedStorageTypeId
                      )?.name ?? "Không xác định")
                    : "Chọn loại ổ cứng"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn loại ổ cứng (SSD, HDD)</Text>
          </View>
        )}

        {/* Loading Card màn hình */}
        {isLoadingGraphicsCards && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải card màn hình...</Text>
          </View>
        )}
        {/* Card màn hình */}
        {showGraphicsCardDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowGraphicsCardModal(true)}
            >
              <Text style={styles.dropdownLabel}>Card màn hình</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedGraphicsCardId
                    ? (graphicsCards.find(
                        (t) => Number(t.id) === selectedGraphicsCardId
                      )?.name ?? "Không xác định")
                    : "Chọn card màn hình"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn card màn hình (GPU)</Text>
          </View>
        )}

        {/* ===== KẾT THÚC THÊM 4 JSX MỚI (LAPTOP) ===== */}

        {/* Loading Màu sắc */}
        {isLoadingColors && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải màu sắc...</Text>
          </View>
        )}
        {/* Màu sắc */}
        {showColorDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowColorModal(true)}
            >
              <Text style={styles.dropdownLabel}>Màu sắc</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedColorId
                    ? (colors.find((t) => Number(t.id) === selectedColorId)
                        ?.name ?? "Không xác định")
                    : "Chọn màu sắc"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn màu sắc sản phẩm</Text>
          </View>
        )}

        {/* Loading Dung lượng */}
        {isLoadingCapacities && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải dung lượng...</Text>
          </View>
        )}
        {/* Dung lượng */}
        {showCapacityDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowCapacityModal(true)}
            >
              <Text style={styles.dropdownLabel}>Dung lượng</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedCapacityId
                    ? (capacities.find(
                        (t) => Number(t.id) === selectedCapacityId
                      )?.name ?? "Không xác định")
                    : "Chọn dung lượng"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn dung lượng (ROM)</Text>
          </View>
        )}

        {/* Loading Bảo hành */}
        {isLoadingWarranties && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải bảo hành...</Text>
          </View>
        )}
        {/* Bảo hành */}
        {showWarrantyDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowWarrantyModal(true)}
            >
              <Text style={styles.dropdownLabel}>Bảo hành</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedWarrantyId
                    ? (warranties.find(
                        (t) => Number(t.id) === selectedWarrantyId
                      )?.name ?? "Không xác định")
                    : "Chọn tình trạng bảo hành"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn tình trạng bảo hành</Text>
          </View>
        )}

        {/* Loading Kích cỡ */}
        {isLoadingSizes && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải kích cỡ...</Text>
          </View>
        )}
        {/* Kích cỡ */}
        {showSizeDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowSizeModal(true)}
            >
              <Text style={styles.dropdownLabel}>Kích cỡ</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedSizeId
                    ? (sizes.find((t) => Number(t.id) === selectedSizeId)
                        ?.name ?? "Không xác định")
                    : "Chọn kích cỡ"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn kích cỡ</Text>
          </View>
        )}

        {/* Loading Chất liệu */}
        {isLoadingMaterials && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải chất liệu...</Text>
          </View>
        )}
        {/* Chất liệu */}
        {showMaterialDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowMaterialModal(true)}
            >
              <Text style={styles.dropdownLabel}>Chất liệu</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedMaterialId
                    ? (materials.find(
                        (t) => Number(t.id) === selectedMaterialId
                      )?.name ?? "Không xác định")
                    : "Chọn chất liệu"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn chất liệu của sản phẩm</Text>
          </View>
        )}

        {/* Loading Xuất xứ */}
        {isLoadingOrigins && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#3366FF" />
            <Text style={styles.loadingText}>Đang tải xuất xứ...</Text>
          </View>
        )}
        {/* Xuất xứ */}
        {showOriginDropdown && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowOriginModal(true)}
            >
              <Text style={styles.dropdownLabel}>Xuất xứ</Text>
              <View style={styles.dropdownContent}>
                <Text
                  style={styles.dropdownText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {selectedOriginId
                    ? (origins.find((t) => Number(t.id) === selectedOriginId)
                        ?.name ?? "Không xác định")
                    : "Chọn xuất xứ"}
                </Text>
                <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.helperText}>Chọn xuất xứ của sản phẩm</Text>
          </View>
        )}
        {/* Input Tài liệu khoa (Tác giả) */}
        {showAuthorField && (
          <View style={styles.section}>
            <Text style={styles.dropdownLabel}>Tác giả/ Người biên soạn</Text>
            <TextInput
              style={styles.input}
              placeholder="Tác giả / Người biên soạn *"
              value={author}
              onChangeText={setAuthor}
            />
          </View>
        )}

        {/* Input đặc thù (Năm sản xuất) */}
        {showYearField && (
          <View style={styles.section}>
            <Text style={styles.dropdownLabel}>Năm sản xuất</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={year}
                onValueChange={(itemValue) => setYear(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Chọn năm *" value={null} />
                {years.map((y) => (
                  <Picker.Item key={y} label={y.toString()} value={y} />
                ))}
              </Picker>
            </View>
          </View>
        )}

        {/* Hình thức giao dịch */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDealTypeModal(true)}
          >
            <Text style={styles.dropdownLabel}>Hình thức giao dịch</Text>
            <View style={styles.dropdownContent}>
              <Text style={styles.dropdownText}>
                {dealTypeId
                  ? dealTypes.find(
                      (opt) => Number(opt.id) === Number(dealTypeId)
                    )?.name || "Không xác định"
                  : "Chọn hình thức"}
              </Text>
              <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
            </View>
          </TouchableOpacity>
          {dealTypeId === 1 && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.dropdownLabel, { marginBottom: 4 }]}>
                Giá bán (VNĐ)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Nhập giá bán mong muốn"
                value={price.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                onChangeText={(text) => {
                  const numeric = text.replace(/\D/g, "").slice(0, 9);
                  setPrice(numeric);
                }}
                keyboardType="numeric"
              />
            </View>
          )}
          {dealTypeId === 3 && (
            <TouchableOpacity
              style={styles.section} // để giữ style hiện tại
              onPress={() => {
                navigation.navigate("ChooseExchangeCategoryScreen", {
                  onSelectCategory: (
                    category: Category,
                    subCategory: SubCategory
                  ) => {
                    setExchangeCategory(category);
                    setExchangeSubCategory(subCategory);
                  },
                });
              }}
            >
              <Text>
                {exchangeCategory && exchangeSubCategory
                  ? `${exchangeCategory.name} - ${exchangeSubCategory.name}`
                  : "Chọn danh mục trao đổi"}
              </Text>
              <Text style={styles.helperText}>
                Chọn danh mục cha và con bạn muốn đổi
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.helperText}>
            Chọn hình thức giao dịch bạn muốn
          </Text>
        </View>

        {/* Mô tả sản phẩm */}
        <View style={styles.section}>
          <Text style={styles.dropdownLabel}>Mô tả sản phẩm</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Mô tả chi tiết sản phẩm *"
            value={description} // 🚀 Đã có state
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
          <Text style={styles.helperText}>
            Nhập mô tả chi tiết cho sản phẩm của bạn
          </Text>
        </View>

        {/* Địa chỉ giao dịch */}
        <View style={styles.section}>
          <Text style={styles.dropdownLabel}>Chọn địa chỉ giao dịch</Text>
          <AddressPicker
            onChange={(fullAddress) => setAddress(fullAddress)}
            initialValue={address} // 🚀 Thêm initialValue
          />
          <Text style={styles.helperText}>Chọn địa chỉ giao dịch</Text>
        </View>
        {/* Chọn phạm vi bài đăng */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowGroupModal(true)}
          >
            <Text style={styles.dropdownLabel}>Đăng tại (Phạm vi)</Text>
            <View style={styles.dropdownContent}>
              <Text
                style={styles.dropdownText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {selectedGroupId
                  ? groups.find((g) => Number(g.id) === Number(selectedGroupId))
                      ?.name ||
                    product.group?.name ||
                    "Không xác định"
                  : "Toàn trường"}
              </Text>
              <FontAwesome6 name="chevron-down" size={20} color="#3366FF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.helperText}>
            Chọn đăng công khai hoặc trong nhóm bạn đã tham gia
          </Text>
        </View>
        {/* Loại bài đăng  */}
        {!isLoadingOptions && (
          <View style={styles.section}>
            <Text style={styles.dropdownLabel}>Loại bài đăng *</Text>
            <View style={styles.radioContainer}>
              {postTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.radioOption,
                    Number(postTypeId) === Number(type.id) &&
                      styles.radioOptionSelected,
                  ]}
                  onPress={() => handleSelectPostType(Number(type.id))}
                >
                  <Text
                    style={[
                      styles.radioOptionText,
                      Number(postTypeId) === Number(type.id) &&
                        styles.radioOptionTextSelected,
                    ]}
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
            <Text style={styles.helperText}>
              Chọn loại bài đăng (Đăng bán hoặc Đăng mua)
            </Text>
          </View>
        )}

        {/* Buttons*/}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.postButton, isLoading && { opacity: 0.7 }]}
            onPress={handleUpdate}
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.postButtonText}>Đang cập nhật...</Text>
              </View>
            ) : (
              <Text style={styles.postButtonText}>Lưu & Gửi duyệt</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* === MODALS === */}
      {/* Menu chọn tình trạng sản phẩm */}
      {showConditionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn tình trạng sản phẩm</Text>
            {conditions.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.modalOption,
                  conditionId === Number(type.id) && styles.modalOptionSelected,
                ]}
                onPress={() => handleSelectCondition(Number(type.id))}
              >
                <Text style={styles.modalOptionText}>{type.name}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShowConditionModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn loại sản phẩm */}
      {showTypeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn loại sản phẩm</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {productTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedProductTypeId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectProductType(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowTypeModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Hãng */}
      {showBrandModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn hãng</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {brands.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedBrandId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectBrand(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowBrandModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Dòng */}
      {showProductModelModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn dòng</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {productModels.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedProductModelId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectProductModel(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowProductModelModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Bộ vi xử lý */}
      {showProcessorModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn bộ vi xử lý</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {processors.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedProcessorId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectProcessor(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowProcessorModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn RAM */}
      {showRamOptionModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn RAM</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {ramOptions.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedRamOptionId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectRamOption(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowRamOptionModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Loại ổ cứng */}
      {showStorageTypeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn loại ổ cứng</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {storageTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedStorageTypeId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectStorageType(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowStorageTypeModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Card màn hình */}
      {showGraphicsCardModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn card màn hình</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {graphicsCards.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedGraphicsCardId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectGraphicsCard(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowGraphicsCardModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Giống */}
      {showBreedModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn giống thú cưng</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {breeds.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedBreedId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectBreed(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowBreedModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Độ tuổi */}
      {showAgeRangeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn độ tuổi</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {ageRanges.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedAgeRangeId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectAgeRange(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowAgeRangeModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Giới tính */}
      {showGenderModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn giới tính</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {genders.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedGenderId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectGender(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowGenderModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Menu chọn Dung tích xe */}
      {showEngineCapacityModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn dung tích xe</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {engineCapacities.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedEngineCapacityId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectEngineCapacity(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowEngineCapacityModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Menu chọn Màu sắc */}
      {showColorModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn màu sắc</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {colors.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedColorId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectColor(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowColorModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Dung lượng */}
      {showCapacityModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn dung lượng</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {capacities.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedCapacityId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectCapacity(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowCapacityModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Bảo hành */}
      {showWarrantyModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn bảo hành</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {warranties.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedWarrantyId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectWarranty(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowWarrantyModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Menu chọn Kích cỡ */}
      {showSizeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn kích cỡ</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {sizes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedSizeId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectSize(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowSizeModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Chất liệu */}
      {showMaterialModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn chất liệu</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {materials.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedMaterialId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectMaterial(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowMaterialModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Menu chọn Xuất xứ */}
      {showOriginModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn xuất xứ</Text>
            <ScrollView style={{ flexShrink: 1 }}>
              {origins.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.modalOption,
                    selectedOriginId === Number(type.id) &&
                      styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectOrigin(Number(type.id))}
                >
                  <Text style={styles.modalOptionText}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => setShowOriginModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {/* Chọn hình thức giao dịch */}
      {showDealTypeModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn hình thức giao dịch</Text>
            {dealTypes.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.modalOption,
                  dealTypeId === Number(option.id) &&
                    styles.modalOptionSelected,
                ]}
                onPress={() => handleSelectDealType(Number(option.id))}
              >
                <Text style={styles.modalOptionText}>{option.name}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={() => setShowDealTypeModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MODAL CHỌN NHÓM */}
      {showGroupModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.dropdownLabel}>Chọn nơi đăng bài</Text>
            <ScrollView style={{ flexShrink: 1, maxHeight: 300 }}>
              {/* Option 1: Toàn trường */}
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  selectedGroupId === null && styles.modalOptionSelected,
                ]}
                onPress={() => handleSelectGroup(null)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalOptionText}>Toàn trường</Text>
                  <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                    Hiển thị công khai cho tất cả sinh viên
                  </Text>
                </View>
                {selectedGroupId === null && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color="#3366FF"
                  />
                )}
              </TouchableOpacity>

              {/* Option 2: Các nhóm đã tham gia */}
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.modalOption,
                    selectedGroupId === group.id && styles.modalOptionSelected,
                  ]}
                  onPress={() => handleSelectGroup(group.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalOptionText}>{group.name}</Text>
                    <Text style={{ fontSize: 12, color: "#94a3b8" }}>
                      Chỉ hiển thị trong nhóm này
                    </Text>
                  </View>
                  {selectedGroupId === group.id && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color="#3366FF"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowGroupModal(false)}
              style={styles.modalCancelButton}
            >
              <Text style={styles.modalCancelText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

// === STYLES ===
const styles = StyleSheet.create({
  disabledDropdown: {
    backgroundColor: "#f3f4f6",
    opacity: 0.7,
  },
  disabledDropdownText: {
    color: "#6b7280",
  },
  removeButton: {
    position: "absolute",
    top: -8,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 12,
  },

  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    backgroundColor: "#f8fafc",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#64748b",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 4,
    backgroundColor: "#3366FF",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginTop: 20,
  },
  headerIcon: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  picker: {
    height: 50,
    width: "100%",
  },

  dropdown: {
    marginBottom: 8,
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  dropdownText: {
    fontSize: 16,
    color: "#334155",
    flex: 1,
  },
  uploadBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fef3c7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fcd34d",
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: "#92400e",
    marginLeft: 6,
    fontWeight: "500",
  },

  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 10,
    marginTop: 10,
  },
  imagePreview: {
    width: 60,
    height: 60,
    marginRight: 8,
    borderRadius: 5,
    marginBottom: 8,
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
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginVertical: 20,
    gap: 12,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f59e0b",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#f59e0b",
  },
  postButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "#f59e0b",
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  postButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: "60%",
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
  },
  modalOptionSelected: {
    backgroundColor: "#f0f9ff",
    borderLeftWidth: 4,
    borderLeftColor: "#3366FF",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#334155",
    flex: 1,
  },
  modalCancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "500",
  },
  radioContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 8,
  },
  radioOption: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  radioOptionSelected: {
    borderColor: "#3366FF",
    backgroundColor: "#f0f9ff",
  },
  radioOptionText: {
    fontSize: 15,
    color: "#334155",
    fontWeight: "500",
  },
  radioOptionTextSelected: {
    color: "#3366FF",
  },
});
