// app/about.tsx
import { View } from "react-native";
import { Text, Divider } from "react-native-paper";

export default function AboutScreen() {
  return (
    <View style={{ flex: 1, padding: 24, gap: 12 }}>
      <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
        About
      </Text>
      <Divider />

      <View style={{ gap: 8 }}>
        <Row label="System" value="Point of Sale System (POS)" />
        <Row
          label="Description"
          value="A simple sales-based Point of Sale system for recording transactions and monitoring revenue."
        />
        <Row label="Version" value="1.0.0" />
        <Row label="Platform" value="React Native Expo" />
        <Row label="Database" value="SQLite (local)" />
        <Row label="Developed by" value="Echo" />
        <Row label="Year" value="2026" />
      </View>
    </View>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Text variant="bodyMedium" style={{ color: "gray", width: 120 }}>
        {label}
      </Text>
      <Text variant="bodyMedium" style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}
