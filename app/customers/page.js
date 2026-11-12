"use client";

import Link from "next/link";

import CustomerListClient from "./CustomerListClient.js";
import { useDatabasePageData } from "../useDatabasePageData.js";

export default function CustomersPage() {
  const { data, loading, reload } = useDatabasePageData();
  const { customers } = data;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-6">
      <header className="flex flex-col gap-4 border-b border-[var(--border)] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[var(--accent)]" href="/">
            返回首页
          </Link>
          <h1 className="mt-3 text-3xl font-semibold">客户列表</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">
            读取当前登录账号可访问门店的数据库客户清单，用于开单准备和应收款扫描。
          </p>
        </div>
      </header>

      <ReadStateNotice loading={loading} state={customers} />

      <CustomerListClient
        initialCustomers={customers.rows}
        onSaved={reload}
        readSource={customers.source}
      />
    </main>
  );
}

function ReadStateNotice({ loading, state }) {
  const label = loading ? "正在读取数据库" : getReadStateLabel(state.source);

  return (
    <section className="mt-5 rounded-md border border-[var(--border)] bg-[var(--accent-soft)] px-4 py-3">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-sm text-[var(--muted)]">{state.notice}</p>
      </div>
    </section>
  );
}

function getReadStateLabel(source) {
  if (source === "supabase") {
    return "数据库实时数据";
  }

  if (source === "supabase_empty") {
    return "数据库暂无数据";
  }

  return "数据库读取受限";
}
