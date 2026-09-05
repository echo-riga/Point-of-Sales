// app/(tabs)/products.tsx
import { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
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
import { router, useFocusEffect } from "expo-router";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import { itemService } from "@/services/itemService";
import {
  CATEGORY_PALETTE,
  ITEM_PALETTE,
  SUBCATEGORY_PALETTE,
} from "@/components/ColorPicker";
import ProductTile from "@/components/ProductTile";

type EntryType = "category" | "subcategory" | "product";

interface Entry {
  id: number;
  name: string;
  color: string;
  type: EntryType;
  category_id?: number | null;
  subcategory_id?: number | null;
}

export default function ProductsScreen() {
  const [categories, setCategories] = useState<Entry[]>([]);
  const [subcategories, setSubcategories] = useState<Entry[]>([]);
  const [items, setItems] = useState<Entry[]>([]);

  const [selectedCategory, setSelectedCategory] = useState<Entry | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Entry | null>(null);

  // Single item action dialog (when not in delete mode)
  const [activeItem, setActiveItem] = useState<Entry | null>(null);

  // Multi-select delete mode
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<
    { id: number; type: EntryType; name: string }[]
  >([]);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  const load = useCallback(() => {
    const rawCats = (categoryService.getAll() as any[]).map((c) => ({
      ...c,
      type: "category" as EntryType,
    }));
    const rawItems = (itemService.getAll() as any[]).map((i) => ({
      ...i,
      type: "product" as EntryType,
    }));
    setCategories(rawCats);
    setItems(rawItems);
    if (selectedCategory) {
      const rawSubs = (
        subcategoryService.getByCategory(selectedCategory.id) as any[]
      ).map((s) => ({
        ...s,
        type: "subcategory" as EntryType,
      }));
      setSubcategories(rawSubs);
    }
  }, [selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      load();
      setIsDeleteMode(false);
      setSelectedForDelete([]);
    }, [])
  );

  const handleCategoryPress = (cat: Entry) => {
    if (isDeleteMode) {
      toggleSelectForDelete(cat);
      return;
    }
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    const rawSubs = (
      subcategoryService.getByCategory(cat.id) as any[]
    ).map((s) => ({
      ...s,
      type: "subcategory" as EntryType,
    }));
    setSubcategories(rawSubs);
  };

  const handleSubcategoryPress = (sub: Entry) => {
    if (isDeleteMode) {
      toggleSelectForDelete(sub);
      return;
    }
    setSelectedSubcategory(sub);
  };

  const handleProductPress = (prod: Entry) => {
    if (isDeleteMode) {
      toggleSelectForDelete(prod);
      return;
    }
    setActiveItem(prod);
  };

  const toggleSelectForDelete = (entry: Entry) => {
    setSelectedForDelete((prev) => {
      const exists = prev.some(
        (x) => x.id === entry.id && x.type === entry.type
      );
      if (exists) {
        return prev.filter(
          (x) => !(x.id === entry.id && x.type === entry.type)
        );
      } else {
        return [...prev, { id: entry.id, type: entry.type, name: entry.name }];
      }
    });
  };

  const handleDeleteModeToggle = () => {
    if (!isDeleteMode) {
      setIsDeleteMode(true);
      setSelectedForDelete([]);
    } else {
      if (selectedForDelete.length > 0) {
        setConfirmDeleteVisible(true);
      } else {
        setIsDeleteMode(false);
      }
    }
  };

  const cancelDeleteMode = () => {
    setIsDeleteMode(false);
    setSelectedForDelete([]);
    setConfirmDeleteVisible(false);
  };

  const executeDelete = () => {
    for (const item of selectedForDelete) {
      if (item.type === "category") {
        categoryService.delete(item.id);
      } else if (item.type === "subcategory") {
        subcategoryService.delete(item.id);
      } else if (item.type === "product") {
        itemService.delete(item.id);
      }
    }
    setConfirmDeleteVisible(false);
    setIsDeleteMode(false);
    setSelectedForDelete([]);
    load();
  };

  // Visible current cards
  const noCategoryItems = items.filter((i) => !i.category_id);
  const itemsInSelectedCategoryNoSubcat = selectedCategory
    ? items.filter(
        (i) => i.category_id === selectedCategory.id && !i.subcategory_id
      )
    : [];
  const itemsInSelectedSubcategory = selectedSubcategory
    ? items.filter((i) => i.subcategory_id === selectedSubcategory.id)
    : [];

  const renderGrid = () => {
    const cards: React.ReactNode[] = [];

    if (selectedSubcategory) {
      itemsInSelectedSubcategory.forEach((item) => {
        const isSelected = selectedForDelete.some(
          (x) => x.id === item.id && x.type === "product"
        );
        cards.push(
          <ProductTile
            key={`prod-${item.id}`}
            name={item.name}
            color={item.color}
            palette={ITEM_PALETTE}
            onPress={() => handleProductPress(item)}
            isDeleteMode={isDeleteMode}
            isShaking={isDeleteMode}
            isSelected={isSelected}
            badgeText="Product"
          />
        );
      });
    } else if (selectedCategory) {
      subcategories.forEach((sub) => {
        const isSelected = selectedForDelete.some(
          (x) => x.id === sub.id && x.type === "subcategory"
        );
        cards.push(
          <ProductTile
            key={`sub-${sub.id}`}
            name={sub.name}
            color={sub.color}
            palette={SUBCATEGORY_PALETTE}
            onPress={() => handleSubcategoryPress(sub)}
            isDeleteMode={isDeleteMode}
            isShaking={isDeleteMode}
            isSelected={isSelected}
            badgeText="Subcategory"
          />
        );
      });
      itemsInSelectedCategoryNoSubcat.forEach((item) => {
        const isSelected = selectedForDelete.some(
          (x) => x.id === item.id && x.type === "product"
        );
        cards.push(
          <ProductTile
            key={`prod-${item.id}`}
            name={item.name}
            color={item.color}
            palette={ITEM_PALETTE}
            onPress={() => handleProductPress(item)}
            isDeleteMode={isDeleteMode}
            isShaking={isDeleteMode}
            isSelected={isSelected}
            badgeText="Product"
          />
        );
      });
    } else {
      categories.forEach((cat) => {
        const isSelected = selectedForDelete.some(
          (x) => x.id === cat.id && x.type === "category"
        );
        cards.push(
          <ProductTile
            key={`cat-${cat.id}`}
            name={cat.name}
            color={cat.color}
            palette={CATEGORY_PALETTE}
            onPress={() => handleCategoryPress(cat)}
            isDeleteMode={isDeleteMode}
            isShaking={isDeleteMode}
            isSelected={isSelected}
            badgeText="Category"
          />
        );
      });
      noCategoryItems.forEach((item) => {
        const isSelected = selectedForDelete.some(
          (x) => x.id === item.id && x.type === "product"
        );
        cards.push(
          <ProductTile
            key={`prod-${item.id}`}
            name={item.name}
            color={item.color}
            palette={ITEM_PALETTE}
            onPress={() => handleProductPress(item)}
            isDeleteMode={isDeleteMode}
            isShaking={isDeleteMode}
            isSelected={isSelected}
            badgeText="Product"
          />
        );
      });
    }

    if (cards.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nothing here yet</Text>
          <Text style={styles.emptySubtext}>
            Tap "+ Add Product" on the bottom right to create items
          </Text>
        </View>
      );
    }

    return cards;
  };

  return (
    <View style={styles.container}>
      {/* Top Bar: Breadcrumbs & Action buttons (No redundant Products header) */}
      <View style={styles.topBar}>
        {/* Breadcrumbs */}
        <View style={styles.breadcrumbRow}>
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory(null);
              setSelectedSubcategory(null);
              setSubcategories([]);
            }}
          >
            <Text
              variant="bodyMedium"
              style={{
                color: "#16a34a",
                fontWeight: !selectedCategory ? "bold" : "600",
              }}
            >
              All
            </Text>
          </TouchableOpacity>

          {selectedCategory && (
            <>
              <Text variant="bodyMedium" style={{ color: "#9ca3af" }}>
                {" "}
                ›{" "}
              </Text>
              <TouchableOpacity
                onPress={() => setSelectedSubcategory(null)}
              >
                <Text
                  variant="bodyMedium"
                  style={{
                    color: "#16a34a",
                    fontWeight: !selectedSubcategory ? "bold" : "600",
                  }}
                >
                  {selectedCategory.name}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {selectedSubcategory && (
            <>
              <Text variant="bodyMedium" style={{ color: "#9ca3af" }}>
                {" "}
                ›{" "}
              </Text>
              <Text
                variant="bodyMedium"
                style={{ fontWeight: "bold", color: "#374151" }}
              >
                {selectedSubcategory.name}
              </Text>
            </>
          )}
        </View>

        {/* Delete Mode Trigger */}
        <View style={styles.actionRow}>
          {isDeleteMode && (
            <Button
              compact
              mode="text"
              textColor="#6b7280"
              onPress={cancelDeleteMode}
              style={{ marginRight: 4 }}
            >
              Cancel
            </Button>
          )}
          <Button
            mode={isDeleteMode ? "contained" : "outlined"}
            buttonColor={isDeleteMode ? "#dc2626" : undefined}
            textColor={isDeleteMode ? "#ffffff" : "#dc2626"}
            icon="trash-can-outline"
            style={{
              borderColor: "#dc2626",
              borderRadius: 8,
            }}
            onPress={handleDeleteModeToggle}
          >
            {isDeleteMode
              ? selectedForDelete.length > 0
                ? `Delete (${selectedForDelete.length})`
                : "Done"
              : "Delete Mode"}
          </Button>
        </View>
      </View>

      <Divider />

      {/* Grid Content */}
      <ScrollView
        contentContainerStyle={styles.gridContainer}
        keyboardShouldPersistTaps="handled"
      >
        {renderGrid()}
      </ScrollView>

      {/* Floating Action Button at Bottom Right */}
      {!isDeleteMode && (
        <FAB
          icon="plus"
          label="Add Product"
          color="#ffffff"
          style={styles.fab}
          onPress={() => router.push("/product-form")}
        />
      )}

      {/* Single Item Action Dialog */}
      <Portal>
        <Dialog
          visible={!!activeItem}
          onDismiss={() => setActiveItem(null)}
          style={{ width: 360, alignSelf: "center" }}
        >
          <Dialog.Title style={{ fontWeight: "bold", color: "#16a34a" }}>
            {activeItem?.name}
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: "#4b5563" }}>
              {activeItem?.type === "product"
                ? "Would you like to edit or delete this product?"
                : `Would you like to delete this ${activeItem?.type}?`}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setActiveItem(null)} textColor="#6b7280">
              Close
            </Button>
            {activeItem?.type === "product" && (
              <Button
                onPress={() => {
                  if (activeItem) router.push(`/product-form?id=${activeItem.id}`);
                  setActiveItem(null);
                }}
                textColor="#16a34a"
              >
                Edit
              </Button>
            )}
            <Button
              textColor="#dc2626"
              onPress={() => {
                const itemToDelete = activeItem;
                setActiveItem(null);
                if (itemToDelete) {
                  Alert.alert(
                    `Delete ${itemToDelete.type}`,
                    `Are you sure you want to delete "${itemToDelete.name}"?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: () => {
                          if (itemToDelete.type === "category") {
                            categoryService.delete(itemToDelete.id);
                          } else if (itemToDelete.type === "subcategory") {
                            subcategoryService.delete(itemToDelete.id);
                          } else {
                            itemService.delete(itemToDelete.id);
                          }
                          load();
                        },
                      },
                    ]
                  );
                }
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Multi-Delete Confirmation Modal */}
        <Dialog
          visible={confirmDeleteVisible}
          onDismiss={() => setConfirmDeleteVisible(false)}
          style={{ width: 380, alignSelf: "center" }}
        >
          <Dialog.Title style={{ color: "#dc2626", fontWeight: "bold" }}>
            Confirm Deletion
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ fontSize: 15, color: "#374151", marginBottom: 8 }}>
              Are you sure you want to delete the following {selectedForDelete.length} item(s)?
            </Text>
            <ScrollView style={{ maxHeight: 150, marginVertical: 6 }}>
              {selectedForDelete.map((x, i) => (
                <Text key={i} style={{ fontSize: 13, color: "#6b7280", marginVertical: 2 }}>
                  • <Text style={{ fontWeight: "bold" }}>{x.name}</Text> ({x.type})
                </Text>
              ))}
            </ScrollView>
            <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setConfirmDeleteVisible(false)}
              textColor="#6b7280"
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              buttonColor="#dc2626"
              onPress={executeDelete}
            >
              Yes, Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f7faf8",
    padding: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    minHeight: 42,
  },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingTop: 12,
    paddingBottom: 90,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#16a34a",
    borderRadius: 28,
  },
  emptyContainer: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6b7280",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: "#9ca3af",
  },
});
