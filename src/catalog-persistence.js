import { validateFirstStoreImportFiles } from "./first-store-import.js";
import {
  normalizeProductDraft,
  validateProductDraft
} from "./product-editor.js";
import {
  normalizeCustomerDraft,
  validateCustomerDraft
} from "./customers.js";

const catalogWriteTables = {
  products: "products",
  customers: "customers",
  suppliers: "suppliers"
};

export function prepareProductCatalogInsert({ draft, storeContext } = {}) {
  const gate = buildCatalogWriteGate(storeContext);

  if (!gate.allowed) {
    return blockedPreparation(gate);
  }

  const errors = validateProductDraft(draft ?? {});

  if (Object.keys(errors).length > 0) {
    return validationPreparation(errors);
  }

  const product = normalizeProductDraft(draft);

  return {
    allowed: true,
    reason: "ready",
    errors: {},
    row: {
      store_id: gate.storeId,
      name: product.name,
      spec: product.spec,
      unit: product.unit,
      cost_price: product.costPrice,
      sale_price: product.salePrice,
      current_stock: product.currentStock,
      low_stock_threshold: product.lowStockThreshold
    }
  };
}

export function prepareCustomerCatalogInsert({ draft, storeContext } = {}) {
  const gate = buildCatalogWriteGate(storeContext);

  if (!gate.allowed) {
    return blockedPreparation(gate);
  }

  const errors = validateCustomerDraft(draft ?? {});

  if (Object.keys(errors).length > 0) {
    return validationPreparation(errors);
  }

  const customer = normalizeCustomerDraft(draft);

  return {
    allowed: true,
    reason: "ready",
    errors: {},
    row: {
      store_id: gate.storeId,
      name: customer.name,
      phone: customer.phone,
      notes: customer.notes,
      receivable_balance: customer.receivableBalance
    }
  };
}

export function prepareSupplierCatalogInsert({ draft, storeContext } = {}) {
  const gate = buildCatalogWriteGate(storeContext);

  if (!gate.allowed) {
    return blockedPreparation(gate);
  }

  const errors = validateSupplierDraft(draft ?? {});

  if (Object.keys(errors).length > 0) {
    return validationPreparation(errors);
  }

  return {
    allowed: true,
    reason: "ready",
    errors: {},
    row: {
      store_id: gate.storeId,
      name: String(draft.name).trim(),
      phone: String(draft.phone ?? "").trim(),
      notes: String(draft.notes ?? "").trim(),
      payable_balance: Number(draft.payableBalance ?? 0)
    }
  };
}

export async function saveCatalogProduct({ client, storeContext, draft } = {}) {
  const preparation = prepareProductCatalogInsert({ draft, storeContext });

  if (draft?.id) {
    return updateCatalogRow({
      client,
      table: catalogWriteTables.products,
      id: draft.id,
      preparation
    });
  }

  return insertCatalogRow({
    client,
    table: catalogWriteTables.products,
    preparation
  });
}

export async function saveCatalogCustomer({ client, storeContext, draft } = {}) {
  return insertCatalogRow({
    client,
    table: catalogWriteTables.customers,
    preparation: prepareCustomerCatalogInsert({ draft, storeContext })
  });
}

export async function deleteCatalogProduct({ client, storeContext, id } = {}) {
  return deleteCatalogRow({
    client,
    table: catalogWriteTables.products,
    storeContext,
    id
  });
}

export async function deleteCatalogCustomer({ client, storeContext, id } = {}) {
  return deleteCatalogRow({
    client,
    table: catalogWriteTables.customers,
    storeContext,
    id
  });
}

export async function saveCatalogSupplier({ client, storeContext, draft } = {}) {
  return insertCatalogRow({
    client,
    table: catalogWriteTables.suppliers,
    preparation: prepareSupplierCatalogInsert({ draft, storeContext })
  });
}

