// app/expenses.tsx
import { expenseService, ExpenseRow } from "@/services/expenseService";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  Dialog,
  Divider,
  FAB,
  IconButton,
  Portal,
  Text,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";

// ── Helpers ───────────────────────────────────────────────────────────────────
function currency(n: number) {
  return "₱" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
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

function groupByDate(expenses: ExpenseRow[]): Record<string, ExpenseRow[]> {
  const groups: Record<string, ExpenseRow[]> = {};
  for (const e of expenses) {
    if (!groups[e.date]) groups[e.date] = [];
    groups[e.date].push(e);
  }
  return groups;
}

// ── Red Numpad ────────────────────────────────────────────────────────────────
function AmountNumpad({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
  isPrice?: boolean;
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

  const FAST_AMOUNTS = [20, 50, 100, 200, 500];

  return (
    <View style={{ gap: 6 }}>
      {/* Quick-select amounts */}
      <View style={{ flexDirection: "row", gap: 5 }}>
        {FAST_AMOUNTS.map((amt) => (
          <TouchableOpacity
            key={amt}
            onPress={() => onChange(amt.toString())}
            style={{
              flex: 1,
              paddingVertical: 6,
              alignItems: "center",
              borderRadius: 8,
              backgroundColor: value === amt.toString() ? "#dc2626" : "#fef2f2",
              borderWidth: 1,
              borderColor: "#dc2626",
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: value === amt.toString() ? "white" : "#dc2626",
              }}
            >
              ₱{amt}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Number grid */}
      <View
        style={{
          borderRadius: 10,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#fecaca",
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
              borderTopColor: "#fecaca",
            }}
          >
            {row.map((key, ki) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleKey(key)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    key === "⌫"
                      ? "#fef2f2"
                      : ki % 2 === 0
                      ? "#fff5f5"
                      : "#fffafa",
                  borderLeftWidth: ki === 0 ? 0 : 1,
                  borderLeftColor: "#fecaca",
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    color: key === "⌫" ? "#ef4444" : "#b91c1c",
                  }}
                >
                  {key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Date Range Filter ────────────────────────────────────────────────────────
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
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
      }}
    >
      <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => setShowFromPicker(true)}
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: "#fecaca",
            borderRadius: 10,
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: "#fef2f2",
          }}
        >
          <Text style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>FROM</Text>
          <Text style={{ fontWeight: "700", color: "#dc2626", fontSize: 13 }}>
            {formatDateLabel(fromDate)}
          </Text>
        </TouchableOpacity>

        <Text style={{ color: "#9ca3af", fontWeight: "700", fontSize: 16 }}>→</Text>

        <TouchableOpacity
          onPress={() => setShowToPicker(true)}
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: "#fecaca",
            borderRadius: 10,
            paddingVertical: 8,
            paddingHorizontal: 12,
            backgroundColor: "#fef2f2",
          }}
        >
          <Text style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>TO</Text>
          <Text style={{ fontWeight: "700", color: "#dc2626", fontSize: 13 }}>
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

