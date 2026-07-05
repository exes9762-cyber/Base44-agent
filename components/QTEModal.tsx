import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { QTEEvent, QTEType } from "@/game/types";

interface Props {
  qte: QTEEvent;
  onAction: (type: QTEType) => void;
}

const QTE_LABELS: Record<QTEType, string> = {
  DODGE: "DODGE",
  DUCK: "DUCK",
  PARRY: "PARRY",
  COUNTER: "COUNTER",
};

const QTE_COLORS: Record<QTEType, string> = {
  DODGE: "#3498db",
  DUCK: "#27ae60",
  PARRY: "#f39c12",
  COUNTER: "#9b59b6",
};

const ALL_QTE: QTEType[] = ["DODGE", "DUCK", "PARRY", "COUNTER"];

export function QTEModal({ qte, onAction }: Props) {
  const { width: W } = useWindowDimensions();
  const timerAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const remaining = Math.max(0, qte.deadline - Date.now());

  useEffect(() => {
    timerAnim.setValue(1);
    Animated.timing(timerAnim, {
      toValue: 0,
      duration: remaining,
      useNativeDriver: false,
    }).start();

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 250, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [qte.type]);

  const barColor = timerAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: ["#e74c3c", "#f39c12", "#2ecc71"],
  });

  return (
    <View style={styles.overlay}>
      <Animated.View style={[styles.container, { width: W * 0.65, transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.incomingLabel}>⚡ INCOMING ATTACK</Text>

        {/* Timer bar */}
        <View style={styles.timerBg}>
          <Animated.View
            style={[styles.timerBar, { flex: timerAnim as any, backgroundColor: barColor }]}
          />
        </View>

        {/* Correct move highlight */}
        <Text style={[styles.correctMove, { color: QTE_COLORS[qte.type] }]}>
          {QTE_LABELS[qte.type]}!
        </Text>

        {/* All buttons */}
        <View style={styles.btnRow}>
          {ALL_QTE.map((type) => (
            <Pressable
              key={type}
              onPress={() => onAction(type)}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: type === qte.type ? QTE_COLORS[type] : "#ffffff11",
                  borderColor: QTE_COLORS[type],
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: type === qte.type ? 1.1 : 1 }],
                },
              ]}
            >
              <Text style={[styles.btnText, { color: type === qte.type ? "#fff" : QTE_COLORS[type] }]}>
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000077",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    backgroundColor: "#0d0508ee",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff22",
    gap: 10,
  },
  incomingLabel: {
    fontSize: 13,
    color: "#ff6b00",
    fontWeight: "700" as const,
    letterSpacing: 2,
    fontFamily: "Inter_700Bold",
  },
  timerBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#ffffff22",
    borderRadius: 4,
    flexDirection: "row",
    overflow: "hidden",
  },
  timerBar: {
    height: "100%",
    borderRadius: 4,
  },
  correctMove: {
    fontSize: 20,
    fontWeight: "700" as const,
    letterSpacing: 3,
    fontFamily: "Inter_700Bold",
  },
  btnRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    minWidth: 70,
    alignItems: "center",
  },
  btnText: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
});
