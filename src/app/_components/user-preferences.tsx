"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "~/trpc/react";

export interface UserPreferences {
  showListStats: boolean;
  statusSelectMode: "dropdown" | "buttons";
  defaultPlaylistId: string | null;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  showListStats: true,
  statusSelectMode: "dropdown",
  defaultPlaylistId: null,
};

interface UserPreferencesContextValue {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K],
  ) => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | null>(
  null,
);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const utils = api.useUtils();
  const { data, isLoading } = api.preferences.get.useQuery();

  const mutation = api.preferences.update.useMutation({
    onSuccess: () => {
      void utils.preferences.get.invalidate();
    },
  });

  const preferences: UserPreferences = data
    ? {
        showListStats: data.showListStats,
        statusSelectMode: data.statusSelectMode as "dropdown" | "buttons",
        defaultPlaylistId: data.defaultPlaylistId,
      }
    : DEFAULT_PREFERENCES;

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      mutation.mutate({ [key]: value });
    },
    [mutation],
  );

  if (isLoading) return null;

  return (
    <UserPreferencesContext.Provider value={{ preferences, updatePreference }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPreferencesContext);
  if (!ctx) {
    throw new Error(
      "useUserPreferences must be used within UserPreferencesProvider",
    );
  }
  return ctx;
}
