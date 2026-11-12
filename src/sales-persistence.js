import {
  calculateSalesDraftTotals,
  validateSalesDraft
} from "./sales-form.js";

const salesWriteRoles = new Set(["owner", "clerk"]);

export function prepareSalesOrderTransaction({
  draft,
  storeContext,
  orderDate = getTodayIsoDate()
} = {}) {
  const gate = buildSalesWriteGate(storeContext);

  if (!gate.allowed) {
    return blockedPreparation(gate);
  }

  const errors = validateSalesTransactionDraft(draft);

  if (Object.keys(errors).length > 0) {
    return validationPreparation(errors);
  }

  const totals = calculateSalesDraftTotals(draft);
  const paymentAmount = roundMoney(Number(draft.paymentAmount ?? 0));

  return {
    allowed: true,
    reason: "ready",
    errors: {},
    payload: {
      store_id: gate.storeId,
      customer_id: draft.customer.id,
      order_date: orderDate,
      subtotal: totals.subtotal,
      discount_amount: totals.discountAmount,
      total_amount: totals.totalAmount,
      payment_amount: paymentAmount,
      payment_status: totals.paymentStatus,
      receivable_delta: totals.receivableDelta,
      notes: String(draft.notes ?? ""),
      lines: draft.lines.map((line) => ({
        product_id: line.productId,
        product_name_snapshot: String(line.productNameSnapshot),
        spec_snapshot: String(line.specSnapshot ?? ""),
        quantity: roundStock(Number(line.quantity)),
        unit: String(line.unit),
        unit_price: roundMoney(Number(line.unitPrice)),
        discount_amount: roundMoney(Number(line.discountAmount ?? 0)),
        line_total: roundMoney(Number(line.lineTotal))
      }))
    }
  };
}

export async function saveSalesOrderTransaction({
  client,
  storeContext,
  draft,
  orderDate
} = {}) {
  const preparation = prepareSalesOrderTransaction({
    draft,
    storeContext,
    orderDate
  });

  if (!preparation.allowed) {
    return {
      errors: preparation.errors,
      saved: null
    };
  }

  if (!client?.rpc) {
    return {
      errors: {
        sales: "sales_client_unavailable"
      },
      saved: null
    };
  }

  const { data, error } = await client.rpc("save_sales_order_transaction", {
    p_payload: preparation.payload
  });

  if (error) {
    return {
      errors: {
        sales: error.message ?? "sales_transaction_failed"
      },
      saved: null
    };
  }

  return {
    errors: {},
    saved: data
  };
}

export function buildSalesWriteGate(storeContext) {
  if (!storeContext?.ready) {
    return {
      allowed: false,
      reason: "loading_store_context",
      storeId: null
    };
  }

  if (!storeContext.activeStore?.id) {
    return {
      allowed: false,
      reason: "missing_store_context",
      storeId: null
    };
  }

  if (!salesWriteRoles.has(storeContext.role)) {
    return {
      allowed: false,
      reason: "role_forbidden",
      storeId: storeContext.activeStore.id
    };
  }

  return {
    allowed: true,
    reason: "ready",
    storeId: storeContext.activeStore.id
  };
}

function validateSalesTransactionDraft(draft = {}) {
  const errors = validateSalesDraft(draft);
  const totals = calculateSalesDraftTotals({
    lines: draft.lines ?? [],
    paymentAmount: draft.paymentAmount
  });
  const paymentAmount = Number(draft.paymentAmount ?? 0);

  if (draft.customer && !draft.customer.id) {
    errors.customer = "sales_customer_id_required";
  }

  if (Array.isArray(draft.lines) && draft.lines.some((line) => !line.productId)) {
    errors.lines = "sales_product_id_required";
  }

  if (
    Array.isArray(draft.lines) &&
    draft.lines.some((line) => line.currentStock !== undefined && Number(line.currentStock) < Number(line.quantity))
  ) {
    errors.inventory = "sales_stock_insufficient";
  }

  if (Number.isFinite(paymentAmount) && paymentAmount > totals.totalAmount) {
    errors.paymentAmount = "sales_payment_exceeds_total";
  }

  return errors;
}

function blockedPreparation(gate) {
  return {
    allowed: false,
    reason: gate.reason,
    errors: {
      sales: gate.reason
    },
    payload: null
  };
}

function validationPreparation(errors) {
  return {
    allowed: false,
    reason: "validation_failed",
    errors,
    payload: null
  };
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function roundStock(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
