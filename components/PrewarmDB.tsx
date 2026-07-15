"use client";
import { useEffect } from "react";
export default function PrewarmDB() {
  useEffect(() => {
    fetch("/api/health").catch(() => {});
  }, []);
  return null;
}
