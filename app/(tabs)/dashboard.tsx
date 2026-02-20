// app/(tabs)/dashboard.tsx
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function DashboardScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text variant="headlineMedium">Dashboard Screen</Text>
    </View>
  );
}
