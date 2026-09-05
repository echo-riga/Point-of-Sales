// components/CartSideBar.tsx
import { View, ScrollView, TouchableOpacity } from "react-native";
import { Text, Button, Divider } from "react-native-paper";
import { router } from "expo-router";
import { useCartStore, CartItem } from "@/context/CartItem";

interface Props {
  readonly?: boolean;
  items?: CartItem[];
}

export default function CartSidebar({ readonly = false, items: customItems }: Props) {
  const storeItems = useCartStore((s) => s.items);
  const removeOne = useCartStore((s) => s.removeOne);
  const removeAll = useCartStore((s) => s.removeAll);

  const items = customItems ?? storeItems;

  const totalQty = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  return (
    <View style={{ backgroundColor: "#f9f9f9", flex: 1, padding: 16, gap: 12 }}>
      <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
        Cart
      </Text>
      <Divider />

      <ScrollView style={{ flex: 1 }}>
        {items.length === 0 && (
          <Text style={{ color: "gray", textAlign: "center", marginTop: 32 }}>
            Cart is empty
          </Text>
        )}
        {items.map((item) => (
          <TouchableOpacity
            key={`${item.id}-${item.price}`}
            onPress={() => !readonly && removeOne(item.id)}
            onLongPress={() => !readonly && removeAll(item.id)}
            activeOpacity={readonly ? 1 : 0.6}
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
                {item.category_name && (
                  <Text variant="bodySmall" style={{ color: "gray" }}>
                    {item.subcategory_name
                      ? `${item.category_name} > ${item.subcategory_name}`
                      : item.category_name}
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
            ₱{totalPrice.toFixed(2)}
          </Text>
        </View>
      </View>

      {!readonly && (
        <Button
          mode="contained"
          onPress={() => router.push("/checkout")}
          disabled={items.length === 0}
          style={{ borderRadius: 8 }}
          contentStyle={{ paddingVertical: 8 }}
        >
          Charge ₱{totalPrice}
        </Button>
      )}
    </View>
  );
}
