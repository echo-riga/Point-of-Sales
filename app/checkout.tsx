// app/checkout.tsx
import { View } from "react-native";
import { Text, Button } from "react-native-paper";
import { router } from "expo-router";

export default function CheckoutScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text variant="headlineMedium">Checkout Screen</Text>
      <Button mode="outlined" onPress={() => router.back()}>
        Back
      </Button>
    </View>
  );
}
