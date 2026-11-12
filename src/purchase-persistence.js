import {
  calculatePurchaseDraftTotals,
  validatePurchaseDraft
} from "./purchase-form.js";

const purchaseWriteRoles = new Set(["owner", "clerk"]);

export function preparePurchaseOrderTransaction({
  draft,
  storeContext,
  receivedDate = getTodayIsoDate()
} = {}) {
  const gate = buildPurchaseWriteGate(storeContext);

  if (!gate.allowed) {
    return blockedPreparation(gate);
  }

  const errors = validatePurchaseTransactionDraft(draft);

  if (Object.keys(errors).length > 0) {
    return validationPreparation(errors);
  }

  const totals = calculatePurchaseDraftTotals(draft);
  const paymentAmount = roundMoney(Number(draft.paymentAmount ?? 0));

  return {
    allowed: true,
    reason: "ready",
    errors: {},
    payload: {
      store_id: gate.storeId,
      supplier_id: draft.supplier.id,
      received_date: receivedDate,
      subtotal: totals.subtotal,
      total_amount: totals.totalAmount,
      payment_amount: paymentAmount,
      payment_status: totals.paymentStatus,
      payable_delta: totals.payableDelta,
      notes: String(draft.notes ?? ""),
      lines: draft.lines.map((line) => ({
        product_id: line.productId,
        product_name_snapshot: String(line.productNameSnapshot),
        spec_snapshot: String(line.specSnapshot ?? ""),
        quantity: roundStock(Number(line.quantity)),
        unit: String(line.unit),
        unit_cost: roundMoney(Number(line.unitCost)),
        line_total: roundMoney(Number(line.lineTotal))
      }))
    }
  };
}

export async function savePurchaseOrderTransaction({
  client,
  storeContext,
  draft,
  receivedDate
} = {}) {
  const supplierProvision = await provisionPurchaseSupplierIfNeeded({
    client,
    storeContext,
    draft
  });

  if (Object.keys(supplierProvision.errors).length > 0) {
    return {
      errors: supplierProvision.errors,
      saved: null
    };
  }

  const preparation = preparePurchaseOrderTransaction({
    draft: supplierProvision.draft,
    storeContext,
    receivedDate
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
        purchase: "purchase_client_unavailable"
      },
      saved: null
    };
  }

  const { data, error } = await client.rpc("save_purchase_order_transaction", {
    p_payload: preparation.payload
  });

  if (error) {
    return {
      errors: {
        purchase: error.message ?? "purchase_transaction_failed"
      },
      saved: null
    };
  }

  return {
    errors: {},
    saved: data
  };
}

async function provisionPurchaseSupplierIfNeeded({ client, storeContext, draft } = {}) {
  if (!draft?.supplier || draft.supplier.id) {
    return {
      errors: {},
      draft
    };
  }

  const gate = buildPurchaseWriteGate(storeContext);

  if (!gate.allowed) {
    return {
      errors: {
        purchase: gate.reason
      },
      draft
    };
  }

  if (!client?.from) {
    return {
      errors: {
        supplier: "purchase_supplier_client_unavailable"
      },
      draft
    };
  }

  const supplierName = String(draft.supplier.name ?? "").trim();

  if (!supplierName) {
    return {
      errors: {
        supplier: "请选择供应商。"
      },
      draft
    };
  }

  const existing = await client
    .from("suppliers")
    .select("id")
    .eq("store_id", gate.storeId)
    .eq("name", supplierName)
    .maybeSingle();

  if (existing.error) {
    return {
      errors: {
        supplier: existing.error.message ?? "purchase_supplier_lookup_failed"
      },
      draft
    };
  }

  const supplier = existing.data ?? await createPurchaseSupplier({
    client,
    storeId: gate.storeId,
    supplierName
  });

  if (supplier.error) {
    return {
      errors: {
        supplier: supplier.error.message ?? "purchase_supplier_create_failed"
      },
      draft
    };
  }

  return {
    errors: {},
    draft: {
      ...draft,
      supplier: {
        ...draft.supplier,
        id: supplier.id,
        name: supplierName
      }
    }
  };
}

async function createPurchaseSupplier({ client, storeId, supplierName }) {
  const { data, error } = await client
    .from("suppliers")
    .insert({
      store_id: storeId,
      name: supplierName,
      phone: "",
      notes: "采购入库自动创建",
      payable_balance: 0
    })
    .select("id")
    .single();

  if (error) {
    return {
      error
    };
  }

  return data;
}

export function buildPurchaseWriteGate(storeContext) {
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

  if (!purchaseWriteRoles.has(storeContext.role)) {
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

function validatePurchaseTransactionDraft(draft = {}) {
  const errors = validatePurchaseDraft(draft);
  const totals = calculatePurchaseDraftTotals({
    lines: draft.lines ?? [],
    paymentAmount: draft.paymentAmount
  });
  const paymentAmount = Number(draft.paymentAmount ?? 0);

  if (draft.supplier && !draft.supplier.id) {
    errors.supplier = "purchase_supplier_id_required";
  }

  if (Array.isArray(draft.lines) && draft.lines.some((line) => !line.productId)) {
    errors.lines = "purchase_product_id_required";
  }

  if (Array.isArray(draft.lines) && draft.lines.some((line) => Number(line.unitCost) < 0)) {
    errors.lines = "purchase_unit_cost_invalid";
  }

  if (!errors.lines && Number.isFinite(paymentAmount) && paymentAmount > totals.totalAmount) {
    errors.paymentAmount = "purchase_payment_exceeds_total";
  }

  return errors;
}

function blockedPreparation(gate) {
  return {
    allowed: false,
    reason: gate.reason,
    errors: {
      purchase: gate.reason
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
