export function createManualAdjustmentDraft(products, selectedProduct = products[0]) {
  return {
    ...(selectedProduct?.id ? { productId: selectedProduct.id } : {}),
    ...(selectedProduct?.storeId ? { productStoreId: selectedProduct.storeId } : {}),
    productNameSnapshot: selectedProduct?.name ?? "",
    specSnapshot: selectedProduct?.spec ?? "",
    unit: selectedProduct?.unit ?? "",
    quantityDelta: "0",
    reason: ""
  };
}

export function validateManualAdjustmentDraft(products, draft) {
  const product = findProductForAdjustment(products, draft);

  if (!product) {
    return {
      product: `未找到要调整的商品：${draft.productNameSnapshot} ${draft.specSnapshot}。`
    };
  }

  const quantityDelta = Number(draft.quantityDelta);

  if (!Number.isFinite(quantityDelta)) {
    return {
      quantityDelta: "调整数量必须是数字。"
    };
  }

  if (quantityDelta === 0) {
    return {
      quantityDelta: "调整数量不能为 0。"
    };
  }

  if (roundStock(product.currentStock + quantityDelta) < 0) {
    return {
      quantityDelta: "调整后库存不能为负数。"
    };
  }

  if (!draft.reason?.trim()) {
    return {
      reason: "请填写调整原因。"
    };
  }

  return {};
}

export function applyManualInventoryAdjustment(products, draft, options = {}) {
  const errors = validateManualAdjustmentDraft(products, draft);

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      products,
      movement: null
    };
  }

  const product = findProductForAdjustment(products, draft);
  const quantityDelta = roundStock(Number(draft.quantityDelta));
  const stockAfter = roundStock(product.currentStock + quantityDelta);
  const sourceOrderNumber = createAdjustmentNumber(options);
  const reason = draft.reason.trim();
  const movement = {
    productNameSnapshot: product.name,
    specSnapshot: product.spec,
    movementType: "adjustment",
    quantityDelta,
    stockAfter,
    sourceTable: "manual_adjustments",
    sourceOrderNumber,
    notes: `手动调整：${reason}`
  };

  return {
    errors: {},
    products: products.map((productItem) =>
      productItem === product
        ? {
            ...productItem,
            currentStock: stockAfter
          }
        : productItem
    ),
    movement
  };
}

function findProductForAdjustment(products, draft) {
  if (draft.productId) {
    const matchedById = products.find((product) => product.id === draft.productId);

    if (matchedById) {
      return matchedById;
    }
  }

  return products.find(
    (product) =>
      product.name === draft.productNameSnapshot &&
      product.spec === draft.specSnapshot
  );
}

function createAdjustmentNumber(options) {
  const rawDate = options.adjustmentDate ?? new Date().toISOString().slice(0, 10);
  const compactDate = rawDate.replaceAll("-", "");
  const sequence = String(options.sequence ?? 1).padStart(3, "0");

  return `ADJ-${compactDate}-${sequence}`;
}

function roundStock(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
}
