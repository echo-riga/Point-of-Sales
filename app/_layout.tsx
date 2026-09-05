// app/_layout.tsx
import { setupDatabase } from "@/services/db";
import { Ionicons } from "@expo/vector-icons";
import * as NavigationBar from "expo-navigation-bar";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Alert, AppState, BackHandler, Dimensions, Platform, TouchableOpacity, View } from "react-native";
import { MD3LightTheme, PaperProvider } from "react-native-paper";

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#16a34a",
    secondary: "#4ade80",
    background: "#f9fafb",
  },
};

function checkIsTablet(): boolean {
  const { width, height } = Dimensions.get("screen");
  return Math.min(width, height) >= 600;
}

export default function RootLayout() {
  const [allowed, setAllowed] = useState(checkIsTablet);

  useEffect(() => {
    if (!checkIsTablet()) {
      Alert.alert(
        "Tablet Only",
        "This app is designed for tablets only and is not supported on phones.",
        [{ text: "Exit", onPress: () => BackHandler.exitApp() }],
        { cancelable: false },
      );
      setAllowed(false);
      return;
    }

    setAllowed(true);
    setupDatabase();

    const enforceFullscreen = () => {
      if (Platform.OS === "android") {
        NavigationBar.setBackgroundColorAsync("#f9fafb").catch(() => undefined);
        NavigationBar.setButtonStyleAsync("dark").catch(() => undefined);
        NavigationBar.setVisibilityAsync("hidden").catch(() => undefined);
        NavigationBar.setBehaviorAsync("overlay-swipe").catch(() => undefined);
      }
    };
    enforceFullscreen();

    const dimSub = Dimensions.addEventListener("change", () => {
      if (checkIsTablet()) {
        setAllowed(true);
      }
    });

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") enforceFullscreen();
    });

    return () => {
      dimSub.remove();
      appStateSub.remove();
    };
  }, []);

  if (!allowed) return null;

  return (
    <PaperProvider theme={theme}>
      <StatusBar hidden />
      <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#16a34a" },
            headerTintColor: "white",
            headerTitleStyle: { fontWeight: "bold" },
            contentStyle: { backgroundColor: "#f9fafb" },
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
          <Stack.Screen
            name="expenses"
            options={{
              title: "Expenses",
              headerStyle: { backgroundColor: "#dc2626" },
              headerTintColor: "white",
              headerTitleStyle: { fontWeight: "bold" },
              animation: "slide_from_right",
            }}
          />
        </Stack>
      </View>
    </PaperProvider>
  );
}
