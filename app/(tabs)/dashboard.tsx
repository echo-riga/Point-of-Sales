// app/(tabs)/dashboard.tsx
import db from "@/services/db";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  TouchableOpacity,
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

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
        borderRadius: 14,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: accent ?? "#16a34a",
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          color: "#9ca3af",
          letterSpacing: 1,
          marginBottom: 4,
        }}
      >
        {label.toUpperCase()}
      </Text>
      <Text style={{ fontSize: 22, fontWeight: "bold", color: "#111827" }}>
        {value}
      </Text>
      {sub ? (
        <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
          {sub}
        </Text>
      ) : null}
    </View>
  );
}

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
function BarChart({ data }: { data: DailyRow[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const BAR_WIDTH = Math.max(
    20,
    Math.min(
      40,
      (Dimensions.get("window").width * 0.55) / (data.length || 1) - 6,
    ),
  );

  if (!data.length)
    return (
      <View style={{ alignItems: "center", paddingVertical: 24 }}>
        <Text style={{ color: "#9ca3af" }}>No data yet</Text>
      </View>
    );

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          gap: 6,
          paddingVertical: 8,
          paddingHorizontal: 4,
        }}
      >
        {data.map((d, i) => {
          const h = Math.max(4, (d.revenue / max) * 120);
          return (
            <View key={i} style={{ alignItems: "center", gap: 4 }}>
              <Text style={{ fontSize: 9, color: "#6b7280" }}>
                {currency(d.revenue)}
              </Text>
              <View
                style={{
                  width: BAR_WIDTH,
                  height: h,
                  backgroundColor: "#16a34a",
                  borderRadius: 6,
                  opacity: 0.85 + 0.15 * (i / data.length),
                }}
              />
              <Text style={{ fontSize: 10, color: "#6b7280" }}>
                {d.day.slice(5)}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "700",
          color: "#374151",
          letterSpacing: 0.5,
        }}
      >
        {title.toUpperCase()}
      </Text>
      {action}
    </View>
  );
}

// ── Card Wrapper ──────────────────────────────────────────────────────────────
function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 14,
        padding: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        ...style,
      }}
    >
      {children}
    </View>
  );
}

// ── Period Selector ───────────────────────────────────────────────────────────
type Period = "today" | "week" | "month" | "all";
const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "7 Days" },
  { key: "month", label: "30 Days" },
  { key: "all", label: "All Time" },
];