// ── Form Date Button (inside dialog) ─────────────────────────────────────────
function FormDateField({
  value,
  onChange,
}: {
  value: string;
  onChange: (d: string) => void;
}) {
  const [show, setShow] = useState(false);
  const dateObj = new Date(value + "T00:00:00");

  return (
    <>
      <TouchableOpacity
        onPress={() => setShow(true)}
        style={{
          borderWidth: 1.5,
          borderColor: "#fecaca",
          borderRadius: 8,
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: "#fef2f2",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View>
          <Text style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 1 }}>DATE</Text>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#b91c1c", marginTop: 1 }}>
            {formatDateLabel(value)}
          </Text>
        </View>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={dateObj}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(_, selected) => {
            setShow(false);
            if (selected) onChange(toDateString(selected));
          }}
        />
      )}
    </>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ExpensesScreen() {
  const today = todayString();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<ExpenseRow | null>(null);
  const [formDate, setFormDate] = useState(today);
  const [formDescription, setFormDescription] = useState("");
  const [formAmount, setFormAmount] = useState("");

  const rangeValid =
    isValidDate(fromDate) && isValidDate(toDate) && fromDate <= toDate;

  const load = useCallback(() => {
    if (!rangeValid) return;
    setExpenses(expenseService.getByDateRange(fromDate, toDate));
  }, [fromDate, toDate, rangeValid]);

  useFocusEffect(load);

  const grouped = groupByDate(expenses);
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const totalFiltered = expenses.reduce((s, e) => s + e.amount, 0);

  const openAdd = () => {
    setEditTarget(null);
    setFormDate(today);
    setFormDescription("");
    setFormAmount("");
    setModalVisible(true);
  };

  const openEdit = (expense: ExpenseRow) => {
    setEditTarget(expense);
    setFormDate(expense.date);
    setFormDescription(expense.description);
    setFormAmount(String(expense.amount));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditTarget(null);
    setFormDate(today);
    setFormDescription("");
    setFormAmount("");
  };

  const handleSave = () => {
    const amount = parseFloat(formAmount);
    if (!formDescription.trim()) {
      Alert.alert("Notice", "Description is required.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Notice", "Enter a valid amount.");
      return;
    }
    if (editTarget) {
      expenseService.update(editTarget.id, {
        date: formDate,
        description: formDescription,
        amount,
      });
    } else {
      expenseService.create({
        date: formDate,
        description: formDescription,
        amount,
      });
    }
    load();
    closeModal();
  };

  const handleDelete = (expense: ExpenseRow) => {
    Alert.alert(
      "Delete Expense",
      `Delete "${expense.description}" (${currency(expense.amount)})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            expenseService.delete(expense.id);
            load();
          },
        },
      ]
    );
  };

  const isFormValid =
    formDescription.trim().length > 0 &&
    parseFloat(formAmount) > 0 &&
    isValidDate(formDate);

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <View style={{ maxWidth: 900, width: "100%", alignSelf: "center", flex: 1 }}>
        {/* Date Range Filter */}
        <DateRangeFilter
          fromDate={fromDate}
          toDate={toDate}
          onFromChange={setFromDate}
          onToChange={setToDate}
        />

        {/* Subtle count & total row */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: 4,
          }}
        >
          <Text style={{ fontSize: 13, color: "#6b7280", fontWeight: "600" }}>
            {expenses.length} {expenses.length === 1 ? "expense" : "expenses"}
          </Text>
          <Text style={{ fontSize: 13, color: "#dc2626", fontWeight: "700" }}>
            Total: {currency(totalFiltered)}
          </Text>
        </View>

        {/* Content */}
        {!rangeValid ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 32 }}>📅</Text>
            <Text style={{ color: "#9ca3af", fontSize: 14 }}>Enter a valid date range</Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 8 }}>
            <Text style={{ fontSize: 40 }}>💸</Text>
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#9ca3af" }}>No expenses found</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 100 }}>
          {days.map((day) => {
            const dayTotal = grouped[day].reduce((s, e) => s + e.amount, 0);
            return (
              <View key={day} style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#6b7280", letterSpacing: 0.5 }}>
                    {formatDisplayDate(day).toUpperCase()}
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: "#e5e7eb" }} />
                  <Text style={{ fontSize: 12, color: "#dc2626", fontWeight: "600" }}>
                    {currency(dayTotal)}
                  </Text>
                </View>

                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 12,
                    overflow: "hidden",
                    elevation: 1,
                    shadowColor: "#000",
                    shadowOpacity: 0.04,
                    shadowRadius: 4,
                  }}
                >
                  {grouped[day].map((expense, i) => (
                    <View key={expense.id}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          gap: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: "#fef2f2",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 16 }}>💸</Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: "600", color: "#111827", fontSize: 14 }}>
                            {expense.description}
                          </Text>
                          <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>
                            {formatDisplayDate(expense.date)}
                          </Text>
                        </View>

                        <Text style={{ fontWeight: "bold", color: "#dc2626", fontSize: 15 }}>
                          {currency(expense.amount)}
                        </Text>

                        <View style={{ flexDirection: "row", gap: 2 }}>
                          <IconButton
                            icon="pencil-outline"
                            size={18}
                            iconColor="#6b7280"
                            onPress={() => openEdit(expense)}
                          />
                          <IconButton
                            icon="trash-can-outline"
                            size={18}
                            iconColor="#ef4444"
                            onPress={() => handleDelete(expense)}
                          />
                        </View>
                      </View>
                      {i < grouped[day].length - 1 && <Divider style={{ marginLeft: 64 }} />}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
      </View>

      {/* FAB at Bottom Right */}
      <FAB
        icon="plus"
        label="Add Expense"
        color="#ffffff"
        style={{
          position: "absolute",
          bottom: 24,
          right: 24,
          backgroundColor: "#dc2626",
          borderRadius: 28,
        }}
        onPress={openAdd}
      />

      {/* Add / Edit Expense Dialog */}
      <Portal>
        <Dialog
          visible={modalVisible}
          onDismiss={closeModal}
          style={{ width: 380, alignSelf: "center" }}
        >
          <Dialog.Title style={{ fontWeight: "bold", color: "#dc2626" }}>
            {editTarget ? "Edit Expense" : "New Expense"}
          </Dialog.Title>
          <Dialog.Content style={{ gap: 10 }}>
            <FormDateField value={formDate} onChange={setFormDate} />

            <RNTextInput
              placeholder="Expense Description"
              value={formDescription}
              onChangeText={setFormDescription}
              style={{
                borderWidth: 1,
                borderColor: "#d1d5db",
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 14,
                backgroundColor: "#ffffff",
              }}
            />

            <View
              style={{
                borderWidth: 1.5,
                borderColor: "#fecaca",
                borderRadius: 8,
                padding: 10,
                backgroundColor: "#fef2f2",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 1 }}>AMOUNT</Text>
              <Text style={{ fontSize: 24, fontWeight: "bold", color: formAmount ? "#b91c1c" : "#9ca3af" }}>
                ₱{formAmount === "" ? "0.00" : parseFloat(formAmount).toFixed(2)}
              </Text>
            </View>

            <AmountNumpad value={formAmount} onChange={setFormAmount} isPrice />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={closeModal} textColor="#6b7280">
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor="#dc2626"
              disabled={!isFormValid}
              onPress={handleSave}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}