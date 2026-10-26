import { useCallback, useEffect, useState } from "react";
import { getAllDocs, saveDoc, deleteDoc, deleteFile } from "../lib/db.js";

export default function useDocuments() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const all = await getAllDocs();
      all.sort((a, b) => b.addedAt.localeCompare(a.addedAt)); // newest first
      setDocs(all);
      setError("");
    } catch (err) {
      setError(err.message || "Couldn't load your library.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (doc) => {
      await saveDoc(doc);
      await refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    async (id) => {
      await deleteDoc(id);
      try {
        await deleteFile(id);
      } catch {
        // The lesson is already gone; a leftover file isn't a problem
      }
      await refresh();
    },
    [refresh]
  );

  return { docs, loading, error, add, remove };
}