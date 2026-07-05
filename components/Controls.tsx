import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

interface Props {
  onPunch: () => void;
  onKick: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}

function MoveBtn({
  label,
  onMoveLeft,
  onMoveRight,
}: {
  label: string;
  onMoveLeft: () => void;
  onMoveRight: () => void;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = (fn: () => void) => {
    fn();
    intervalRef.current = setInterval(fn, 80);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const isLeft = label === "◀";
  const fn = isLeft ? onMoveLeft : onMoveRight;

  return (
    <Pressable
      onPressIn={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); start(fn); }}
      onPressOut={stop}
      style={({ pressed }) => [
        styles.btn,
        styles.moveBtn,
        { backgroundColor: pressed ? "#3498db44" : "#3498db1a", borderColor: "#3498db" },
      ]}
    >
      <Text style={[styles.btnLabel, { color: "#3498db", fontSize: 22 }]}>{label}</Text>
    </Pressable>
  );
}

function AttackBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
      style={({ pressed }) => [
        styles.btn,
        styles.attackBtn,
        { backgroundColor: pressed ? color + "55" : color + "1a", borderColor: color },
      ]}
    >
      <Text style={[styles.btnLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function Controls({ onPunch, onKick, onMoveLeft, onMoveRight }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.side}>
        <MoveBtn label="◀" onMoveLeft={onMoveLeft} onMoveRight={onMoveRight} />
        <MoveBtn label="▶" onMoveLeft={onMoveLeft} onMoveRight={onMoveRight} />
      </View>
      <View style={styles.side}>
        <AttackBtn label="PUNCH" color="#e74c3c" onPress={onPunch} />
        <AttackBtn label="KICK" color="#f39c12" onPress={onKick} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 18,
    paddingBottom: 10,
    paddingTop: 6,
  },
  side: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  moveBtn: {
    width: 68,
    height: 58,
  },
  attackBtn: {
    width: 80,
    height: 58,
  },
  btnLabel: {
    fontSize: 13,
    fontWeight: "700" as const,
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
});
