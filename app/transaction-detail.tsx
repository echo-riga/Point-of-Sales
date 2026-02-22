// app/transaction-detail.tsx
import { transactionService } from "@/services/transactionService";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { Button, Chip, Divider, Text } from "react-native-paper";

interface TransactionRow {
  id: number;
  payment_type_id: number | null;
  payment_type_name: string | null;
  date: string;
  total_qty: number;
  total_price: number;
}

interface TransactionItemRow {
  id: number;
  item_id: number | null;
  item_name: string | null;
  price: number;
  qty: number;
  total: number;
}

function currency(n: number) {
  return "₱" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
      }}
    >
      <Text style={{ color: "#6b7280", fontSize: 14 }}>{label}</Text>
      <Text
        style={{
          color: "#111827",
          fontWeight: bold ? "700" : "500",
          fontSize: 14,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionRow | null>(null);
  const [items, setItems] = useState<TransactionItemRow[]>([]);

  useEffect(() => {
    if (!id) return;
    const t = transactionService.getById(Number(id));
    const its = transactionService.getItemsByTransactionId(Number(id));
    setTransaction(t);
    setItems(its);
  }, [id]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Transaction",
      `Are you sure you want to delete transaction #${id}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            transactionService.delete(Number(id));
            router.back();
          },
        },
      ],
    );
  };

  if (!transaction) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Text style={{ fontSize: 36 }}>🔍</Text>
        <Text variant="titleMedium" style={{ color: "#9ca3af" }}>
          Transaction not found
        </Text>
        <Button mode="outlined" onPress={() => router.back()}>
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Header card */}
        <View
          style={{
            backgroundColor: "#16a34a",
            borderRadius: 16,
            padding: 20,
            gap: 8,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View>
              <Text
                style={{ color: "#bbf7d0", fontSize: 11, letterSpacing: 1 }}
              >
                TRANSACTION
              </Text>
              <Text
                style={{ color: "white", fontSize: 28, fontWeight: "bold" }}
              >
                #{transaction.id}
              </Text>
            </View>
            {transaction.payment_type_name && (
              <Chip
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                textStyle={{ color: "white", fontWeight: "700", fontSize: 12 }}
              >
                {transaction.payment_type_name}
              </Chip>
            )}
          </View>
          <Text style={{ color: "#bbf7d0", fontSize: 13 }}>
            {formatDateTime(transaction.date)}
          </Text>
        </View>

        {/* Summary card */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 14,
            padding: 16,
            elevation: 2,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#6b7280",
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            SUMMARY
          </Text>
          <Row label="Items Sold" value={String(transaction.total_qty)} />
          <Divider />
          <Row
            label="Payment Method"
            value={transaction.payment_type_name ?? "Unknown"}
          />
          <Divider />
          <Row
            label="Total Revenue"
            value={currency(transaction.total_price)}
            bold
          />
        </View>

        {/* Items card */}
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 14,
            padding: 16,
            elevation: 2,
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 4,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: "#6b7280",
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            ORDER ITEMS
          </Text>

          {/* Table header */}
          <View style={{ flexDirection: "row", paddingBottom: 8 }}>
            <Text
              style={{
                flex: 3,
                fontSize: 11,
                color: "#9ca3af",
                fontWeight: "600",
              }}
            >
              ITEM
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 11,
                color: "#9ca3af",
                fontWeight: "600",
                textAlign: "center",
              }}
            >
              QTY
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 11,
                color: "#9ca3af",
                fontWeight: "600",
                textAlign: "right",
              }}
            >
              PRICE
            </Text>
            <Text
              style={{
                flex: 1,
                fontSize: 11,
                color: "#9ca3af",
                fontWeight: "600",
                textAlign: "right",
              }}
            >
              TOTAL
            </Text>
          </View>
          <Divider />

          {items.map((item, i) => (
            <View key={item.id}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                }}
              >
                <View style={{ flex: 3 }}>
                  <Text style={{ fontWeight: "600", color: "#111827" }}>
                    {item.item_name ?? "Deleted Item"}
                  </Text>
                  <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                    {currency(item.price)} each
                  </Text>
                </View>
                <Text
                  style={{
                    flex: 1,
                    textAlign: "center",
                    color: "#374151",
                    fontWeight: "500",
                  }}
                >
                  {item.qty}
                </Text>
                <Text style={{ flex: 1, textAlign: "right", color: "#374151" }}>
                  {currency(item.price)}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    textAlign: "right",
                    color: "#16a34a",
                    fontWeight: "700",
                  }}
                >
                  {currency(item.total)}
                </Text>
              </View>
              {i < items.length - 1 && <Divider />}
            </View>
          ))}

          <Divider style={{ marginTop: 4 }} />

          {/* Total row */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 12,
            }}
          >
            <Text style={{ fontWeight: "700", color: "#111827", fontSize: 15 }}>
              Total
            </Text>
            <Text
              style={{ fontWeight: "bold", color: "#16a34a", fontSize: 18 }}
            >
              {currency(transaction.total_price)}
            </Text>
          </View>
        </View>

        {/* Delete button */}
        <Button
          mode="outlined"
          icon="trash-can-outline"
          onPress={handleDelete}
          textColor="#ef4444"
          style={{ borderColor: "#fca5a5", borderRadius: 10 }}
          contentStyle={{ paddingVertical: 4 }}
        >
          Delete Transaction
        </Button>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}
