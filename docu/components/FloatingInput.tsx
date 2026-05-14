import { useState, forwardRef } from "react";
import { TextInput, View, Text, TouchableOpacity, TextInputProps } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import React from "react";

// Kế thừa toàn bộ TextInputProps để nhận đúng union type của RN
type FloatingInputProps = {
  label: string;
  toggleSecure?: () => void;
  containerClassName?: string; // tuỳ chọn: custom style container
  inputClassName?: string;     // tuỳ chọn: custom style input
} & TextInputProps;

const FloatingInput = forwardRef<TextInput, FloatingInputProps>(function FloatingInput(
  {
    label,
    toggleSecure,
    containerClassName,
    inputClassName,
    secureTextEntry, // đã có trong TextInputProps
    value,
    onChangeText,
    ...rest // nhận keyboardType, autoCapitalize, autoCorrect, v.v.
  },
  ref
) {
  const [isFocused, setIsFocused] = useState(false);
  const isActive = isFocused || (!!value && String(value).length > 0);

  return (
    <View className={`mb-5 relative ${containerClassName ?? ""}`}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        className={`w-full h-[50px] px-5 rounded-xl pb-1 ${
          isActive ? "border-2 border-black" : "border border-gray-500"
        } ${inputClassName ?? ""}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...rest}
      />

      <View
        pointerEvents="none"
        className={`absolute flex flex-row ${
          isActive ? "top-1 left-5" : "top-4 left-5"
        }`}
      >
        <Text
          className={`font-bold ${
            isActive ? "text-[10px]" : "text-[14px] text-gray-500"
          }`}
        >
          {label}
        </Text>
        <Text
          className={`text-[red] ${
            isActive ? "text-[10px] ml-1" : "text-[14px] ml-1"
          }`}
        >
          *
        </Text>
      </View>

      {/* Chỉ hiển thị nút show/hide khi có toggleSecure (tức là input dạng password) */}
      {typeof toggleSecure === "function" && (
        <TouchableOpacity onPress={toggleSecure} className="absolute right-5 top-3">
          <FontAwesome5 name={secureTextEntry ? "eye-slash" : "eye"} size={20} color="gray" />
        </TouchableOpacity>
      )}
    </View>
  );
});

export default FloatingInput;
