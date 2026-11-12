"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createManualAdjustmentDraft
} from "../../../src/inventory-adjustments.js";
import { createBrowserSupabaseClient } from "../../../lib/supabase.js";

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3
});

export default function InventoryAdjustmentClient({
  initialProducts = [],
  onSaved,
  readSource = "supabase_unavailable"
}) {
  const authClient = useMemo(() => createBrowserSupabaseClient(), []);
  const [products, setProducts] = useState(initialProducts);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [draft, setDraft] = useState(() => createManualAdjustmentDraft(initialProducts, initialProducts[0]));
  const [errors, setErrors] = useState({});
  const [movements, setMovements] = useState([]);
  const [notice, setNotice] = useState("");
  const selectedProduct = products[selectedIndex];
  const projectedStock = useMemo(() => {
    const delta = Number(draft.quantityDelta);
    return Number.isFinite(delta) && selectedProduct
      ? number.format(selectedProduct.currentStock + delta)
      : "-";
  }, [draft.quantityDelta, selectedProduct]);

  useEffect(() => {
    setProducts(initialProducts);
    setSelectedIndex(initialProducts.length > 0 ? 0 : -1);
    setDraft(createManualAdjustmentDraft(initialProducts, initialProducts[0]));
    setErrors({});
    setNotice("");
  }, [initialProducts]);

  function selectProduct(index) {
    const nextIndex = Number(index);
    setSelectedIndex(nextIndex);
    setDraft(createManualAdjustmentDraft(products, products[nextIndex]));
    setErrors({});
    setNotice("");
  }

  function updateDraft(field, value) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value
    }));
    setErrors((currentErrors) => {
      const { [field]: removed, product, ...rest } = currentErrors;
      return field === "quantityDelta" || field === "reason" ? rest : currentErrors;
    });
  }

  async function applyAdjustment(event) {
    event.preventDefault();
    const result = await saveAdjustmentToApi({ authClient, draft, readSource });

    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      setNotice("请检查标记的字段。");
      return;
    }

    const updatedProducts = products.map((productItem) =>
      productItem.id === result.saved.product.id
        ? {
            ...productItem,
            currentStock: result.saved.product.currentStock
          }
        : productItem
    );

    setProducts(updatedProducts);
    setMovements((currentMovements) => [...currentMovements, result.saved.movement]);
    setDraft(createManualAdjustmentDraft(updatedProducts, updatedProducts[selectedIndex]));
    setErrors({});
    setNotice("已写入数据库库存调整。");
    onSaved?.();
  }

  return (
    <div className="grid gap-5 py-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
      <section className="grid h-fit gap-5 rounded-md border border-[var(--border)] bg-[var(--panel)] p-4">
        <div>
          <p className="text-xs uppercase text-[var(--muted)]">调整设置</p>
          <h2 className="mt-1 text-xl font-semibold">手工库存调整</h2>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          <span>商品</span>
          <select
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            onChange={(event) => selectProduct(event.target.value)}
            value={selectedIndex}
          >
            {products.map((product, index) => (
              <option key={`${product.name}-${product.spec}`} value={index}>
                {product.name} - {product.spec} ({number.format(product.currentStock)} {product.unit})
              </option>
            ))}
          </select>
          {errors.product ? (
            <span className="text-xs font-medium text-[#b91c1c]">{errors.product}</span>
          ) : null}
        </label>

        <label className="grid gap-1 text-sm font-semibold">
          <span>调整数量</span>
          <input
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            onChange={(event) => updateDraft("quantityDelta", event.target.value)}
            step="1"
            type="number"
            value={draft.quantityDelta}
          />
          {errors.quantityDelta ? (
            <span className="text-xs font-medium text-[#b91c1c]">{errors.quantityDelta}</span>
          ) : null}
        </label>

        <label className="grid gap-1 text-sm font-semibold">
          <span>原因</span>
          <textarea
            className="min-h-24 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            onChange={(event) => updateDraft("reason", event.target.value)}
            value={draft.reason}
          />
          {errors.reason ? (
            <span className="text-xs font-medium text-[#b91c1c]">{errors.reason}</span>
          ) : null}
        </label>

        <div className="rounded-md bg-[var(--accent-soft)] px-3 py-2 text-sm">
          <p className="font-semibold">
            当前库存 {number.format(selectedProduct?.currentStock ?? 0)} {selectedProduct?.unit}
          </p>
          <p className="mt-1 text-[var(--muted)]">调整后预计库存 {projectedStock}</p>
        </div>

        <p className="min-h-5 text-sm font-medium text-[var(--muted)]">{notice}</p>

        <button
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          disabled={products.length === 0}
          onClick={applyAdjustment}
          type="button"
        >
          保存调整
        </button>
      </section>

      <section className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="grid gap-3 border-b border-[var(--border)] px-4 py-3 md:grid-cols-3">
          <Metric label="商品数" value={number.format(products.length)} />
          <Metric label="调整次数" value={number.format(movements.length)} />
          <Metric label="当前库存" value={number.format(selectedProduct?.currentStock ?? 0)} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--accent-soft)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <Column>商品</Column>
                <Column>规格</Column>
                <Column align="right">数量</Column>
                <Column align="right">调整后库存</Column>
                <Column>原因</Column>
                <Column>来源</Column>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <Cell className="text-[var(--muted)]" colSpan={6}>
                    暂无手工库存调整。
                  </Cell>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr className="border-t border-[var(--border)]" key={movement.sourceOrderNumber}>
                    <Cell className="font-semibold">{movement.productNameSnapshot}</Cell>
                    <Cell>{movement.specSnapshot}</Cell>
                    <Cell align="right">{number.format(movement.quantityDelta)}</Cell>
                    <Cell align="right">{number.format(movement.stockAfter)}</Cell>
                    <Cell>{movement.notes}</Cell>
                    <Cell>{movement.sourceOrderNumber}</Cell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

async function saveAdjustmentToApi({ authClient, draft, readSource }) {
  if (readSource !== "supabase") {
    return {
      errors: {
        product: "数据库商品目录未就绪。"
      },
      saved: null
    };
  }

  if (!authClient) {
    return {
      errors: {
        product: "Supabase Auth 尚未配置。"
      },
      saved: null
    };
  }

  const { data } = await authClient.auth.getSession();
  const accessToken = data?.session?.access_token;

  if (!accessToken) {
    return {
      errors: {
        product: "请先登录后再调整库存。"
      },
      saved: null
    };
  }

  try {
    const response = await fetch("/api/inventory/adjustments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(draft)
    });
    const body = await response.json();

    if (!response.ok) {
      return {
        errors: body.errors ?? { inventory: "库存调整写入失败。" },
        saved: null
      };
    }

    return body;
  } catch {
    return {
      errors: {
        inventory: "数据库连接异常，库存调整未写入。"
      },
      saved: null
    };
  }
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-[var(--accent-soft)] px-3 py-2">
      <p className="text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
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
    <td
      className={`whitespace-nowrap px-4 py-3 ${align === "right" ? "text-right" : ""} ${className}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  );
}
