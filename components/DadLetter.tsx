import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import * as Haptics from "expo-haptics";
import type { LetterType } from "@/game/types";

interface Props {
  letter: LetterType;
  onDismiss: (letter: LetterType) => void;
}

const LETTERS: Record<LetterType, { title: string; body: string; ps: string; coinReward: number }> = {
  intro: {
    title: "A Letter From Dad",
    body: "Hey kid,\n\nHeard you're getting into the fighting business. Don't embarrass me out there! Keep your guard up, remember flashy kicks don't always work, and listen to your coaches.\n\nYou've got heart — just don't let it get you knocked out.",
    ps: "P.S. Here is a little something to get you started.",
    coinReward: 5,
  },
  win50: {
    title: "Another Letter From Dad",
    body: "Well look at you — 50 wins!\n\nI knew you had it in you. Honestly, I'm incredibly proud of you, kid. Keep dominating the ring. You've come a long way from that scrawny little brawler I knew.\n\nMake me proud out there.",
    ps: "P.S. Here's a real bonus for making it this far. Go hire the best coaches money can buy!",
    coinReward: 100,
  },
};

export function DadLetter({ letter, onDismiss }: Props) {
  const { width: W } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const data = LETTERS[letter];

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 40, duration: 250, useNativeDriver: true }),
    ]).start(() => onDismiss(letter));
  };

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
      <Animated.View style={[styles.card, { width: Math.min(W * 0.82, 420), transform: [{ translateY: slideAnim }] }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.envelope}>✉️</Text>
          <Text style={styles.title}>{data.title}</Text>
        </View>

        {/* Paper lines */}
        <View style={styles.paper}>
          <Text style={styles.body}>{data.body}</Text>
          <View style={styles.divider} />
          <Text style={styles.ps}>{data.ps}</Text>

          <View style={styles.rewardRow}>
            <View style={styles.coinBadge}>
              <Text style={styles.coinText}>🪙 +{data.coinReward} COINS</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleDismiss}
          style={({ pressed }) => [styles.closeBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.closeBtnText}>Thanks, Dad</Text>
        </Pressable>
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
    zIndex: 999,
  },
  card: {
    backgroundColor: "#0d0508",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#f39c1266",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff11",
    backgroundColor: "#1a0a00",
  },
  envelope: {
    fontSize: 22,
  },
  title: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#f39c12",
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  paper: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  body: {
    fontSize: 13,
    color: "#ffffffcc",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: "#ffffff11",
  },
  ps: {
    fontSize: 12,
    color: "#ffffff88",
    fontStyle: "italic",
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  rewardRow: {
    alignItems: "center",
    marginTop: 4,
  },
  coinBadge: {
    backgroundColor: "#f39c1222",
    borderWidth: 1.5,
    borderColor: "#f39c12",
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  coinText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#f39c12",
    letterSpacing: 2,
    fontFamily: "Inter_700Bold",
  },
  closeBtn: {
    backgroundColor: "#ff6b00",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
});
