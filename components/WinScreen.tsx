import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";

interface Props {
  won: boolean;
  coinsEarned: number;
  winStreak: number;
  onNextMatch: () => void;
  onGoHome: () => void;
}

export function WinScreen({ won, coinsEarned, winStreak, onNextMatch, onGoHome }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const trophyBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Haptics.notificationAsync(
      won ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
    );
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
    ]).start(() => {
      if (won) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(trophyBounce, { toValue: -8, duration: 400, useNativeDriver: true }),
            Animated.timing(trophyBounce, { toValue: 0, duration: 400, useNativeDriver: true }),
          ]),
          { iterations: 3 }
        ).start();
      }
    });
  }, []);

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
        {/* Trophy / skull */}
        <Animated.Text style={[styles.icon, { transform: [{ translateY: trophyBounce }] }]}>
          {won ? "🏆" : "💀"}
        </Animated.Text>

        {/* Result text */}
        <Text style={[styles.resultText, { color: won ? "#ffd700" : "#e74c3c" }]}>
          {won ? "VICTORY!" : "DEFEATED"}
        </Text>

        {/* Coins earned (win only) */}
        {won && coinsEarned > 0 && (
          <View style={styles.coinsRow}>
            <Text style={styles.coinsLabel}>COINS EARNED</Text>
            <View style={styles.coinsBadge}>
              <Text style={styles.coinsValue}>🪙 +{coinsEarned}</Text>
            </View>
          </View>
        )}

        {/* Win streak (win only) */}
        {won && winStreak > 1 && (
          <View style={styles.streakRow}>
            <Text style={styles.streakText}>🔥 {winStreak} WIN STREAK! +{Math.round((winStreak - 1) * 10)}% bonus</Text>
          </View>
        )}

        {/* Lose message */}
        {!won && (
          <Text style={styles.loseMsg}>Keep training and come back stronger.</Text>
        )}

        {/* Buttons */}
        <View style={styles.btnRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onNextMatch();
            }}
            style={({ pressed }) => [styles.btn, styles.btnPrimary, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.btnPrimaryText}>{won ? "NEXT MATCH" : "RETRY"}</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onGoHome();
            }}
            style={({ pressed }) => [styles.btn, styles.btnSecondary, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.btnSecondaryText}>GO HOME</Text>
          </Pressable>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000bb",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  card: {
    backgroundColor: "#0d0508",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ffffff22",
    paddingHorizontal: 32,
    paddingVertical: 28,
    alignItems: "center",
    minWidth: 280,
    gap: 12,
  },
  icon: {
    fontSize: 56,
  },
  resultText: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 4,
    fontFamily: "Inter_700Bold",
  },
  coinsRow: {
    alignItems: "center",
    gap: 6,
  },
  coinsLabel: {
    fontSize: 9,
    color: "#ffffff55",
    letterSpacing: 3,
    fontFamily: "Inter_400Regular",
  },
  coinsBadge: {
    backgroundColor: "#f39c1222",
    borderWidth: 1.5,
    borderColor: "#f39c12",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  coinsValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#f39c12",
    letterSpacing: 2,
    fontFamily: "Inter_700Bold",
  },
  streakRow: {
    backgroundColor: "#ff6b0022",
    borderWidth: 1,
    borderColor: "#ff6b0066",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  streakText: {
    fontSize: 11,
    color: "#ff8c00",
    fontFamily: "Inter_600SemiBold",
  },
  loseMsg: {
    fontSize: 12,
    color: "#ffffff55",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  btn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 110,
  },
  btnPrimary: {
    backgroundColor: "#ff6b00",
  },
  btnPrimaryText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 2,
    fontFamily: "Inter_700Bold",
  },
  btnSecondary: {
    backgroundColor: "#ffffff11",
    borderWidth: 1.5,
    borderColor: "#ffffff33",
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#ffffff88",
    letterSpacing: 2,
    fontFamily: "Inter_700Bold",
  },
});
