// app/(tabs)/transactions.tsx
import { transactionService } from "@/services/transactionService";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Divider, Text } from "react-native-paper";

interface TransactionRow {
  id: number;
  payment_type_id: number | null;
  payment_type_name: string | null;
  date: string;
  total_qty: number;
  total_price: number;
}

function currency(n: number) {
  return "₱" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDate(transactions: TransactionRow[]) {
  const groups: Record<string, TransactionRow[]> = {};
  for (const t of transactions) {
    const day = formatDate(t.date);
    if (!groups[day]) groups[day] = [];
    groups[day].push(t);
  }
  return groups;
}

type Period = "today" | "week" | "month" | "all";
const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 Days" },
  { key: "month", label: "30 Days" },
  { key: "all", label: "All" },
];

function filterByPeriod(
  transactions: TransactionRow[],
  period: Period,
): TransactionRow[] {
  if (period === "all") return transactions;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return transactions.filter((t) => {
    const d = new Date(t.date);
    const txDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (period === "today") return txDate.getTime() === today.getTime();
    if (period === "week") {
      const cutoff = new Date(today);
      cutoff.setDate(today.getDate() - 6);
      return txDate >= cutoff;
    }
    if (period === "month") {
      const cutoff = new Date(today);
      cutoff.setDate(today.getDate() - 29);
      return txDate >= cutoff;
    }
    return true;
  });
}

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);
  const [period, setPeriod] = useState<Period>("all");

  useFocusEffect(
    useCallback(() => {
      setTransactions(transactionService.getAll() as TransactionRow[]);
    }, []),
  );

  const filtered = filterByPeriod(transactions, period);
  const grouped = groupByDate(filtered);
  const days = Object.keys(grouped);

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      {/* Summary bar */}
      <View
        style={{
          backgroundColor: "#16a34a",
          paddingHorizontal: 20,
          paddingVertical: 14,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#bbf7d0", fontSize: 11, letterSpacing: 1 }}>
          TOTAL TRANSACTIONS
        </Text>
        <Text style={{ color: "white", fontSize: 22, fontWeight: "bold" }}>
          {filtered.length}
        </Text>
      </View>

      {/* Period Filter */}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          padding: 12,
          backgroundColor: "white",
          elevation: 1,
        }}
      >
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            onPress={() => setPeriod(p.key)}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: 10,
              alignItems: "center",
              backgroundColor: period === p.key ? "#16a34a" : "#f3f4f6",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: period === p.key ? "white" : "#6b7280",
              }}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ fontSize: 40 }}>🧾</Text>
          <Text variant="titleMedium" style={{ color: "#9ca3af" }}>
            {transactions.length === 0
              ? "No transactions yet"
              : "No transactions in this period"}
          </Text>
          <Text style={{ color: "#d1d5db", fontSize: 13 }}>
            {transactions.length === 0
              ? "Completed orders will appear here"
              : "Try selecting a wider date range"}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
          {days.map((day) => (
            <View key={day} style={{ gap: 8 }}>
              {/* Date header */}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: "#6b7280",
                    letterSpacing: 0.5,
                  }}
                >
                  {day.toUpperCase()}
                </Text>
                <View
                  style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }}
                />
                <Text style={{ fontSize: 12, color: "#9ca3af" }}>
                  {currency(
                    grouped[day].reduce((s, t) => s + t.total_price, 0),
                  )}
                </Text>
              </View>

              {/* Transaction cards */}
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 14,
                  overflow: "hidden",
                  elevation: 2,
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 4,
                }}
              >
                {grouped[day].map((t, i) => (
                  <View key={t.id}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push(`/transaction-detail?id=${t.id}`)
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        gap: 12,
                      }}
                    >
                      {/* Icon */}
                      <View
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 21,
                          backgroundColor: "#f0fdf4",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 18 }}>🧾</Text>
                      </View>

                      {/* Info */}
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "700",
                              color: "#111827",
                              fontSize: 15,
                            }}
                          >
                            #{t.id}
                          </Text>
                          {t.payment_type_name && (
                            <View
                              style={{
                                backgroundColor: "#f0fdf4",
                                borderRadius: 6,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderWidth: 1,
                                borderColor: "#bbf7d0",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: "#16a34a",
                                  fontWeight: "600",
                                }}
                                numberOfLines={1}
                              >
                                {t.payment_type_name}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#9ca3af",
                            marginTop: 2,
                          }}
                        >
                          {formatTime(t.date)} · {t.total_qty} item
                          {t.total_qty !== 1 ? "s" : ""}
                        </Text>
                      </View>

                      {/* Amount */}
                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          style={{
                            fontWeight: "bold",
                            color: "#16a34a",
                            fontSize: 16,
                          }}
                        >
                          {currency(t.total_price)}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: "#d1d5db",
                            marginTop: 2,
                          }}
                        >
                          ›
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {i < grouped[day].length - 1 && (
                      <Divider style={{ marginLeft: 70 }} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}
