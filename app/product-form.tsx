// app/product-form.tsx
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Button,
  IconButton,
  RadioButton,
  Text,
  TextInput,
} from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { itemService } from "@/services/itemService";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import ColorPicker, {
  CATEGORY_PALETTE,
  ITEM_PALETTE,
  SUBCATEGORY_PALETTE,
} from "@/components/ColorPicker";

interface CategoryEntry {
  id: number;
  name: string;
  color: string;
}

interface SubcategoryEntry {
  id: number;
  name: string;
  category_id: number;
  color: string;
}

interface ItemDetail {
  id: number;
  name: string;
  color: string;
  category_id: number | null;
  subcategory_id: number | null;
}

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams();
  const isEdit = !!id;

  // Form State
  const [name, setName] = useState("");
  const [itemColor, setItemColor] = useState(ITEM_PALETTE[0].bg);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<number | null>(null);

  // Data lists
  const [categories, setCategories] = useState<CategoryEntry[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryEntry[]>([]);

  // Creation forms state
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState(CATEGORY_PALETTE[0].bg);

  const [isCreatingSubcategory, setIsCreatingSubcategory] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubColor, setNewSubColor] = useState(SUBCATEGORY_PALETTE[0].bg);

  // Delete mode for radio buttons
  const [categoryDeleteMode, setCategoryDeleteMode] = useState(false);
  const [subcategoryDeleteMode, setSubcategoryDeleteMode] = useState(false);

  const loadCategories = () => {
    const cats = categoryService.getAll() as CategoryEntry[];
    setCategories(cats);
  };

  const loadSubcategories = (catId: number) => {
    const subs = subcategoryService.getByCategory(catId) as SubcategoryEntry[];
    setSubcategories(subs);
  };

  useEffect(() => {
    loadCategories();

    if (isEdit) {
      const item = itemService.getById(Number(id)) as ItemDetail | null;
      if (item) {
        setName(item.name);
        setItemColor(item.color ?? ITEM_PALETTE[0].bg);
        setSelectedCategoryId(item.category_id);
        if (item.category_id) {
          const subs = subcategoryService.getByCategory(item.category_id) as SubcategoryEntry[];
          setSubcategories(subs);
          setSelectedSubcategoryId(item.subcategory_id);
        }
      }
    }
  }, []);

  const handleCategorySelect = (catId: number | null) => {
    setSelectedCategoryId(catId);
    setSelectedSubcategoryId(null);
    if (catId !== null) {
      loadSubcategories(catId);
    } else {
      setSubcategories([]);
    }
  };

  const handleCreateCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      Alert.alert("Notice", "Please enter a category name");
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert("Notice", "A category with this name already exists");
      return;
    }
    const newId = categoryService.create({
      name: trimmed,
      color: newCatColor,
    }) as number;

    setNewCatName("");
    setIsCreatingCategory(false);
    loadCategories();
    handleCategorySelect(newId);
  };

  const handleDeleteCategory = (cat: CategoryEntry) => {
    Alert.alert(
      "Delete Category",
      `Delete "${cat.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            categoryService.delete(cat.id);
            if (selectedCategoryId === cat.id) {
              handleCategorySelect(null);
            }
            loadCategories();
          },
        },
      ]
    );
  };

  const handleCreateSubcategory = () => {
    if (!selectedCategoryId) {
      Alert.alert("Notice", "Please select a category first");
      return;
    }
    const trimmed = newSubName.trim();
    if (!trimmed) {
      Alert.alert("Notice", "Please enter a subcategory name");
      return;
    }
    if (subcategories.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert("Notice", "A subcategory with this name already exists in this category");
      return;
    }
    const newId = subcategoryService.create({
      name: trimmed,
      category_id: selectedCategoryId,
      color: newSubColor,
    }) as number;

    setNewSubName("");
    setIsCreatingSubcategory(false);
    loadSubcategories(selectedCategoryId);
    setSelectedSubcategoryId(newId);
  };

  const handleDeleteSubcategory = (sub: SubcategoryEntry) => {
    Alert.alert(
      "Delete Subcategory",
      `Delete "${sub.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            subcategoryService.delete(sub.id);
            if (selectedSubcategoryId === sub.id) {
              setSelectedSubcategoryId(null);
            }
            if (selectedCategoryId) {
              loadSubcategories(selectedCategoryId);
            }
          },
        },
      ]
    );
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Notice", "Please enter a product name");
      return;
    }

    if (isEdit) {
      itemService.update(Number(id), {
        name: name.trim(),
        color: itemColor,
        category_id: selectedCategoryId,
        subcategory_id: selectedSubcategoryId,
      });
    } else {
      itemService.create({
        name: name.trim(),
        color: itemColor,
        category_id: selectedCategoryId,
        subcategory_id: selectedSubcategoryId,
      });
    }

    router.back();
  };

  const selectedItemColorEntry =
    ITEM_PALETTE.find((c) => c.bg === itemColor) ?? ITEM_PALETTE[0];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          gap: 14,
          backgroundColor: "#f9fafb",
          maxWidth: 800,
          width: "100%",
          alignSelf: "center",
        }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 1. CATEGORY SECTION ───────────────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Category</Text>
            {categories.length > 0 && (
              <Button
                compact
                mode={categoryDeleteMode ? "contained" : "text"}
                buttonColor={categoryDeleteMode ? "#fee2e2" : undefined}
                textColor="#dc2626"
                icon="trash-can-outline"
                onPress={() => setCategoryDeleteMode(!categoryDeleteMode)}
              >
                {categoryDeleteMode ? "Done" : "Delete"}
              </Button>
            )}
          </View>

          <View style={styles.radioListContainer}>
            {/* None / Independent option */}
            <TouchableOpacity
              activeOpacity={0.7}
              style={[
                styles.radioRow,
                selectedCategoryId === null && styles.radioRowActive,
              ]}
              onPress={() => handleCategorySelect(null)}
            >
              <RadioButton
                value="none"
                status={selectedCategoryId === null ? "checked" : "unchecked"}
                onPress={() => handleCategorySelect(null)}
                color="#16a34a"
              />
              <Text
                style={[
                  styles.radioLabel,
                  selectedCategoryId === null && styles.radioLabelActive,
                ]}
              >
                None (Standalone)
              </Text>
            </TouchableOpacity>

            {/* Existing categories */}
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <View key={`cat-${cat.id}`} style={styles.radioRowWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[
                      styles.radioRow,
                      isSelected && styles.radioRowActive,
                      { flex: 1 },
                    ]}
                    onPress={() => handleCategorySelect(cat.id)}
                  >
                    <RadioButton
                      value={String(cat.id)}
                      status={isSelected ? "checked" : "unchecked"}
                      onPress={() => handleCategorySelect(cat.id)}
                      color="#16a34a"
                    />
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: cat.color || "#16a34a" },
                      ]}
                    />
                    <Text
                      style={[
                        styles.radioLabel,
                        isSelected && styles.radioLabelActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>

                  {categoryDeleteMode && (
                    <IconButton
                      icon="trash-can"
                      size={18}
                      iconColor="#dc2626"
                      onPress={() => handleDeleteCategory(cat)}
                    />
                  )}
                </View>
              );
            })}
          </View>

          {/* Inline Add New Category */}
          {!isCreatingCategory ? (
            <Button
              mode="outlined"
              icon="plus"
              textColor="#16a34a"
              style={styles.addButton}
              onPress={() => setIsCreatingCategory(true)}
            >
              Add Category
            </Button>
          ) : (
            <View style={styles.newInlineBox}>
              <TextInput
                label="Category Name"
                value={newCatName}
                onChangeText={setNewCatName}
                mode="outlined"
                outlineColor="#d1fae5"
                activeOutlineColor="#16a34a"
                style={{ backgroundColor: "#ffffff" }}
              />
              <ColorPicker
                label="Color"
                palette={CATEGORY_PALETTE}
                value={newCatColor}
                onChange={setNewCatColor}
              />
              <View style={styles.newInlineActions}>
                <Button
                  onPress={() => {
                    setIsCreatingCategory(false);
                    setNewCatName("");
                  }}
                  textColor="#6b7280"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  buttonColor="#16a34a"
                  onPress={handleCreateCategory}
                >
                  Save
                </Button>
              </View>
            </View>
          )}
        </View>

        {/* ── 2. SUBCATEGORY SECTION ────────────────────────────────────────── */}
        {selectedCategoryId !== null && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>Subcategory</Text>
              {subcategories.length > 0 && (
                <Button
                  compact
                  mode={subcategoryDeleteMode ? "contained" : "text"}
                  buttonColor={subcategoryDeleteMode ? "#fee2e2" : undefined}
                  textColor="#dc2626"
                  icon="trash-can-outline"
                  onPress={() =>
                    setSubcategoryDeleteMode(!subcategoryDeleteMode)
                  }
                >
                  {subcategoryDeleteMode ? "Done" : "Delete"}
                </Button>
              )}
            </View>

            <View style={styles.radioListContainer}>
              {/* None option */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.radioRow,
                  selectedSubcategoryId === null && styles.radioRowActive,
                ]}
                onPress={() => setSelectedSubcategoryId(null)}
              >
                <RadioButton
                  value="none_sub"
                  status={
                    selectedSubcategoryId === null ? "checked" : "unchecked"
                  }
                  onPress={() => setSelectedSubcategoryId(null)}
                  color="#16a34a"
                />
                <Text
                  style={[
                    styles.radioLabel,
                    selectedSubcategoryId === null && styles.radioLabelActive,
                  ]}
                >
                  None
                </Text>
              </TouchableOpacity>

              {/* Existing Subcategories */}
              {subcategories.map((sub) => {
                const isSelected = selectedSubcategoryId === sub.id;
                return (
                  <View key={`sub-${sub.id}`} style={styles.radioRowWrapper}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.radioRow,
                        isSelected && styles.radioRowActive,
                        { flex: 1 },
                      ]}
                      onPress={() => setSelectedSubcategoryId(sub.id)}
                    >
                      <RadioButton
                        value={String(sub.id)}
                        status={isSelected ? "checked" : "unchecked"}
                        onPress={() => setSelectedSubcategoryId(sub.id)}
                        color="#16a34a"
                      />
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: sub.color || "#2563eb" },
                        ]}
                      />
                      <Text
                        style={[
                          styles.radioLabel,
                          isSelected && styles.radioLabelActive,
                        ]}
                      >
                        {sub.name}
                      </Text>
                    </TouchableOpacity>

                    {subcategoryDeleteMode && (
                      <IconButton
                        icon="trash-can"
                        size={18}
                        iconColor="#dc2626"
                        onPress={() => handleDeleteSubcategory(sub)}
                      />
                    )}
                  </View>
                );
              })}
            </View>

            {/* Inline Add New Subcategory */}
            {!isCreatingSubcategory ? (
              <Button
                mode="outlined"
                icon="plus"
                textColor="#16a34a"
                style={styles.addButton}
                onPress={() => setIsCreatingSubcategory(true)}
              >
                Add Subcategory
              </Button>
            ) : (
              <View style={styles.newInlineBox}>
                <TextInput
                  label="Subcategory Name"
                  value={newSubName}
                  onChangeText={setNewSubName}
                  mode="outlined"
                  outlineColor="#d1fae5"
                  activeOutlineColor="#16a34a"
                  style={{ backgroundColor: "#ffffff" }}
                />
                <ColorPicker
                  label="Color"
                  palette={SUBCATEGORY_PALETTE}
                  value={newSubColor}
                  onChange={setNewSubColor}
                />
                <View style={styles.newInlineActions}>
                  <Button
                    onPress={() => {
                      setIsCreatingSubcategory(false);
                      setNewSubName("");
                    }}
                    textColor="#6b7280"
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    buttonColor="#16a34a"
                    onPress={handleCreateSubcategory}
                  >
                    Save
                  </Button>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── 3. PRODUCT DETAILS SECTION ───────────────────────────────────── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>Product Details</Text>

          {/* Product Name Input with Preview Tile */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 10,
                backgroundColor: selectedItemColorEntry.bg,
                borderWidth: 1.5,
                borderColor: selectedItemColorEntry.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "bold",
                  color: selectedItemColorEntry.text,
                }}
              >
                {name.slice(0, 3).toUpperCase() || "..."}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <TextInput
                label="Product Name"
                value={name}
                onChangeText={setName}
                mode="outlined"
                outlineColor="#d1fae5"
                activeOutlineColor="#16a34a"
                textColor="#111827"
                style={{ backgroundColor: "#ffffff" }}
              />
            </View>
          </View>

          {/* Color Picker */}
          <View style={{ marginTop: 6 }}>
            <ColorPicker
              label="Card Color"
              palette={ITEM_PALETTE}
              value={itemColor}
              onChange={setItemColor}
            />
          </View>
        </View>

        {/* ── SAVE / DELETE BUTTONS ─────────────────────────────────────────── */}
        <Button
          mode="contained"
          buttonColor="#16a34a"
          style={{ borderRadius: 10, marginTop: 2 }}
          contentStyle={{ paddingVertical: 5 }}
          onPress={handleSave}
        >
          {isEdit ? "Update Product" : "Save Product"}
        </Button>

        {isEdit && (
          <Button
            mode="outlined"
            textColor="#ef4444"
            style={{ borderColor: "#fca5a5", borderRadius: 10 }}
            contentStyle={{ paddingVertical: 4 }}
            onPress={() =>
              Alert.alert("Delete Product", `Delete "${name}"?`, [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    itemService.delete(Number(id));
                    router.back();
                  },
                },
              ])
            }
          >
            Delete Product
          </Button>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#15803d",
  },
  radioListContainer: {
    gap: 4,
  },
  radioRowWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  radioRowActive: {
    backgroundColor: "#f0fdf4",
    borderColor: "#bbf7d0",
  },
  radioLabel: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 6,
  },
  radioLabelActive: {
    fontWeight: "700",
    color: "#15803d",
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  addButton: {
    borderColor: "#16a34a",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  newInlineBox: {
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bbf7d0",
    padding: 10,
    gap: 8,
  },
  newInlineActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
});
