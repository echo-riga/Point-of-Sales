// components/pos/CartSidebar.tsx
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text, Button, Divider } from "react-native-paper";
import { router } from "expo-router";

const mockItems = [
  // no category
  { id: "1", name: "Water", price: 20, qty: 1, category: null },
  // category, no subcategory
  {
    id: "2",
    name: "Coke",
    price: 40,
    qty: 3,
    category: { id: "1", name: "Drinks", subcategory: null },
  },
  // category with subcategory
  {
    id: "3",
    name: "Burger",
    price: 120,
    qty: 2,
    category: {
      id: "2",
      name: "Meals",
      subcategory: { id: "1", name: "Burgers" },
    },
  },
  {
    id: "4",
    name: "Fries",
    price: 60,
    qty: 1,
    category: {
      id: "3",
      name: "Sides",
      subcategory: { id: "2", name: "Fried" },
    },
  },
];

export default function CartSidebar() {
  const totalQty = mockItems.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = mockItems.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <View style={{ backgroundColor: "#f9f9f9", flex: 1, padding: 16, gap: 12 }}>
      {/* Header */}
      <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
        Cart
      </Text>
      <Divider />

      {/* Items */}
      <ScrollView style={{ flex: 1 }}>
        {mockItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            onLongPress={() => console.log("remove all", item.id)}
            onPress={() => console.log("remove one", item.id)}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingVertical: 10,
              }}
            >
              <View>
                <Text variant="bodyLarge">{item.name}</Text>
                {/* category / subcategory label */}
                {item.category && (
                  <Text variant="bodySmall" style={{ color: "gray" }}>
                    {item.category.subcategory
                      ? `${item.category.name} > ${item.category.subcategory.name}`
                      : item.category.name}
                  </Text>
                )}
                <Text variant="bodySmall" style={{ color: "gray" }}>
                  ₱{item.price} x {item.qty}
                </Text>
              </View>
              <Text variant="bodyLarge">₱{item.price * item.qty}</Text>
            </View>
            <Divider />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Totals */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text variant="bodyMedium" style={{ color: "gray" }}>
            Total Qty
          </Text>
          <Text variant="bodyMedium">{totalQty}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
            Total
          </Text>
          <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
            ₱{totalPrice}
          </Text>
        </View>
      </View>

      {/* Charge Button */}
      <Button
        mode="contained"
        onPress={() => router.push("/checkout")}
        style={{ borderRadius: 8 }}
        contentStyle={{ paddingVertical: 8 }}
      >
        Charge ₱{totalPrice}
      </Button>
    </View>
  );
}
