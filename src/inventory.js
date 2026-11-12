export function findProductForSalesItem(products, item) {
  return products.find(
    (product) =>
      product.name === item.productNameSnapshot &&
      product.spec === item.specSnapshot
  );
}

export function findProductForPurchaseItem(products, item) {
  return products.find(
    (product) =>
      product.name === item.productNameSnapshot &&
      product.spec === item.specSnapshot
  );
}

export function validateSalesOrderInventory(products, savedOrder) {
  const groupedItems = groupSalesItemsByProduct(products, savedOrder);

  if (groupedItems.errors) {
    return groupedItems.errors;
  }

  for (const item of groupedItems.items) {
    if (item.product.currentStock < item.quantity) {
      return {
        inventory: `${item.productNameSnapshot} ${item.specSnapshot} 库存不足。`
      };
    }
  }

  return {};
}

export function applySalesOrderToInventory(products, savedOrder) {
  const errors = validateSalesOrderInventory(products, savedOrder);

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      products,
      movements: []
    };
  }

  const groupedItems = groupSalesItemsByProduct(products, savedOrder).items;
  const movements = [];
  const nextProducts = products.map((product) => {
    const item = groupedItems.find((candidate) => candidate.product === product);

    if (!item) {
      return product;
    }

    const stockAfter = roundStock(product.currentStock - item.quantity);
    movements.push({
      productNameSnapshot: product.name,
      specSnapshot: product.spec,
      movementType: "sale",
      quantityDelta: -item.quantity,
      stockAfter,
      sourceTable: "sales_orders",
      sourceOrderNumber: savedOrder.order.orderNumber,
      notes: "Sales order stock movement"
    });

    return {
      ...product,
      currentStock: stockAfter
    };
  });

  return {
    errors: {},
    products: nextProducts,
    movements
  };
}

export function validatePurchaseOrderReceiving(products, savedOrder) {
  const groupedItems = groupPurchaseItemsByProduct(products, savedOrder);

  if (groupedItems.errors) {
    return groupedItems.errors;
  }

  return {};
}

export function applyPurchaseOrderToInventory(products, savedOrder) {
  const errors = validatePurchaseOrderReceiving(products, savedOrder);

  if (Object.keys(errors).length > 0) {
    return {
      errors,
      products,
      movements: []
    };
  }

  const groupedItems = groupPurchaseItemsByProduct(products, savedOrder).items;
  const movements = [];
  const nextProducts = products.map((product) => {
    const item = groupedItems.find((candidate) => candidate.product === product);

    if (!item) {
      return product;
    }

    const stockAfter = roundStock(product.currentStock + item.quantity);
    movements.push({
      productNameSnapshot: product.name,
      specSnapshot: product.spec,
      movementType: "purchase",
      quantityDelta: item.quantity,
      stockAfter,
      sourceTable: "purchase_orders",
      sourceOrderNumber: savedOrder.order.orderNumber,
      notes: "Purchase receiving stock movement"
    });

    return {
      ...product,
      currentStock: stockAfter
    };
  });

  return {
    errors: {},
    products: nextProducts,
    movements
  };
}

export function getInventoryMovementSummary(movements) {
  return {
    movementCount: movements.length,
    totalUnitsDeducted: movements.reduce(
      (total, movement) => total + Math.abs(movement.quantityDelta),
      0
    ),
    latestSourceOrderNumber: movements.at(-1)?.sourceOrderNumber ?? ""
  };
}

function roundStock(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
}

function groupSalesItemsByProduct(products, savedOrder) {
  const itemsByProduct = new Map();

  for (const item of savedOrder.items) {
    const product = findProductForSalesItem(products, item);

    if (!product) {
      return {
        errors: {
          inventory: `未找到明细对应商品：${item.productNameSnapshot} ${item.specSnapshot}。`
        }
      };
    }

    const key = `${item.productNameSnapshot}\u0000${item.specSnapshot}`;
    const existing = itemsByProduct.get(key);

    if (existing) {
      existing.quantity = roundStock(existing.quantity + item.quantity);
    } else {
      itemsByProduct.set(key, {
        product,
        productNameSnapshot: item.productNameSnapshot,
        specSnapshot: item.specSnapshot,
        quantity: item.quantity
      });
    }
  }

  return {
    errors: null,
    items: [...itemsByProduct.values()]
  };
}

function groupPurchaseItemsByProduct(products, savedOrder) {
  const itemsByProduct = new Map();

  for (const item of savedOrder.items) {
    const product = findProductForPurchaseItem(products, item);

    if (!product) {
      return {
        errors: {
          inventory: `未找到明细对应商品：${item.productNameSnapshot} ${item.specSnapshot}。`
        }
      };
    }

    const key = `${item.productNameSnapshot}\u0000${item.specSnapshot}`;
    const existing = itemsByProduct.get(key);

    if (existing) {
      existing.quantity = roundStock(existing.quantity + item.quantity);
    } else {
      itemsByProduct.set(key, {
        product,
        productNameSnapshot: item.productNameSnapshot,
        specSnapshot: item.specSnapshot,
        quantity: item.quantity
      });
    }
  }

  return {
    errors: null,
    items: [...itemsByProduct.values()]
  };
}
