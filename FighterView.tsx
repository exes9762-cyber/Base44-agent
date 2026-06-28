/**
 * FighterView.tsx — Human-proportioned fighter renderer
 * Inspired by UFC-style 2.5D fighting game aesthetics.
 * Uses React Native SVG-style View composition with Animated for all moves.
 */

import React, { useEffect, useRef } from "react";
import { Animated, View } from "react-native";
import type { Fighter } from "@/game/types";

interface Props {
  fighter: Fighter;
  screenX: number;
  screenY: number;
  scale?: number;
  color: string;       // fighter's style color (outfit color)
  mirrorX?: boolean;
  comboName?: string | null;
}

// ── Color helpers ─────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}
function lighten(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`;
}
function darken(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`;
}
function alpha(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

/** Rounded pill — used for limb segments */
function Pill({
  w, h, color, borderColor, style,
}: {
  w: number; h: number; color: string; borderColor?: string; style?: object;
}) {
  return (
    <View
      style={[{
        width: w,
        height: h,
        borderRadius: w / 2,
        backgroundColor: color,
        borderWidth: borderColor ? 1.5 : 0,
        borderColor: borderColor ?? "transparent",
      }, style]}
    />
  );
}

/** Boxing glove shape */
function Glove({ size, color, style }: { size: number; color: string; style?: object }) {
  const dark = darken(color, 50);
  return (
    <View style={[{ width: size * 1.3, height: size, position: "relative" }, style]}>
      {/* Main glove body */}
      <View style={{
        width: size * 1.3, height: size,
        borderRadius: size * 0.4,
        backgroundColor: color,
        borderWidth: 1.5, borderColor: dark,
      }} />
      {/* Wrist wrap line */}
      <View style={{
        position: "absolute", bottom: size * 0.22,
        left: 0, right: 0, height: 2,
        backgroundColor: alpha(dark, 0.6),
      }} />
      {/* Knuckle highlight */}
      <View style={{
        position: "absolute", top: size * 0.12,
        left: size * 0.15, right: size * 0.15, height: size * 0.18,
        borderRadius: size * 0.1,
        backgroundColor: alpha("#ffffff", 0.18),
      }} />
    </View>
  );
}

/** Human-shaped head with face detail */
function Head({ size, skinColor, hurtFlash, mirrorX }: {
  size: number; skinColor: string; hurtFlash: boolean; mirrorX?: boolean;
}) {
  const shadow = darken(skinColor, 30);
  const flip = mirrorX ? -1 : 1;

  return (
    <View style={{ width: size, height: size * 1.15, position: "relative" }}>
      {/* Skull */}
      <View style={{
        width: size, height: size * 1.15,
        borderRadius: size * 0.55,
        backgroundColor: hurtFlash ? "#ffe0e0" : skinColor,
        borderWidth: 2, borderColor: shadow,
        overflow: "hidden",
      }}>
        {/* Jaw shadow */}
        <View style={{
          position: "absolute", bottom: 0, left: size * 0.1, right: size * 0.1,
          height: size * 0.28, borderRadius: size * 0.25,
          backgroundColor: alpha(shadow, 0.2),
        }} />
        {/* Hair */}
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: size * 0.32, borderRadius: size * 0.5,
          backgroundColor: "#1a1a1a",
        }} />
        {/* Eyes */}
        <View style={{
          position: "absolute",
          top: size * 0.36, left: size * 0.18,
          width: size * 0.16, height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: hurtFlash ? "#ff4444" : "#2c1a0e",
        }} />
        <View style={{
          position: "absolute",
          top: size * 0.36, right: size * 0.18,
          width: size * 0.16, height: size * 0.14,
          borderRadius: size * 0.07,
          backgroundColor: hurtFlash ? "#ff4444" : "#2c1a0e",
        }} />
        {/* Eye whites */}
        <View style={{
          position: "absolute",
          top: size * 0.37, left: size * 0.20,
          width: size * 0.06, height: size * 0.06,
          borderRadius: size * 0.03,
          backgroundColor: "#ffffff",
        }} />
        <View style={{
          position: "absolute",
          top: size * 0.37, right: size * 0.20,
          width: size * 0.06, height: size * 0.06,
          borderRadius: size * 0.03,
          backgroundColor: "#ffffff",
        }} />
        {/* Nose */}
        <View style={{
          position: "absolute",
          top: size * 0.52, left: size * 0.5 - size * 0.05,
          width: size * 0.10, height: size * 0.12,
          borderRadius: size * 0.05,
          backgroundColor: alpha(shadow, 0.4),
        }} />
        {/* Mouth — grimace when hurt */}
        <View style={{
          position: "absolute",
          top: size * 0.68, left: size * 0.27, right: size * 0.27,
          height: size * 0.06,
          borderRadius: size * 0.03,
          backgroundColor: hurtFlash ? alpha("#cc0000", 0.7) : alpha(shadow, 0.5),
        }} />
        {/* Ear */}
        <View style={{
          position: "absolute",
          top: size * 0.45,
          left: flip > 0 ? -size * 0.04 : undefined,
          right: flip > 0 ? undefined : -size * 0.04,
          width: size * 0.14, height: size * 0.2,
          borderRadius: size * 0.07,
          backgroundColor: skinColor,
          borderWidth: 1.5, borderColor: shadow,
        }} />
      </View>
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function FighterView({
  fighter,
  screenX,
  screenY,
  scale = 1,
  color,
  mirrorX,
  comboName,
}: Props) {
  const s = scale * 1.0; // base scale multiplier

  // ── Skin & outfit colors ──────────────────────────────────────────────────
  const isHurt     = fighter.isHurt;
  const skinBase   = "#d4956a";          // tan fighter skin
  const skinColor  = isHurt ? "#ffddcc" : skinBase;
  const shirtColor = isHurt ? "#ffcccc" : darken(color, 20);
  const shortsColor = isHurt ? "#cccccc" : "#1a1a2e";
  const shortsStripe = color;
  const gloveColor  = isHurt ? "#ffaaaa" : color;
  const shoeColor   = "#111111";

  // ── Sizing (scale-aware) ───────────────────────────────────────────────────
  const HEAD_W    = 30 * s;
  const HEAD_H    = 34 * s;
  const NECK_W    = 14 * s;
  const NECK_H    = 10 * s;
  const TORSO_W   = 46 * s;
  const TORSO_H   = 52 * s;
  const SHOULDER_W = 52 * s;
  const SHOULDER_H = 14 * s;
  const BICEP_W   = 18 * s;
  const BICEP_H   = 22 * s;
  const FORE_W    = 14 * s;
  const FORE_H    = 20 * s;
  const GLOVE_S   = 16 * s;
  const HIP_W     = 40 * s;
  const HIP_H     = 10 * s;
  const THIGH_W   = 20 * s;
  const THIGH_H   = 28 * s;
  const SHIN_W    = 16 * s;
  const SHIN_H    = 26 * s;
  const FOOT_W    = 22 * s;
  const FOOT_H    = 10 * s;

  // total height for positioning anchor
  const TOTAL_H = HEAD_H + NECK_H + TORSO_H + HIP_H + THIGH_H + SHIN_H + FOOT_H;

  // ── Animated values ────────────────────────────────────────────────────────
  // Root
  const rootY     = useRef(new Animated.Value(0)).current; // whole body up/down
  const rootX     = useRef(new Animated.Value(0)).current; // whole body fwd/back
  const shakeX    = useRef(new Animated.Value(0)).current;
  const shakeY    = useRef(new Animated.Value(0)).current;
  const fallRot   = useRef(new Animated.Value(0)).current;
  const stumbleX  = useRef(new Animated.Value(0)).current;
  const bodyScale = useRef(new Animated.Value(1)).current; // impact squash

  // Body twist
  const torsoRot  = useRef(new Animated.Value(0)).current; // body rotation
  const torsoY    = useRef(new Animated.Value(0)).current; // torso bob

  // Head
  const headRot   = useRef(new Animated.Value(0)).current;
  const headY     = useRef(new Animated.Value(0)).current;

  // Right arm (lead arm — jab arm in orthodox)
  const rBicepRot = useRef(new Animated.Value(-15)).current; // guard position
  const rForeRot  = useRef(new Animated.Value(10)).current;
  const rArmX     = useRef(new Animated.Value(0)).current;
  const rArmY     = useRef(new Animated.Value(0)).current;

  // Left arm (power hand)
  const lBicepRot = useRef(new Animated.Value(20)).current;  // guard pulled back
  const lForeRot  = useRef(new Animated.Value(-15)).current;
  const lArmX     = useRef(new Animated.Value(0)).current;
  const lArmY     = useRef(new Animated.Value(0)).current;

  // Legs
  const lThighRot = useRef(new Animated.Value(-8)).current;  // stance splay
  const rThighRot = useRef(new Animated.Value(8)).current;
  const lShinRot  = useRef(new Animated.Value(5)).current;
  const rShinRot  = useRef(new Animated.Value(-5)).current;
  const lLegY     = useRef(new Animated.Value(0)).current;
  const rLegY     = useRef(new Animated.Value(0)).current;

  // ── Idle breath ────────────────────────────────────────────────────────────
  const breathAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const b = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: -3, duration: 800, useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 0,  duration: 800, useNativeDriver: true }),
      ])
    );
    b.start();
    return () => b.stop();
  }, []);

  // ── Walk bob ────────────────────────────────────────────────────────────────
  const walkBob = useRef(new Animated.Value(0)).current;
  const walkRef = useRef<Animated.CompositeAnimation | null>(null);
  useEffect(() => {
    if (fighter.animState === "walk") {
      const wa = Animated.loop(
        Animated.sequence([
          Animated.timing(walkBob, { toValue: -4, duration: 160, useNativeDriver: true }),
          Animated.timing(walkBob, { toValue: 0,  duration: 160, useNativeDriver: true }),
        ])
      );
      walkRef.current = wa;
      wa.start();
    } else {
      walkRef.current?.stop();
      walkBob.setValue(0);
    }
  }, [fighter.animState]);

  // ── Reset to orthodox guard stance ─────────────────────────────────────────
  function resetGuard() {
    Animated.parallel([
      Animated.spring(torsoRot,  { toValue: 0,   tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(torsoY,    { toValue: 0,   tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(headRot,   { toValue: 0,   tension: 140, friction: 9, useNativeDriver: true }),
      Animated.spring(headY,     { toValue: 0,   tension: 140, friction: 9, useNativeDriver: true }),
      Animated.spring(rBicepRot, { toValue: -15, tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(rForeRot,  { toValue: 10,  tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(rArmX,     { toValue: 0,   tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(rArmY,     { toValue: 0,   tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(lBicepRot, { toValue: 20,  tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(lForeRot,  { toValue: -15, tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(lArmX,     { toValue: 0,   tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(lArmY,     { toValue: 0,   tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(lThighRot, { toValue: -8,  tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(rThighRot, { toValue: 8,   tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(lShinRot,  { toValue: 5,   tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(rShinRot,  { toValue: -5,  tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(lLegY,     { toValue: 0,   tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(rLegY,     { toValue: 0,   tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(rootY,     { toValue: 0,   tension: 120, friction: 9, useNativeDriver: true }),
      Animated.spring(rootX,     { toValue: 0,   tension: 120, friction: 9, useNativeDriver: true }),
    ]).start();
  }

  // ── ATTACK animations ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!fighter.isAttacking) return;
    const dir = mirrorX ? 1 : -1;
    const fwd = mirrorX ? -1 : 1;
    const cn = comboName ?? "";

    if (fighter.isKicking) {
      // ─ FLYING / JUMP KICK ─────────────────────────────────────────────────
      if (cn.match(/jump|flying/i)) {
        Animated.sequence([
          // Crouch
          Animated.parallel([
            Animated.timing(rootY,     { toValue: 8,   duration: 80, useNativeDriver: true }),
            Animated.timing(lThighRot, { toValue: -25, duration: 80, useNativeDriver: true }),
            Animated.timing(rThighRot, { toValue: 25,  duration: 80, useNativeDriver: true }),
          ]),
          // Launch
          Animated.parallel([
            Animated.timing(rootY,     { toValue: -36, duration: 160, useNativeDriver: true }),
            Animated.timing(rThighRot, { toValue: dir * -100, duration: 150, useNativeDriver: true }),
            Animated.timing(rShinRot,  { toValue: dir * 30,   duration: 150, useNativeDriver: true }),
            Animated.timing(lThighRot, { toValue: dir * 35,   duration: 150, useNativeDriver: true }),
            Animated.timing(rBicepRot, { toValue: dir * 55,   duration: 140, useNativeDriver: true }),
            Animated.timing(lBicepRot, { toValue: dir * -55,  duration: 140, useNativeDriver: true }),
          ]),
          // Land squash
          Animated.parallel([
            Animated.spring(rootY, { toValue: 0, tension: 90, friction: 5, useNativeDriver: true }),
            Animated.spring(bodyScale, { toValue: 0.72, tension: 500, friction: 6, useNativeDriver: true }),
          ]),
          Animated.spring(bodyScale, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
        ]).start(() => resetGuard());
      }

      // ─ SPINNING HEEL ──────────────────────────────────────────────────────
      else if (cn.match(/spinning/i)) {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(torsoRot, { toValue: dir * -50, duration: 120, useNativeDriver: true }),
            Animated.timing(rootY,    { toValue: -6,        duration: 120, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(torsoRot,  { toValue: dir * 35,  duration: 180, useNativeDriver: true }),
            Animated.timing(rThighRot, { toValue: dir * -105, duration: 170, useNativeDriver: true }),
            Animated.timing(rShinRot,  { toValue: dir * 20,  duration: 170, useNativeDriver: true }),
            Animated.timing(lBicepRot, { toValue: dir * -60, duration: 160, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(torsoRot,  { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
            Animated.spring(rThighRot, { toValue: 8, tension: 80, friction: 8, useNativeDriver: true }),
            Animated.spring(rShinRot,  { toValue: -5, tension: 80, friction: 8, useNativeDriver: true }),
          ]),
        ]).start(() => resetGuard());
      }

      // ─ TRIPLE KICK ────────────────────────────────────────────────────────
      else if (cn.match(/triple/i)) {
        Animated.sequence([
          // Kick 1
          Animated.timing(rThighRot, { toValue: dir * -80, duration: 85, useNativeDriver: true }),
          Animated.timing(rThighRot, { toValue: 5,         duration: 65, useNativeDriver: true }),
          // Kick 2
          Animated.timing(lThighRot, { toValue: dir * 80,  duration: 85, useNativeDriver: true }),
          Animated.timing(lThighRot, { toValue: -5,        duration: 65, useNativeDriver: true }),
          // Kick 3 — spinning back
          Animated.parallel([
            Animated.timing(rThighRot, { toValue: dir * -95, duration: 100, useNativeDriver: true }),
            Animated.timing(torsoRot,  { toValue: dir * -25, duration: 100, useNativeDriver: true }),
          ]),
        ]).start(() => resetGuard());
      }

      // ─ DOUBLE KICK / DOUBLE KNEE ──────────────────────────────────────────
      else if (cn.match(/double/i)) {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(rThighRot, { toValue: dir * -80, duration: 90, useNativeDriver: true }),
            Animated.timing(rShinRot,  { toValue: dir * 20,  duration: 90, useNativeDriver: true }),
            Animated.timing(torsoRot,  { toValue: dir * -12, duration: 90, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(rThighRot, { toValue: 8, tension: 120, friction: 8, useNativeDriver: true }),
            Animated.spring(rShinRot,  { toValue: -5, tension: 120, friction: 8, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(lThighRot, { toValue: dir * 80,  duration: 90, useNativeDriver: true }),
            Animated.timing(lShinRot,  { toValue: dir * -20, duration: 90, useNativeDriver: true }),
            Animated.timing(torsoRot,  { toValue: dir * 12,  duration: 90, useNativeDriver: true }),
          ]),
        ]).start(() => resetGuard());
      }

      // ─ ROUNDHOUSE ─────────────────────────────────────────────────────────
      else if (cn.match(/roundhouse/i)) {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(torsoRot,  { toValue: dir * -20, duration: 80,  useNativeDriver: true }),
            Animated.timing(lThighRot, { toValue: dir * 90,  duration: 140, useNativeDriver: true }),
            Animated.spring(torsoRot,  { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
            Animated.spring(lThighRot, { toValue: -8, tension: 80, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rBicepRot, { toValue: dir * 45, duration: 80, useNativeDriver: true }),
            Animated.spring(rBicepRot, { toValue: -15, tension: 100, friction: 8, useNativeDriver: true }),
          ]),
        ]).start();
      }

      // ─ KNEE STRIKE ────────────────────────────────────────────────────────
      else if (cn.match(/knee/i)) {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(rootY,    { toValue: -10, duration: 80, useNativeDriver: true }),
            Animated.spring(rootY,    { toValue: 0, tension: 100, friction: 7, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rThighRot, { toValue: dir * -85, duration: 95, useNativeDriver: true }),
            Animated.timing(rShinRot,  { toValue: dir * 15,  duration: 95, useNativeDriver: true }),
            Animated.spring(rThighRot, { toValue: 8, tension: 100, friction: 7, useNativeDriver: true }),
            Animated.spring(rShinRot,  { toValue: -5, tension: 100, friction: 7, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(lBicepRot, { toValue: dir * -50, duration: 90, useNativeDriver: true }),
            Animated.timing(rBicepRot, { toValue: dir * 50,  duration: 90, useNativeDriver: true }),
            Animated.spring(lBicepRot, { toValue: 20, tension: 100, friction: 8, useNativeDriver: true }),
            Animated.spring(rBicepRot, { toValue: -15, tension: 100, friction: 8, useNativeDriver: true }),
          ]),
        ]).start();
      }

      // ─ LOW KICK / SWEEP ───────────────────────────────────────────────────
      else if (cn.match(/low kick|sweep|foot|leg trip/i)) {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(lThighRot, { toValue: dir * 50, duration: 95, useNativeDriver: true }),
            Animated.spring(lThighRot, { toValue: -8, tension: 100, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(torsoRot, { toValue: dir * -10, duration: 95, useNativeDriver: true }),
            Animated.spring(torsoRot, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
          ]),
        ]).start();
      }

      // ─ DEFAULT FRONT KICK / TEEP ──────────────────────────────────────────
      else {
        Animated.parallel([
          Animated.sequence([
            Animated.timing(rThighRot, { toValue: dir * -75, duration: 90, useNativeDriver: true }),
            Animated.timing(rShinRot,  { toValue: dir * 25,  duration: 90, useNativeDriver: true }),
            Animated.spring(rThighRot, { toValue: 8,  tension: 100, friction: 8, useNativeDriver: true }),
            Animated.spring(rShinRot,  { toValue: -5, tension: 100, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(torsoRot, { toValue: dir * -14, duration: 100, useNativeDriver: true }),
            Animated.spring(torsoRot, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rBicepRot, { toValue: dir * 40, duration: 90, useNativeDriver: true }),
            Animated.spring(rBicepRot, { toValue: -15, tension: 100, friction: 8, useNativeDriver: true }),
          ]),
        ]).start();
      }

    } else if (fighter.attackType === "hook") {
      // ─ LEFT HOOK — powerful hip rotation, arm arcs laterally ─────────────
      Animated.parallel([
        Animated.sequence([
          Animated.timing(torsoRot,  { toValue: dir * -22, duration: 75, useNativeDriver: true }),
          Animated.timing(torsoRot,  { toValue: dir * 18,  duration: 100, useNativeDriver: true }),
          Animated.spring(torsoRot,  { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(lBicepRot, { toValue: dir * -70, duration: 80, useNativeDriver: true }),
          Animated.timing(lForeRot,  { toValue: dir * 20,  duration: 80, useNativeDriver: true }),
          Animated.spring(lBicepRot, { toValue: 20, tension: 100, friction: 8, useNativeDriver: true }),
          Animated.spring(lForeRot,  { toValue: -15, tension: 100, friction: 8, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(lArmX,    { toValue: dir * -20, duration: 75, useNativeDriver: true }),
          Animated.timing(lArmX,    { toValue: dir * 15,  duration: 95, useNativeDriver: true }),
          Animated.spring(lArmX,    { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(lArmY,    { toValue: -12, duration: 75, useNativeDriver: true }),
          Animated.spring(lArmY,    { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(torsoY,   { toValue: -5, duration: 80, useNativeDriver: true }),
          Animated.spring(torsoY,   { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
        ]),
      ]).start();

    } else {
      // ─ PUNCH variants by combo name ────────────────────────────────────────

      if (cn.match(/uppercut/i)) {
        // UPPERCUT — dip then drive upward
        Animated.parallel([
          Animated.sequence([
            Animated.timing(rootY,    { toValue: 8,  duration: 60, useNativeDriver: true }),
            Animated.timing(rootY,    { toValue: -12, duration: 90, useNativeDriver: true }),
            Animated.spring(rootY,    { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rArmY,    { toValue: 8,  duration: 60, useNativeDriver: true }),
            Animated.timing(rArmY,    { toValue: -25, duration: 90, useNativeDriver: true }),
            Animated.spring(rArmY,    { toValue: 0, tension: 150, friction: 7, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.spring(rBicepRot, { toValue: dir * -60, tension: 600, friction: 6, useNativeDriver: true }),
            Animated.spring(rForeRot,  { toValue: dir * -30, tension: 500, friction: 6, useNativeDriver: true }),
            Animated.spring(rBicepRot, { toValue: -15, tension: 120, friction: 8, useNativeDriver: true }),
            Animated.spring(rForeRot,  { toValue: 10,  tension: 120, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(torsoRot, { toValue: dir * -12, duration: 80, useNativeDriver: true }),
            Animated.spring(torsoRot, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
          ]),
        ]).start();

      } else if (cn.match(/elbow/i)) {
        // ELBOW — tight horizontal arc
        Animated.parallel([
          Animated.sequence([
            Animated.timing(lBicepRot, { toValue: dir * -95, duration: 65, useNativeDriver: true }),
            Animated.timing(lArmX,     { toValue: dir * -18, duration: 65, useNativeDriver: true }),
            Animated.spring(lBicepRot, { toValue: 20, tension: 100, friction: 8, useNativeDriver: true }),
            Animated.spring(lArmX,     { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(torsoRot,  { toValue: dir * -28, duration: 70, useNativeDriver: true }),
            Animated.timing(torsoRot,  { toValue: dir * 18,  duration: 80, useNativeDriver: true }),
            Animated.spring(torsoRot,  { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(torsoY,    { toValue: -6, duration: 80, useNativeDriver: true }),
            Animated.spring(torsoY,    { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
          ]),
        ]).start();

      } else if (cn.match(/grab|takedown|throw|hold|submission|nage|kote|ippon|hip|shoulder|grip|harmony|energy|collar/i)) {
        // GRAPPLING — lunge forward, body twist, throw
        Animated.parallel([
          Animated.sequence([
            Animated.timing(rootX,    { toValue: fwd * 22, duration: 110, useNativeDriver: true }),
            Animated.spring(rootX,    { toValue: 0, tension: 60, friction: 6, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(torsoRot, { toValue: dir * -22, duration: 90, useNativeDriver: true }),
            Animated.timing(torsoRot, { toValue: dir * 32,  duration: 130, useNativeDriver: true }),
            Animated.spring(torsoRot, { toValue: 0, tension: 60, friction: 6, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rBicepRot, { toValue: dir * -40, duration: 80, useNativeDriver: true }),
            Animated.timing(lBicepRot, { toValue: dir * -40, duration: 80, useNativeDriver: true }),
            Animated.spring(rBicepRot, { toValue: -15, tension: 80, friction: 6, useNativeDriver: true }),
            Animated.spring(lBicepRot, { toValue: 20, tension: 80, friction: 6, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(rootY,    { toValue: -8, duration: 90, useNativeDriver: true }),
            Animated.spring(rootY,    { toValue: 0, tension: 80, friction: 6, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(bodyScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
            Animated.spring(bodyScale, { toValue: 1, tension: 200, friction: 7, useNativeDriver: true }),
          ]),
        ]).start();

      } else if (cn.match(/triple jab|jab.cross|five animal|ground|mantis|1-2|double.*palm|double jab|double grip/i)) {
        // 3-HIT MEGA COMBO — jab, cross, power hook
        Animated.sequence([
          // Jab
          Animated.parallel([
            Animated.timing(rArmX,     { toValue: dir * -28, duration: 60, useNativeDriver: true }),
            Animated.spring(rBicepRot, { toValue: dir * -35, tension: 600, friction: 7, useNativeDriver: true }),
            Animated.spring(rForeRot,  { toValue: dir * 15,  tension: 500, friction: 7, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(rArmX,     { toValue: 0, tension: 300, friction: 8, useNativeDriver: true }),
            Animated.spring(rBicepRot, { toValue: -15, tension: 120, friction: 8, useNativeDriver: true }),
            Animated.spring(rForeRot,  { toValue: 10, tension: 120, friction: 8, useNativeDriver: true }),
          ]),
          // Cross
          Animated.parallel([
            Animated.timing(lArmX,     { toValue: dir * -26, duration: 60, useNativeDriver: true }),
            Animated.timing(torsoRot,  { toValue: dir * -14, duration: 60, useNativeDriver: true }),
            Animated.spring(lBicepRot, { toValue: dir * -45, tension: 500, friction: 7, useNativeDriver: true }),
            Animated.spring(lForeRot,  { toValue: dir * 12,  tension: 400, friction: 7, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(lArmX,     { toValue: 0, tension: 250, friction: 8, useNativeDriver: true }),
            Animated.spring(lBicepRot, { toValue: 20, tension: 120, friction: 8, useNativeDriver: true }),
            Animated.spring(lForeRot,  { toValue: -15, tension: 120, friction: 8, useNativeDriver: true }),
          ]),
          // Power hook finish
          Animated.parallel([
            Animated.timing(lArmX,     { toValue: dir * -35, duration: 55, useNativeDriver: true }),
            Animated.timing(lArmY,     { toValue: -12,       duration: 55, useNativeDriver: true }),
            Animated.timing(torsoRot,  { toValue: dir * 20,  duration: 95, useNativeDriver: true }),
            Animated.spring(lBicepRot, { toValue: dir * -75, tension: 500, friction: 6, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.spring(lArmX,     { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }),
            Animated.spring(lArmY,     { toValue: 0, tension: 120, friction: 8, useNativeDriver: true }),
            Animated.spring(torsoRot,  { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
            Animated.spring(lBicepRot, { toValue: 20, tension: 100, friction: 8, useNativeDriver: true }),
          ]),
        ]).start();

      } else if (cn.match(/palm|crane|tiger|leopard|mantis|redirect/i)) {
        // PALM / OPEN HAND — upward angled strike
        Animated.parallel([
          Animated.sequence([
            Animated.timing(rArmX,     { toValue: dir * -32, duration: 65, useNativeDriver: true }),
            Animated.timing(rArmY,     { toValue: -10,       duration: 65, useNativeDriver: true }),
            Animated.spring(rArmX,     { toValue: 0, tension: 250, friction: 8, useNativeDriver: true }),
            Animated.spring(rArmY,     { toValue: 0, tension: 250, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.spring(rBicepRot, { toValue: dir * -42, tension: 550, friction: 7, useNativeDriver: true }),
            Animated.spring(rForeRot,  { toValue: dir * -20, tension: 400, friction: 7, useNativeDriver: true }),
            Animated.spring(rBicepRot, { toValue: -15, tension: 120, friction: 8, useNativeDriver: true }),
            Animated.spring(rForeRot,  { toValue: 10,  tension: 120, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(torsoRot, { toValue: dir * -10, duration: 65, useNativeDriver: true }),
            Animated.spring(torsoRot, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
          ]),
        ]).start();

      } else {
        // DEFAULT JAB — lead right arm shoots forward
        Animated.parallel([
          Animated.sequence([
            Animated.timing(rArmX,     { toValue: dir * -32, duration: 70, useNativeDriver: true }),
            Animated.spring(rArmX,     { toValue: 0, tension: 280, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.spring(rBicepRot, { toValue: dir * -38, tension: 550, friction: 7, useNativeDriver: true }),
            Animated.spring(rForeRot,  { toValue: dir * 15,  tension: 450, friction: 7, useNativeDriver: true }),
            Animated.spring(rBicepRot, { toValue: -15, tension: 120, friction: 8, useNativeDriver: true }),
            Animated.spring(rForeRot,  { toValue: 10,  tension: 120, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(torsoY,   { toValue: -5, duration: 65, useNativeDriver: true }),
            Animated.spring(torsoY,   { toValue: 0, tension: 100, friction: 8, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(torsoRot, { toValue: dir * -8, duration: 65, useNativeDriver: true }),
            Animated.spring(torsoRot, { toValue: 0, tension: 80, friction: 8, useNativeDriver: true }),
          ]),
        ]).start();
      }
    }
  }, [fighter.isAttacking, fighter.isKicking, fighter.attackType, comboName]);

  // ── HURT ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fighter.isHurt) return;
    const dir = mirrorX ? 1 : -1;
    Animated.parallel([
      Animated.sequence([
        Animated.timing(shakeX,    { toValue: dir * 16,  duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX,    { toValue: dir * -12, duration: 45, useNativeDriver: true }),
        Animated.spring(shakeX,    { toValue: 0, tension: 220, friction: 6, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(shakeY,    { toValue: -10, duration: 55, useNativeDriver: true }),
        Animated.spring(shakeY,    { toValue: 0, tension: 130, friction: 6, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(bodyScale, { toValue: 0.82, duration: 55, useNativeDriver: true }),
        Animated.spring(bodyScale, { toValue: 1, tension: 280, friction: 8, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(headRot,   { toValue: dir * -25, duration: 55, useNativeDriver: true }),
        Animated.spring(headRot,   { toValue: 0, tension: 170, friction: 6, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(torsoRot,  { toValue: dir * -18, duration: 55, useNativeDriver: true }),
        Animated.spring(torsoRot,  { toValue: 0, tension: 120, friction: 7, useNativeDriver: true }),
      ]),
      // Arms flung back on impact
      Animated.spring(lBicepRot,   { toValue: dir * -90, tension: 60, friction: 5, useNativeDriver: true }),
      Animated.spring(rBicepRot,   { toValue: dir * 90,  tension: 60, friction: 5, useNativeDriver: true }),
    ]).start(() => resetGuard());
  }, [fighter.isHurt]);

  // ── WHIFF stumble ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fighter.isWhiffed) return;
    const fwd = mirrorX ? -1 : 1;
    Animated.sequence([
      Animated.timing(stumbleX, { toValue: fwd * 25, duration: 210, useNativeDriver: true }),
      Animated.spring(stumbleX, { toValue: 0, tension: 60, friction: 6, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(torsoRot, { toValue: fwd * 30, duration: 210, useNativeDriver: true }),
      Animated.spring(torsoRot, { toValue: 0, tension: 60, friction: 7, useNativeDriver: true }),
    ]).start();
  }, [fighter.isWhiffed]);

  // ── FALL / KO ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fighter.isFallen) return;
    const dir = mirrorX ? -1 : 1;
    Animated.parallel([
      Animated.spring(fallRot,   { toValue: dir * 90, tension: 18, friction: 5, useNativeDriver: true }),
      Animated.spring(rootY,     { toValue: 40,       tension: 14, friction: 5, useNativeDriver: true }),
      Animated.spring(lBicepRot, { toValue: -140,     tension: 14, friction: 4, useNativeDriver: true }),
      Animated.spring(rBicepRot, { toValue: 140,      tension: 14, friction: 4, useNativeDriver: true }),
      Animated.spring(lThighRot, { toValue: 50,       tension: 14, friction: 4, useNativeDriver: true }),
      Animated.spring(rThighRot, { toValue: -40,      tension: 14, friction: 4, useNativeDriver: true }),
      Animated.spring(lShinRot,  { toValue: -30,      tension: 14, friction: 4, useNativeDriver: true }),
      Animated.spring(rShinRot,  { toValue: 30,       tension: 14, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [fighter.isFallen]);

  // ── Interpolations ─────────────────────────────────────────────────────────
  const toRot = (val: Animated.Value, lo: number, hi: number) =>
    val.interpolate({ inputRange: [lo, hi], outputRange: [`${lo}deg`, `${hi}deg`] });

  const fallRotDeg   = toRot(fallRot,   -90, 90);
  const torsoRotDeg  = toRot(torsoRot,  -60, 60);
  const headRotDeg   = toRot(headRot,   -45, 45);
  const rBicepDeg    = toRot(rBicepRot, -150, 150);
  const rForeDeg     = toRot(rForeRot,  -60, 60);
  const lBicepDeg    = toRot(lBicepRot, -150, 150);
  const lForeDeg     = toRot(lForeRot,  -60, 60);
  const lThighDeg    = toRot(lThighRot, -120, 120);
  const rThighDeg    = toRot(rThighRot, -120, 120);
  const lShinDeg     = toRot(lShinRot,  -60, 60);
  const rShinDeg     = toRot(rShinRot,  -60, 60);

  const idleY = fighter.isFallen
    ? new Animated.Value(0)
    : fighter.animState === "walk"
    ? walkBob
    : breathAnim;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Animated.View
      style={{
        position: "absolute",
        left: screenX - SHOULDER_W / 2,
        top:  screenY - TOTAL_H,
        transform: [
          { translateX: shakeX },
          { translateX: stumbleX },
          { translateX: rootX },
          { translateY: shakeY },
          { translateY: rootY },
          { translateY: idleY },
          { scaleX: mirrorX ? -1 : 1 },
          { scale: bodyScale },
          { rotate: fallRotDeg },
        ],
      }}
    >
      {/* ── TORSO WRAPPER (handles twist) ───────────────────────────────── */}
      <Animated.View
        style={{
          transform: [{ translateY: torsoY }, { rotate: torsoRotDeg }],
          alignItems: "center",
        }}
      >

        {/* ── HEAD ────────────────────────────────────────────────────────── */}
        <Animated.View style={{ transform: [{ translateY: headY }, { rotate: headRotDeg }] }}>
          <Head size={HEAD_W} skinColor={skinColor} hurtFlash={isHurt} mirrorX={mirrorX} />
        </Animated.View>

        {/* ── NECK ────────────────────────────────────────────────────────── */}
        <View style={{
          width: NECK_W, height: NECK_H,
          backgroundColor: skinColor,
          borderRadius: NECK_W / 2,
          marginTop: -2,
        }} />

        {/* ── SHOULDERS ───────────────────────────────────────────────────── */}
        <View style={{ width: SHOULDER_W, height: SHOULDER_H, position: "relative", marginTop: -2 }}>
          {/* Left shoulder cap */}
          <View style={{
            position: "absolute", left: 0, top: 0,
            width: SHOULDER_H * 1.4, height: SHOULDER_H * 1.4,
            borderRadius: SHOULDER_H * 0.7,
            backgroundColor: shirtColor,
            borderWidth: 2, borderColor: darken(color, 60),
          }} />
          {/* Right shoulder cap */}
          <View style={{
            position: "absolute", right: 0, top: 0,
            width: SHOULDER_H * 1.4, height: SHOULDER_H * 1.4,
            borderRadius: SHOULDER_H * 0.7,
            backgroundColor: shirtColor,
            borderWidth: 2, borderColor: darken(color, 60),
          }} />
          {/* Trapezius bar connecting shoulders */}
          <View style={{
            position: "absolute",
            left: SHOULDER_H * 0.5, right: SHOULDER_H * 0.5,
            top: 0, height: SHOULDER_H,
            backgroundColor: shirtColor,
          }} />
        </View>

        {/* ── ARMS + TORSO row ────────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginTop: -SHOULDER_H * 0.2 }}>

          {/* LEFT ARM */}
          <Animated.View style={{
            transform: [{ translateX: lArmX }, { translateY: lArmY }, { rotate: lBicepDeg }],
            alignItems: "center",
          }}>
            {/* Bicep */}
            <View style={{
              width: BICEP_W, height: BICEP_H,
              borderRadius: BICEP_W / 2,
              backgroundColor: shirtColor,
              borderWidth: 1.5, borderColor: darken(color, 60),
            }} />
            {/* Elbow joint */}
            <View style={{
              width: BICEP_W * 0.85, height: BICEP_W * 0.85,
              borderRadius: BICEP_W * 0.425,
              backgroundColor: skinColor,
              marginTop: -4,
            }} />
            {/* Forearm */}
            <Animated.View style={{ transform: [{ rotate: lForeDeg }], alignItems: "center" }}>
              <View style={{
                width: FORE_W, height: FORE_H,
                borderRadius: FORE_W / 2,
                backgroundColor: skinColor,
                borderWidth: 1, borderColor: darken(skinColor, 20),
                marginTop: -3,
              }} />
              {/* Glove */}
              <Glove size={GLOVE_S} color={gloveColor} style={{ marginTop: -2 }} />
            </Animated.View>
          </Animated.View>

          {/* TORSO */}
          <View style={{ flex: 1, alignItems: "center" }}>
            {/* Upper chest */}
            <View style={{
              width: TORSO_W, height: TORSO_H * 0.42,
              borderRadius: TORSO_W * 0.12,
              backgroundColor: shirtColor,
              borderWidth: 2, borderColor: darken(color, 60),
              overflow: "hidden",
            }}>
              {/* Chest muscle highlight */}
              <View style={{
                position: "absolute", top: 6, left: 6, right: 6, height: TORSO_H * 0.18,
                borderRadius: TORSO_W * 0.1,
                backgroundColor: alpha(lighten(color, 60), 0.18),
              }} />
              {/* Chest centre line */}
              <View style={{
                position: "absolute", top: 0, bottom: 0, left: TORSO_W / 2 - 1,
                width: 2, backgroundColor: alpha(darken(color, 50), 0.4),
              }} />
            </View>
            {/* Lower torso / abs */}
            <View style={{
              width: TORSO_W * 0.88, height: TORSO_H * 0.38,
              borderRadius: TORSO_W * 0.1,
              backgroundColor: lighten(shirtColor, 10),
              borderWidth: 1.5, borderColor: darken(color, 60),
              marginTop: 2,
              overflow: "hidden",
            }}>
              {/* Ab lines */}
              {[0.3, 0.6].map((t, i) => (
                <View key={i} style={{
                  position: "absolute",
                  top: TORSO_H * 0.38 * t,
                  left: 6, right: 6, height: 1.5,
                  backgroundColor: alpha(darken(color, 50), 0.3),
                }} />
              ))}
            </View>
          </View>

          {/* RIGHT ARM */}
          <Animated.View style={{
            transform: [{ translateX: rArmX }, { translateY: rArmY }, { rotate: rBicepDeg }],
            alignItems: "center",
          }}>
            <View style={{
              width: BICEP_W, height: BICEP_H,
              borderRadius: BICEP_W / 2,
              backgroundColor: shirtColor,
              borderWidth: 1.5, borderColor: darken(color, 60),
            }} />
            <View style={{
              width: BICEP_W * 0.85, height: BICEP_W * 0.85,
              borderRadius: BICEP_W * 0.425,
              backgroundColor: skinColor,
              marginTop: -4,
            }} />
            <Animated.View style={{ transform: [{ rotate: rForeDeg }], alignItems: "center" }}>
              <View style={{
                width: FORE_W, height: FORE_H,
                borderRadius: FORE_W / 2,
                backgroundColor: skinColor,
                borderWidth: 1, borderColor: darken(skinColor, 20),
                marginTop: -3,
              }} />
              <Glove size={GLOVE_S} color={gloveColor} style={{ marginTop: -2 }} />
            </Animated.View>
          </Animated.View>

        </View>{/* end arms+torso row */}

        {/* ── BELT / WAISTBAND ────────────────────────────────────────────── */}
        <View style={{
          width: TORSO_W * 0.95, height: 9 * s,
          backgroundColor: "#0a0a1e",
          borderRadius: 4 * s,
          borderWidth: 1.5, borderColor: "#333",
          alignSelf: "center",
          marginTop: 2,
        }}>
          {/* Belt stripe (fighter color) */}
          <View style={{
            position: "absolute", top: 2, bottom: 2,
            left: 8 * s, width: 18 * s,
            borderRadius: 2 * s,
            backgroundColor: alpha(color, 0.7),
          }} />
        </View>

        {/* ── HIPS ────────────────────────────────────────────────────────── */}
        <View style={{
          width: HIP_W, height: HIP_H,
          backgroundColor: shortsColor,
          borderRadius: 4 * s,
          alignSelf: "center",
          marginTop: 1,
        }} />

        {/* ── LEGS ────────────────────────────────────────────────────────── */}
        <View style={{ flexDirection: "row", gap: 4 * s, alignSelf: "center", marginTop: 1 }}>
          {/* Left leg */}
          <Animated.View style={{ transform: [{ translateY: lLegY }, { rotate: lThighDeg }], alignItems: "center" }}>
            {/* Shorts thigh */}
            <View style={{
              width: THIGH_W, height: THIGH_H * 0.7,
              borderRadius: THIGH_W / 2,
              backgroundColor: shortsColor,
              borderWidth: 1, borderColor: "#333",
              overflow: "hidden",
            }}>
              {/* Shorts stripe */}
              <View style={{
                position: "absolute", left: 3 * s, top: 0, bottom: 0, width: 3 * s,
                backgroundColor: alpha(shortsStripe, 0.7),
              }} />
            </View>
            {/* Knee */}
            <View style={{
              width: THIGH_W * 0.85, height: THIGH_W * 0.85,
              borderRadius: THIGH_W * 0.425,
              backgroundColor: skinColor,
              marginTop: -3,
              borderWidth: 1, borderColor: darken(skinColor, 20),
            }} />
            {/* Shin */}
            <Animated.View style={{ transform: [{ rotate: lShinDeg }], alignItems: "center" }}>
              <View style={{
                width: SHIN_W, height: SHIN_H,
                borderRadius: SHIN_W / 2,
                backgroundColor: skinColor,
                borderWidth: 1, borderColor: darken(skinColor, 15),
                marginTop: -3,
              }} />
              {/* Foot / shoe */}
              <View style={{
                width: FOOT_W, height: FOOT_H,
                borderRadius: FOOT_H * 0.5,
                backgroundColor: shoeColor,
                marginTop: -2,
                marginLeft: mirrorX ? -FOOT_W * 0.25 : FOOT_W * 0.25,
                borderWidth: 1, borderColor: "#333",
              }}>
                {/* Shoe sole */}
                <View style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
                  backgroundColor: "#555",
                  borderRadius: 2,
                }} />
              </View>
            </Animated.View>
          </Animated.View>

          {/* Right leg */}
          <Animated.View style={{ transform: [{ translateY: rLegY }, { rotate: rThighDeg }], alignItems: "center" }}>
            <View style={{
              width: THIGH_W, height: THIGH_H * 0.7,
              borderRadius: THIGH_W / 2,
              backgroundColor: shortsColor,
              borderWidth: 1, borderColor: "#333",
              overflow: "hidden",
            }}>
              <View style={{
                position: "absolute", left: 3 * s, top: 0, bottom: 0, width: 3 * s,
                backgroundColor: alpha(shortsStripe, 0.7),
              }} />
            </View>
            <View style={{
              width: THIGH_W * 0.85, height: THIGH_W * 0.85,
              borderRadius: THIGH_W * 0.425,
              backgroundColor: skinColor,
              marginTop: -3,
              borderWidth: 1, borderColor: darken(skinColor, 20),
            }} />
            <Animated.View style={{ transform: [{ rotate: rShinDeg }], alignItems: "center" }}>
              <View style={{
                width: SHIN_W, height: SHIN_H,
                borderRadius: SHIN_W / 2,
                backgroundColor: skinColor,
                borderWidth: 1, borderColor: darken(skinColor, 15),
                marginTop: -3,
              }} />
              <View style={{
                width: FOOT_W, height: FOOT_H,
                borderRadius: FOOT_H * 0.5,
                backgroundColor: shoeColor,
                marginTop: -2,
                marginLeft: mirrorX ? -FOOT_W * 0.25 : FOOT_W * 0.25,
                borderWidth: 1, borderColor: "#333",
              }}>
                <View style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
                  backgroundColor: "#555", borderRadius: 2,
                }} />
              </View>
            </Animated.View>
          </Animated.View>
        </View>

      </Animated.View>
    </Animated.View>
  );
}
