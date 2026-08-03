import { useContext } from "react";
import { RuntimeStoreContext, type RuntimeStoreValue } from "./RuntimeStoreContext";

export function useRuntimeStore(): RuntimeStoreValue {
  const ctx = useContext(RuntimeStoreContext);
  if (!ctx) throw new Error("useRuntimeStore must be used within a RuntimeStoreProvider");
  return ctx;
}
