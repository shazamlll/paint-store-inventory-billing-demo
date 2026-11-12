import { getProductStockStatus } from "./products.js";

export function getLowStockAlertRows(products) {
  return products
    .filter((productItem) => getProductStockStatus(productItem) === "low")
    .map((productItem) => {
      const stockGap = roundStock(
        Math.max(0, productItem.lowStockThreshold - productItem.currentStock)
      );

      return {
        productName: productItem.name,
        spec: productItem.spec,
        unit: productItem.unit,
        currentStock: productItem.currentStock,
        lowStockThreshold: productItem.lowStockThreshold,
        stockGap,
        statusLabel: stockGap > 0 ? "低于预警线" : "刚到预警线"
      };
    })
    .sort(
      (left, right) =>
        right.stockGap - left.stockGap ||
        left.currentStock - right.currentStock ||
        left.productName.localeCompare(right.productName) ||
        left.spec.localeCompare(right.spec)
    );
}

export function getLowStockAlertSummary(products) {
  const rows = getLowStockAlertRows(products);

  return {
    lowStockCount: rows.length,
    belowThresholdCount: rows.filter((row) => row.statusLabel === "低于预警线").length,
    atThresholdCount: rows.filter((row) => row.statusLabel === "刚到预警线").length,
    totalStockGap: roundStock(rows.reduce((total, row) => total + row.stockGap, 0))
  };
}

function roundStock(value) {
  return Math.round((Number(value) + Number.EPSILON) * 1000) / 1000;
}
