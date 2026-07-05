import React from "react";
import { StyleSheet, View } from "react-native";
import { useWindowDimensions } from "react-native";

export function Arena() {
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();
  const floorY = SCREEN_H * 0.62;

  return (
    <View style={styles.bg}>
      {/* Sky gradient layers */}
      <View style={[styles.skyTop, { height: floorY * 0.45, width: SCREEN_W }]} />
      <View style={[styles.skyMid, { height: floorY * 0.35, top: floorY * 0.1, width: SCREEN_W }]} />

      {/* Distant crowd silhouettes */}
      {Array.from({ length: 18 }).map((_, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: (i / 18) * SCREEN_W + (i % 3) * 8,
            top: floorY * 0.18 + (i % 4) * 6,
            width: 18,
            height: 28 + (i % 3) * 8,
            backgroundColor: `rgba(${30 + (i % 3) * 10},${10 + (i % 2) * 5},${40 + (i % 5) * 5},0.5)`,
            borderRadius: 9,
          }}
        />
      ))}

      {/* Floor */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: floorY,
          width: SCREEN_W,
          height: SCREEN_H - floorY,
          backgroundColor: "#1a0a00",
        }}
      />
      {/* Floor highlight */}
      <View
        style={{
          position: "absolute",
          left: 0,
          top: floorY,
          width: SCREEN_W,
          height: 6,
          backgroundColor: "#c0770033",
        }}
      />

      {/* Octagon line */}
      <View
        style={{
          position: "absolute",
          left: SCREEN_W * 0.05,
          top: floorY - 2,
          width: SCREEN_W * 0.9,
          height: 3,
          backgroundColor: "#ff6b0044",
        }}
      />

      {/* Torches */}
      {[0.1, 0.9].map((pos, i) => (
        <View key={i} style={{ position: "absolute", left: SCREEN_W * pos - 8, top: floorY - 60 }}>
          <View style={{ width: 6, height: 40, backgroundColor: "#5c3a1e", marginLeft: 5, borderRadius: 2 }} />
          <View style={{ position: "absolute", top: -20, left: 0, width: 16, height: 24, backgroundColor: "#ff8c0066", borderRadius: 8 }} />
          <View style={{ position: "absolute", top: -14, left: 3, width: 10, height: 16, backgroundColor: "#ffd700aa", borderRadius: 5 }} />
        </View>
      ))}

      {/* Pillars */}
      {[0.05, 0.95].map((pos, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            left: SCREEN_W * pos - 12,
            top: floorY * 0.1,
            width: 24,
            height: floorY * 0.9,
            backgroundColor: "#2a1505",
            borderRadius: 4,
            borderWidth: 1,
            borderColor: "#5c3a1e",
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#050302",
  },
  skyTop: {
    position: "absolute",
    left: 0,
    top: 0,
    backgroundColor: "#0d0508",
  },
  skyMid: {
    position: "absolute",
    left: 0,
    backgroundColor: "#1a080a",
  },
});
