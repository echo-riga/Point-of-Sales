// components/ProductTile.tsx
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { resolveColor, ColorEntry } from "./ColorPicker";
import { Ionicons } from "@expo/vector-icons";

interface ProductTileProps {
  name: string;
  color: string;
  palette: ColorEntry[];
  onPress: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
  isDeleteMode?: boolean;
  isShaking?: boolean;
  badgeText?: string;
  disabled?: boolean;
}

export const TILE_WIDTH = 140;
export const TILE_HEIGHT = 88;

export default function ProductTile({
  name,
  color,
  palette,
  onPress,
  onLongPress,
  isSelected = false,
  isDeleteMode = false,
  isShaking = false,
  badgeText,
  disabled = false,
}: ProductTileProps) {
  const entry = resolveColor(color, palette);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isShaking || isDeleteMode) {
      const randomOffset = Math.random() * 4 - 2;
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: -2.5 + randomOffset * 0.2,
            duration: 85,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 2.5 + randomOffset * 0.2,
            duration: 85,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 85,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      anim.stopAnimation();
      anim.setValue(0);
    }

    return () => {
      if (animation) animation.stop();
    };
  }, [isShaking, isDeleteMode]);

  const rotate = anim.interpolate({
    inputRange: [-3, 0, 3],
    outputRange: ["-2deg", "0deg", "2deg"],
  });

  const translateX = anim.interpolate({
    inputRange: [-3, 0, 3],
    outputRange: [-1.5, 0, 1.5],
  });

  // Determine badge styling based on whether text is white (saturated card) or dark
  const isDarkBg = entry.text.toLowerCase() === "#ffffff";

  return (
    <Animated.View
      style={{
        transform: [{ rotate }, { translateX }],
        margin: 6,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        style={[
          styles.card,
          {
            backgroundColor: isSelected ? "#fee2e2" : entry.bg,
            borderColor: isSelected ? "#dc2626" : entry.border,
            borderWidth: isSelected ? 2.5 : 1.5,
          },
        ]}
      >
        {/* Selection Checkbox / Delete Icon Badge */}
        {isDeleteMode && (
          <View
            style={[
              styles.selectBadge,
              { backgroundColor: isSelected ? "#dc2626" : "#ffffff" },
            ]}
          >
            <Ionicons
              name={isSelected ? "checkmark" : "trash-outline"}
              size={13}
              color={isSelected ? "#ffffff" : "#9ca3af"}
            />
          </View>
        )}

        {/* Type Badge: Category / Subcategory / Product */}
        {badgeText && !isDeleteMode && (
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: isDarkBg
                  ? "rgba(255,255,255,0.25)"
                  : "rgba(0,0,0,0.07)",
              },
            ]}
          >
            <Text
              style={[
                styles.typeBadgeText,
                {
                  color: isDarkBg ? "#ffffff" : "#4b5563",
                },
              ]}
            >
              {badgeText}
            </Text>
          </View>
        )}

        {/* Name with word wrapping */}
        <Text
          numberOfLines={3}
          ellipsizeMode="tail"
          style={[
            styles.title,
            {
              color: isSelected ? "#991b1b" : entry.text,
              marginTop: badgeText && !isDeleteMode ? 8 : 0,
            },
          ]}
        >
          {name || "Item"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    position: "relative",
  },
  title: {
    textAlign: "center",
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 17,
  },
  selectBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    zIndex: 10,
    elevation: 3,
  },
  typeBadge: {
    position: "absolute",
    top: 5,
    left: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 8.5,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
