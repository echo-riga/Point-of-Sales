// app/(tabs)/transactions.tsx
import { transactionService } from "@/services/transactionService";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, TouchableOpacity, View, KeyboardAvoidingView, Platform } from "react-native";
import { Divider, Text } from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";

interface TransactionRow {
  id: number;
  payment_type_id: number | null;
  payment_type_name: string | null;
  reference_number: string | null;
  date: string;
  total_qty: number;
  total_price: number;
}

function currency(n: number) {
  return "₱" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-PH", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDisplayDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${months[m - 1]} ${d}, ${y}`;
}

function todayString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function toDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function isValidDate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const [y, m, d] = str.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return (
    date.getFullYear() === y &&
    date.getMonth() === m - 1 &&
    date.getDate() === d
  );
}

function groupByDate(transactions: TransactionRow[]) {
  const groups: Record<string, TransactionRow[]> = {};
  for (const t of transactions) {
    const day = t.date.slice(0, 10); // use YYYY-MM-DD key
    if (!groups[day]) groups[day] = [];
    groups[day].push(t);
  }
  return groups;
}

// ── Date Range Filter ─────────────────────────────────────────────────────────
function DateRangeFilter({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
}: {
  fromDate: string;
  toDate: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
}) {
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  const fromDateObj = new Date(fromDate + "T00:00:00");
  const toDateObj = new Date(toDate + "T00:00:00");

  return (
    <View
      style={{
        backgroundColor: "white",
        paddingHorizontal: 16,
        paddingVertical: 14,
        elevation: 1,
      }}
    >
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        {/* From */}
        <TouchableOpacity
          onPress={() => setShowFromPicker(true)}
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: "#bbf7d0",
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: "#f0fdf4",
          }}
        >
          <Text style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>
            FROM
          </Text>
          <Text style={{ fontWeight: "700", color: "#16a34a", fontSize: 14 }}>
            {formatDateLabel(fromDate)}
          </Text>
        </TouchableOpacity>

        <Text style={{ color: "#9ca3af", fontWeight: "700", fontSize: 16 }}>
          →
        </Text>

        {/* To */}
        <TouchableOpacity
          onPress={() => setShowToPicker(true)}
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: "#bbf7d0",
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: "#f0fdf4",
          }}
        >
          <Text style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>
            TO
          </Text>
          <Text style={{ fontWeight: "700", color: "#16a34a", fontSize: 14 }}>
            {formatDateLabel(toDate)}
          </Text>
        </TouchableOpacity>
      </View>

      {showFromPicker && (
        <DateTimePicker
          value={fromDateObj}
          mode="date"
          display="default"
          maximumDate={toDateObj}
          onChange={(_, selected) => {
            setShowFromPicker(false);
            if (selected) onFromChange(toDateString(selected));
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={toDateObj}
          mode="date"
          display="default"
          minimumDate={fromDateObj}
          maximumDate={new Date()}
          onChange={(_, selected) => {
            setShowToPicker(false);
            if (selected) onToChange(toDateString(selected));
          }}
        />
      )}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TransactionsScreen() {
  const today = todayString();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [transactions, setTransactions] = useState<TransactionRow[]>([]);

  const rangeValid =
    isValidDate(fromDate) && isValidDate(toDate) && fromDate <= toDate;

  const load = useCallback(() => {
    if (!rangeValid) return;
    const all = transactionService.getAll() as TransactionRow[];
    const filtered = all.filter((t) => {
      const day = t.date.slice(0, 10);
      return day >= fromDate && day <= toDate;
    });
    setTransactions(filtered);
  }, [fromDate, toDate, rangeValid]);

  useFocusEffect(load);

  const grouped = groupByDate(transactions);
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
        {/* Summary bar */}
        <View
          style={{
            backgroundColor: "#16a34a",
            paddingHorizontal: 20,
            paddingVertical: 14,
            alignItems: "center",
            gap: 2,
          }}
        >
          <Text style={{ color: "#bbf7d0", fontSize: 11, letterSpacing: 1 }}>
            TOTAL TRANSACTIONS
          </Text>
          <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
            {transactions.length}
          </Text>
          <Text style={{ color: "#86efac", fontSize: 12 }}>
            {currency(transactions.reduce((s, t) => s + t.total_price, 0))}
            {rangeValid
              ? `  ·  ${formatDisplayDate(fromDate)} – ${formatDisplayDate(toDate)}`
              : ""}
          </Text>
        </View>

        {/* Date Range Filter */}
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={(d) => { setFromDate(d); }}
          onToChange={(d) => { setToDate(d); }}
        />

        {/* Content */}
        {!rangeValid ? (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Text style={{ fontSize: 32 }}>📅</Text>
            <Text style={{ color: "#9ca3af", fontSize: 14 }}>
              Enter a valid date range above
            </Text>
          </View>
        ) : transactions.length === 0 ? (
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
              No transactions found
            </Text>
            <Text style={{ color: "#d1d5db", fontSize: 13 }}>
              Try selecting a wider date range
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 32 }}>
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
                    {formatDisplayDate(day).toUpperCase()}
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
                            {t.reference_number && (
                              <View
                                style={{
                                  backgroundColor: "#fffbeb",
                                  borderRadius: 6,
                                  paddingHorizontal: 8,
                                  paddingVertical: 2,
                                  borderWidth: 1,
                                  borderColor: "#fde68a",
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: 11,
                                    color: "#92400e",
                                    fontWeight: "600",
                                  }}
                                  numberOfLines={1}
                                >
                                  🔖 {t.reference_number}
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
    </KeyboardAvoidingView>
  );
}