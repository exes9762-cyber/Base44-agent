import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import type { GameState } from "@/game/types";
import { getStyle } from "@/game/styles";

interface Props {
  state: GameState;
}

function HealthBar({
  hp,
  maxHp,
  color,
  reverse,
}: {
  hp: number;
  maxHp: number;
  color: string;
  reverse?: boolean;
}) {
  const pct = Math.max(0, hp / maxHp);
  const barColor = pct > 0.5 ? color : pct > 0.25 ? "#f39c12" : "#e74c3c";

  return (
    <View style={[styles.hpBarOuter, { flexDirection: reverse ? "row-reverse" : "row" }]}>
      <View
        style={[styles.hpBarInner, { width: `${pct * 100}%` as any, backgroundColor: barColor }]}
      />
    </View>
  );
}

export function GameHUD({ state }: Props) {
  const { width: SCREEN_W } = useWindowDimensions();
  const { player, enemy, playerRoundWins, enemyRoundWins, roundsToWin, round, winStreak, lastComboName, lastComboTime, currentEnemy } = state;
  const playerStyle = getStyle(state.playerStyle);
  const now = Date.now();
  const showCombo = lastComboName && now - lastComboTime < 1500;
  const enemyDisplayName = currentEnemy ? currentEnemy.name.split(" ")[0]!.toUpperCase() : "CPU";

  return (
    <>
      <View style={styles.topHud}>
        {/* Player side */}
        <View style={styles.fighterInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.fighterName, { color: playerStyle.color }]}>YOU</Text>
            <Text style={styles.hpText}>{Math.ceil(player.hp)}</Text>
          </View>
          <HealthBar hp={player.hp} maxHp={player.maxHp} color={playerStyle.color} />
          <View style={styles.roundDots}>
            {Array.from({ length: roundsToWin }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i < playerRoundWins ? { backgroundColor: "#f39c12" } : {}]}
              />
            ))}
          </View>
        </View>

        {/* Center */}
        <View style={styles.centerInfo}>
          <Text style={styles.roundLabel}>RND {round}</Text>
          {winStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥{winStreak}</Text>
            </View>
          )}
        </View>

        {/* Enemy side */}
        <View style={[styles.fighterInfo, { alignItems: "flex-end" }]}>
          <View style={[styles.nameRow, { flexDirection: "row-reverse" }]}>
            <Text style={[styles.fighterName, { color: "#e74c3c" }]}>{enemyDisplayName}</Text>
            <Text style={styles.hpText}>{Math.ceil(enemy.hp)}</Text>
          </View>
          <HealthBar hp={enemy.hp} maxHp={enemy.maxHp} color={currentEnemy?.color ?? "#e74c3c"} reverse />
          <View style={[styles.roundDots, { flexDirection: "row-reverse" }]}>
            {Array.from({ length: roundsToWin }).map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i < enemyRoundWins ? { backgroundColor: "#e74c3c" } : {}]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Combo flash */}
      {showCombo && (
        <View style={styles.comboFlash} pointerEvents="none">
          <Text style={styles.comboText}>{lastComboName}!</Text>
        </View>
      )}

      {/* Damage numbers */}
      {state.damageNumbers.map((dn) => (
        <View
          key={dn.id}
          style={[
            styles.damageNum,
            { left: SCREEN_W * 0.3 + (dn.isPlayer ? -60 : 60), top: 100 },
          ]}
          pointerEvents="none"
        >
          <Text
            style={[
              styles.damageText,
              { color: dn.isCrit ? "#ffd700" : "#fff", fontSize: dn.isCrit ? 22 : 16 },
            ]}
          >
            -{dn.value}{dn.isCrit ? "!" : ""}
          </Text>
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  topHud: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 8,
  },
  fighterInfo: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  fighterName: {
    fontSize: 11,
    fontWeight: "700" as const,
    letterSpacing: 1,
    fontFamily: "Inter_700Bold",
  },
  hpText: {
    fontSize: 10,
    color: "#ffffff88",
    fontFamily: "Inter_400Regular",
  },
  hpBarOuter: {
    height: 10,
    backgroundColor: "#ffffff22",
    borderRadius: 5,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ffffff22",
  },
  hpBarInner: { height: "100%", borderRadius: 5 },
  roundDots: { flexDirection: "row", gap: 4, marginTop: 3 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff33",
    borderWidth: 1,
    borderColor: "#ffffff55",
  },
  centerInfo: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 2,
    minWidth: 60,
  },
  roundLabel: {
    fontSize: 10,
    color: "#ffffff66",
    letterSpacing: 2,
    fontFamily: "Inter_600SemiBold",
  },
  streakBadge: {
    marginTop: 4,
    backgroundColor: "#ff6b0033",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ff6b0066",
  },
  streakText: {
    fontSize: 10,
    color: "#ff8c00",
    fontFamily: "Inter_700Bold",
  },
  comboFlash: {
    position: "absolute",
    top: 55,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  comboText: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#ffd700",
    letterSpacing: 2,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    fontFamily: "Inter_700Bold",
  },
  damageNum: { position: "absolute" },
  damageText: {
    fontWeight: "700" as const,
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    fontFamily: "Inter_700Bold",
  },
});
