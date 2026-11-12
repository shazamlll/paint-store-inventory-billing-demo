const inventoryAdjustmentRoles = new Set(["owner", "clerk"]);

export async function saveInventoryAdjustment({ client, storeContext, draft } = {}) {
  const gate = buildInventoryAdjustmentWriteGate(storeContext);

  if (!gate.allowed) {
    return {
      errors: {
        inventory: gate.reason
      },
      saved: null
    };
  }

  const errors = validateInventoryAdjustmentPayload(draft);

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      saved: null
    };
  }

  if (!client?.from) {
    return {
      errors: {
        inventory: "inventory_client_unavailable"
      },
      saved: null
    };
  }

  const { data: product, error: productError } = await client
    .from("products")
    .select("id,store_id,name,spec,unit,current_stock")
    .eq("id", draft.productId)
    .eq("store_id", gate.storeId)
    .single();

  if (productError || !product) {
    return {
      errors: {
        product: "inventory_product_not_found"
      },
      saved: null
    };
  }

  const quantityDelta = roundStock(Number(draft.quantityDelta));
  const stockAfter = roundStock(Number(product.current_stock) + quantityDelta);

  if (stockAfter < 0) {
    return {
      errors: {
        quantityDelta: "inventory_stock_after_negative"
      },
      saved: null
    };
  }

  const { error: updateError } = await client
    .from("products")
    .update({ current_stock: stockAfter })
    .eq("id", product.id)
    .eq("store_id", gate.storeId);

  if (updateError) {
    return {
      errors: {
        inventory: updateError.message ?? "inventory_product_update_failed"
      },
      saved: null
    };
  }

  const movementId = crypto.randomUUID();
  const movementRow = {
    id: movementId,
    store_id: gate.storeId,
    product_id: product.id,
    movement_type: "adjustment",
    quantity_delta: quantityDelta,
    stock_after: stockAfter,
    source_table: "inventory_movements",
    source_id: movementId,
    notes: `手动调整：${String(draft.reason).trim()}`
  };
  const { error: movementError } = await client
    .from("inventory_movements")
    .insert(movementRow);

  if (movementError) {
    return {
      errors: {
        inventory: movementError.message ?? "inventory_movement_insert_failed"
      },
      saved: null
    };
  }

  return {
    errors: {},
    saved: {
      product: {
        id: product.id,
        storeId: product.store_id,
        name: product.name,
        spec: product.spec,
        unit: product.unit,
        currentStock: stockAfter
      },
      movement: {
        id: movementId,
        productNameSnapshot: product.name,
        specSnapshot: product.spec,
        movementType: "adjustment",
        quantityDelta,
        stockAfter,
        sourceTable: "inventory_movements",
        sourceOrderNumber: movementId,
        notes: movementRow.notes
      }
    }
  };
}

export function buildInventoryAdjustmentWriteGate(storeContext) {
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

  if (!inventoryAdjustmentRoles.has(storeContext.role)) {
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

function validateInventoryAdjustmentPayload(draft = {}) {
  const errors = {};
  const quantityDelta = Number(draft.quantityDelta);

  if (!draft.productId) {
    errors.product = "inventory_product_id_required";
  }

  if (!Number.isFinite(quantityDelta)) {
    errors.quantityDelta = "inventory_quantity_delta_invalid";
  } else if (quantityDelta === 0) {
    errors.quantityDelta = "inventory_quantity_delta_zero";
  }

  if (!String(draft.reason ?? "").trim()) {
    errors.reason = "inventory_adjustment_reason_required";
  }

  return errors;
}

function roundStock(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
}
