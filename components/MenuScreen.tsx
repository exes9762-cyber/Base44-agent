import React, { useState } from "react";
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import type { Difficulty, GameState, StyleId } from "@/game/types";
import { getStyle, MARTIAL_ARTS } from "@/game/styles";

const { width: W } = Dimensions.get("window");

type MenuTab = "FIGHT" | "GYM" | "COMBOS";

interface Props {
  state: GameState;
  onStartFight: () => void;
  onSetStyle: (id: StyleId) => void;
  onHireCoach: (id: StyleId) => void;
  onUpgrade: (stat: "strength" | "agility" | "timing") => void;
  onSetDifficulty: (d: Difficulty) => void;
  isUpgrade?: boolean;
  isLose?: boolean;
}

function StatRow({
  label, value, stat, coins, onUpgrade, icon,
}: {
  label: string; value: number; stat: "strength" | "agility" | "timing";
  coins: number; onUpgrade: (s: "strength" | "agility" | "timing") => void; icon: string;
}) {
  const cost = value * 5;
  const canUpgrade = coins >= cost && value < 10;
  return (
    <View style={sty.statRow}>
      <Text style={sty.statIcon}>{icon}</Text>
      <Text style={sty.statLabel}>{label}</Text>
      <View style={sty.statDots}>
        {Array.from({ length: 10 }).map((_, i) => (
          <View key={i} style={[sty.statDot, i < value && { backgroundColor: "#f39c12" }]} />
        ))}
      </View>
      <Pressable
        onPress={() => {
          if (!canUpgrade) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onUpgrade(stat);
        }}
        style={[sty.upgradeBtn, !canUpgrade && { opacity: 0.35 }]}
      >
        <Text style={sty.upgradeBtnText}>+🪙{cost}</Text>
      </Pressable>
    </View>
  );
}

