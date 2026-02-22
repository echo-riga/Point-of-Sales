// app/checkout.tsx
import CartSidebar from "@/components/CartSideBar";
import { useCartStore } from "@/context/CartItem";
import { paymentTypeService } from "@/services/paymentTypeService";
import { transactionService } from "@/services/transactionService";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Button, Divider, RadioButton, Text } from "react-native-paper";

interface PaymentType {
  id: number;
  name: string;
}

type Stage = "input" | "paid";

export default function CheckoutScreen() {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  const totalPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [selectedPaymentType, setSelectedPaymentType] = useState<number | null>(
    null,
  );
  const [cash, setCash] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [finalChange, setFinalChange] = useState(0);

  useEffect(() => {
    const types = paymentTypeService.getAll() as PaymentType[];
    setPaymentTypes(types);
    if (types.length > 0) setSelectedPaymentType(types[0].id);
  }, []);

  const cashAmount = parseFloat(cash) || 0;
  const change = cashAmount - totalPrice;
  const isInsufficient = cashAmount < totalPrice;
  const canCharge = cashAmount >= totalPrice && selectedPaymentType !== null;

  const handleCharge = () => {
    if (!canCharge || selectedPaymentType === null) return;

    transactionService.create({
      paymentTypeId: selectedPaymentType,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
      })),
    });

    setFinalChange(cashAmount - totalPrice);
    setStage("paid");
  };

  const handleNewSale = () => {
    clear();
    router.back();
  };

  const FAST_AMOUNTS = [20, 50, 100, 200, 500, 1000];

  if (stage === "paid") {
    return (
      <View style={{ flex: 1, flexDirection: "row" }}>
        <CartSidebar readonly />
        <View
          style={{
            flex: 2,
            padding: 32,
            justifyContent: "center",
            alignItems: "center",
            gap: 24,
          }}
        >
          <View
            style={{
              backgroundColor: "#f0fdf4",
              borderRadius: 20,
              padding: 40,
              alignItems: "center",
              gap: 16,
              width: "100%",
              maxWidth: 440,
              borderWidth: 1,
              borderColor: "#bbf7d0",
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: "#16a34a",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "white", fontSize: 32 }}>✓</Text>
            </View>
            <Text
              variant="headlineSmall"
              style={{ fontWeight: "bold", color: "#15803d" }}
            >
              Payment Received
            </Text>
            <Divider style={{ width: "100%" }} />
            <View style={{ width: "100%", gap: 10 }}>
              <Row label="Amount Due" value={`₱${totalPrice.toFixed(2)}`} />
              <Row label="Cash" value={`₱${cashAmount.toFixed(2)}`} />
              <Divider />
              <Row
                label="Change"
                value={`₱${finalChange.toFixed(2)}`}
                valueStyle={{
                  color: "#16a34a",
                  fontWeight: "bold",
                  fontSize: 20,
                }}
              />
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button
              mode="outlined"
              icon="printer"
              onPress={() => console.log("print receipt")}
              style={{ borderRadius: 8 }}
              contentStyle={{ paddingVertical: 6, paddingHorizontal: 12 }}
            >
              Print Receipt
            </Button>
            <Button
              mode="contained"
              icon="plus"
              onPress={handleNewSale}
              style={{ borderRadius: 8 }}
              contentStyle={{ paddingVertical: 6, paddingHorizontal: 12 }}
            >
              New Sale
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      <CartSidebar readonly />
      <ScrollView
        style={{ flex: 2 }}
        contentContainerStyle={{ padding: 20, gap: 20 }}
      >
        <View
          style={{
            backgroundColor: "#16a34a",
            borderRadius: 16,
            padding: 5,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#bbf7d0", fontSize: 14, marginBottom: 4 }}>
            AMOUNT DUE
          </Text>
          <Text
            style={{
              color: "white",
              fontSize: 48,
              fontWeight: "bold",
              letterSpacing: 1,
            }}
          >
            ₱{totalPrice.toFixed(2)}
          </Text>
        </View>

        <View style={{ gap: 10 }}>
          <Text variant="labelLarge" style={{ color: "#374151" }}>
            Cash Received
          </Text>
          <View
            style={{
              borderWidth: 2,
              borderColor:
                isInsufficient && cash !== "" ? "#ef4444" : "#16a34a",
              borderRadius: 12,
              paddingHorizontal: 20,
              paddingVertical: 16,
              backgroundColor: "#f9fafb",
            }}
          >
            <Text
              style={{
                fontSize: 36,
                fontWeight: "bold",
                color: isInsufficient && cash !== "" ? "#ef4444" : "#111827",
                letterSpacing: 1,
              }}
            >
              ₱{cash === "" ? "0.00" : parseFloat(cash).toFixed(2)}
            </Text>
          </View>
          {isInsufficient && cash !== "" && (
            <Text style={{ color: "#ef4444", fontSize: 13 }}>
              Short by ₱{(totalPrice - cashAmount).toFixed(2)}
            </Text>
          )}
          <Numpad value={cash} onChange={setCash} />
          <View
            style={{
              flexDirection: "row",
              overflow: "hidden",
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#16a34a",
            }}
          >
            {FAST_AMOUNTS.map((amt, index) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setCash(amt.toString())}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: "center",
                  backgroundColor:
                    cash === amt.toString() ? "#16a34a" : "white",
                  borderLeftWidth: index === 0 ? 0 : 1,
                  borderLeftColor: "#16a34a",
                }}
              >
                <Text
                  style={{
                    color: cash === amt.toString() ? "white" : "#16a34a",
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  ₱{amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Divider />

        <View style={{ gap: 10 }}>
          <Text variant="labelLarge" style={{ color: "#374151" }}>
            Payment Type
          </Text>
          <RadioButton.Group
            value={selectedPaymentType?.toString() ?? ""}
            onValueChange={(val) => setSelectedPaymentType(parseInt(val))}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {paymentTypes.map((pt) => (
                <TouchableOpacity
                  key={pt.id}
                  onPress={() => setSelectedPaymentType(pt.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor:
                      selectedPaymentType === pt.id ? "#16a34a" : "#d1d5db",
                    backgroundColor:
                      selectedPaymentType === pt.id ? "#f0fdf4" : "white",
                    gap: 6,
                  }}
                >
                  <RadioButton value={pt.id.toString()} color="#16a34a" />
                  <Text
                    style={{
                      color:
                        selectedPaymentType === pt.id ? "#15803d" : "#374151",
                      fontWeight: selectedPaymentType === pt.id ? "700" : "400",
                    }}
                  >
                    {pt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </RadioButton.Group>
          {paymentTypes.length === 0 && (
            <Text style={{ color: "gray", fontSize: 13 }}>
              No payment types found. Add some in the Dashboard.
            </Text>
          )}
        </View>

        {canCharge && (
          <View
            style={{
              backgroundColor: "#f0fdf4",
              borderRadius: 12,
              padding: 16,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text variant="bodyMedium" style={{ color: "#166534" }}>
              Change
            </Text>
            <Text
              variant="titleMedium"
              style={{ color: "#16a34a", fontWeight: "bold" }}
            >
              ₱{change.toFixed(2)}
            </Text>
          </View>
        )}

        <Button
          mode="contained"
          onPress={handleCharge}
          disabled={!canCharge}
          style={{
            borderRadius: 12,
            backgroundColor:
              isInsufficient || cash === "" ? "#9ca3af" : "#16a34a",
          }}
          contentStyle={{ paddingVertical: 10 }}
          labelStyle={{ fontSize: 18, fontWeight: "bold" }}
        >
          {cash === ""
            ? "Enter Cash Amount"
            : isInsufficient
              ? `Insufficient — Short ₱${(totalPrice - cashAmount).toFixed(2)}`
              : `Charge ₱${totalPrice.toFixed(2)}`}
        </Button>
      </ScrollView>
    </View>
  );
}

function Row({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle?: object;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Text variant="bodyMedium" style={{ color: "#6b7280" }}>
        {label}
      </Text>
      <Text variant="titleMedium" style={[{ fontWeight: "600" }, valueStyle]}>
        {value}
      </Text>
    </View>
  );
}

function Numpad({
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
    if (key === "." && value.includes(".")) return;
    if (value.includes(".") && value.split(".")[1]?.length >= 2) return;
    onChange(value + key);
  };
  return (
    <View
      style={{
        borderRadius: 10,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#e5e7eb",
      }}
    >
      {[
        ["7", "8", "9"],
        ["4", "5", "6"],
        ["1", "2", "3"],
        [".", "0", "⌫"],
      ].map((row, ri) => (
        <View
          key={ri}
          style={{
            flexDirection: "row",
            borderTopWidth: ri === 0 ? 0 : 1,
            borderTopColor: "#e5e7eb",
          }}
        >
          {row.map((key, ki) => (
            <TouchableOpacity
              key={key}
              onPress={() => handleKey(key)}
              style={{
                flex: 1,
                paddingVertical: 18,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: key === "⌫" ? "#fee2e2" : "#f3f4f6",
                borderLeftWidth: ki === 0 ? 0 : 1,
                borderLeftColor: "#e5e7eb",
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "600",
                  color: key === "⌫" ? "#ef4444" : "#111827",
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
