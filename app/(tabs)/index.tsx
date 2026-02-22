// app/(tabs)/index.tsx
import CartSidebar from "@/components/CartSideBar";
import { useCartStore } from "@/context/CartItem";
import { categoryService } from "@/services/categoryService";
import { itemService } from "@/services/itemService";
import { subcategoryService } from "@/services/subcategoryService";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { Button, Dialog, Divider, Portal, Text } from "react-native-paper";

interface Item {
  id: number;
  name: string;
  category_id: number | null;
  category_name: string | null;
  subcategory_id: number | null;
  subcategory_name: string | null;
}

interface Option {
  id: number;
  name: string;
}

// ── Numpad ────────────────────────────────────────────────────────────────────
function Numpad({
  value,
  onChange,
  isPrice,
}: {
  value: string;
  onChange: (v: string) => void;
  isPrice: boolean;
}) {
  const handleKey = (key: string) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
      return;
    }
    if (!isPrice) {
      // qty: integers only, no leading zeros
      if (key === ".") return;
      if (value === "0") {
        onChange(key);
        return;
      }
      onChange(value + key);
      return;
    }
    if (key === "." && value.includes(".")) return;
    if (value.includes(".") && value.split(".")[1]?.length >= 2) return;
    onChange(value + key);
  };

  const FAST_PRICE = [20, 50, 100, 200, 500];
  const FAST_QTY = [1, 2, 3, 5, 10];
  const fastValues = isPrice ? FAST_PRICE : FAST_QTY;

  return (
    <View style={{ gap: 8 }}>
      {/* Fast amounts */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {fastValues.map((amt) => (
          <TouchableOpacity
            key={amt}
            onPress={() => onChange(amt.toString())}
            style={{
              flex: 1,
              paddingVertical: 7,
              alignItems: "center",
              borderRadius: 8,
              backgroundColor: value === amt.toString() ? "#16a34a" : "#f0fdf4",
              borderWidth: 1,
              borderColor: "#16a34a",
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: value === amt.toString() ? "white" : "#16a34a",
              }}
            >
              {isPrice ? `₱${amt}` : `×${amt}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Numpad grid */}
      <View
        style={{
          borderRadius: 10,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "#d1fae5",
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
              borderTopColor: "#d1fae5",
            }}
          >
            {row.map((key, ki) => (
              <TouchableOpacity
                key={key}
                onPress={() => handleKey(key)}
                disabled={key === "." && !isPrice}
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor:
                    key === "⌫"
                      ? "#fef2f2"
                      : key === "." && !isPrice
                        ? "#e5e7eb"
                        : ki % 2 === 0
                          ? "#f0fdf4"
                          : "#f9fafb",
                  borderLeftWidth: ki === 0 ? 0 : 1,
                  borderLeftColor: "#d1fae5",
                }}
              >
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "600",
                    color:
                      key === "⌫"
                        ? "#ef4444"
                        : key === "." && !isPrice
                          ? "#9ca3af"
                          : "#15803d",
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
// ─────────────────────────────────────────────────────────────────────────────

export default function OrderScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [subcategories, setSubcategories] = useState<Option[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(
    null,
  );

  // modal
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [qty, setQty] = useState("1");
  const [price, setPrice] = useState("");
  const [activeInput, setActiveInput] = useState<"qty" | "price">("price");

  const addItem = useCartStore((s) => s.addItem);

  useFocusEffect(
    useCallback(() => {
      setItems(itemService.getAll() as Item[]);
      setCategories(categoryService.getAll() as Option[]);
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSubcategories([]);
    }, []),
  );

  const handleCategoryPress = (catId: number) => {
    if (selectedCategory === catId) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSubcategories([]);
      return;
    }
    setSelectedCategory(catId);
    setSelectedSubcategory(null);
    setSubcategories(subcategoryService.getByCategory(catId) as Option[]);
  };

  const handleSubcategoryPress = (subId: number) => {
    setSelectedSubcategory(selectedSubcategory === subId ? null : subId);
  };

  const handleItemPress = (item: Item) => {
    setSelectedItem(item);
    setQty("1");
    setPrice("");
    setActiveInput("price");
  };

  const handleAddToCart = () => {
    if (!selectedItem || !price) return;
    addItem(
      {
        id: selectedItem.id,
        name: selectedItem.name,
        category_name: selectedItem.category_name,
        subcategory_name: selectedItem.subcategory_name,
        price: parseFloat(price),
      },
      parseInt(qty) || 1,
    );
    setSelectedItem(null);
  };

  const noCategoyItems = items.filter((i) => !i.category_id);
  const itemsInSelectedCategoryNoSubcat = selectedCategory
    ? items.filter(
        (i) => i.category_id === selectedCategory && !i.subcategory_id,
      )
    : [];
  const itemsInSelectedSubcategory = selectedSubcategory
    ? items.filter((i) => i.subcategory_id === selectedSubcategory)
    : [];

  const renderItemCard = (item: Item) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => handleItemPress(item)}
      style={{
        backgroundColor: "#e8f5e9",
        borderRadius: 10,
        padding: 16,
        margin: 6,
        width: 120,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 80,
      }}
    >
      <Text
        variant="bodyMedium"
        style={{ textAlign: "center", fontWeight: "bold" }}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const renderBoxCard = (label: string, onPress: () => void, key: string) => (
    <TouchableOpacity
      key={key}
      onPress={onPress}
      style={{
        backgroundColor: "#16a34a",
        borderRadius: 10,
        padding: 16,
        margin: 6,
        width: 120,
        alignItems: "center",
        justifyContent: "center",
        minHeight: 80,
      }}
    >
      <Text
        variant="bodyMedium"
        style={{ textAlign: "center", color: "white", fontWeight: "bold" }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderGrid = () => {
    const cards: React.ReactNode[] = [];

    if (selectedSubcategory) {
      itemsInSelectedSubcategory.forEach((item) =>
        cards.push(renderItemCard(item)),
      );
    } else if (selectedCategory) {
      subcategories.forEach((sub) =>
        cards.push(
          renderBoxCard(
            sub.name,
            () => handleSubcategoryPress(sub.id),
            `sub-${sub.id}`,
          ),
        ),
      );
      itemsInSelectedCategoryNoSubcat.forEach((item) =>
        cards.push(renderItemCard(item)),
      );
    } else {
      categories.forEach((cat) =>
        cards.push(
          renderBoxCard(
            cat.name,
            () => handleCategoryPress(cat.id),
            `cat-${cat.id}`,
          ),
        ),
      );
      noCategoyItems.forEach((item) => cards.push(renderItemCard(item)));
    }

    return cards;
  };

  // Shared display box style
  const inputBox = (active: boolean) => ({
    backgroundColor: active ? "#f0fdf4" : "#f9fafb",
    borderWidth: 2,
    borderColor: active ? "#16a34a" : "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flex: 1,
  });

  return (
    <View style={{ flex: 1, flexDirection: "row" }}>
      {/* Left - Products */}
      <View style={{ flex: 2, padding: 16 }}>
        {/* Breadcrumb */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 12,
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
              setSubcategories([]);
            }}
          >
            <Text variant="bodyMedium" style={{ color: "#16a34a" }}>
              All
            </Text>
          </TouchableOpacity>
          {selectedCategory && (
            <>
              <Text variant="bodyMedium"> › </Text>
              <TouchableOpacity onPress={() => setSelectedSubcategory(null)}>
                <Text variant="bodyMedium" style={{ color: "#16a34a" }}>
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </Text>
              </TouchableOpacity>
            </>
          )}
          {selectedSubcategory && (
            <>
              <Text variant="bodyMedium"> › </Text>
              <Text variant="bodyMedium">
                {subcategories.find((s) => s.id === selectedSubcategory)?.name}
              </Text>
            </>
          )}
        </View>

        <Divider />

        <ScrollView
          contentContainerStyle={{
            flexDirection: "row",
            flexWrap: "wrap",
            paddingTop: 12,
          }}
        >
          {renderGrid()}
        </ScrollView>
      </View>

      {/* Right - Cart */}
      <CartSidebar />

      {/* Item Modal */}
      <Portal>
        <Dialog
          visible={!!selectedItem}
          onDismiss={() => setSelectedItem(null)}
          style={{
            alignSelf: "center",
            width: 380,
            position: "absolute",
            left: "50%",
            transform: [{ translateX: -190 }],
          }}
        >
          <Dialog.Title style={{ color: "#15803d", fontWeight: "bold" }}>
            {selectedItem?.name}
          </Dialog.Title>

          <Dialog.Content style={{ gap: 12 }}>
            {/* Tappable display inputs */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              {/* Qty box */}
              <TouchableOpacity
                style={inputBox(activeInput === "qty")}
                onPress={() => setActiveInput("qty")}
              >
                <Text
                  style={{ fontSize: 11, color: "#6b7280", letterSpacing: 1 }}
                >
                  QUANTITY
                </Text>
                <Text
                  style={{ fontSize: 26, fontWeight: "bold", color: "#111827" }}
                >
                  {qty || "0"}
                </Text>
              </TouchableOpacity>

              {/* Price box */}
              <TouchableOpacity
                style={inputBox(activeInput === "price")}
                onPress={() => setActiveInput("price")}
              >
                <Text
                  style={{ fontSize: 11, color: "#6b7280", letterSpacing: 1 }}
                >
                  UNIT PRICE
                </Text>
                <Text
                  style={{
                    fontSize: 26,
                    fontWeight: "bold",
                    color: price ? "#111827" : "#9ca3af",
                  }}
                >
                  ₱{price === "" ? "0.00" : parseFloat(price).toFixed(2)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Single numpad — switches based on activeInput */}
            <Numpad
              value={activeInput === "qty" ? qty : price}
              onChange={activeInput === "qty" ? setQty : setPrice}
              isPrice={activeInput === "price"}
            />
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setSelectedItem(null)} textColor="#6b7280">
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleAddToCart}
              disabled={!price}
              buttonColor="#16a34a"
            >
              Add to Cart
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
