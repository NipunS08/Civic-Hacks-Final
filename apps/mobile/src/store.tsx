import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_PREFERENCES,
  parsePreferences,
  isMobileItem,
  type Preferences,
  type AgendaItem,
} from "@civiclens/shared";
const KEY = "civiclens.mobile.v1";
type Store = {
  ready: boolean;
  preferences: Preferences;
  setPreferences: (p: Preferences) => void;
  saved: AgendaItem[];
  toggleSaved: (i: AgendaItem) => void;
  clear: () => void;
  storageError: string | null;
};
const Context = createContext<Store | null>(null);
let writes = Promise.resolve();
export function ResidentProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [saved, setSaved] = useState<AgendaItem[]>([]);
  const [storageError, setStorageError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const data = JSON.parse(raw);
        setPreferences(parsePreferences(data.preferences));
        setSaved(
          Array.isArray(data.saved)
            ? data.saved.filter(isMobileItem).slice(0, 100)
            : [],
        );
      })
      .catch(() => {
        if (active)
          setStorageError(
            "Local storage could not be read. Your choices will last for this session.",
          );
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const value = JSON.stringify({ preferences, saved });
    writes = writes
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(KEY, value));
    writes.catch(() =>
      setStorageError(
        "Changes could not be saved on this device. Keep the app open or retry later.",
      ),
    );
  }, [preferences, saved, ready]);
  const toggleSaved = useCallback(
    (item: AgendaItem) =>
      setSaved((old) =>
        old.some((i) => i.item_number === item.item_number)
          ? old.filter((i) => i.item_number !== item.item_number)
          : [item, ...old].slice(0, 100),
      ),
    [],
  );
  return (
    <Context.Provider
      value={{
        ready,
        preferences,
        setPreferences,
        saved,
        toggleSaved,
        storageError,
        clear: () => {
          setPreferences({ ...DEFAULT_PREFERENCES, onboarded: true });
          setSaved([]);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useResident() {
  const s = useContext(Context);
  if (!s) throw Error("ResidentProvider missing");
  return s;
}
