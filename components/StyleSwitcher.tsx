import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { MARTIAL_ARTS, getStyle } from "@/game/styles";
import type { StyleId } from "@/game/types";

interface Props {
  currentStyle: StyleId;
  unlockedStyles: StyleId[];
  onSwitch: (id: StyleId) => void;
}

const ABBREV: Record<StyleId, string> = {
  boxing: "BOX",
  kickboxing: "KB",
  bjj: "BJJ",
  aikido: "AKD",
  muaythai: "MT",
  judo: "JDO",
  taekwondo: "TKD",
  kungfu: "KF",
  mma: "MMA",
  wrestling: "WRS",
};

export function StyleSwitcher({ currentStyle, unlockedStyles, onSwitch }: Props) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {unlockedStyles.map((id) => {
          const style = getStyle(id);
          const active = id === currentStyle;
          return (
            <Pressable
              key={id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSwitch(id);
              }}
              style={[
                styles.chip,
                {
                  borderColor: style.color,
                  backgroundColor: active ? style.color : style.color + "22",
                },
              ]}
            >
              <Text style={[styles.chipText, { color: active ? "#fff" : style.color }]}>
                {ABBREV[id]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 4,
  },
  row: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 10,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
    fontFamily: "Inter_700Bold",
  },
});
