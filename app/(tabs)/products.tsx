// app/(tabs)/products.tsx
import { useState, useCallback } from "react";
import {
  View,
  FlatList,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  Divider,
  FAB,
  Portal,
  Dialog,
  Button,
  IconButton,
  TextInput,
} from "react-native-paper";
import { router, useFocusEffect } from "expo-router";
import { itemService } from "@/services/itemService";
import { categoryService } from "@/services/categoryService";
import { subcategoryService } from "@/services/subcategoryService";
import ColorPicker, {
  CATEGORY_PALETTE,
  SUBCATEGORY_PALETTE,
  resolveColor,
} from "@/components/ColorPicker";
import { ITEM_PALETTE as ITEM_PALETTE_IMPORT } from "@/components/ColorPicker";

interface Item {
  id: number;
  name: string;
  color: string;
  category_id: number | null;
  category_name: string | null;
  subcategory_id: number | null;
  subcategory_name: string | null;
}

interface CatOption {
  id: number;
  name: string;
  color: string;
}

interface SubOption {
  id: number;
  name: string;
  color: string;
  category_id: number;
}

// ── Reusable green-themed TextInput ──────────────────────────────────────────
function GreenInput({
  label,
  value,
  onChangeText,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      mode="outlined"
      dense
      autoFocus={autoFocus}
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
  );
}

