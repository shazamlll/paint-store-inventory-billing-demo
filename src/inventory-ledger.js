export function getInventoryLedgerRows(movements) {
  const rowsByProduct = new Map();

  for (const movement of movements) {
    const key = `${movement.productNameSnapshot}\u0000${movement.specSnapshot}`;
    const existing = rowsByProduct.get(key);
    const quantityDelta = Number(movement.quantityDelta);

    if (existing) {
      existing.movementCount += 1;
      existing.totalIn = roundStock(existing.totalIn + Math.max(0, quantityDelta));
      existing.totalOut = roundStock(existing.totalOut + Math.abs(Math.min(0, quantityDelta)));
      existing.netChange = roundStock(existing.totalIn - existing.totalOut);
      existing.lastStockAfter = movement.stockAfter;
      existing.latestSourceOrderNumber = movement.sourceOrderNumber;
    } else {
      rowsByProduct.set(key, {
        productName: movement.productNameSnapshot,
        spec: movement.specSnapshot,
        movementCount: 1,
        totalIn: roundStock(Math.max(0, quantityDelta)),
        totalOut: roundStock(Math.abs(Math.min(0, quantityDelta))),
        netChange: roundStock(quantityDelta),
        lastStockAfter: movement.stockAfter,
        latestSourceOrderNumber: movement.sourceOrderNumber
      });
    }
  }

  return [...rowsByProduct.values()].sort(
    (left, right) =>
      right.movementCount - left.movementCount ||
      left.productName.localeCompare(right.productName) ||
      left.spec.localeCompare(right.spec)
  );
}

export function getInventoryLedgerSummary(movements) {
  const rows = getInventoryLedgerRows(movements);
  const totalIn = roundStock(rows.reduce((total, row) => total + row.totalIn, 0));
  const totalOut = roundStock(rows.reduce((total, row) => total + row.totalOut, 0));

  return {
    productCount: rows.length,
    movementCount: movements.length,
    totalIn,
    totalOut,
    netChange: roundStock(totalIn - totalOut)
  };
}

export function getProductMovementHistory(movements, product) {
  return movements.filter(
    (movement) =>
      movement.productNameSnapshot === product.productName &&
      movement.specSnapshot === product.spec
  );
}

function roundStock(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
}
