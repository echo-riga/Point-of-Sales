// app/(tabs)/_layout.tsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableOpacity, Vibration, View } from "react-native";
import { Button, Dialog, IconButton, Portal, Text } from "react-native-paper";

const PIN_KEY = "app_dashboard_pin";

// ── PIN Dot Display ───────────────────────────────────────────────────────────
function PinDots({ length, filled }: { length: number; filled: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        gap: 16,
        marginVertical: 16,
      }}
    >
      {Array.from({ length }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            backgroundColor: i < filled ? "#16a34a" : "#e5e7eb",
            borderWidth: 2,
            borderColor: i < filled ? "#16a34a" : "#9ca3af",
          }}
        />
      ))}
    </View>
  );
}

// ── PIN Numpad ────────────────────────────────────────────────────────────────
function PinNumpad({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const handleKey = (key: string) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    if (value.length >= 4) return;
    onChange(value + key);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

  return (
    <View style={{ gap: 8 }}>
      {[0, 1, 2, 3].map((row) => (
        <View
          key={row}
          style={{ flexDirection: "row", justifyContent: "center", gap: 12 }}
        >
          {keys.slice(row * 3, row * 3 + 3).map((key, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => key && handleKey(key)}
              disabled={!key}
              style={{
                width: 70,
                height: 70,
                borderRadius: 35,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor:
                  key === "⌫"
                    ? "#fef2f2"
                    : key === ""
                      ? "transparent"
                      : "#f0fdf4",
                borderWidth: key && key !== "⌫" ? 1 : 0,
                borderColor: "#d1fae5",
              }}
            >
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: key === "⌫" ? "#ef4444" : "#15803d",
                }}
              >
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function TabLayout() {
  const [showPinModal, setShowPinModal] = useState(false);
  const [mode, setMode] = useState<"verify" | "create" | "confirm">("verify");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [tempPin, setTempPin] = useState(""); // holds first entry during create
  const [errorMsg, setErrorMsg] = useState("");
  const [hasPin, setHasPin] = useState(false);

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (mode === "verify" && pin.length === 4) handleVerify();
    if (mode === "create" && pin.length === 4) {
      setTempPin(pin);
      setPin("");
      setMode("confirm");
    }
    if (mode === "confirm" && confirmPin.length === 4) handleConfirm();
  }, [pin, confirmPin, mode]);

  const openModal = async () => {
    const stored = await AsyncStorage.getItem(PIN_KEY);
    setHasPin(!!stored);
    setMode(stored ? "verify" : "create");
    setPin("");
    setConfirmPin("");
    setTempPin("");
    setErrorMsg("");
    setShowPinModal(true);
  };

  const handleVerify = async () => {
    const stored = await AsyncStorage.getItem(PIN_KEY);
    if (pin === stored) {
      setShowPinModal(false);
      setPin("");
      router.push("/(tabs)/dashboard");
    } else {
      Vibration.vibrate(300);
      setErrorMsg("Incorrect PIN. Try again.");
      setPin("");
    }
  };

  const handleConfirm = async () => {
    if (confirmPin === tempPin) {
      await AsyncStorage.setItem(PIN_KEY, confirmPin);
      setShowPinModal(false);
      setConfirmPin("");
      setTempPin("");
      router.push("/(tabs)/dashboard");
    } else {
      Vibration.vibrate(300);
      setErrorMsg("PINs don't match. Start over.");
      setMode("create");
      setPin("");
      setConfirmPin("");
      setTempPin("");
    }
  };

  const dismiss = () => {
    setShowPinModal(false);
    setPin("");
    setConfirmPin("");
    setTempPin("");
    setErrorMsg("");
  };

  const titleMap = {
    verify: "Enter PIN",
    create: "Create a PIN",
    confirm: "Confirm PIN",
  };

  const subtitleMap = {
    verify: "Enter your 4-digit PIN to access the Dashboard.",
    create: "Set a 4-digit PIN to protect the Dashboard.",
    confirm: "Re-enter your PIN to confirm.",
  };

  const activeValue = mode === "confirm" ? confirmPin : pin;
  const activeOnChange = mode === "confirm" ? setConfirmPin : setPin;

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#16a34a",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: { backgroundColor: "white" },
          headerStyle: { backgroundColor: "#16a34a" },
          headerTintColor: "white",
          headerRight: () => (
            <IconButton
              icon="information-outline"
              size={22}
              iconColor="white"
              onPress={() => router.push("/about")}
            />
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Order",
            tabBarIcon: ({ color }) => (
              <Ionicons name="cart" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ color }) => (
              <Ionicons name="grid" size={24} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              openModal();
            },
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: "Products",
            tabBarIcon: ({ color }) => (
              <Ionicons name="fast-food" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color }) => (
              <Ionicons name="receipt" size={24} color={color} />
            ),
          }}
        />
      </Tabs>

      <Portal>
        <Dialog
          visible={showPinModal}
          onDismiss={dismiss}
          style={{ width: 340, alignSelf: "center" }}
        >
          <Dialog.Title
            style={{
              color: "#15803d",
              fontWeight: "bold",
              textAlign: "center",
            }}
          >
            {titleMap[mode]}
          </Dialog.Title>

          <Dialog.Content style={{ alignItems: "center" }}>
            <Text
              style={{ color: "#6b7280", textAlign: "center", marginBottom: 4 }}
            >
              {subtitleMap[mode]}
            </Text>

            <PinDots length={4} filled={activeValue.length} />

            {errorMsg ? (
              <Text
                style={{
                  color: "#ef4444",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                {errorMsg}
              </Text>
            ) : null}

            <PinNumpad value={activeValue} onChange={activeOnChange} />
          </Dialog.Content>

          <Dialog.Actions style={{ justifyContent: "center" }}>
            <Button onPress={dismiss} textColor="#6b7280">
              Cancel
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
