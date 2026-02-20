// app/_layout.tsx
import { Stack } from "expo-router";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#16a34a",
    secondary: "#4ade80",
  },
};

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#16a34a" },
          headerTintColor: "white", // back button + title color
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="checkout"
          options={{
            animation: "slide_from_right",
            title: "Checkout",
            headerBackTitle: "Order", // ← this controls the back button text
          }}
        />
        <Stack.Screen
          name="product-form"
          options={{
            animation: "slide_from_right",
            title: "Product",
            headerBackTitle: "Products", // ← back button says "Products"
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: "About",
            animation: "slide_from_right",
            headerStyle: { backgroundColor: "#16a34a" },
            headerTintColor: "white",
          }}
        />
        <Stack.Screen
          name="transaction-detail"
          options={{
            animation: "slide_from_right",
            title: "Transaction Detail",
            headerBackTitle: "Transactions", // ← back button says "Transactions"
          }}
        />
      </Stack>
    </PaperProvider>
  );
}