export default function ProductsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<CatOption[]>([]);
  const [subcategories, setSubcategories] = useState<SubOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<number | null>(null);

  // ── Manage modal state ────────────────────────────────────────────────────
  const [showManage, setShowManage] = useState(false);
  const [manageCategories, setManageCategories] = useState<CatOption[]>([]);
  const [manageSubcategories, setManageSubcategories] = useState<SubOption[]>([]);
  const [manageSelectedCategory, setManageSelectedCategory] = useState<number | null>(null);

  // ── Add/edit inline forms ─────────────────────────────────────────────────
  const [addCatName, setAddCatName] = useState("");
  const [addCatColor, setAddCatColor] = useState(CATEGORY_PALETTE[0].bg);
  const [showAddCat, setShowAddCat] = useState(false);

  const [addSubName, setAddSubName] = useState("");
  const [addSubColor, setAddSubColor] = useState(SUBCATEGORY_PALETTE[0].bg);
  const [showAddSub, setShowAddSub] = useState(false);

  // edit
  const [editCat, setEditCat] = useState<CatOption | null>(null);
  const [editCatName, setEditCatName] = useState("");
  const [editCatColor, setEditCatColor] = useState("");

  const [editSub, setEditSub] = useState<SubOption | null>(null);
  const [editSubName, setEditSubName] = useState("");
  const [editSubColor, setEditSubColor] = useState("");

  // ── Delete confirm ────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    name: string;
    type: "category" | "subcategory";
  } | null>(null);

  const loadData = () => {
    setItems(itemService.getAll() as Item[]);
    setCategories(categoryService.getAll() as CatOption[]);
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSubcategories([]);
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const openManage = () => {
    const cats = categoryService.getAll() as CatOption[];
    setManageCategories(cats);
    setManageSelectedCategory(null);
    setManageSubcategories([]);
    setShowAddCat(false);
    setShowAddSub(false);
    setEditCat(null);
    setEditSub(null);
    setShowManage(true);
  };

  const closeManage = () => {
    setShowManage(false);
    setManageSelectedCategory(null);
    setManageSubcategories([]);
    setShowAddCat(false);
    setShowAddSub(false);
    setEditCat(null);
    setEditSub(null);
    loadData();
  };

  // ── Category filter ───────────────────────────────────────────────────────
  const handleCategoryFilter = (catId: number) => {
    if (selectedCategory === catId) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSubcategories([]);
      return;
    }
    setSelectedCategory(catId);
    setSelectedSubcategory(null);
    setSubcategories(subcategoryService.getByCategory(catId) as SubOption[]);
  };

  const handleSubcategoryFilter = (subId: number) => {
    setSelectedSubcategory(selectedSubcategory === subId ? null : subId);
  };

  // ── Manage: category select ───────────────────────────────────────────────
  const handleManageCategoryPress = (catId: number) => {
    if (manageSelectedCategory === catId) {
      setManageSelectedCategory(null);
      setManageSubcategories([]);
      setShowAddSub(false);
      setEditSub(null);
      return;
    }
    setManageSelectedCategory(catId);
    setManageSubcategories(subcategoryService.getByCategory(catId) as SubOption[]);
    setShowAddSub(false);
    setEditSub(null);
  };

  // ── Add category ──────────────────────────────────────────────────────────
  const handleSaveNewCat = () => {
    if (!addCatName.trim()) return;
    categoryService.create({ name: addCatName.trim(), color: addCatColor });
    const refreshed = categoryService.getAll() as CatOption[];
    setManageCategories(refreshed);
    setAddCatName("");
    setAddCatColor(CATEGORY_PALETTE[0].bg);
    setShowAddCat(false);
  };

  // ── Add subcategory ───────────────────────────────────────────────────────
  const handleSaveNewSub = () => {
    if (!addSubName.trim() || !manageSelectedCategory) return;
    subcategoryService.create({
      name: addSubName.trim(),
      category_id: manageSelectedCategory,
      color: addSubColor,
    });
    setManageSubcategories(
      subcategoryService.getByCategory(manageSelectedCategory) as SubOption[],
    );
    setAddSubName("");
    setAddSubColor(SUBCATEGORY_PALETTE[0].bg);
    setShowAddSub(false);
  };

  // ── Edit category save ────────────────────────────────────────────────────
  const handleSaveEditCat = () => {
    if (!editCat || !editCatName.trim()) return;
    categoryService.update(editCat.id, { name: editCatName.trim(), color: editCatColor });
    const refreshed = categoryService.getAll() as CatOption[];
    setManageCategories(refreshed);
    setEditCat(null);
  };

  // ── Edit subcategory save ─────────────────────────────────────────────────
  const handleSaveEditSub = () => {
    if (!editSub || !editSubName.trim() || !manageSelectedCategory) return;
    subcategoryService.update(editSub.id, { name: editSubName.trim(), color: editSubColor });
    setManageSubcategories(
      subcategoryService.getByCategory(manageSelectedCategory) as SubOption[],
    );
    setEditSub(null);
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "category") {
      const subs = subcategoryService.getByCategory(deleteTarget.id) as SubOption[];
      subs.forEach((sub) => subcategoryService.delete(sub.id));
      categoryService.delete(deleteTarget.id);
      if (manageSelectedCategory === deleteTarget.id) {
        setManageSelectedCategory(null);
        setManageSubcategories([]);
      }
    } else {
      subcategoryService.delete(deleteTarget.id);
      if (manageSelectedCategory) {
        setManageSubcategories(
          subcategoryService.getByCategory(manageSelectedCategory) as SubOption[],
        );
      }
    }
    setDeleteTarget(null);
    const refreshed = categoryService.getAll() as CatOption[];
    setManageCategories(refreshed);
    setCategories(refreshed);
    setItems(itemService.getAll() as Item[]);
  };

  const filteredItems = items.filter((item) => {
    if (selectedCategory) {
      if (item.category_id !== selectedCategory) return false;
      if (selectedSubcategory) return item.subcategory_id === selectedSubcategory;
    }
    return true;
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={{ flex: 1 }}>
        {/* Category Filter chips */}
        <View style={{ padding: 12, gap: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {categories.map((cat) => {
                  const entry = resolveColor(cat.color, CATEGORY_PALETTE);
                  const selected = selectedCategory === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => handleCategoryFilter(cat.id)}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 20,
                        backgroundColor: selected ? entry.bg : "#f3f4f6",
                        borderWidth: 1.5,
                        borderColor: selected ? entry.border : "#e5e7eb",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: selected ? entry.text : "#374151",
                        }}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {selectedCategory && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCategory(null);
                      setSelectedSubcategory(null);
                      setSubcategories([]);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 20,
                      backgroundColor: "#fee2e2",
                      borderWidth: 1.5,
                      borderColor: "#fecaca",
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#dc2626", fontWeight: "600" }}>✕ Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
            <IconButton icon="cog" size={20} onPress={openManage} />
          </View>

          {selectedCategory && subcategories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {subcategories.map((sub) => {
                  const entry = resolveColor(sub.color, SUBCATEGORY_PALETTE);
                  const selected = selectedSubcategory === sub.id;
                  return (
                    <TouchableOpacity
                      key={sub.id}
                      onPress={() => handleSubcategoryFilter(sub.id)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 5,
                        borderRadius: 16,
                        backgroundColor: selected ? entry.bg : "#f9fafb",
                        borderWidth: 1.5,
                        borderColor: selected ? entry.border : "#e5e7eb",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: selected ? entry.text : "#6b7280",
                        }}
                      >
                        {sub.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>

        <Divider />

        {/* Items List */}
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const entry = resolveColor(item.color, ITEM_PALETTE_IMPORT);
            return (
              <TouchableOpacity
                onPress={() => router.push(`/product-form?id=${item.id}`)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  backgroundColor: "white",
                  borderRadius: 12,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: "#f3f4f6",
                  elevation: 1,
                }}
              >
                {/* Color swatch */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: entry.bg,
                    borderWidth: 1.5,
                    borderColor: entry.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "bold", color: entry.text }}>
                    {item.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "600", fontSize: 15, color: "#111827" }}>
                    {item.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                    {item.category_name
                      ? item.subcategory_name
                        ? `${item.category_name} › ${item.subcategory_name}`
                        : item.category_name
                      : "No category"}
                  </Text>
                </View>
                <Text style={{ color: "#d1d5db", fontSize: 16 }}>›</Text>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 0 }} />}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", color: "gray", marginTop: 40 }}>
              No products found
            </Text>
          }
        />

        <FAB
          icon="plus"
          style={{ position: "absolute", right: 16, bottom: 16 }}
          onPress={() => router.push("/product-form")}
        />

        {/* ── Manage Modal ─────────────────────────────────────────────────── */}
        <Portal>
          <Dialog visible={showManage} onDismiss={closeManage}>
            <Dialog.Title style={{ color: "#15803d", fontWeight: "bold" }}>
              Manage Categories
            </Dialog.Title>

            <Dialog.ScrollArea style={{ maxHeight: 520, paddingHorizontal: 0, paddingBottom: 0 }}>
              <ScrollView
                contentContainerStyle={{ paddingVertical: 8, paddingBottom: 24 }}
                keyboardShouldPersistTaps="handled"
              >
                {/* ── Category list ─────────────────────────────────────── */}
                <Text
                  variant="labelSmall"
                  style={{ paddingHorizontal: 24, paddingBottom: 6, color: "#9ca3af" }}
                >
                  CATEGORIES — tap to expand
                </Text>

                {manageCategories.length === 0 && (
                  <Text style={{ paddingHorizontal: 24, color: "gray", paddingVertical: 8 }}>
                    No categories yet
                  </Text>
                )}

                {manageCategories.map((cat) => {
                  const entry = resolveColor(cat.color, CATEGORY_PALETTE);
                  const isExpanded = manageSelectedCategory === cat.id;
                  const isEditing = editCat?.id === cat.id;

                  return (
                    <View key={cat.id}>
                      {isEditing ? (
                        /* ── Edit category inline ── */
                        <View
                          style={{
                            paddingHorizontal: 24,
                            paddingVertical: 10,
                            gap: 8,
                            backgroundColor: "#f0fdf4",
                            borderRadius: 10,
                            marginHorizontal: 12,
                            marginBottom: 4,
                            borderWidth: 1,
                            borderColor: "#d1fae5",
                          }}
                        >
                          <GreenInput
                            label="Category name"
                            value={editCatName}
                            onChangeText={setEditCatName}
                            autoFocus
                          />
                          <ColorPicker
                            label="Color"
                            palette={CATEGORY_PALETTE}
                            value={editCatColor}
                            onChange={setEditCatColor}
                          />
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <Button
                              mode="contained"
                              compact
                              buttonColor="#16a34a"
                              onPress={handleSaveEditCat}
                              style={{ flex: 1, borderRadius: 8 }}
                            >
                              Save
                            </Button>
                            <Button
                              compact
                              textColor="#6b7280"
                              onPress={() => setEditCat(null)}
                              style={{ flex: 1 }}
                            >
                              Cancel
                            </Button>
                          </View>
                        </View>
                      ) : (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingLeft: 24,
                            paddingRight: 8,
                            backgroundColor: isExpanded ? "#f0fdf4" : "transparent",
                          }}
                        >
                          {/* Color dot */}
                          <View
                            style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: entry.bg,
                              borderWidth: 1,
                              borderColor: entry.border,
                              marginRight: 8,
                            }}
                          />
                          <TouchableOpacity
                            onPress={() => handleManageCategoryPress(cat.id)}
                            style={{ flex: 1, paddingVertical: 10 }}
                          >
                            <Text
                              variant="bodyMedium"
                              style={{
                                color: isExpanded ? "#16a34a" : "#111827",
                                fontWeight: isExpanded ? "700" : "400",
                              }}
                            >
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                          <IconButton
                            icon="pencil-outline"
                            size={18}
                            iconColor="#6b7280"
                            onPress={() => {
                              setEditCat(cat);
                              setEditCatName(cat.name);
                              setEditCatColor(cat.color);
                              setManageSelectedCategory(null);
                              setManageSubcategories([]);
                            }}
                          />
                          <IconButton
                            icon="delete-outline"
                            size={18}
                            iconColor="#ef4444"
                            onPress={() =>
                              setDeleteTarget({ id: cat.id, name: cat.name, type: "category" })
                            }
                          />
                        </View>
                      )}

                      {/* ── Subcategory list ───────────────────────────── */}
                      {isExpanded && !isEditing && (
                        <View
                          style={{
                            marginLeft: 44,
                            marginRight: 8,
                            marginBottom: 8,
                            borderLeftWidth: 2,
                            borderLeftColor: entry.bg,
                            paddingLeft: 12,
                            gap: 2,
                          }}
                        >
                          {manageSubcategories.length === 0 && !showAddSub && (
                            <Text variant="bodySmall" style={{ color: "gray", paddingVertical: 4 }}>
                              No subcategories
                            </Text>
                          )}

                          {manageSubcategories.map((sub) => {
                            const subEntry = resolveColor(sub.color, SUBCATEGORY_PALETTE);
                            const isEditingSub = editSub?.id === sub.id;

                            return (
                              <View key={sub.id}>
                                {isEditingSub ? (
                                  <View
                                    style={{
                                      paddingVertical: 8,
                                      paddingHorizontal: 8,
                                      gap: 8,
                                      backgroundColor: "#f0fdf4",
                                      borderRadius: 10,
                                      borderWidth: 1,
                                      borderColor: "#d1fae5",
                                      marginVertical: 4,
                                    }}
                                  >
                                    <GreenInput
                                      label="Subcategory name"
                                      value={editSubName}
                                      onChangeText={setEditSubName}
                                      autoFocus
                                    />
                                    <ColorPicker
                                      label="Color"
                                      palette={SUBCATEGORY_PALETTE}
                                      value={editSubColor}
                                      onChange={setEditSubColor}
                                    />
                                    <View style={{ flexDirection: "row", gap: 8 }}>
                                      <Button
                                        mode="contained"
                                        compact
                                        buttonColor="#16a34a"
                                        onPress={handleSaveEditSub}
                                        style={{ flex: 1, borderRadius: 8 }}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        compact
                                        textColor="#6b7280"
                                        onPress={() => setEditSub(null)}
                                        style={{ flex: 1 }}
                                      >
                                        Cancel
                                      </Button>
                                    </View>
                                  </View>
                                ) : (
                                  <View
                                    style={{
                                      flexDirection: "row",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <View
                                      style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        gap: 6,
                                        flex: 1,
                                      }}
                                    >
                                      <View
                                        style={{
                                          width: 10,
                                          height: 10,
                                          borderRadius: 5,
                                          backgroundColor: subEntry.bg,
                                          borderWidth: 1,
                                          borderColor: subEntry.border,
                                        }}
                                      />
                                      <Text variant="bodySmall" style={{ color: "#374151" }}>
                                        {sub.name}
                                      </Text>
                                    </View>
                                    <View style={{ flexDirection: "row" }}>
                                      <IconButton
                                        icon="pencil-outline"
                                        size={16}
                                        iconColor="#6b7280"
                                        onPress={() => {
                                          setEditSub(sub);
                                          setEditSubName(sub.name);
                                          setEditSubColor(sub.color);
                                        }}
                                      />
                                      <IconButton
                                        icon="delete-outline"
                                        size={16}
                                        iconColor="#ef4444"
                                        onPress={() =>
                                          setDeleteTarget({
                                            id: sub.id,
                                            name: sub.name,
                                            type: "subcategory",
                                          })
                                        }
                                      />
                                    </View>
                                  </View>
                                )}
                              </View>
                            );
                          })}

                          {/* Add subcategory inline form */}
                          {showAddSub ? (
                            <View
                              style={{
                                paddingVertical: 8,
                                paddingHorizontal: 8,
                                gap: 8,
                                backgroundColor: "#f0fdf4",
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: "#d1fae5",
                                marginVertical: 4,
                              }}
                            >
                              <GreenInput
                                label="Subcategory name"
                                value={addSubName}
                                onChangeText={setAddSubName}
                                autoFocus
                              />
                              <ColorPicker
                                label="Color"
                                palette={SUBCATEGORY_PALETTE}
                                value={addSubColor}
                                onChange={setAddSubColor}
                              />
                              <View style={{ flexDirection: "row", gap: 8 }}>
                                <Button
                                  mode="contained"
                                  compact
                                  buttonColor="#16a34a"
                                  onPress={handleSaveNewSub}
                                  style={{ flex: 1, borderRadius: 8 }}
                                >
                                  Add
                                </Button>
                                <Button
                                  compact
                                  textColor="#6b7280"
                                  onPress={() => setShowAddSub(false)}
                                  style={{ flex: 1 }}
                                >
                                  Cancel
                                </Button>
                              </View>
                            </View>
                          ) : (
                            <Button
                              mode="text"
                              compact
                              icon="plus"
                              textColor="#16a34a"
                              onPress={() => {
                                setAddSubName("");
                                setAddSubColor(SUBCATEGORY_PALETTE[0].bg);
                                setShowAddSub(true);
                              }}
                              style={{ alignSelf: "flex-start" }}
                            >
                              Add subcategory
                            </Button>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}

                <Divider style={{ marginVertical: 8 }} />

                {/* ── Add category inline form ───────────────────────────── */}
                {showAddCat ? (
                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      gap: 8,
                      backgroundColor: "#f0fdf4",
                      borderRadius: 10,
                      marginHorizontal: 12,
                      borderWidth: 1,
                      borderColor: "#d1fae5",
                    }}
                  >
                    <GreenInput
                      label="Category name"
                      value={addCatName}
                      onChangeText={setAddCatName}
                      autoFocus
                    />
                    <ColorPicker
                      label="Color"
                      palette={CATEGORY_PALETTE}
                      value={addCatColor}
                      onChange={setAddCatColor}
                    />
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <Button
                        mode="contained"
                        compact
                        buttonColor="#16a34a"
                        onPress={handleSaveNewCat}
                        style={{ flex: 1, borderRadius: 8 }}
                      >
                        Add
                      </Button>
                      <Button
                        compact
                        textColor="#6b7280"
                        onPress={() => setShowAddCat(false)}
                        style={{ flex: 1 }}
                      >
                        Cancel
                      </Button>
                    </View>
                  </View>
                ) : (
                  <Button
                    mode="text"
                    icon="plus"
                    textColor="#16a34a"
                    onPress={() => {
                      setAddCatName("");
                      setAddCatColor(CATEGORY_PALETTE[0].bg);
                      setShowAddCat(true);
                      setManageSelectedCategory(null);
                      setManageSubcategories([]);
                    }}
                    style={{ marginHorizontal: 16 }}
                  >
                    Add Category
                  </Button>
                )}
              </ScrollView>
            </Dialog.ScrollArea>

            <Dialog.Actions>
              <Button textColor="#16a34a" onPress={closeManage}>
                Done
              </Button>
            </Dialog.Actions>
          </Dialog>

          {/* Delete Confirm */}
          <Dialog visible={!!deleteTarget} onDismiss={() => setDeleteTarget(null)}>
            <Dialog.Title>
              Delete {deleteTarget?.type === "category" ? "Category" : "Subcategory"}
            </Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                Are you sure you want to delete "{deleteTarget?.name}"?
                {deleteTarget?.type === "category" &&
                  " All its subcategories will also be deleted."}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button textColor="#6b7280" onPress={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button textColor="#ef4444" onPress={handleDelete}>
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </KeyboardAvoidingView>
  );
}