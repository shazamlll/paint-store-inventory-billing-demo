"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "../lib/supabase.js";
import {
  createEmptyDatabaseReadData,
  loadDevelopmentPageReadData
} from "../src/development-page-reads.js";

export function useDatabasePageData() {
  const authClient = useMemo(() => createBrowserSupabaseClient(), []);
  const [state, setState] = useState(() => ({
    data: createEmptyDatabaseReadData({ source: "loading", notice: "正在读取数据库。" }),
    loading: true
  }));

  const reload = useCallback(() => {
    if (!authClient) {
      setState({
        data: createEmptyDatabaseReadData({
          source: "supabase_unavailable",
          notice: "缺少 Supabase 公开配置，暂时无法读取数据库。"
        }),
        loading: false
      });
      return;
    }

    let active = true;

    setState((currentState) => ({
      ...currentState,
      loading: true
    }));

    loadDevelopmentPageReadData({ client: authClient }).then((data) => {
      if (!active) {
        return;
      }

      setState({
        data,
        loading: false
      });
    });

    return () => {
      active = false;
    };
  }, [authClient]);

  useEffect(() => reload(), [reload]);

  return {
    ...state,
    reload
  };
}
