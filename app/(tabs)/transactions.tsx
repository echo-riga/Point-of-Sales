// app/(tabs)/transactions.tsx
import { View } from "react-native";
import { Text, Button } from "react-native-paper";
import { router } from "expo-router";

export default function TransactionsScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text variant="headlineMedium">Transactions Screen</Text>
      <Button
        mode="contained"
        onPress={() => router.push("/transaction-detail?id=456")}
      >
        View Transaction #456
      </Button>
    </View>
  );
}
