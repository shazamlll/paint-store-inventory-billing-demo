export function createPurchaseDraft(suppliers, products) {
  return {
    supplier: suppliers[0] ?? null,
    lines: products.length > 0 ? [createPurchaseLine(products[0])] : [],
    paymentAmount: 0,
    notes: ""
  };
}

export function createPurchaseLine(product, options = {}) {
  const quantity = Number(options.quantity ?? 1);
  const unitCost = Number(options.unitCost ?? product.costPrice);

  return {
    ...(product.id ? { productId: product.id } : {}),
    ...(product.storeId ? { productStoreId: product.storeId } : {}),
    productNameSnapshot: product.name,
    specSnapshot: product.spec,
    unit: product.unit,
    quantity,
    unitCost,
    lineTotal: calculateLineTotal({ quantity, unitCost })
  };
}

export function addPurchaseLine(lines, product) {
  return [...lines, createPurchaseLine(product)];
}

export function removePurchaseLine(lines, index) {
  return lines.filter((_, lineIndex) => lineIndex !== index);
}

export function updatePurchaseLineQuantity(lines, index, quantity) {
  return lines.map((line, lineIndex) => {
    if (lineIndex !== index) {
      return line;
    }

    return recalculateLine({
      ...line,
      quantity: Number(quantity)
    });
  });
}

export function updatePurchaseLineCost(lines, index, unitCost) {
  return lines.map((line, lineIndex) => {
    if (lineIndex !== index) {
      return line;
    }

    return recalculateLine({
      ...line,
      unitCost: Number(unitCost)
    });
  });
}

export function calculatePurchaseDraftTotals({ lines, paymentAmount }) {
  const subtotal = roundMoney(
    lines.reduce((total, line) => total + line.quantity * line.unitCost, 0)
  );
  const totalAmount = subtotal;
  const safePaymentAmount = Math.min(Number(paymentAmount) || 0, totalAmount);
  const payableDelta = roundMoney(totalAmount - safePaymentAmount);

  return {
    subtotal,
    totalAmount,
    paymentAmount: roundMoney(safePaymentAmount),
    paymentStatus: getPaymentStatus(totalAmount, safePaymentAmount),
    payableDelta
  };
}

export function validatePurchaseDraft(draft) {
  const errors = {};
  const paymentAmount = Number(draft.paymentAmount);

  if (!draft.supplier) {
    errors.supplier = "请选择供应商。";
  }

  if (!draft.lines || draft.lines.length === 0) {
    errors.lines = "至少需要一条入库明细。";
  } else if (draft.lines.some((line) => Number(line.quantity) <= 0)) {
    errors.lines = "入库数量必须大于 0。";
  } else if (draft.lines.some((line) => Number(line.unitCost) < 0)) {
    errors.lines = "进货单价不能小于 0。";
  }

  if (draft.paymentAmount === "" || Number.isNaN(paymentAmount)) {
    errors.paymentAmount = "付款金额必须是数字。";
  } else if (paymentAmount < 0) {
    errors.paymentAmount = "付款金额不能小于 0。";
  }

  return errors;
}

export function savePurchaseOrder(savedOrders, draft, options = {}) {
  const errors = validatePurchaseDraft(draft);

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      savedOrders
    };
  }

  const receivedDate = options.receivedDate ?? getTodayIsoDate();
  const orderNumber =
    options.orderNumber ?? createPurchaseOrderNumber(receivedDate, savedOrders.length + 1);
  const totals = calculatePurchaseDraftTotals(draft);
  const order = {
    orderNumber,
    supplierNameSnapshot: draft.supplier.name,
    receivedDate,
    subtotal: totals.subtotal,
    totalAmount: totals.totalAmount,
    paymentStatus: totals.paymentStatus,
    payableDelta: totals.payableDelta,
    paymentAmount: totals.paymentAmount,
    notes: draft.notes ?? ""
  };
  const items = draft.lines.map((line) => ({
    purchaseOrderNumber: orderNumber,
    productNameSnapshot: line.productNameSnapshot,
    specSnapshot: line.specSnapshot,
    quantity: line.quantity,
    unit: line.unit,
    unitCost: line.unitCost,
    lineTotal: line.lineTotal
  }));
  const savedOrder = {
    order,
    items
  };

  return {
    errors: {},
    savedOrder,
    savedOrders: [...savedOrders, savedOrder]
  };
}

export function createPurchaseOrderNumber(receivedDate, sequence) {
  return `PO-${receivedDate.replaceAll("-", "")}-${String(sequence).padStart(3, "0")}`;
}

export function getPaymentStatus(totalAmount, paymentAmount) {
  if (totalAmount <= 0 || paymentAmount >= totalAmount) {
    return "paid";
  }

  if (paymentAmount <= 0) {
    return "unpaid";
  }

  return "partial";
}

function recalculateLine(line) {
  return {
    ...line,
    lineTotal: calculateLineTotal(line)
  };
}

function calculateLineTotal({ quantity, unitCost }) {
  return roundMoney(Math.max(0, quantity * unitCost));
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
