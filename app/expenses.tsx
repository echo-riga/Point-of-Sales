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

// ── Date Range Filter (list filter bar) ──────────────────────────────────────
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
        <TouchableOpacity
          onPress={() => setShowFromPicker(true)}
          style={{
            flex: 1,
            borderWidth: 1.5,
            borderColor: "#fecaca",
            borderRadius: 10,
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: "#fef2f2",
          }}
        >
          <Text style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>FROM</Text>
          <Text style={{ fontWeight: "700", color: "#dc2626", fontSize: 14 }}>
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
            paddingVertical: 10,
            paddingHorizontal: 12,
            backgroundColor: "#fef2f2",
          }}
        >
          <Text style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>TO</Text>
          <Text style={{ fontWeight: "700", color: "#dc2626", fontSize: 14 }}>
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
      Alert.alert("Validation", "Description is required.");
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Validation", "Enter a valid amount greater than 0.");
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
      ],
    );
  };

  const isFormValid =
    formDescription.trim().length > 0 &&
    parseFloat(formAmount) > 0 &&
    isValidDate(formDate);

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      {/* Summary bar */}
      <View
        style={{
          backgroundColor: "#dc2626",
          paddingHorizontal: 20,
          paddingVertical: 16,
          alignItems: "center",
          gap: 2,
        }}
      >
        <Text style={{ color: "#fecaca", fontSize: 11, letterSpacing: 1 }}>
          TOTAL EXPENSES
        </Text>
        <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
          {currency(totalFiltered)}
        </Text>
        <Text style={{ color: "#fca5a5", fontSize: 12 }}>
          {expenses.length} record{expenses.length !== 1 ? "s" : ""}
          {rangeValid
            ? `  ·  ${formatDisplayDate(fromDate)} – ${formatDisplayDate(toDate)}`
            : ""}
        </Text>
      </View>

      {/* Date Range Filter */}
      <DateRangeFilter
        fromDate={fromDate}
        toDate={toDate}
        onFromChange={setFromDate}
        onToChange={setToDate}
      />

      {/* Content */}
      {!rangeValid ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 32 }}>📅</Text>
          <Text style={{ color: "#9ca3af", fontSize: 14 }}>Enter a valid date range above</Text>
        </View>
      ) : expenses.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 40 }}>💸</Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#9ca3af" }}>No expenses found</Text>
          <Text style={{ color: "#d1d5db", fontSize: 13, textAlign: "center", paddingHorizontal: 32 }}>
            Tap + to log an expense, or adjust the date range
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 20, paddingBottom: 100 }}>
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
                    borderRadius: 14,
                    overflow: "hidden",
                    elevation: 2,
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
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
                          paddingVertical: 14,
                          gap: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 21,
                            backgroundColor: "#fef2f2",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 18 }}>💸</Text>
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            style={{ fontWeight: "600", color: "#111827", fontSize: 15 }}
                            numberOfLines={1}
                          >
                            {expense.description}
                          </Text>
                          <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                            #{expense.id}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end", flexDirection: "row", gap: 4 }}>
                          <Text
                            style={{ fontWeight: "bold", color: "#dc2626", fontSize: 16, alignSelf: "center" }}
                          >
                            {currency(expense.amount)}
                          </Text>
                          <IconButton
                            icon="pencil-outline"
                            size={18}
                            iconColor="#6b7280"
                            onPress={() => openEdit(expense)}
                            style={{ margin: 0 }}
                          />
                          <IconButton
                            icon="trash-can-outline"
                            size={18}
                            iconColor="#ef4444"
                            onPress={() => handleDelete(expense)}
                            style={{ margin: 0 }}
                          />
                        </View>
                      </View>
                      {i < grouped[day].length - 1 && <Divider style={{ marginLeft: 70 }} />}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        label="Add Expense"
        style={{
          position: "absolute",
          right: 16,
          bottom: 24,
          backgroundColor: "#dc2626",
          borderRadius: 16,
        }}
        color="white"
        onPress={openAdd}
      />

      {/* Add / Edit Modal */}
      <Portal>
        <Dialog
          visible={modalVisible}
          onDismiss={closeModal}
          style={{ width: 360, alignSelf: "center" }}
        >
          {/* Compact header row with date picker inline */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 4,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#dc2626" }}>
              {editTarget ? "Edit Expense" : "Add Expense"}
            </Text>
            <FormDateField value={formDate} onChange={setFormDate} />
          </View>

          <Dialog.Content style={{ gap: 8, paddingTop: 8 }}>
            {/* Description */}
            <View
              style={{
                borderWidth: 1.5,
                borderColor: formDescription.trim() ? "#fca5a5" : "#fecaca",
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: "white",
              }}
            >
              <Text style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 1, marginBottom: 2 }}>
                DESCRIPTION
              </Text>
              <RNTextInput
                value={formDescription}
                onChangeText={setFormDescription}
                placeholder="e.g. Ink cartridge, Electricity bill"
                placeholderTextColor="#d1d5db"
                autoFocus={!editTarget}
                style={{ fontSize: 15, color: "#111827", padding: 0, margin: 0 }}
              />
            </View>

            {/* Amount display */}
            <View
              style={{
                borderWidth: 1.5,
                borderColor: "#fecaca",
                borderRadius: 8,
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: "#fef2f2",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View>
                <Text style={{ fontSize: 10, color: "#9ca3af", letterSpacing: 1 }}>AMOUNT</Text>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    color: formAmount ? "#b91c1c" : "#fca5a5",
                    marginTop: 1,
                  }}
                >
                  ₱{formAmount === "" ? "0.00" : parseFloat(formAmount || "0").toFixed(2)}
                </Text>
              </View>
              {formAmount !== "" && (
                <TouchableOpacity
                  onPress={() => setFormAmount("")}
                  style={{
                    backgroundColor: "#fecaca",
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text style={{ fontSize: 12, color: "#dc2626", fontWeight: "600" }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Built-in numpad */}
            <AmountNumpad value={formAmount} onChange={setFormAmount} />
          </Dialog.Content>

          <Dialog.Actions style={{ paddingTop: 4, paddingBottom: 12 }}>
            <Button onPress={closeModal} textColor="#6b7280">Cancel</Button>
            <Button
              mode="contained"
              buttonColor="#dc2626"
              disabled={!isFormValid}
              onPress={handleSave}
            >
              {editTarget ? "Save Changes" : "Add"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}