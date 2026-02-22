// app/_layout.tsx
import { setupDatabase } from "@/services/db";
import { Ionicons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Alert, BackHandler, Dimensions, TouchableOpacity } from "react-native";
import { MD3LightTheme, PaperProvider } from "react-native-paper";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#16a34a",
    secondary: "#4ade80",
  },
};

function isTablet(): boolean {
  const { width, height } = Dimensions.get("window");
  const diagonal = Math.sqrt(width * width + height * height) / 160;
  return diagonal >= 7;
}

export default function RootLayout() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isTablet()) {
      Alert.alert(
        "Tablet Only",
        "This app is designed for tablets only and is not supported on phones.",
        [{ text: "Exit", onPress: () => BackHandler.exitApp() }],
        { cancelable: false },
      );
      return;
    }

    setAllowed(true);
    setupDatabase();
    NavigationBar.setVisibilityAsync("hidden");
  }, []);

  if (!allowed) return null;

  return (
    <PaperProvider theme={theme}>
      <StatusBar hidden />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#16a34a" },
          headerTintColor: "white",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            headerBackTitle: "",
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            animation: "slide_from_right",
            title: "Checkout",
            headerBackTitle: "Order",
          }}
        />
        <Stack.Screen
          name="product-form"
          options={{
            animation: "slide_from_right",
            title: "Product",
            headerBackTitle: "Products",
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: "About",
            animation: "slide_from_right",
            headerStyle: { backgroundColor: "#16a34a" },
            headerTintColor: "white",
            headerBackVisible: false,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ marginLeft: 4 }}
              >
                <Ionicons name="chevron-back" size={26} color="white" />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="transaction-detail"
          options={{
            animation: "slide_from_right",
            title: "Transaction Detail",
            headerBackTitle: "Transactions",
          }}
        />
      </Stack>
    </PaperProvider>
  );
}
