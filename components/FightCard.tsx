import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import * as Haptics from "expo-haptics";
import type { CpuFighter } from "@/game/fighters";
import { getStyle } from "@/game/styles";
import type { GameState } from "@/game/types";

interface Props {
  state: GameState;
  onFight: () => void;
  onGoHome: () => void;
}

export function FightCard({ state, onFight, onGoHome }: Props) {
  const { width: W } = useWindowDimensions();
  const enemy = state.currentEnemy;
  const playerStyle = getStyle(state.playerStyle);

  const bgFade = useRef(new Animated.Value(0)).current;
  const leftSlide = useRef(new Animated.Value(-W * 0.5)).current;
  const rightSlide = useRef(new Animated.Value(W * 0.5)).current;
  const vsScale = useRef(new Animated.Value(0)).current;
  const btnSlide = useRef(new Animated.Value(80)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Animated.sequence([
      Animated.timing(bgFade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(leftSlide, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
        Animated.spring(rightSlide, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
      ]),
      Animated.spring(vsScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      Animated.spring(btnSlide, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
    ]).start();

    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    glow.start();
    return () => glow.stop();
  }, []);

  if (!enemy) return null;

  const enemyStyle = getStyle(enemy.styleId);
  const playerRecord = `${state.totalWins}-${Math.max(0, state.winStreak === 0 ? 0 : 0)}-0`;

  return (
    <Animated.View style={[styles.overlay, { opacity: bgFade }]}>
      {/* Red glow background */}
      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowPulse,
            backgroundColor: enemy.color + "22",
          },
        ]}
      />

      <Text style={styles.announcement}>🥊 FIGHT ANNOUNCEMENT 🥊</Text>

      <View style={styles.cardsRow}>
        {/* PLAYER CARD */}
        <Animated.View style={[styles.card, styles.playerCard, { transform: [{ translateX: leftSlide }], borderColor: playerStyle.color }]}>
          <View style={[styles.cardHeader, { backgroundColor: playerStyle.color + "33" }]}>
            <Text style={[styles.cardBadge, { color: playerStyle.color }]}>CHALLENGER</Text>
          </View>
          <View style={styles.fighterIcon}>
            <Text style={styles.fighterEmoji}>🥊</Text>
          </View>
          <Text style={[styles.fighterName, { color: playerStyle.color }]}>YOU</Text>
          <Text style={styles.fighterNickname}>"{state.playerStyle.toUpperCase()}"</Text>
          <View style={styles.infoRow}>
            <View style={[styles.styleTag, { borderColor: playerStyle.color }]}>
              <Text style={[styles.styleTagText, { color: playerStyle.color }]}>{playerStyle.name.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>WIN STREAK</Text>
            <Text style={[styles.recordValue, { color: playerStyle.color }]}>🔥 {state.winStreak}</Text>
          </View>
          <View style={styles.statsRow}>
            <StatPill label="STR" value={state.strength} color={playerStyle.color} />
            <StatPill label="AGI" value={state.agility} color={playerStyle.color} />
            <StatPill label="TMG" value={state.timing} color={playerStyle.color} />
          </View>
        </Animated.View>

        {/* VS */}
        <Animated.View style={{ transform: [{ scale: vsScale }] }}>
          <Text style={styles.vs}>VS</Text>
        </Animated.View>

        {/* ENEMY CARD */}
        <Animated.View style={[styles.card, styles.enemyCard, { transform: [{ translateX: rightSlide }], borderColor: enemy.color }]}>
          <View style={[styles.cardHeader, { backgroundColor: enemy.color + "33" }]}>
            <Text style={[styles.cardBadge, { color: enemy.color }]}>OPPONENT</Text>
          </View>
          <View style={styles.fighterIcon}>
            <Text style={styles.fighterEmoji}>💀</Text>
          </View>
          <Text style={[styles.fighterName, { color: enemy.color }]}>{enemy.name}</Text>
          <Text style={styles.fighterNickname}>"{enemy.nickname}"</Text>
          <View style={styles.infoRow}>
            <View style={[styles.styleTag, { borderColor: enemy.color }]}>
              <Text style={[styles.styleTagText, { color: enemy.color }]}>{enemyStyle.name.toUpperCase()}</Text>
            </View>
            <Text style={styles.ageText}>AGE {enemy.age}</Text>
          </View>
          <View style={styles.recordRow}>
            <Text style={styles.recordLabel}>RECORD</Text>
            <Text style={[styles.recordValue, { color: enemy.color }]}>{enemy.record}</Text>
          </View>
          <Text style={styles.description}>{enemy.description}</Text>
          {/* Weakness — intel box */}
          <View style={styles.tellBox}>
            <Text style={styles.tellLabel}>⚠ INTEL</Text>
            <Text style={styles.tellText}>{enemy.weakness}</Text>
          </View>
        </Animated.View>
      </View>

      {/* FIGHT button */}
      <Animated.View style={{ transform: [{ translateY: btnSlide }], alignItems: "center", gap: 10 }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onFight();
          }}
          style={({ pressed }) => [styles.fightBtn, { opacity: pressed ? 0.85 : 1, backgroundColor: enemy.color }]}
        >
          <Text style={styles.fightBtnText}>FIGHT!</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onGoHome();
          }}
          style={({ pressed }) => [styles.homeBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.homeBtnText}>← GO HOME</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.statPill}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000ee",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    zIndex: 90,
    paddingHorizontal: 16,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
  },
  announcement: {
    fontSize: 11,
    color: "#ffffff55",
    letterSpacing: 4,
    fontFamily: "Inter_700Bold",
  },
  cardsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  card: {
    width: 178,
    backgroundColor: "#0d0508",
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    gap: 6,
    paddingBottom: 12,
  },
  playerCard: {},
  enemyCard: {},
  cardHeader: {
    paddingVertical: 6,
    alignItems: "center",
  },
  cardBadge: {
    fontSize: 9,
    fontWeight: "700" as const,
    letterSpacing: 3,
    fontFamily: "Inter_700Bold",
  },
  fighterIcon: {
    alignItems: "center",
    paddingTop: 4,
  },
  fighterEmoji: {
    fontSize: 28,
  },
  fighterName: {
    fontSize: 16,
    fontWeight: "700" as const,
    textAlign: "center",
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 8,
  },
  fighterNickname: {
    fontSize: 10,
    color: "#ffffff55",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
  },
  styleTag: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  styleTagText: {
    fontSize: 9,
    fontWeight: "700" as const,
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
  ageText: {
    fontSize: 10,
    color: "#ffffff44",
    fontFamily: "Inter_400Regular",
  },
  recordRow: {
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
  },
  recordLabel: {
    fontSize: 8,
    color: "#ffffff33",
    letterSpacing: 2,
    fontFamily: "Inter_400Regular",
  },
  recordValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  statPill: {
    alignItems: "center",
    backgroundColor: "#ffffff11",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 1,
  },
  statLabel: {
    fontSize: 7,
    color: "#ffffff44",
    letterSpacing: 1,
    fontFamily: "Inter_400Regular",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  description: {
    fontSize: 10,
    color: "#ffffff55",
    textAlign: "center",
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 10,
    lineHeight: 14,
  },
  tellBox: {
    marginHorizontal: 10,
    backgroundColor: "#f39c1211",
    borderWidth: 1,
    borderColor: "#f39c1244",
    borderRadius: 8,
    padding: 8,
    gap: 3,
  },
  tellLabel: {
    fontSize: 8,
    color: "#f39c12",
    fontWeight: "700" as const,
    letterSpacing: 2,
    fontFamily: "Inter_700Bold",
  },
  tellText: {
    fontSize: 10,
    color: "#f39c12cc",
    fontFamily: "Inter_400Regular",
    lineHeight: 14,
  },
  vs: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#ffffff",
    letterSpacing: 4,
    fontFamily: "Inter_700Bold",
    textShadowColor: "#ff6b00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  fightBtn: {
    paddingHorizontal: 64,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  fightBtnText: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 6,
    fontFamily: "Inter_700Bold",
  },
  homeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  homeBtnText: {
    fontSize: 11,
    color: "#ffffff44",
    letterSpacing: 2,
    fontFamily: "Inter_400Regular",
  },
});
