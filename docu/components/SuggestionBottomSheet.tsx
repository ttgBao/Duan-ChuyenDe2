import React from "react";
import { Modal, View, Text, TouchableOpacity, FlatList, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type SuggestionProps = {
  visible: boolean;
  suggestions: any[];
  onClose: () => void;
  onItemPress: (item: any) => void;
  title?: string;
};

export default function SuggestionBottomSheet({
  visible,
  suggestions,
  onClose,
  onItemPress,
  title = "Có thể bạn quan tâm",
}: SuggestionProps) {
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => onItemPress(item)}
      className="flex-row items-center px-4 py-3 border-b border-gray-100 bg-white"
    >
      {item.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} className="w-12 h-12 rounded-lg" />
      ) : (
        <View className="w-12 h-12 rounded-lg bg-gray-200 items-center justify-center">
          <Ionicons name="image-outline" size={24} color="gray" />
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
          {item.price?.toLocaleString("vi-VN")} đ • {item.user?.name || "Người dùng"}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[70%]">
          {/* Header */}
          <View className="flex-row justify-between items-center px-5 py-4 border-b border-gray-200">
            <Text className="text-lg font-bold text-gray-800">{title}</Text>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={24} color="#4b5563" />
            </TouchableOpacity>
          </View>

          {/* List */}
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text className="text-center py-8 text-gray-500">
                Chưa có gợi ý nào phù hợp vào lúc này.
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}
