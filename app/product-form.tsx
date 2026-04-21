// app/product-form.tsx
import { useEffect, useState } from "react";
import { View, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Divider,
  IconButton,
  Portal,
  Dialog,
} from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { itemService } from "@/services/itemService";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import PaperDropdown from "@/components/PaperDropdown";
import ColorPicker, { ITEM_PALETTE } from "@/components/ColorPicker";

interface Option {
  label: string;
  value: number;
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

  const [name, setName] = useState("");
  const [color, setColor] = useState(ITEM_PALETTE[0].bg);
  const [showCategory, setShowCategory] = useState(false);
  const [showSubcategory, setShowSubcategory] = useState(false);
  const [categoryValue, setCategoryValue] = useState<number | null>(null);
  const [subcategoryValue, setSubcategoryValue] = useState<number | null>(null);
  const [categories, setCategories] = useState<Option[]>([]);
  const [subcategories, setSubcategories] = useState<Option[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const cats = categoryService.getAll() as any[];
    setCategories(cats.map((c) => ({ label: c.name, value: c.id })));

    if (isEdit) {
      const item = itemService.getById(Number(id)) as ItemDetail | null;
      if (item) {
        setName(item.name);
        setColor(item.color ?? ITEM_PALETTE[0].bg);
        if (item.category_id) {
          setShowCategory(true);
          setCategoryValue(item.category_id);
          const subs = subcategoryService.getByCategory(item.category_id) as any[];
          setSubcategories(subs.map((s) => ({ label: s.name, value: s.id })));
        }
        if (item.subcategory_id) {
          setShowSubcategory(true);
          setSubcategoryValue(item.subcategory_id);
        }
      }
    }
  }, []);

  const handleAddCategory = (newName: string) => {
    const newId = categoryService.create({
      name: newName,
      color: "#16a34a",
    }) as number;
    setCategories((prev) => [...prev, { label: newName, value: newId }]);
    setCategoryValue(newId);
    setSubcategories([]);
    setSubcategoryValue(null);
    setShowSubcategory(false);
  };

  const handleAddSubcategory = (newName: string) => {
    if (!categoryValue) return;
    const newId = subcategoryService.create({
      name: newName,
      category_id: categoryValue,
      color: "#dbeafe",
    }) as number;
    setSubcategories((prev) => [...prev, { label: newName, value: newId }]);
    setSubcategoryValue(newId);
  };

  const handleCategoryChange = (val: number) => {
    setCategoryValue(val);
    setSubcategoryValue(null);
    setShowSubcategory(false);
    const subs = subcategoryService.getByCategory(val) as any[];
    setSubcategories(subs.map((s) => ({ label: s.name, value: s.id })));
  };

  const handleUnselectCategory = () => {
    setCategoryValue(null);
    setShowCategory(false);
    setSubcategoryValue(null);
    setShowSubcategory(false);
    setSubcategories([]);
  };

  const handleUnselectSubcategory = () => {
    setSubcategoryValue(null);
    setShowSubcategory(false);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    if (isEdit) {
      itemService.update(Number(id), {
        name,
        color,
        category_id: categoryValue,
        subcategory_id: subcategoryValue,
      });
    } else {
      itemService.create({
        name,
        color,
        category_id: categoryValue,
        subcategory_id: subcategoryValue,
      });
    }
    router.back();
  };

  const handleDelete = () => {
    itemService.delete(Number(id));
    router.back();
  };

  // Preview the selected color
  const selectedEntry = ITEM_PALETTE.find((c) => c.bg === color) ?? ITEM_PALETTE[0];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: "#f9fafb" }}
    >
      <ScrollView
        contentContainerStyle={{ padding: 24, gap: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineSmall" style={{ fontWeight: "bold", color: "#111827" }}>
          {isEdit ? "Edit Product" : "Add Product"}
        </Text>
        <Divider />

        {/* Name + color preview */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: selectedEntry.bg,
              borderWidth: 1.5,
              borderColor: selectedEntry.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: "bold", color: selectedEntry.text }}>
              {name.slice(0, 2).toUpperCase() || "??"}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              label="Name"
              value={name}
              onChangeText={setName}
              mode="outlined"
              outlineColor="#d1fae5"
              activeOutlineColor="#16a34a"
              textColor="#111827"
              style={{ backgroundColor: "#f0fdf4" }}
              theme={{
                colors: {
                  onSurfaceVariant: "#6b7280",
                },
              }}
            />
          </View>
        </View>

        {/* Color picker */}
        <ColorPicker
          label="Card Color"
          palette={ITEM_PALETTE}
          value={color}
          onChange={setColor}
        />

        <Divider />

        {/* Category */}
        {!showCategory ? (
          <Button
            mode="outlined"
            icon="plus"
            textColor="#16a34a"
            style={{ borderColor: "#16a34a", borderRadius: 10 }}
            onPress={() => setShowCategory(true)}
          >
            Add Category
          </Button>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <PaperDropdown
                label="Category"
                value={categoryValue}
                options={categories}
                onChange={handleCategoryChange}
                onAddNew={handleAddCategory}
              />
            </View>
            <IconButton
              icon="close-circle-outline"
              size={22}
              iconColor="#ef4444"
              onPress={handleUnselectCategory}
            />
          </View>
        )}

        {/* Subcategory */}
        {showCategory && !showSubcategory ? (
          <Button
            mode="outlined"
            icon="plus"
            textColor="#16a34a"
            style={{ borderColor: "#16a34a", borderRadius: 10 }}
            onPress={() => setShowSubcategory(true)}
          >
            Add Subcategory
          </Button>
        ) : showSubcategory ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ flex: 1 }}>
              <PaperDropdown
                label="Subcategory"
                value={subcategoryValue}
                options={subcategories}
                onChange={setSubcategoryValue}
                onAddNew={handleAddSubcategory}
              />
            </View>
            <IconButton
              icon="close-circle-outline"
              size={22}
              iconColor="#ef4444"
              onPress={handleUnselectSubcategory}
            />
          </View>
        ) : null}

        <Divider />

        <Button
          mode="contained"
          buttonColor="#16a34a"
          style={{ borderRadius: 10 }}
          contentStyle={{ paddingVertical: 4 }}
          onPress={handleSave}
        >
          {isEdit ? "Save Changes" : "Add Product"}
        </Button>

        {isEdit && (
          <Button
            mode="outlined"
            textColor="#ef4444"
            style={{ borderColor: "#fca5a5", borderRadius: 10 }}
            contentStyle={{ paddingVertical: 4 }}
            onPress={() => setShowDeleteModal(true)}
          >
            Delete Product
          </Button>
        )}

        {/* Bottom padding so last button isn't hidden behind keyboard */}
        <View style={{ height: 40 }} />
      </ScrollView>

      <Portal>
        <Dialog visible={showDeleteModal} onDismiss={() => setShowDeleteModal(false)}>
          <Dialog.Title style={{ color: "#ef4444" }}>Delete Product</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to delete "{name}"? This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button textColor="#6b7280" onPress={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button textColor="#ef4444" onPress={handleDelete}>
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}