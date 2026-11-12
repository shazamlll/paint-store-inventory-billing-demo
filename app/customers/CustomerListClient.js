"use client";

import { useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "../../lib/supabase.js";
import {
  createCustomerDraft,
  getCustomerSummary,
  normalizeCustomerDraft,
  validateCustomerDraft
} from "../../src/customers.js";
import { isWritableCatalogReadSource } from "../../src/catalog-readiness.js";
import { formatMoney } from "../../src/money.js";

export default function CustomerListClient({
  initialCustomers = [],
  onSaved = async () => {},
  readSource = "supabase_unavailable"
}) {
  const authClient = useMemo(() => createBrowserSupabaseClient(), []);
  const [customers, setCustomers] = useState(initialCustomers);
  const [draft, setDraft] = useState(() => createCustomerDraft());
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const summary = useMemo(() => getCustomerSummary(customers), [customers]);

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  function changeField(field, value) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value
    }));
    setErrors((currentErrors) => {
      const { [field]: removed, ...rest } = currentErrors;
      return rest;
    });
  }

  async function addCustomer(event) {
    event.preventDefault();
    const nextErrors = validateCustomerDraft(draft);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setNotice("请检查标记的字段。");
      return;
    }

    const customer = normalizeCustomerDraft(draft);
    const saveResult = await saveCustomerToCatalogApi(customer, authClient, readSource);

    if (!saveResult.ok) {
      setNotice(saveResult.message);
      return;
    }

    setDraft(createCustomerDraft());
    setNotice(saveResult.message);
    await onSaved();
  }

  async function removeCustomer(customer) {
    const deleteResult = await deleteCustomerFromCatalogApi(customer.id, authClient, readSource);

    setNotice(deleteResult.message);

    if (deleteResult.ok) {
      await onSaved();
    }
  }

  return (
    <div className="grid gap-5 py-5">
      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="客户数" value={summary.totalCustomers} />
        <Metric label="有应收款" value={summary.receivableCustomerCount} />
        <Metric label="应收合计" value={formatMoney(summary.totalReceivableBalance)} />
        <Metric label="快速开单" value={summary.walkInCustomerName || "未设置"} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.4fr)]">
        <form className="rounded-md border border-[var(--border)] bg-[var(--panel)] p-4" onSubmit={addCustomer}>
          <div>
            <p className="text-xs uppercase text-[var(--muted)]">新增客户</p>
            <h2 className="mt-1 text-xl font-semibold">客户资料</h2>
          </div>

          <div className="mt-4 grid gap-3">
            <Field
              error={errors.name}
              label="姓名"
              name="name"
              onChange={changeField}
              value={draft.name}
            />
            <Field
              label="电话"
              name="phone"
              onChange={changeField}
              value={draft.phone}
            />
            <Field
              error={errors.receivableBalance}
              label="期初应收"
              name="receivableBalance"
              onChange={changeField}
              type="number"
              value={draft.receivableBalance}
            />
            <label className="grid gap-1 text-sm font-semibold">
              <span>备注</span>
              <textarea
                className="min-h-24 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
                name="notes"
                onChange={(event) => changeField("notes", event.target.value)}
                value={draft.notes}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4">
            <p className="min-h-5 text-sm font-medium text-[var(--muted)]">{notice}</p>
            <button
              className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
              type="submit"
            >
              保存客户
            </button>
          </div>
        </form>

        <div className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--panel)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead className="bg-[var(--accent-soft)] text-xs uppercase text-[var(--muted)]">
                <tr>
                  <Column>姓名</Column>
                  <Column>电话</Column>
                  <Column>备注</Column>
                  <Column align="right">应收款</Column>
                  <Column>状态</Column>
                  <Column>操作</Column>
                </tr>
              </thead>
              <tbody>
                {customers.length === 0 ? (
                  <tr className="border-t border-[var(--border)]">
                    <Cell className="text-[var(--muted)]" colSpan={6}>
                      暂无数据库客户。
                    </Cell>
                  </tr>
                ) : (
                  customers.map((customer) => (
                    <tr className="border-t border-[var(--border)]" key={`${customer.name}-${customer.phone}`}>
                      <Cell className="font-semibold">{customer.name}</Cell>
                      <Cell>{customer.phone || "-"}</Cell>
                      <Cell>{customer.notes || "-"}</Cell>
                      <Cell align="right">{formatMoney(customer.receivableBalance)}</Cell>
                      <Cell>
                        <span
                          className={
                            customer.receivableBalance > 0
                              ? "rounded px-2 py-1 text-xs font-semibold text-[#991b1b] bg-[#fee2e2]"
                              : "rounded px-2 py-1 text-xs font-semibold text-[#166534] bg-[#dcfce7]"
                          }
                        >
                          {customer.receivableBalance > 0 ? "有欠款" : "已结清"}
                        </span>
                      </Cell>
                      <Cell>
                        <button
                          aria-label={`删除 ${customer.name}`}
                          className="rounded-md border border-[var(--border)] px-3 py-1 text-sm font-semibold text-[var(--danger-ink)] disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!customer.id}
                          onClick={() => removeCustomer(customer)}
                          type="button"
                        >
                          删除
                        </button>
                      </Cell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

async function saveCustomerToCatalogApi(customer, authClient, readSource) {
  if (!isWritableCatalogReadSource(readSource)) {
    return {
      ok: false,
      message: "数据库客户目录未就绪，未写入数据库。"
    };
  }

  if (!authClient) {
    return {
      ok: false,
      message: "Supabase Auth 尚未配置，未写入数据库。"
    };
  }

  const { data } = await authClient.auth.getSession();
  const accessToken = data?.session?.access_token;

  if (!accessToken) {
    return {
      ok: false,
      message: "请先登录后再写入数据库。"
    };
  }

  try {
    const response = await fetch("/api/catalog/customers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(customer)
    });

    if (!response.ok) {
      return {
        ok: false,
        message: "数据库客户目录写入失败，请检查门店上下文。"
      };
    }

    return {
      ok: true,
      message: "已写入数据库客户目录。"
    };
  } catch {
    return {
      ok: false,
      message: "数据库连接异常，未写入远端。"
    };
  }
}

async function deleteCustomerFromCatalogApi(id, authClient, readSource) {
  if (!isWritableCatalogReadSource(readSource) || !id) {
    return {
      ok: false,
      message: "数据库客户目录未就绪，未删除客户。"
    };
  }

  if (!authClient) {
    return {
      ok: false,
      message: "Supabase Auth 尚未配置，未删除数据。"
    };
  }

  const { data } = await authClient.auth.getSession();
  const accessToken = data?.session?.access_token;

  if (!accessToken) {
    return {
      ok: false,
      message: "请先登录后再删除数据。"
    };
  }

  try {
    const response = await fetch("/api/catalog/customers", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id })
    });

    if (!response.ok) {
      return {
        ok: false,
        message: "数据库客户删除失败，请检查门店上下文。"
      };
    }

    return {
      ok: true,
      message: "已删除数据库客户。"
    };
  } catch {
    return {
      ok: false,
      message: "数据库连接异常，未删除远端数据。"
    };
  }
}

function Field({ error, label, name, onChange, type = "text", value }) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      <span>{label}</span>
      <input
        className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
        min={type === "number" ? "0" : undefined}
        name={name}
        onChange={(event) => onChange(name, event.target.value)}
        step={type === "number" ? "0.01" : undefined}
        type={type}
        value={value}
      />
      {error ? <span className="text-xs font-medium text-[#b91c1c]">{error}</span> : null}
    </label>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md border border-[var(--border)] bg-[var(--panel)] px-4 py-3">
      <p className="text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-xl font-semibold">{value}</p>
    </div>
  );
}

function Column({ align = "left", children }) {
  return (
    <th className={`whitespace-nowrap px-4 py-3 font-semibold ${align === "right" ? "text-right" : ""}`}>
      {children}
    </th>
  );
}

function Cell({ align = "left", className = "", colSpan, children }) {
  return (
    <td className={`whitespace-nowrap px-4 py-3 ${align === "right" ? "text-right" : ""} ${className}`} colSpan={colSpan}>
      {children}
    </td>
  );
}
