// app/(tabs)/products.tsx
import { View } from "react-native";
import { Text, Button } from "react-native-paper";
import { router } from "expo-router";

export default function ProductsScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text variant="headlineMedium">Products Screen</Text>
      <Button mode="contained" onPress={() => router.push("/product-form")}>
        Add Product
      </Button>
      <Button
        mode="outlined"
        onPress={() => router.push("/product-form?id=123")}
      >
        Edit Product (id=123)
      </Button>
    </View>
  );
}
