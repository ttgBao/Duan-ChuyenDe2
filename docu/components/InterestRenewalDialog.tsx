import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type DialogProps = {
  visible: boolean;
  productName: string;
  onRenew: () => void;
  onCancel: () => void;
};

export default function InterestRenewalDialog({
  visible,
  productName,
  onRenew,
  onCancel,
}: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/60 items-center justify-center px-6">
        <View className="bg-white rounded-2xl w-full p-6 items-center">
          <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Ionicons name="notifications-outline" size={32} color="#3b82f6" />
          </View>
          
          <Text className="text-xl font-bold text-gray-800 text-center mb-2">
            Gợi ý sản phẩm
          </Text>
          
          <Text className="text-base text-gray-600 text-center mb-6">
            Bạn có còn quan tâm đến sản phẩm{" "}
            <Text className="font-semibold text-gray-800">"{productName}"</Text>{" "}
            không để tiếp tục nhận gợi ý từ chúng tôi?
          </Text>
          
          <View className="flex-row w-full space-x-3">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 py-3 bg-gray-100 rounded-xl items-center"
            >
              <Text className="text-gray-600 font-semibold text-base">Không, cảm ơn</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onRenew}
              className="flex-1 py-3 bg-blue-500 rounded-xl items-center"
            >
              <Text className="text-white font-semibold text-base">Có, tiếp tục</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
