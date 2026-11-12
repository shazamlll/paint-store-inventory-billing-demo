export function getProductStockStatus(productItem) {
  return productItem.currentStock <= productItem.lowStockThreshold ? "low" : "ok";
}

export function getProductSummary(products) {
  return products.reduce(
    (summary, productItem) => {
      summary.totalProducts += 1;
      summary.totalStockUnits += productItem.currentStock;
      summary.totalCostValue += productItem.currentStock * productItem.costPrice;
      summary.totalRetailValue += productItem.currentStock * productItem.salePrice;

      if (getProductStockStatus(productItem) === "low") {
        summary.lowStockCount += 1;
      }

      return summary;
    },
    {
      totalProducts: 0,
      totalStockUnits: 0,
      totalCostValue: 0,
      totalRetailValue: 0,
      lowStockCount: 0
    }
  );
}
