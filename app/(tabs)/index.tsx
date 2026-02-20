// app/(tabs)/index.tsx
import { View } from "react-native";
import CartSidebar from "@/components/CartSideBar";
import { Text } from "react-native-paper";

export default function OrderScreen() {
  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {/* Left - Products */}
      <View
        style={{
          flex: 2,
          padding: 16,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text variant="headlineMedium">Products go here</Text>
      </View>

      {/* Right - Cart */}
      <CartSidebar />
    </View>
  );
}
