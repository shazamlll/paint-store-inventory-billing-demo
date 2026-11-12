export function createSalesDraft(customers, products) {
  return {
    customer: customers.find((customer) => customer.name === "散客") ?? customers[0],
    lines: products.length > 0 ? [createSalesLine(products[0])] : [],
    paymentAmount: 0,
    notes: ""
  };
}

export function createSalesLine(product, options = {}) {
  const quantity = Number(options.quantity ?? 1);
  const unitPrice = Number(options.unitPrice ?? product.salePrice);
  const discountAmount = Number(options.discountAmount ?? 0);

  return {
    ...(product.id ? { productId: product.id } : {}),
    ...(product.storeId ? { productStoreId: product.storeId } : {}),
    ...(product.id && product.currentStock !== undefined ? { currentStock: product.currentStock } : {}),
    productNameSnapshot: product.name,
    specSnapshot: product.spec,
    unit: product.unit,
    quantity,
    unitPrice,
    discountAmount,
    lineTotal: calculateLineTotal({ quantity, unitPrice, discountAmount })
  };
}

export function addSalesLine(lines, product) {
  return [...lines, createSalesLine(product)];
}

export function removeSalesLine(lines, index) {
  return lines.filter((_, lineIndex) => lineIndex !== index);
}

export function updateSalesLineQuantity(lines, index, quantity) {
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

export function updateSalesLineDiscount(lines, index, discountAmount) {
  return lines.map((line, lineIndex) => {
    if (lineIndex !== index) {
      return line;
    }

    return recalculateLine({
      ...line,
      discountAmount: Number(discountAmount)
    });
  });
}

export function calculateSalesDraftTotals({ lines, paymentAmount }) {
  const subtotal = roundMoney(
    lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0)
  );
  const discountAmount = roundMoney(
    lines.reduce((total, line) => total + line.discountAmount, 0)
  );
  const totalAmount = roundMoney(
    lines.reduce((total, line) => total + line.lineTotal, 0)
  );
  const safePaymentAmount = Math.min(Number(paymentAmount) || 0, totalAmount);
  const receivableDelta = roundMoney(totalAmount - safePaymentAmount);

  return {
    subtotal,
    discountAmount,
    totalAmount,
    paymentAmount: roundMoney(safePaymentAmount),
    paymentStatus: getPaymentStatus(totalAmount, safePaymentAmount),
    receivableDelta
  };
}

export function validateSalesDraft(draft) {
  const errors = {};
  const paymentAmount = Number(draft.paymentAmount);
  const totals = calculateSalesDraftTotals({
    lines: draft.lines ?? [],
    paymentAmount: 0
  });

  if (!draft.customer) {
    errors.customer = "请选择客户。";
  }

  if (!draft.lines || draft.lines.length === 0) {
    errors.lines = "至少需要一条商品明细。";
  } else if (draft.lines.some((line) => Number(line.quantity) <= 0)) {
    errors.lines = "商品数量必须大于 0。";
  }

  if (draft.paymentAmount === "" || Number.isNaN(paymentAmount)) {
    errors.paymentAmount = "收款金额必须是数字。";
  } else if (paymentAmount < 0) {
    errors.paymentAmount = "收款金额不能小于 0。";
  } else if (paymentAmount > totals.totalAmount) {
    errors.paymentAmount = "本次收款不能大于销售合计。";
  }

  return errors;
}

export function saveSalesOrder(savedOrders, draft, options = {}) {
  const errors = validateSalesDraft(draft);

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      savedOrders
    };
  }

  const orderDate = options.orderDate ?? getTodayIsoDate();
  const orderNumber =
    options.orderNumber ?? createSalesOrderNumber(orderDate, savedOrders.length + 1);
  const totals = calculateSalesDraftTotals(draft);
  const order = {
    orderNumber,
    customerNameSnapshot: draft.customer.name,
    orderDate,
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    totalAmount: totals.totalAmount,
    paymentStatus: totals.paymentStatus,
    receivableDelta: totals.receivableDelta,
    paymentAmount: totals.paymentAmount,
    notes: draft.notes ?? ""
  };
  const items = draft.lines.map((line) => ({
    salesOrderNumber: orderNumber,
    productNameSnapshot: line.productNameSnapshot,
    specSnapshot: line.specSnapshot,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPrice,
    discountAmount: line.discountAmount,
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

export function createSalesOrderNumber(orderDate, sequence) {
  return `SO-${orderDate.replaceAll("-", "")}-${String(sequence).padStart(3, "0")}`;
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

function calculateLineTotal({ quantity, unitPrice, discountAmount }) {
  return roundMoney(Math.max(0, quantity * unitPrice - discountAmount));
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