export function buildDevelopmentCatalogImportPlan({ storeContext, files, validation } = {}) {
  const gate = buildCatalogWriteGate(storeContext);
  const importValidation = validation ?? validateFirstStoreImportFiles(files);
  const ready = gate.allowed && importValidation.ready === true;

  return {
    mode: "development_catalog_import_plan",
    canWriteToDevelopment: ready,
    productionWritesAllowed: false,
    reason: ready ? "ready" : gate.reason ?? "validation_failed",
    storeId: gate.storeId ?? null,
    validation: importValidation,
    steps: (importValidation.batches ?? []).map((batch) => ({
      id: `development_import_${batch.id}`,
      sourceId: batch.id,
      targetTable: batch.targetTable,
      rows: batch.rows,
      storeId: gate.storeId ?? null,
      action: "insert_with_server_controlled_store_id"
    })),
    blockedOperations: ["production_supabase_write", "live_sales_order_write"]
  };
}

export function buildCatalogWriteGate(storeContext) {
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

  return {
    allowed: true,
    reason: "ready",
    storeId: storeContext.activeStore.id
  };
}

async function insertCatalogRow({ client, table, preparation }) {
  if (!preparation.allowed) {
    return {
      errors: preparation.errors,
      saved: null
    };
  }

  if (!client?.from) {
    return {
      errors: {
        catalog: "catalog_client_unavailable"
      },
      saved: null
    };
  }

  const { data, error } = await client
    .from(table)
    .insert(preparation.row)
    .select("id")
    .single();

  if (error) {
    return {
      errors: {
        catalog: error.message ?? "catalog_write_failed"
      },
      saved: null
    };
  }

  return {
    errors: {},
    saved: data
  };
}

async function updateCatalogRow({ client, table, id, preparation }) {
  if (!preparation.allowed) {
    return {
      errors: preparation.errors,
      saved: null
    };
  }

  if (!client?.from) {
    return {
      errors: {
        catalog: "catalog_client_unavailable"
      },
      saved: null
    };
  }

  const { data, error } = await client
    .from(table)
    .update(preparation.row)
    .eq("id", id)
    .eq("store_id", preparation.row.store_id)
    .select("id")
    .single();

  if (error) {
    return {
      errors: {
        catalog: error.message ?? "catalog_update_failed"
      },
      saved: null
    };
  }

  return {
    errors: {},
    saved: data
  };
}

async function deleteCatalogRow({ client, table, storeContext, id }) {
  const gate = buildCatalogWriteGate(storeContext);

  if (!gate.allowed) {
    return {
      errors: {
        catalog: gate.reason
      },
      deleted: null
    };
  }

  if (!String(id ?? "").trim()) {
    return {
      errors: {
        catalog: "catalog_delete_id_required"
      },
      deleted: null
    };
  }

  if (!client?.from) {
    return {
      errors: {
        catalog: "catalog_client_unavailable"
      },
      deleted: null
    };
  }

  const { data, error } = await client
    .from(table)
    .delete()
    .eq("id", id)
    .eq("store_id", gate.storeId)
    .select("id")
    .single();

  if (error) {
    return {
      errors: {
        catalog: error.message ?? "catalog_delete_failed"
      },
      deleted: null
    };
  }

  return {
    errors: {},
    deleted: data
  };
}

function blockedPreparation(gate) {
  return {
    allowed: false,
    reason: gate.reason,
    errors: {
      catalog: gate.reason
    },
    row: null
  };
}

function validationPreparation(errors) {
  return {
    allowed: false,
    reason: "validation_failed",
    errors,
    row: null
  };
}

function validateSupplierDraft(draft) {
  const errors = {};
  const payableBalance = Number(draft.payableBalance ?? 0);

  if (!draft.name?.trim()) {
    errors.name = "supplier_name_required";
  }

  if (Number.isNaN(payableBalance) || payableBalance < 0) {
    errors.payableBalance = "supplier_payable_balance_invalid";
  }

  return errors;
}
