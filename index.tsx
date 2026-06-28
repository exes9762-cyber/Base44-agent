import React from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Arena } from "@/components/Arena";
import { Controls } from "@/components/Controls";
import { DadLetter } from "@/components/DadLetter";
import { FightCard } from "@/components/FightCard";
import { FighterView } from "@/components/FighterView";
import { GameHUD } from "@/components/GameHUD";
import { MenuScreen } from "@/components/MenuScreen";
import { QTEModal } from "@/components/QTEModal";
import { StyleSwitcher } from "@/components/StyleSwitcher";
import { WinScreen } from "@/components/WinScreen";
import { useGameState } from "@/game/useGameState";
import { getStyle } from "@/game/styles";
import type { QTEType } from "@/game/types";

const ARENA_UNITS = 10;

function arenaToScreen(x: number, width: number): number {
  return ((x + 5) / ARENA_UNITS) * width;
}

export default function GameScreen() {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const {
    state,
    beginMatch,
    startFight,
    doPlayerAttack,
    doQTEAction,
    movePlayer,
    switchStyleInFight,
    upgradeStat,
    setStyle,
    hireCoach,
    setDifficulty,
    dismissLetter,
    goToMenu,
  } = useGameState();

  const { phase } = state;

  const isFighting   = phase === "fighting";
  const isMenu       = phase === "menu";
  const isUpgrade    = phase === "upgrade";
  const isLose       = phase === "lose";
  const isBetween    = phase === "between";
  const isFightCard  = phase === "fightcard";
  const showFighters = isFighting || isBetween || isUpgrade || isLose || isFightCard;

  const FLOOR_Y = H * 0.62;
  const scale   = Math.min(H / 480, 1.1);

  const playerStyle  = getStyle(state.playerStyle);
  const enemyColor   = state.currentEnemy?.color ?? "#e74c3c";
  const playerScreenX = arenaToScreen(state.player.x, W);
  const enemyScreenX  = arenaToScreen(state.enemy.x, W);

  return (
    <View style={styles.root}>
      {/* Arena background — always visible */}
      <Arena />

      {/* Fighters */}
      {showFighters && (
        <>
          <FighterView
            fighter={state.player}
            screenX={playerScreenX}
            screenY={FLOOR_Y}
            color={playerStyle.color}
            scale={scale}
            comboName={state.lastComboName}
          />
          <FighterView
            fighter={state.enemy}
            screenX={enemyScreenX}
            screenY={FLOOR_Y}
            color={enemyColor}
            scale={scale}
            mirrorX
          />
        </>
      )}

      {/* HUD — only during active fighting */}
      {isFighting && (
        <View style={[styles.hudWrapper, { paddingTop: insets.top + 4 }]}>
          <GameHUD state={state} />
        </View>
      )}

      {/* QTE */}
      {isFighting && state.qte?.active && (
        <QTEModal qte={state.qte} onAction={(t: QTEType) => doQTEAction(t)} />
      )}

      {/* Controls — only during active fighting */}
      {isFighting && (
        <View style={[styles.controlsArea, { paddingBottom: Math.max(insets.bottom, 6) }]}>
          {state.unlockedStyles.length > 1 && (
            <StyleSwitcher
              currentStyle={state.playerStyle}
              unlockedStyles={state.unlockedStyles}
              onSwitch={switchStyleInFight}
            />
          )}
          <Controls
            onPunch={() => doPlayerAttack("P")}
            onKick={() => doPlayerAttack("K")}
            onMoveLeft={() => movePlayer(-1)}
            onMoveRight={() => movePlayer(1)}
          />
        </View>
      )}

      {/* Between-rounds banner */}
      {isBetween && (
        <View style={styles.betweenOverlay} pointerEvents="none">
          <Text style={styles.betweenText}>ROUND {state.round}</Text>
          <Text style={styles.betweenSub}>FIGHT!</Text>
        </View>
      )}

      {/* Main menu */}
      {isMenu && (
        <MenuScreen
          state={state}
          onStartFight={beginMatch}
          onSetStyle={setStyle}
          onHireCoach={hireCoach}
          onUpgrade={upgradeStat}
          onSetDifficulty={setDifficulty}
          isUpgrade={false}
          isLose={false}
        />
      )}

      {/* Pre-fight card */}
      {isFightCard && (
        <FightCard
          state={state}
          onFight={startFight}
          onGoHome={goToMenu}
        />
      )}

      {/* WIN overlay */}
      {isUpgrade && (
        <WinScreen
          won
          coinsEarned={state.lastWinCoins}
          winStreak={state.winStreak}
          onNextMatch={beginMatch}
          onGoHome={goToMenu}
        />
      )}

      {/* LOSE overlay */}
      {isLose && (
        <WinScreen
          won={false}
          coinsEarned={0}
          winStreak={0}
          onNextMatch={beginMatch}
          onGoHome={goToMenu}
        />
      )}

      {/* Dad letter — always on top */}
      {state.activeLetter && (
        <DadLetter letter={state.activeLetter} onDismiss={dismissLetter} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050302" },
  hudWrapper: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  controlsArea: { position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 20 },
  betweenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000077",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 80,
  },
  betweenText: {
    fontSize: 48,
    fontWeight: "700" as const,
    color: "#ffffff",
    letterSpacing: 6,
    fontFamily: "Inter_700Bold",
    textShadowColor: "#ff6b00",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  betweenSub: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#ff6b00",
    letterSpacing: 8,
    fontFamily: "Inter_700Bold",
    marginTop: 8,
  },
});
