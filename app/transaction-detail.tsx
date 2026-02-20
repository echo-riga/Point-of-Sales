// app/transaction-detail.tsx
import { View } from "react-native";
import { Text, Button } from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
      }}
    >
      <Text variant="headlineMedium">Transaction #{id}</Text>
      <Button mode="outlined" onPress={() => router.back()}>
        Back
      </Button>
    </View>
  );
}
