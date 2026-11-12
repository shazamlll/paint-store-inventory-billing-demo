"use client";

import { useEffect, useMemo, useState } from "react";

import { createBrowserSupabaseClient } from "../../lib/supabase.js";
import { validatePurchaseOrderReceiving } from "../../src/inventory.js";
import { formatMoney } from "../../src/money.js";
import {
  addPurchaseLine,
  calculatePurchaseDraftTotals,
  createPurchaseDraft,
  removePurchaseLine,
  savePurchaseOrder,
  updatePurchaseLineCost,
  updatePurchaseLineQuantity
} from "../../src/purchase-form.js";
import { formatPaymentStatusLabel } from "../../src/ux-copy.js";

// Source-visible Chinese contracts: 删除 已保存入库单 库存流水 stock

const number = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 3
});

export default function PurchaseFormClient({
  initialProducts = [],
  initialSuppliers = [],
  initialSavedOrders = [],
  initialInventoryMovements = [],
  onSaved = async () => {},
  readSource = "supabase_unavailable"
}) {
  const authClient = useMemo(() => createBrowserSupabaseClient(), []);
  const initialDraft = useMemo(
    () => createPurchaseDraft(initialSuppliers, initialProducts),
    [initialSuppliers, initialProducts]
  );
  const [products, setProducts] = useState(initialProducts);
  const [supplierName, setSupplierName] = useState(initialDraft.supplier?.name ?? "");
  const [selectedProductIndex, setSelectedProductIndex] = useState(0);
  const [lines, setLines] = useState(initialDraft.lines);
  const [paymentAmount, setPaymentAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [savedOrders, setSavedOrders] = useState(initialSavedOrders);
  const [inventoryMovements, setInventoryMovements] = useState(initialInventoryMovements);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState("");
  const selectedSupplier = initialSuppliers.find((supplier) => supplier.name === supplierName);
  const totals = calculatePurchaseDraftTotals({
    lines,
    paymentAmount: Number(paymentAmount)
  });

  useEffect(() => {
    const nextDraft = createPurchaseDraft(initialSuppliers, initialProducts);

    setProducts(initialProducts);
    setSavedOrders(initialSavedOrders);
    setInventoryMovements(initialInventoryMovements);
    setSupplierName(nextDraft.supplier?.name ?? "");
    setSelectedProductIndex(0);
    setLines(nextDraft.lines);
    setPaymentAmount("0");
    setNotes("");
    setErrors({});
    setNotice("");
  }, [initialInventoryMovements, initialProducts, initialSavedOrders, initialSuppliers]);

  function addSelectedProduct() {
    const product = products[Number(selectedProductIndex)];

    if (!product) {
      return;
    }

    setLines((currentLines) => addPurchaseLine(currentLines, product));
  }

  function removeLine(index) {
    setLines((currentLines) => removePurchaseLine(currentLines, index));
  }

  async function saveCurrentOrder() {
    const supplier = supplierName.trim()
      ? {
          ...(selectedSupplier ?? {}),
          name: supplierName.trim()
        }
      : null;
    const draft = {
      supplier,
      lines,
      paymentAmount: Number(paymentAmount),
      notes
    };
    const result = savePurchaseOrder(savedOrders, draft);

    if (Object.keys(result.errors).length > 0) {
      setErrors(result.errors);
      setNotice("请检查标记的字段。");
      return;
    }

    const inventoryErrors = validatePurchaseOrderReceiving(products, result.savedOrder);

    if (Object.keys(inventoryErrors).length > 0) {
      setErrors(inventoryErrors);
      setNotice("入库前请先检查库存。");
      return;
    }

    const saveResult = await savePurchaseOrderToApi({
      authClient,
      draft,
      readSource
    });

    if (!saveResult.ok) {
      setErrors({});
      setNotice(saveResult.message);
      return;
    }

    setErrors({});
    setNotice(saveResult.message);
    await onSaved();
  }

  return (
    <div className="grid gap-5 py-5 lg:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)]">
      <section className="grid h-fit gap-5 rounded-md border border-[var(--border)] bg-[var(--panel)] p-4">
        <div>
          <p className="text-xs uppercase text-[var(--muted)]">入库设置</p>
          <h2 className="mt-1 text-xl font-semibold">供应商到货</h2>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          <span>供应商</span>
          <input
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            onChange={(event) => setSupplierName(event.target.value)}
            placeholder="请输入供应商名称"
            type="text"
            value={supplierName}
          />
        </label>

        <div className="rounded-md bg-[var(--accent-soft)] px-3 py-2 text-sm">
          <p className="font-semibold">{selectedSupplier?.phone || "无电话"}</p>
          <p className="mt-1 text-[var(--muted)]">
            当前应付 {formatMoney(selectedSupplier?.payableBalance ?? 0)}
          </p>
        </div>

        <label className="grid gap-1 text-sm font-semibold">
          <span>添加入库商品</span>
          <select
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            onChange={(event) => setSelectedProductIndex(event.target.value)}
            value={selectedProductIndex}
          >
            {products.map((product, index) => (
              <option key={`${product.name}-${product.spec}-${index}`} value={index}>
                {product.name} - {product.spec}（现有 {number.format(product.currentStock)} {product.unit}）
              </option>
            ))}
          </select>
        </label>

        <button
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          disabled={products.length === 0}
          onClick={addSelectedProduct}
          type="button"
        >
          添加入库明细
        </button>

        <label className="grid gap-1 text-sm font-semibold">
          <span>本次付款给供应商</span>
          <input
            className="rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            min="0"
            onChange={(event) => setPaymentAmount(event.target.value)}
            step="0.01"
            type="number"
            value={paymentAmount}
          />
          {errors.paymentAmount ? (
            <span className="text-xs font-medium text-[#b91c1c]">{errors.paymentAmount}</span>
          ) : null}
        </label>

        <label className="grid gap-1 text-sm font-semibold">
          <span>到货备注</span>
          <textarea
            className="min-h-24 rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm font-normal outline-none focus:border-[var(--accent)]"
            onChange={(event) => setNotes(event.target.value)}
            value={notes}
          />
        </label>

        {errors.supplier ? <p className="text-sm font-medium text-[#b91c1c]">{errors.supplier}</p> : null}
        {errors.lines ? <p className="text-sm font-medium text-[#b91c1c]">{errors.lines}</p> : null}
        {errors.inventory ? <p className="text-sm font-medium text-[#b91c1c]">{errors.inventory}</p> : null}
        <p className="min-h-5 text-sm font-medium text-[var(--muted)]">{notice}</p>

        <button
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white"
          disabled={products.length === 0}
          onClick={saveCurrentOrder}
          type="button"
        >
          保存入库单
        </button>
      </section>

      <section className="overflow-hidden rounded-md border border-[var(--border)] bg-[var(--panel)]">
        <div className="grid gap-3 border-b border-[var(--border)] px-4 py-3 md:grid-cols-4">
          <Metric label="小计" value={formatMoney(totals.subtotal)} />
          <Metric label="合计" value={formatMoney(totals.totalAmount)} />
          <Metric label="已付" value={formatMoney(totals.paymentAmount)} />
          <Metric label="状态" value={formatPaymentStatusLabel(totals.paymentStatus)} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--accent-soft)] text-xs uppercase text-[var(--muted)]">
              <tr>
                <Column>商品</Column>
                <Column>规格</Column>
                <Column align="right">入库数量</Column>
                <Column align="right">进货单价</Column>
                <Column align="right">行合计</Column>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr className="border-t border-[var(--border)]">
                  <Cell className="text-[var(--muted)]" colSpan={5}>
                    暂无可入库商品，请先确认数据库商品目录。
                  </Cell>
                </tr>
              ) : (
                lines.map((line, index) => (
                  <tr className="border-t border-[var(--border)]" key={`${line.productNameSnapshot}-${line.specSnapshot}-${index}`}>
                    <Cell className="font-semibold">
                      <div className="flex items-center gap-3">
                        <span>{line.productNameSnapshot}</span>
                        <button
                          aria-label={`删除 ${line.productNameSnapshot} ${line.specSnapshot}`}
                          className="rounded-md border border-[var(--border)] px-3 py-1 text-sm font-semibold text-[var(--danger-ink)]"
                          onClick={() => removeLine(index)}
                          type="button"
                        >
                          删除
                        </button>
                      </div>
                    </Cell>
                    <Cell>{line.specSnapshot}</Cell>
                    <Cell align="right">
                      <input
                        className="w-24 rounded-md border border-[var(--border)] px-2 py-1 text-right"
                        min="0"
                        onChange={(event) =>
                          setLines((currentLines) =>
                            updatePurchaseLineQuantity(currentLines, index, event.target.value)
                          )
                        }
                        step="1"
                        type="number"
                        value={line.quantity}
                      />
                    </Cell>
                    <Cell align="right">
                      <input
                        className="w-24 rounded-md border border-[var(--border)] px-2 py-1 text-right"
                        min="0"
                        onChange={(event) =>
                          setLines((currentLines) =>
                            updatePurchaseLineCost(currentLines, index, event.target.value)
                          )
                        }
                        step="0.01"
                        type="number"
                        value={line.unitCost}
                      />
                    </Cell>
                    <Cell align="right">{formatMoney(line.lineTotal)}</Cell>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="grid gap-2 border-t border-[var(--border)] px-4 py-4 text-sm md:ml-auto md:w-80">
          <SummaryRow label="供应商付款" value={formatMoney(totals.paymentAmount)} />
          <SummaryRow label="应付余额" value={formatMoney(totals.payableDelta)} />
          <SummaryRow label="入库明细" value={number.format(lines.length)} />
        </div>

        <div className="border-t border-[var(--border)] px-4 py-4">
          <p className="text-xs uppercase text-[var(--muted)]">已保存入库单</p>
          <h2 className="mt-1 text-lg font-semibold">{savedOrders.length} 张数据库入库单</h2>
        </div>

        <div className="border-t border-[var(--border)] px-4 py-4">
          <p className="text-xs uppercase text-[var(--muted)]">库存流水</p>
          <h2 className="mt-1 text-lg font-semibold">{inventoryMovements.length} 条数据库入库流水</h2>
        </div>
      </section>
    </div>
  );
}

async function savePurchaseOrderToApi({ authClient, draft, readSource }) {
  if (readSource !== "supabase") {
    return {
      ok: false,
      message: "数据库目录未就绪，未写入数据库。"
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
    const response = await fetch("/api/purchases/orders", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(draft)
    });

    if (!response.ok) {
      return {
        ok: false,
        message: "数据库采购事务写入失败，请检查供应商、商品或付款金额。"
      };
    }

    const body = await response.json();
    const orderNumber = body.saved?.order_number;

    return {
      ok: true,
      orderNumber,
      message: `已写入数据库采购事务：${orderNumber ?? "已保存"}。`
    };
  } catch {
    return {
      ok: false,
      message: "数据库连接异常，未写入远端。"
    };
  }
}

function Metric({ label, value }) {
  return (
    <div className="rounded-md bg-[var(--accent-soft)] px-3 py-2">
      <p className="text-xs uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-lg font-semibold capitalize">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="font-semibold">{value}</span>
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
