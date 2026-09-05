// app/(tabs)/dashboard.tsx
import db from "@/services/db";
import { expenseService } from "@/services/expenseService";
import { paymentTypeService } from "@/services/paymentTypeService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Button,
  Dialog,
  Divider,
  IconButton,
  Portal,
  Text,
  TextInput,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { File, Paths } from "expo-file-system/next";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SummaryRow {
  total_revenue: number;
  total_qty: number;
  total_transactions: number;
}

interface TopItem {
  name: string;
  total_qty: number;
  total_revenue: number;
}

interface PaymentBreakdown {
  payment_name: string;
  count: number;
  total: number;
}

interface DailyRow {
  day: string;
  revenue: number;
}

interface PaymentType {
  id: number;
  name: string;
  requires_reference: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function currency(n: number) {
  return "₱" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function pct(part: number, total: number): number {
  if (!total) return 0;
  return (part / total) * 100;
}

function pctLabel(part: number, total: number): string {
  return pct(part, total).toFixed(1) + "%";
}

function toDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayString(): string {
  return toDateString(new Date());
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  return `${months[m - 1]} ${d}, ${y}`;
}

// ── Mini Stat Box (Grid item) ────────────────────────────────────────────────
function StatTile({
  label,
  value,
  accent,
  sub,
}: {
  label: string;
  value: string;
  accent: string;
  sub?: string;
}) {
  return (
    <View style={[styles.statTile, { borderLeftColor: accent }]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function BarChart({ data }: { data: DailyRow[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);

  if (!data.length) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 20 }}>
        <Text style={{ color: "#9ca3af", fontSize: 13 }}>No sales data</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.chartRow}>
        {data.map((d, i) => {
          const h = Math.max(6, (d.revenue / max) * 90);
          return (
            <View key={i} style={{ alignItems: "center", gap: 3 }}>
              <Text style={{ fontSize: 9, color: "#6b7280", fontWeight: "600" }}>
                {currency(d.revenue)}
              </Text>
              <View
                style={{
                  width: 32,
                  height: h,
                  backgroundColor: "#16a34a",
                  borderRadius: 6,
                  opacity: 0.85 + 0.15 * (i / data.length),
                }}
              />
              <Text style={{ fontSize: 10, color: "#6b7280" }}>{d.day.slice(5)}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
function DashboardCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
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
    <DashboardCard style={{ padding: 12 }}>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <TouchableOpacity
          onPress={() => setShowFromPicker(true)}
          style={styles.datePickerBtn}
        >
          <Text style={styles.datePickerTag}>FROM</Text>
          <Text style={styles.datePickerText}>{formatDateLabel(fromDate)}</Text>
        </TouchableOpacity>

        <Text style={{ color: "#9ca3af", fontWeight: "700", fontSize: 14 }}>→</Text>

        <TouchableOpacity
          onPress={() => setShowToPicker(true)}
          style={styles.datePickerBtn}
        >
          <Text style={styles.datePickerTag}>TO</Text>
          <Text style={styles.datePickerText}>{formatDateLabel(toDate)}</Text>
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
    </DashboardCard>
  );
}

function dateRangeFilter(fromDate: string, toDate: string): string {
  return `date(t.date) BETWEEN '${fromDate}' AND '${toDate}'`;
}

// ─────────────────────────────────────────────────────────────────────────────
const PIN_KEY = "app_dashboard_pin";

function exportAllTables() {
  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    categories: db.getAllSync("SELECT * FROM categories"),
    subcategories: db.getAllSync("SELECT * FROM subcategories"),
    items: db.getAllSync("SELECT * FROM items"),
    payment_types: db.getAllSync("SELECT * FROM payment_types"),
    transactions: db.getAllSync("SELECT * FROM transactions"),
    transaction_items: db.getAllSync("SELECT * FROM transaction_items"),
    expenses: db.getAllSync("SELECT * FROM expenses"),
  };
}

function importAllTables(data: ReturnType<typeof exportAllTables>) {
  db.execSync("PRAGMA foreign_keys = OFF;");
  try {
    db.execSync(`
      DELETE FROM transaction_items;
      DELETE FROM transactions;
      DELETE FROM items;
      DELETE FROM subcategories;
      DELETE FROM categories;
      DELETE FROM payment_types;
      DELETE FROM expenses;
    `);

    for (const c of data.categories as any[]) {
      db.runSync("INSERT INTO categories (id, name, color) VALUES (?, ?, ?)", [
        c.id,
        c.name,
        c.color ?? "#16a34a",
      ]);
    }
    for (const s of data.subcategories as any[]) {
      db.runSync(
        "INSERT INTO subcategories (id, category_id, name, color) VALUES (?, ?, ?, ?)",
        [s.id, s.category_id, s.name, s.color ?? "#2563eb"]
      );
    }
    for (const i of data.items as any[]) {
      db.runSync(
        "INSERT INTO items (id, category_id, subcategory_id, name, color) VALUES (?, ?, ?, ?, ?)",
        [i.id, i.category_id, i.subcategory_id, i.name, i.color ?? "#f0fdf4"]
      );
    }
    for (const pt of data.payment_types as any[]) {
      db.runSync(
        "INSERT INTO payment_types (id, name, requires_reference) VALUES (?, ?, ?)",
        [pt.id, pt.name, pt.requires_reference ?? 0]
      );
    }
    for (const t of data.transactions as any[]) {
      db.runSync(
        "INSERT INTO transactions (id, payment_type_id, reference_number, date, total_qty, total_price) VALUES (?, ?, ?, ?, ?, ?)",
        [t.id, t.payment_type_id, t.reference_number, t.date, t.total_qty, t.total_price]
      );
    }
    for (const ti of data.transaction_items as any[]) {
      db.runSync(
        "INSERT INTO transaction_items (id, transaction_id, item_id, item_name, price, qty, total) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [ti.id, ti.transaction_id, ti.item_id, ti.item_name ?? null, ti.price, ti.qty, ti.total]
      );
    }
    for (const e of data.expenses as any[]) {
      db.runSync(
        "INSERT INTO expenses (id, date, description, amount) VALUES (?, ?, ?, ?)",
        [e.id, e.date, e.description, e.amount]
      );
    }
  } finally {
    db.execSync("PRAGMA foreign_keys = ON;");
  }
}

export default function DashboardScreen() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isWide = width >= 760;

  const today = todayString();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const [summary, setSummary] = useState<SummaryRow>({
    total_revenue: 0,
    total_qty: 0,
    total_transactions: 0,
  });
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRow[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);

  // Payment type modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaymentName, setNewPaymentName] = useState("");
  const [newPaymentRequiresRef, setNewPaymentRequiresRef] = useState(false);

  // Loading states
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const loadData = useCallback(() => {
    const f = dateRangeFilter(fromDate, toDate);

    const s = db.getFirstSync<SummaryRow>(`
      SELECT
        COALESCE(SUM(t.total_price), 0) AS total_revenue,
        COALESCE(SUM(t.total_qty), 0)   AS total_qty,
        COUNT(t.id)                     AS total_transactions
      FROM transactions t
      WHERE ${f}
    `);
    if (s) setSummary(s);

    const expenses = expenseService.getTotalByDateRange(fromDate, toDate);
    setTotalExpenses(expenses);

    const items = db.getAllSync<TopItem>(`
      SELECT
        COALESCE(ti.item_name, i.name, 'Item') AS name,
        SUM(ti.qty)   AS total_qty,
        SUM(ti.total) AS total_revenue
      FROM transaction_items ti
      JOIN transactions t ON t.id = ti.transaction_id
      LEFT JOIN items i   ON i.id = ti.item_id
      WHERE ${f}
      GROUP BY COALESCE(ti.item_name, i.name, ti.item_id)
      ORDER BY total_revenue DESC
      LIMIT 6
    `);
    setTopItems(items);

    const payments = db.getAllSync<PaymentBreakdown>(`
      SELECT
        COALESCE(pt.name, 'Unknown') AS payment_name,
        COUNT(t.id)                  AS count,
        SUM(t.total_price)           AS total
      FROM transactions t
      LEFT JOIN payment_types pt ON pt.id = t.payment_type_id
      WHERE ${f}
      GROUP BY t.payment_type_id
      ORDER BY total DESC
    `);
    setPaymentBreakdown(payments);

    const daily = db.getAllSync<DailyRow>(`
      SELECT
        date(t.date) AS day,
        SUM(t.total_price) AS revenue
      FROM transactions t
      WHERE ${f}
      GROUP BY day
      ORDER BY day ASC
    `);
    setDailyRevenue(daily);

    const pts = db.getAllSync<PaymentType>(
      `SELECT id, name, requires_reference FROM payment_types ORDER BY name`
    );
    setPaymentTypes(pts);
  }, [fromDate, toDate]);

  useFocusEffect(loadData);

  const handleAddPaymentType = () => {
    const trimmed = newPaymentName.trim();
    if (!trimmed) return;
    paymentTypeService.create({
      name: trimmed,
      requires_reference: newPaymentRequiresRef,
    });
    setNewPaymentName("");
    setNewPaymentRequiresRef(false);
    setShowPaymentModal(false);
    loadData();
  };

  const handleDeletePaymentType = (id: number, name: string) => {
    Alert.alert("Delete Payment Type", `Delete "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          db.runSync(`DELETE FROM payment_types WHERE id = ?`, [id]);
          loadData();
        },
      },
    ]);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const data = exportAllTables();
      const json = JSON.stringify(data, null, 2);
      const filename = `pos_backup_${todayString()}.json`;
      const file = new File(Paths.cache, filename);
      file.create();
      file.write(json);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: "Export POS Data Backup",
        });
      } else {
        Alert.alert("Exported", `Saved to ${file.uri}`);
      }
    } catch (e) {
      Alert.alert("Export Failed", String(e));
    } finally {
      setExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/json", "*/*"],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;

      Alert.alert(
        "Restore Data",
        "This will replace all current data with the backup. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Restore",
            style: "destructive",
            onPress: async () => {
              setImporting(true);
              try {
                const picked = new File(res.assets[0].uri);
                const text = await picked.text();
                const parsed = JSON.parse(text);
                importAllTables(parsed);
                loadData();
                Alert.alert("Success", "Data restored successfully!");
              } catch (e) {
                Alert.alert("Import Failed", String(e));
              } finally {
                setImporting(false);
              }
            },
          },
        ]
      );
    } catch (e) {
      Alert.alert("Import Failed", String(e));
    }
  };

  const profit = summary.total_revenue - totalExpenses;
  const profitColor = profit >= 0 ? "#16a34a" : "#dc2626";

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── RESPONSIVE TABLET GRID LAYOUT (2-col landscape/wide, 1-col portrait/compact) ── */}
        <View style={[styles.gridColumns, { flexDirection: isWide ? "row" : "column" }]}>
          {/* ── LEFT COLUMN ────────────────────────────────────────────── */}
          <View style={styles.column}>
            {/* Date Filter */}
            <DateRangeFilter
              fromDate={fromDate}
              toDate={toDate}
              onFromChange={setFromDate}
              onToChange={setToDate}
            />

            {/* 2x2 Metric Cards Grid */}
            <View style={styles.metricsGrid}>
              <StatTile
                label="REVENUE"
                value={currency(summary.total_revenue)}
                accent="#16a34a"
              />
              <StatTile
                label="ORDERS"
                value={String(summary.total_transactions)}
                accent="#0284c7"
              />
              <StatTile
                label="EXPENSES"
                value={currency(totalExpenses)}
                accent="#dc2626"
              />
              <StatTile
                label="NET PROFIT"
                value={currency(profit)}
                accent={profitColor}
              />
            </View>

            {/* Revenue Chart */}
            <DashboardCard>
              <SectionHeader title="Sales by Day" />
              <BarChart data={dailyRevenue} />
            </DashboardCard>

            {/* Top Items */}
            <DashboardCard>
              <SectionHeader title="Top Items" />
              {topItems.length === 0 ? (
                <Text style={styles.emptyNote}>No sales in this date range</Text>
              ) : (
                topItems.map((item, i) => (
                  <View key={i}>
                    <View style={styles.topItemRow}>
                      <View
                        style={[
                          styles.rankBadge,
                          { backgroundColor: i < 3 ? "#16a34a" : "#e5e7eb" },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "bold",
                            color: i < 3 ? "white" : "#6b7280",
                          }}
                        >
                          {i + 1}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.topItemNameRow}>
                          <Text style={styles.topItemName}>{item.name}</Text>
                          <Text style={styles.topItemRevenue}>
                            {currency(item.total_revenue)}
                          </Text>
                        </View>
                        <View style={styles.topItemBarTrack}>
                          <View
                            style={[
                              styles.topItemBarFill,
                              {
                                width: `${pct(
                                  item.total_revenue,
                                  topItems[0]?.total_revenue ?? 1
                                )}%`,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.topItemQty}>{item.total_qty} sold</Text>
                      </View>
                    </View>
                    {i < topItems.length - 1 && <Divider />}
                  </View>
                ))
              )}
            </DashboardCard>
          </View>

          {/* ── RIGHT COLUMN ───────────────────────────────────────────── */}
          <View style={styles.column}>
            {/* Payment Methods Breakdown */}
            <DashboardCard>
              <SectionHeader title="Payment Breakdown" />
              {paymentBreakdown.length === 0 ? (
                <Text style={styles.emptyNote}>No transactions recorded</Text>
              ) : (
                paymentBreakdown.map((p, i) => (
                  <View key={i}>
                    <View style={styles.paymentRow}>
                      <View>
                        <Text style={styles.paymentName}>{p.payment_name}</Text>
                        <Text style={styles.paymentCount}>
                          {p.count} order{p.count !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={styles.paymentTotal}>{currency(p.total)}</Text>
                        <Text style={styles.paymentPct}>
                          {pctLabel(p.total, summary.total_revenue)}
                        </Text>
                      </View>
                    </View>
                    {i < paymentBreakdown.length - 1 && <Divider />}
                  </View>
                ))
              )}
            </DashboardCard>

            {/* Payment Types Management */}
            <DashboardCard>
              <SectionHeader
                title="Payment Types"
                action={
                  <Button
                    compact
                    mode="contained"
                    buttonColor="#16a34a"
                    onPress={() => setShowPaymentModal(true)}
                    style={{ borderRadius: 6 }}
                  >
                    + Add
                  </Button>
                }
              />
              {paymentTypes.length === 0 ? (
                <Text style={styles.emptyNote}>No payment types added</Text>
              ) : (
                paymentTypes.map((pt, i) => (
                  <View key={pt.id}>
                    <View style={styles.ptRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.ptName}>{pt.name}</Text>
                        {pt.requires_reference ? (
                          <Text style={styles.ptRefBadge}>Ref No. Required</Text>
                        ) : null}
                      </View>
                      <IconButton
                        icon="trash-can-outline"
                        size={18}
                        iconColor="#ef4444"
                        onPress={() => handleDeletePaymentType(pt.id, pt.name)}
                        style={{ margin: 0 }}
                      />
                    </View>
                    {i < paymentTypes.length - 1 && <Divider />}
                  </View>
                ))
              )}
            </DashboardCard>

            {/* Quick Link: Expenses */}
            <DashboardCard>
              <TouchableOpacity
                onPress={() => router.push("/expenses")}
                style={styles.expensesBanner}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text style={{ fontSize: 22 }}>💸</Text>
                  <View>
                    <Text style={styles.expensesBannerTitle}>Expenses</Text>
                    <Text style={styles.expensesBannerSub}>
                      Total {currency(totalExpenses)} for this period
                    </Text>
                  </View>
                </View>
                <Text style={styles.expensesBannerArrow}>›</Text>
              </TouchableOpacity>
            </DashboardCard>

            {/* Data Management */}
            <DashboardCard>
              <SectionHeader title="Backup & Restore" />
              <View style={{ gap: 8 }}>
                <Button
                  mode="outlined"
                  icon="database-export"
                  textColor="#16a34a"
                  style={{ borderColor: "#16a34a", borderRadius: 8 }}
                  onPress={handleExportData}
                  loading={exporting}
                  disabled={exporting || importing}
                >
                  Backup Data
                </Button>
                <Button
                  mode="outlined"
                  icon="database-import"
                  textColor="#6b7280"
                  style={{ borderColor: "#d1d5db", borderRadius: 8 }}
                  onPress={handleImportData}
                  loading={importing}
                  disabled={exporting || importing}
                >
                  Restore Data
                </Button>
              </View>
            </DashboardCard>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add Payment Type Modal */}
      <Portal>
        <Dialog
          visible={showPaymentModal}
          onDismiss={() => setShowPaymentModal(false)}
          style={{ width: 360, alignSelf: "center" }}
        >
          <Dialog.Title style={{ fontWeight: "bold", color: "#16a34a" }}>
            Add Payment Type
          </Dialog.Title>
          <Dialog.Content style={{ gap: 12 }}>
            <TextInput
              label="Name"
              value={newPaymentName}
              onChangeText={setNewPaymentName}
              mode="outlined"
              outlineColor="#d1fae5"
              activeOutlineColor="#16a34a"
              style={{ backgroundColor: "#ffffff" }}
            />
            <TouchableOpacity
              onPress={() => setNewPaymentRequiresRef(!newPaymentRequiresRef)}
              style={styles.checkboxRow}
            >
              <View
                style={[
                  styles.checkboxBox,
                  newPaymentRequiresRef && styles.checkboxBoxActive,
                ]}
              >
                {newPaymentRequiresRef && (
                  <Text style={{ color: "white", fontSize: 12, fontWeight: "bold" }}>✓</Text>
                )}
              </View>
              <Text style={{ fontSize: 13, color: "#374151" }}>Requires Reference Number</Text>
            </TouchableOpacity>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPaymentModal(false)} textColor="#6b7280">
              Cancel
            </Button>
            <Button mode="contained" buttonColor="#16a34a" onPress={handleAddPaymentType}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    padding: 14,
    gap: 12,
  },
  gridColumns: {
    flexDirection: "row",
    gap: 12,
  },
  column: {
    flex: 1,
    gap: 12,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statTile: {
    flexBasis: "48%",
    flexGrow: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 2,
  },
  statSub: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#374151",
    letterSpacing: 0.5,
  },
  datePickerBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#d1fae5",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f0fdf4",
  },
  datePickerTag: {
    fontSize: 9,
    color: "#9ca3af",
    fontWeight: "600",
  },
  datePickerText: {
    fontWeight: "700",
    color: "#15803d",
    fontSize: 13,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  emptyNote: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 10,
  },
  topItemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 8,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  topItemNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  topItemName: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 13,
  },
  topItemRevenue: {
    fontWeight: "700",
    color: "#16a34a",
    fontSize: 13,
  },
  topItemBarTrack: {
    height: 4,
    backgroundColor: "#f3f4f6",
    borderRadius: 2,
    marginTop: 4,
  },
  topItemBarFill: {
    height: 4,
    backgroundColor: "#16a34a",
    borderRadius: 2,
  },
  topItemQty: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    alignItems: "center",
  },
  paymentName: {
    fontWeight: "600",
    color: "#111827",
    fontSize: 13,
  },
  paymentCount: {
    fontSize: 11,
    color: "#6b7280",
  },
  paymentTotal: {
    fontWeight: "700",
    color: "#16a34a",
    fontSize: 13,
  },
  paymentPct: {
    fontSize: 11,
    color: "#6b7280",
  },
  ptRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  ptName: {
    fontWeight: "500",
    color: "#111827",
    fontSize: 14,
  },
  ptRefBadge: {
    fontSize: 10,
    color: "#854d0e",
    fontWeight: "600",
  },
  expensesBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expensesBannerTitle: {
    fontWeight: "700",
    color: "#111827",
    fontSize: 14,
  },
  expensesBannerSub: {
    fontSize: 11,
    color: "#6b7280",
  },
  expensesBannerArrow: {
    fontSize: 18,
    color: "#dc2626",
    fontWeight: "bold",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#9ca3af",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxBoxActive: {
    backgroundColor: "#16a34a",
    borderColor: "#16a34a",
  },
});