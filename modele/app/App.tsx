import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { CONTENT_URL } from "./src/config";
import { GAME_ACCENT, GAME_BG, GAME_HTML, GAME_ID } from "./src/gameHtml";

const SAVE_KEY = `${GAME_ID}-save`;
const CONTENT_KEY = `${GAME_ID}-content`;
const KEYS = [SAVE_KEY, CONTENT_KEY];
type Stored = Record<string, string | null>;

export default function App() {
  const [stored, setStored] = useState<Stored | null>(null);

  // Une copie native protège la sauvegarde si le système vide le stockage de la WebView.
  useEffect(() => {
    let alive = true;
    AsyncStorage.multiGet([...KEYS])
      .then((rows) => {
        if (alive) setStored(Object.fromEntries(rows) as Stored);
      })
      .catch(() => {
        if (alive) setStored({ [SAVE_KEY]: null, [CONTENT_KEY]: null });
      });
    return () => {
      alive = false;
    };
  }, []);

  // Calculé une seule fois : le jeu lit ces valeurs au démarrage, puis gère son état lui-même.
  const bridge = useMemo(() => {
    if (!stored) return null;
    const data = { save: stored[SAVE_KEY], content: stored[CONTENT_KEY], contentUrl: CONTENT_URL };
    return `window.__CDL_BRIDGE__=${JSON.stringify(data).replace(/</g, "\\u003c")};true;`;
  }, [stored]);

  const onMessage = (event: WebViewMessageEvent) => {
    let msg: { type?: string; key?: string; value?: string | null };
    try {
      msg = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (msg.type !== "kv" || !msg.key || !KEYS.includes(msg.key)) return;
    const key = msg.key;
    const write = msg.value == null ? AsyncStorage.removeItem(key) : AsyncStorage.setItem(key, msg.value);
    write.catch(() => {
      // La copie de la WebView reste disponible : le jeu continue.
    });
  };

  if (!bridge) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={GAME_ACCENT} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <WebView
        style={styles.root}
        originWhitelist={["*"]}
        // Une origine https stable garde le même stockage d'un lancement à l'autre.
        source={{ html: GAME_HTML, baseUrl: `https://${GAME_ID}.app/` }}
        injectedJavaScriptBeforeContentLoaded={bridge}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        bounces={false}
        overScrollMode="never"
        setSupportMultipleWindows={false}
        contentInsetAdjustmentBehavior="never"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: GAME_BG },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: GAME_BG },
});