function FightTab({ state, onStartFight, onSetStyle, onSetDifficulty, onUpgrade, isUpgrade, isLose }: Props & { isUpgrade?: boolean; isLose?: boolean }) {
  return (
    <ScrollView contentContainerStyle={sty.tabScroll} showsVerticalScrollIndicator={false}>
      {isUpgrade && (
        <View style={sty.messageBadge}>
          <Text style={sty.messageText}>🏆 VICTORY! Spend your coins.</Text>
        </View>
      )}
      {isLose && (
        <View style={[sty.messageBadge, { borderColor: "#e74c3c44" }]}>
          <Text style={[sty.messageText, { color: "#e74c3c" }]}>💀 DEFEATED. Keep training.</Text>
        </View>
      )}

      <Text style={sty.sectionLabel}>ACTIVE STYLE</Text>
      <View style={sty.styleGrid}>
        {MARTIAL_ARTS.map((s) => {
          const unlocked = state.unlockedStyles.includes(s.id);
          const active = state.playerStyle === s.id;
          if (!unlocked) return null;
          return (
            <Pressable
              key={s.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSetStyle(s.id); }}
              style={[sty.styleChip, active && { borderColor: s.color, backgroundColor: s.color + "33" }]}
            >
              <Text style={[sty.styleChipText, { color: active ? s.color : "#ffffff88" }]}>{s.name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={sty.sectionLabel}>ATTRIBUTES</Text>
      <View style={sty.card}>
        <StatRow label="Strength" value={state.strength} stat="strength" coins={state.coins} onUpgrade={onUpgrade} icon="💪" />
        <StatRow label="Agility" value={state.agility} stat="agility" coins={state.coins} onUpgrade={onUpgrade} icon="⚡" />
        <StatRow label="Timing" value={state.timing} stat="timing" coins={state.coins} onUpgrade={onUpgrade} icon="🎯" />
      </View>

      <Text style={sty.sectionLabel}>DIFFICULTY</Text>
      <View style={sty.diffRow}>
        {(["easy", "normal", "hard"] as Difficulty[]).map((d) => (
          <Pressable
            key={d}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onSetDifficulty(d); }}
            style={[sty.diffBtn, state.difficulty === d && { backgroundColor: "#ffffff22", borderColor: "#fff" }]}
          >
            <Text style={[sty.diffText, state.difficulty === d && { color: "#fff" }]}>{d.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); onStartFight(); }}
        style={({ pressed }) => [sty.fightBtn, { opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={sty.fightBtnText}>{isUpgrade ? "NEXT FIGHT" : "FIGHT"}</Text>
      </Pressable>
      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

function GymTab({ state, onHireCoach }: { state: GameState; onHireCoach: (id: StyleId) => void }) {
  return (
    <ScrollView contentContainerStyle={sty.tabScroll} showsVerticalScrollIndicator={false}>
      <Text style={sty.gymTitle}>Training Gym</Text>
      <Text style={sty.gymSubtitle}>Hire a coach to permanently unlock a new fighting style.</Text>
      {MARTIAL_ARTS.map((s) => {
        const unlocked = state.unlockedStyles.includes(s.id);
        const canAfford = state.coins >= s.unlockCost;
        return (
          <View
            key={s.id}
            style={[sty.coachCard, unlocked && { borderColor: s.color + "66", backgroundColor: s.color + "11" }]}
          >
            <View style={sty.coachLeft}>
              <View style={[sty.coachDot, { backgroundColor: unlocked ? s.color : "#ffffff33" }]} />
              <View>
                <Text style={[sty.coachStyleName, { color: unlocked ? s.color : "#fff" }]}>{s.name}</Text>
                <Text style={sty.coachName}>{s.coachName} · {s.coachTag}</Text>
                <Text style={sty.coachDesc}>{s.description}</Text>
              </View>
            </View>
            {unlocked ? (
              <View style={sty.unlockedTag}>
                <Text style={sty.unlockedText}>HIRED ✓</Text>
              </View>
            ) : s.unlockCost === 0 ? (
              <View style={sty.unlockedTag}>
                <Text style={sty.unlockedText}>FREE ✓</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  if (!canAfford) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  onHireCoach(s.id);
                }}
                style={[sty.hireBtn, !canAfford && { opacity: 0.4 }]}
              >
                <Text style={sty.hireBtnText}>🪙{s.unlockCost}</Text>
                <Text style={sty.hireBtnSub}>HIRE</Text>
              </Pressable>
            )}
          </View>
        );
      })}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const INPUT_ICONS: Record<string, string> = { P: "👊", K: "🦵" };

function CombosTab({ state }: { state: GameState }) {
  const [expanded, setExpanded] = useState<StyleId | null>(state.playerStyle);
  return (
    <ScrollView contentContainerStyle={sty.tabScroll} showsVerticalScrollIndicator={false}>
      <Text style={sty.gymTitle}>Combo List</Text>
      <Text style={sty.gymSubtitle}>Tap a style to see its input sequences.</Text>
      {MARTIAL_ARTS.map((s) => {
        const unlocked = state.unlockedStyles.includes(s.id);
        const open = expanded === s.id;
        return (
          <View key={s.id} style={sty.comboStyleBlock}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExpanded(open ? null : s.id); }}
              style={[sty.comboHeader, { borderColor: unlocked ? s.color + "88" : "#ffffff22" }]}
            >
              <Text style={[sty.comboStyleName, { color: unlocked ? s.color : "#ffffff44" }]}>
                {unlocked ? s.name : `🔒 ${s.name}`}
              </Text>
              <Text style={{ color: "#ffffff44", fontSize: 14 }}>{open ? "▲" : "▼"}</Text>
            </Pressable>
            {open && (
              <View style={sty.comboList}>
                {unlocked ? (
                  s.combos.map((c, i) => (
                    <View key={i} style={sty.comboRow}>
                      <View style={sty.comboInputs}>
                        {c.inputs.map((inp, j) => (
                          <React.Fragment key={j}>
                            <Text style={sty.comboInputEmoji}>{INPUT_ICONS[inp]}</Text>
                            {j < c.inputs.length - 1 && <Text style={sty.comboArrow}>→</Text>}
                          </React.Fragment>
                        ))}
                      </View>
                      <Text style={sty.comboName}>{c.name}</Text>
                      <View style={sty.comboBadges}>
                        <Text style={sty.comboDmg}>⚡{c.damage}</Text>
                        {c.isMega && <View style={sty.megaBadge}><Text style={sty.megaText}>MEGA</Text></View>}
                        {c.isHighRisk && <View style={sty.riskBadge}><Text style={sty.riskText}>HIGH RISK</Text></View>}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={sty.lockedCombos}>
                    <Text style={sty.lockedComboText}>🔒 Unlock this style in the Gym to reveal combos.</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        );
      })}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

export function MenuScreen({
  state,
  onStartFight,
  onSetStyle,
  onHireCoach,
  onUpgrade,
  onSetDifficulty,
  isUpgrade,
  isLose,
}: Props) {
  const [tab, setTab] = useState<MenuTab>("FIGHT");

  return (
    <View style={sty.overlay}>
      {/* Header */}
      <View style={sty.header}>
        <View style={sty.titleRow}>
          <Text style={sty.title}>UNTITLED</Text>
          <Text style={sty.titleSub}>FIGHTING GAME</Text>
        </View>
        <View style={sty.statsRow}>
          <View style={sty.statChip}>
            <Text style={sty.statChipNum}>🔥{state.winStreak}</Text>
            <Text style={sty.statChipLabel}>STREAK</Text>
          </View>
          <View style={sty.statChip}>
            <Text style={sty.statChipNum}>{state.totalWins}</Text>
            <Text style={sty.statChipLabel}>WINS</Text>
          </View>
          <View style={[sty.statChip, { borderColor: "#f39c1244" }]}>
            <Text style={[sty.statChipNum, { color: "#f39c12" }]}>🪙{state.coins}</Text>
            <Text style={sty.statChipLabel}>COINS</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={sty.tabBar}>
        {(["FIGHT", "GYM", "COMBOS"] as MenuTab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
            style={[sty.tabBtn, tab === t && sty.tabBtnActive]}
          >
            <Text style={[sty.tabBtnText, tab === t && sty.tabBtnTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>
        {tab === "FIGHT" && (
          <FightTab
            state={state}
            onStartFight={onStartFight}
            onSetStyle={onSetStyle}
            onHireCoach={onHireCoach}
            onUpgrade={onUpgrade}
            onSetDifficulty={onSetDifficulty}
            isUpgrade={isUpgrade}
            isLose={isLose}
          />
        )}
        {tab === "GYM" && <GymTab state={state} onHireCoach={onHireCoach} />}
        {tab === "COMBOS" && <CombosTab state={state} />}
      </View>
    </View>
  );
}

const sty = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#050302ee" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ffffff11",
  },
  titleRow: {},
  title: { fontSize: 20, fontWeight: "700" as const, color: "#ff6b00", letterSpacing: 4, fontFamily: "Inter_700Bold" },
  titleSub: { fontSize: 8, letterSpacing: 6, color: "#ffffff44", fontFamily: "Inter_400Regular" },
  statsRow: { flexDirection: "row", gap: 8 },
  statChip: { alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "#ffffff22", backgroundColor: "#ffffff08", minWidth: 52 },
  statChipNum: { fontSize: 14, fontWeight: "700" as const, color: "#fff", fontFamily: "Inter_700Bold" },
  statChipLabel: { fontSize: 7, color: "#ffffff55", letterSpacing: 1, fontFamily: "Inter_400Regular" },

  tabBar: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ffffff11" },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabBtnActive: { borderBottomWidth: 2, borderBottomColor: "#ff6b00" },
  tabBtnText: { fontSize: 11, color: "#ffffff55", letterSpacing: 2, fontFamily: "Inter_600SemiBold" },
  tabBtnTextActive: { color: "#ff6b00" },

  tabScroll: { paddingHorizontal: 16, paddingTop: 12 },

  messageBadge: { borderWidth: 1, borderColor: "#f39c1244", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 10, backgroundColor: "#f39c1211" },
  messageText: { color: "#f39c12", fontSize: 12, fontFamily: "Inter_600SemiBold" },

  sectionLabel: { fontSize: 9, color: "#ffffff44", letterSpacing: 3, marginBottom: 6, fontFamily: "Inter_400Regular" },

  styleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 12 },
  styleChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: "#ffffff22" },
  styleChipText: { fontSize: 11, fontWeight: "700" as const, fontFamily: "Inter_600SemiBold" },

  card: { backgroundColor: "#ffffff08", borderRadius: 10, padding: 10, marginBottom: 12, gap: 8, borderWidth: 1, borderColor: "#ffffff11" },
  statRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statIcon: { fontSize: 13, width: 18 },
  statLabel: { fontSize: 11, color: "#ffffffbb", width: 60, fontFamily: "Inter_500Medium" },
  statDots: { flexDirection: "row", gap: 2, flex: 1 },
  statDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#ffffff22", borderWidth: 1, borderColor: "#ffffff33" },
  upgradeBtn: { backgroundColor: "#f39c1222", borderWidth: 1, borderColor: "#f39c1266", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  upgradeBtnText: { fontSize: 10, color: "#f39c12", fontFamily: "Inter_600SemiBold" },

  diffRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  diffBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: "#ffffff22", alignItems: "center" },
  diffText: { fontSize: 10, color: "#ffffff55", letterSpacing: 2, fontFamily: "Inter_600SemiBold" },

  fightBtn: { backgroundColor: "#ff6b00", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginTop: 4 },
  fightBtnText: { fontSize: 18, fontWeight: "700" as const, color: "#fff", letterSpacing: 4, fontFamily: "Inter_700Bold" },

  // Gym tab
  gymTitle: { fontSize: 16, fontWeight: "700" as const, color: "#fff", marginBottom: 4, fontFamily: "Inter_700Bold" },
  gymSubtitle: { fontSize: 11, color: "#ffffff55", marginBottom: 14, fontFamily: "Inter_400Regular" },
  coachCard: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#ffffff08", borderRadius: 10, borderWidth: 1, borderColor: "#ffffff11",
    padding: 12, marginBottom: 8, gap: 10,
  },
  coachLeft: { flexDirection: "row", gap: 10, flex: 1, alignItems: "flex-start" },
  coachDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  coachStyleName: { fontSize: 13, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  coachName: { fontSize: 10, color: "#ffffff66", fontFamily: "Inter_400Regular", marginTop: 1 },
  coachDesc: { fontSize: 10, color: "#ffffff44", fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 14 },
  hireBtn: { alignItems: "center", backgroundColor: "#f39c1222", borderWidth: 1.5, borderColor: "#f39c12", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, minWidth: 54 },
  hireBtnText: { fontSize: 13, fontWeight: "700" as const, color: "#f39c12", fontFamily: "Inter_700Bold" },
  hireBtnSub: { fontSize: 8, color: "#f39c1299", letterSpacing: 1, fontFamily: "Inter_400Regular" },
  unlockedTag: { backgroundColor: "#27ae6022", borderWidth: 1, borderColor: "#27ae6066", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  unlockedText: { fontSize: 9, color: "#27ae60", fontWeight: "700" as const, fontFamily: "Inter_700Bold", letterSpacing: 1 },

  // Combos tab
  comboStyleBlock: { marginBottom: 6 },
  comboHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderRadius: 8, padding: 10 },
  comboStyleName: { fontSize: 13, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  comboList: { backgroundColor: "#ffffff06", borderRadius: 8, padding: 10, marginTop: 2, gap: 8 },
  comboRow: { gap: 3 },
  comboInputs: { flexDirection: "row", alignItems: "center", gap: 4 },
  comboInputEmoji: { fontSize: 16 },
  comboArrow: { fontSize: 10, color: "#ffffff55" },
  comboName: { fontSize: 12, color: "#ffffffcc", fontFamily: "Inter_500Medium" },
  comboBadges: { flexDirection: "row", gap: 6, marginTop: 2 },
  comboDmg: { fontSize: 10, color: "#ffffff66", fontFamily: "Inter_400Regular" },
  megaBadge: { backgroundColor: "#f39c1222", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  megaText: { fontSize: 8, color: "#f39c12", fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  riskBadge: { backgroundColor: "#e74c3c22", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  riskText: { fontSize: 8, color: "#e74c3c", fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  lockedCombos: { paddingVertical: 8, alignItems: "center" },
  lockedComboText: { fontSize: 11, color: "#ffffff44", fontFamily: "Inter_400Regular", textAlign: "center" },
});