function periodFilter(period: Period): string {
  switch (period) {
    case "today":
      return `date(t.date) = date('now', 'localtime')`;
    case "week":
      return `date(t.date) >= date('now', '-6 days', 'localtime')`;
    case "month":
      return `date(t.date) >= date('now', '-29 days', 'localtime')`;
    default:
      return "1=1";
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const PIN_KEY = "app_dashboard_pin";

const SEED_DATA = [
  {
    category: "Xerox/Photocopy",
    subcategories: [
      { name: "Black & White", items: ["Short", "A4", "Long"] },
      { name: "Colored Text", items: ["Short", "A4", "Long"] },
      { name: "Colored with Picture", items: ["Short", "A4", "Long"] },
      { name: "Colored Whole Page Picture", items: ["Short", "A4", "Long"] },
    ],
  },
  {
    category: "Print Documents Text",
    subcategories: [
      { name: "Black & White", items: ["Short", "A4", "Long"] },
      { name: "Partially Colored", items: ["Short", "A4", "Long"] },
      { name: "Full Colored", items: ["Short", "A4", "Long"] },
    ],
  },
  {
    category: "Print Documents Text Picture",
    subcategories: [
      { name: "Black & White", items: ["Short", "A4", "Long"] },
      { name: "Partially Colored", items: ["Short", "A4", "Long"] },
      { name: "Full Colored", items: ["Short", "A4", "Long"] },
    ],
  },
  {
    category: "Typing Job",
    subcategories: [
      { name: "Full Text", items: ["Short", "A4", "Long"] },
      { name: "Text with Picture", items: ["Short", "A4", "Long"] },
      { name: "Formal or Canva Resume", items: ["Short", "A4", "Long"] },
    ],
  },
  {
    category: "Laminate",
    subcategories: [
      {
        name: "Hot & Cold",
        items: [
          "ID",
          "ATM",
          "2R/Wallet",
          "3R/B7",
          "4R/A6",
          "5R/B6",
          "6R",
          "8R/Short",
          "A5",
          "A4",
          "Long",
        ],
      },
    ],
  },
  {
    category: "Stickers",
    subcategories: [
      {
        name: "Matte/Glossy Photopaper",
        items: [
          "A5 Custom",
          "A4 Custom",
          "A4 Custom Subject Sticker Name",
          "A5 Subject Sticker Plain",
          "A4 Subject Sticker Plain",
        ],
      },
      {
        name: "Vinyl Stickers",
        items: [
          "1in x 3in",
          "1in x 4in",
          "1in x 5in",
          "2in x 3in",
          "2in x 4in",
          "2in x 5in",
        ],
      },
    ],
  },
  {
    category: "Photo Printing",
    subcategories: [
      {
        name: "Glossy Photopaper",
        items: [
          "A4",
          "5R",
          "4R",
          "3R",
          "2R",
          "Miniwallet",
          "Wallet",
          "Cute Size",
          "Photo Strip 2.2 x 7in",
          "Photo Strip 2 x 6in",
          "Photo Grid 4 x 6in",
        ],
      },
      {
        name: "Printed",
        items: [
          "A4",
          "5R",
          "4R",
          "3R",
          "2R",
          "Miniwallet",
          "Wallet",
          "Cute Size",
          "Photo Strip 2.2 x 7in",
          "Photo Strip 2 x 6in",
          "Photo Grid 4 x 6in",
        ],
      },
    ],
  },
  {
    category: "Rush ID/ID Picture",
    subcategories: [
      {
        name: "For Photo Capture",
        items: [
          "2 x 2in",
          "1.5 x 1.5in",
          "1 x 1in",
          "Passport",
          "ASA ID",
          "Combo A",
          "Combo B",
          "Combo C",
          "Combo D",
        ],
      },
      {
        name: "Ready to Print",
        items: [
          "1 x 1in",
          "1.5 x 1.5in",
          "Passport",
          "2 x 2in",
          "ASA ID",
          "Combo A",
          "Combo B",
          "Combo C",
          "Combo D",
        ],
      },
      {
        name: "Provided by Client",
        items: [
          "2 x 2in",
          "1.5 x 1.5in",
          "1 x 1in",
          "Passport",
          "ASA ID",
          "Combo A",
          "Combo B",
          "Combo C",
          "Combo D",
        ],
      },
    ],
  },
  {
    category: "Invitation",
    subcategories: [{ name: "Glossy Photopaper", items: ["3R", "4R", "5R"] }],
  },
  {
    category: "Layout",
    subcategories: [
      { name: "Digital Invitation", items: ["Picture", "GIF", "MP4"] },
    ],
  },
  {
    category: "Customized Items",
    subcategories: [
      { name: "Keychain", items: ["Acrylic Small", "Acrylic Big", "PVC"] },
      {
        name: "Ref Magnet",
        items: ["ATM", "Face Cut Out", "Number Cut Out", "A6", "A5", "A4"],
      },
      {
        name: "Bookmarks",
        items: ["1 x 2.5in", "1.5 x 2.5in", "Laminated 2.25 x 6in"],
      },
      {
        name: "Notepad",
        items: ["3 x 3in", "3 x 4in", "4 x 4in", "4 x 5in", "A5"],
      },
      {
        name: "Nametags",
        items: ["Plain", "Customized", "7 x 2.5in", "ATM", "2 x 4in", "ID"],
      },
      {
        name: "Calling Card",
        items: [
          "Ordinary One Side",
          "Ordinary Back to Back",
          "Leather One Side",
          "Leather Back to Back",
        ],
      },
      {
        name: "Loyalty Card",
        items: [
          "ATM One Side",
          "ATM Back to Back",
          "Square One Side",
          "Square Back to Back",
        ],
      },
      { name: "Tracing Pad", items: ["70GSM", "100GSM"] },
      { name: "Laminated Tracing Pad", items: ["A5"] },
      {
        name: "Workbook",
        items: ["RingBind A5", "RingBind Letter", "Stapler A5"],
      },
      { name: "Laminated Workbook", items: ["A5", "Letter"] },
    ],
  },
];

const STANDALONE_ITEMS = ["Scan", "Ring Binding", "Tarpaulin"];

export default function DashboardScreen() {
  const [period, setPeriod] = useState<Period>("today");
  const [summary, setSummary] = useState<SummaryRow>({
    total_revenue: 0,
    total_qty: 0,
    total_transactions: 0,
  });
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState<PaymentBreakdown[]>(
    [],
  );
  const [dailyRevenue, setDailyRevenue] = useState<DailyRow[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);

  // Payment type modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [newPaymentName, setNewPaymentName] = useState("");
  const [inserting, setInserting] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleInsertArkziamData = () => {
    Alert.alert(
      "Insert Arkziam Data",
      "This will insert all categories, subcategories, and items. Duplicates may appear if run multiple times. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Insert",
          onPress: () => {
            setInserting(true);
            try {
              for (const entry of SEED_DATA) {
                const catResult = db.runSync(
                  "INSERT INTO categories (name) VALUES (?)",
                  [entry.category],
                );
                const catId = catResult.lastInsertRowId;
                for (const sub of entry.subcategories) {
                  const subResult = db.runSync(
                    "INSERT INTO subcategories (category_id, name) VALUES (?, ?)",
                    [catId, sub.name],
                  );
                  const subId = subResult.lastInsertRowId;
                  for (const item of sub.items) {
                    db.runSync(
                      "INSERT INTO items (category_id, subcategory_id, name) VALUES (?, ?, ?)",
                      [catId, subId, item],
                    );
                  }
                }
              }
              for (const item of STANDALONE_ITEMS) {
                db.runSync(
                  "INSERT INTO items (category_id, subcategory_id, name) VALUES (NULL, NULL, ?)",
                  [item],
                );
              }
              Alert.alert("Success", "Arkziam data inserted successfully!");
            } catch (e) {
              Alert.alert("Error", "Something went wrong: " + String(e));
            }
            setInserting(false);
          },
        },
      ],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear All Data",
      "This will permanently delete ALL transactions, items, categories, payment types, and your PIN. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear Everything",
          style: "destructive",
          onPress: async () => {
            setClearing(true);
            try {
              db.execSync(`
                DELETE FROM transaction_items;
                DELETE FROM transactions;
                DELETE FROM items;
                DELETE FROM subcategories;
                DELETE FROM categories;
                DELETE FROM payment_types;
              `);
              await AsyncStorage.removeItem(PIN_KEY);
              Alert.alert("Done", "All data has been cleared.");
              loadData();
            } catch (e) {
              Alert.alert("Error", "Something went wrong: " + String(e));
            }
            setClearing(false);
          },
        },
      ],
    );
  };

  const loadData = useCallback(() => {
    const f = periodFilter(period);

    // Summary
    const s = db.getFirstSync<SummaryRow>(`
      SELECT
        COALESCE(SUM(t.total_price), 0) AS total_revenue,
        COALESCE(SUM(t.total_qty), 0)   AS total_qty,
        COUNT(t.id)                      AS total_transactions
      FROM transactions t
      WHERE ${f}
    `);
    if (s) setSummary(s);

    // Top items
    const items = db.getAllSync<TopItem>(`
      SELECT
        i.name,
        SUM(ti.qty)   AS total_qty,
        SUM(ti.total) AS total_revenue
      FROM transaction_items ti
      JOIN transactions t ON t.id = ti.transaction_id
      JOIN items i        ON i.id = ti.item_id
      WHERE ${f}
      GROUP BY ti.item_id
      ORDER BY total_revenue DESC
      LIMIT 8
    `);
    setTopItems(items);

    // Payment breakdown
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

    // Daily revenue (last 14 days or filtered)
    const daily = db.getAllSync<DailyRow>(`
      SELECT
        date(t.date) AS day,
        SUM(t.total_price)        AS revenue
      FROM transactions t
      WHERE ${f}
      GROUP BY day
      ORDER BY day ASC
    `);
    setDailyRevenue(daily);

    // Payment types list
    const pts = db.getAllSync<PaymentType>(
      `SELECT id, name FROM payment_types ORDER BY name`,
    );
    setPaymentTypes(pts);
  }, [period]);

  useFocusEffect(loadData);

  // ── Payment Type Actions ────────────────────────────────────────────────────
  const handleAddPaymentType = () => {
    const trimmed = newPaymentName.trim();
    if (!trimmed) return;
    db.runSync(`INSERT INTO payment_types (name) VALUES (?)`, [trimmed]);
    setNewPaymentName("");
    loadData();
  };

  const handleDeletePaymentType = (id: number, name: string) => {
    Alert.alert(
      "Delete Payment Type",
      `Delete "${name}"? Existing transactions using it will show "Unknown".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            db.runSync(`DELETE FROM payment_types WHERE id = ?`, [id]);
            loadData();
          },
        },
      ],
    );
  };

  const avgOrder =
    summary.total_transactions > 0
      ? summary.total_revenue / summary.total_transactions
      : 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#f3f4f6" }}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        {/* Period Selector */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              onPress={() => setPeriod(p.key)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 10,
                alignItems: "center",
                backgroundColor: period === p.key ? "#16a34a" : "white",
                elevation: period === p.key ? 3 : 1,
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

        {/* Stat Cards */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          <StatCard
            label="Revenue"
            value={currency(summary.total_revenue)}
            accent="#16a34a"
          />
          <StatCard
            label="Orders"
            value={String(summary.total_transactions)}
            sub={`Avg ${currency(avgOrder)}`}
            accent="#0ea5e9"
          />
          <StatCard
            label="Items Sold"
            value={String(summary.total_qty)}
            accent="#f59e0b"
          />
        </View>

        {/* Revenue Chart */}
        <Card>
          <SectionHeader title="Revenue by Day" />
          <BarChart data={dailyRevenue} />
        </Card>

        {/* Top Items */}
        <Card>
          <SectionHeader title="Top Items" />
          {topItems.length === 0 ? (
            <Text
              style={{
                color: "#9ca3af",
                textAlign: "center",
                paddingVertical: 12,
              }}
            >
              No sales in this period
            </Text>
          ) : (
            topItems.map((item, i) => (
              <View key={i}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    gap: 10,
                  }}
                >
                  {/* Rank */}
                  <View
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 13,
                      backgroundColor: i < 3 ? "#16a34a" : "#e5e7eb",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
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

                  {/* Name + bar */}
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text style={{ fontWeight: "600", color: "#111827" }}>
                        {item.name}
                      </Text>
                      <Text style={{ fontWeight: "700", color: "#16a34a" }}>
                        {currency(item.total_revenue)}
                      </Text>
                    </View>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: "#f3f4f6",
                        borderRadius: 2,
                        marginTop: 4,
                      }}
                    >
                      <View
                        style={{
                          height: 4,
                          width: `${pct(item.total_revenue, topItems[0]?.total_revenue ?? 1)}%`,
                          backgroundColor: "#16a34a",
                          borderRadius: 2,
                          opacity: 0.7 + 0.3 * (1 - i / topItems.length),
                        }}
                      />
                    </View>
                    <Text
                      style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}
                    >
                      {item.total_qty} sold
                    </Text>
                  </View>
                </View>
                {i < topItems.length - 1 && <Divider />}
              </View>
            ))
          )}
        </Card>

        {/* Payment Breakdown */}
        <Card>
          <SectionHeader title="Payment Methods" />
          {paymentBreakdown.length === 0 ? (
            <Text
              style={{
                color: "#9ca3af",
                textAlign: "center",
                paddingVertical: 12,
              }}
            >
              No transactions yet
            </Text>
          ) : (
            paymentBreakdown.map((p, i) => (
              <View key={i}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text style={{ fontWeight: "600", color: "#111827" }}>
                      {p.payment_name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      {p.count} transaction{p.count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ fontWeight: "700", color: "#16a34a" }}>
                      {currency(p.total)}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                      {pctLabel(p.total, summary.total_revenue)} of total
                    </Text>
                  </View>
                </View>
                {i < paymentBreakdown.length - 1 && <Divider />}
              </View>
            ))
          )}
        </Card>

        {/* Payment Types Management */}
        <Card>
          <SectionHeader
            title="Payment Types"
            action={
              <TouchableOpacity
                onPress={() => setShowPaymentModal(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#f0fdf4",
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  gap: 4,
                  borderWidth: 1,
                  borderColor: "#16a34a",
                }}
              >
                <Text
                  style={{ color: "#16a34a", fontWeight: "700", fontSize: 13 }}
                >
                  + Add
                </Text>
              </TouchableOpacity>
            }
          />

          {paymentTypes.length === 0 ? (
            <Text
              style={{
                color: "#9ca3af",
                textAlign: "center",
                paddingVertical: 12,
              }}
            >
              No payment types yet. Add one!
            </Text>
          ) : (
            paymentTypes.map((pt, i) => (
              <View key={pt.id}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 8,
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "500",
                      color: "#111827",
                      fontSize: 15,
                    }}
                  >
                    {pt.name}
                  </Text>
                  <IconButton
                    icon="trash-can-outline"
                    size={20}
                    iconColor="#ef4444"
                    onPress={() => handleDeletePaymentType(pt.id, pt.name)}
                    style={{ margin: 0 }}
                  />
                </View>
                {i < paymentTypes.length - 1 && <Divider />}
              </View>
            ))
          )}
        </Card>

        {/* Data Management */}
        <Card>
          <SectionHeader title="Data Management" />

          <Button
            mode="contained"
            buttonColor="#16a34a"
            icon="database-import"
            onPress={handleInsertArkziamData}
            disabled={inserting || clearing}
            loading={inserting}
            style={{ borderRadius: 10, marginBottom: 10 }}
            contentStyle={{ paddingVertical: 4 }}
          >
            Insert Arkziam Data
          </Button>

          <Button
            mode="outlined"
            textColor="#ef4444"
            icon="delete-forever"
            onPress={handleClearData}
            disabled={inserting || clearing}
            loading={clearing}
            style={{ borderRadius: 10, borderColor: "#fca5a5" }}
            contentStyle={{ paddingVertical: 4 }}
          >
            Clear All Data
          </Button>

          <Text
            style={{
              fontSize: 11,
              color: "#9ca3af",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            Clear Data removes all transactions, items, categories, payment
            types, and PIN.
          </Text>
        </Card>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Add Payment Type Modal */}
      <Portal>
        <Dialog
          visible={showPaymentModal}
          onDismiss={() => {
            setShowPaymentModal(false);
            setNewPaymentName("");
          }}
          style={{ width: 340, alignSelf: "center" }}
        >
          <Dialog.Title style={{ color: "#15803d", fontWeight: "bold" }}>
            Add Payment Type
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Payment name"
              value={newPaymentName}
              onChangeText={setNewPaymentName}
              mode="outlined"
              outlineColor="#d1fae5"
              activeOutlineColor="#16a34a"
              placeholder="e.g. Cash, GCash, Card"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowPaymentModal(false);
                setNewPaymentName("");
              }}
              textColor="#6b7280"
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor="#16a34a"
              disabled={!newPaymentName.trim()}
              onPress={() => {
                handleAddPaymentType();
                setShowPaymentModal(false);
              }}
            >
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
