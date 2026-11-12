export const sampleProducts = [
  product("内墙乳胶漆", "白色 1 加仑", "罐", 18, 29, 24, 6, "paint"),
  product("内墙乳胶漆", "白色 5 加仑", "桶", 74, 118, 10, 3, "paint"),
  product("外墙漆", "半光 1 加仑", "罐", 22, 36, 16, 4, "paint"),
  product("外墙漆", "半光 5 加仑", "桶", 92, 148, 8, 2, "paint"),
  product("底漆", "多表面 1 加仑", "罐", 14.5, 24, 20, 5, "primer"),
  product("底漆", "多表面 5 加仑", "桶", 56, 89, 9, 2, "primer"),
  product("木器着色剂", "胡桃色 1 夸脱", "罐", 8.2, 15, 18, 4, "stain"),
  product("清漆", "亮光 1 夸脱", "罐", 9.5, 17, 15, 4, "stain"),
  product("油漆稀释剂", "1 加仑", "罐", 7.8, 13, 30, 8, "prep"),
  product("红色色浆", "通用 16 盎司", "瓶", 6.4, 11, 12, 3, "paint"),
  product("蓝色色浆", "通用 16 盎司", "瓶", 6.4, 11, 12, 3, "paint"),
  product("黄色色浆", "通用 16 盎司", "瓶", 6.4, 11, 3, 3, "paint"),
  product("滚筒刷", "9 英寸", "个", 3.2, 7.5, 40, 10, "tool"),
  product("滚筒替换头", "9 英寸超细纤维", "个", 2.1, 5, 48, 12, "tool"),
  product("油漆刷", "2 英寸斜头", "把", 2.8, 6.5, 36, 10, "tool"),
  product("油漆托盘", "标准塑料款", "个", 1.9, 4.5, 25, 6, "tool"),
  product("美纹纸胶带", "1.5 英寸", "卷", 1.4, 3.5, 60, 15, "prep"),
  product("防尘布", "9 乘 12 英尺", "块", 4.8, 9.5, 4, 5, "prep"),
  product("砂纸套装", "混合目数", "包", 2.5, 5.5, 34, 8, "prep"),
  product("填缝胶", "可涂刷白色", "支", 2.2, 4.8, 28, 7, "prep"),
  product("天花板漆", "哑光白 1 加仑", "罐", 16, 27, 14, 4, "paint"),
  product("柜体瓷漆", "缎光白 1 夸脱", "罐", 11, 21, 7, 3, "paint"),
  product("露台木蜡油", "雪松色 1 加仑", "罐", 19, 34, 5, 4, "stain"),
  product("混凝土密封剂", "透明 1 加仑", "罐", 17.5, 31, 11, 3, "sundry"),
  product("补墙膏", "轻质 1 夸脱", "盒", 4.2, 8.5, 22, 6, "prep"),
  product("腻子刀", "3 英寸", "把", 2.3, 5.25, 18, 5, "tool"),
  product("伸缩杆", "4-8 英尺", "根", 7.5, 16, 9, 3, "tool"),
  product("低粘美纹纸", "精细表面 1 英寸", "卷", 2.1, 4.75, 2, 8, "prep"),
  product("喷漆", "哑光黑 12 盎司", "罐", 4.4, 8.9, 19, 6, "sundry"),
  product("环氧地坪套装", "灰色双组分", "套", 62, 119, 3, 2, "sundry"),
  product("防毒面具", "可重复使用半面罩", "个", 14, 29, 6, 4, "tool"),
  product("梯子稳定器", "通用款", "个", 18, 39, 1, 2, "tool")
];

export const sampleCustomers = [
  customer("常客施工队甲", "555-0101", "经常赊账的施工客户", 180, "contractor"),
  customer("社区业主", "555-0102", "通常现金结算", 0, "homeowner"),
  customer("北区物业经理", "555-0103", "每月维护项目", 260, "property-manager"),
  customer("橱柜加工坊", "555-0104", "常买木器着色剂和清漆", 95, "workshop"),
  customer("散客", "", "默认快速销售客户", 0, "walk-in"),
  customer("南岭翻新队", "555-0105", "内墙翻新施工客户", 420, "contractor"),
  customer("橡树街房东", "555-0106", "出租房翻新项目", 75, "property-manager"),
  customer("周末自装客户", "555-0107", "小型家庭项目", 0, "homeowner"),
  customer("定制门工作室", "555-0108", "反复购买着色剂和瓷漆", 140, "workshop")
];

export const sampleSuppliers = [
  supplier("都会涂料供应", "555-310-0142", "主要涂料和底漆供应商", 320),
  supplier("北区涂层仓库", "555-310-0188", "外墙涂料和特殊饰面", 0),
  supplier("刷具滚筒批发", "555-310-0120", "工具、滚筒、托盘和遮蔽辅料", 180),
  supplier("色浆中心", "555-310-0199", "通用色浆和调色材料", 95),
  supplier("修补辅料分销", "555-310-0165", "填缝胶、砂纸、稀释剂和施工辅料", 0)
];

export const sampleSavedOrders = [
  salesOrder("SO-20260623-001", "常客施工队甲", "2026-06-23", 196, 8, 188, 120, "partial", [
    salesItem("内墙乳胶漆", "白色 1 加仑", "罐", 4, 29, 8),
    salesItem("滚筒刷", "9 英寸", "个", 6, 7.5, 0),
    salesItem("美纹纸胶带", "1.5 英寸", "卷", 10, 3.5, 0)
  ]),
  salesOrder("SO-20260623-002", "散客", "2026-06-23", 72.5, 0, 72.5, 72.5, "paid", [
    salesItem("底漆", "多表面 1 加仑", "罐", 1, 24, 0),
    salesItem("滚筒替换头", "9 英寸超细纤维", "个", 5, 5, 0),
    salesItem("油漆托盘", "标准塑料款", "个", 1, 4.5, 0),
    salesItem("防尘布", "9 乘 12 英尺", "块", 2, 9.5, 0)
  ]),
  salesOrder("SO-20260623-003", "北区物业经理", "2026-06-23", 482, 2, 480, 0, "unpaid", [
    salesItem("外墙漆", "半光 5 加仑", "桶", 3, 148, 0),
    salesItem("低粘美纹纸", "精细表面 1 英寸", "卷", 8, 4.75, 2)
  ]),
  salesOrder("SO-20260622-001", "橱柜加工坊", "2026-06-22", 117.5, 0, 117.5, 60, "partial", [
    salesItem("木器着色剂", "胡桃色 1 夸脱", "罐", 4, 15, 0),
    salesItem("清漆", "亮光 1 夸脱", "罐", 3, 17, 0),
    salesItem("油漆刷", "2 英寸斜头", "把", 1, 6.5, 0)
  ])
];

export const sampleSavedPurchases = [
  purchaseOrder("PO-20260623-001", "都会涂料供应", "2026-06-23", 824, 824, 0, "paid", [
    purchaseItem("内墙乳胶漆", "白色 1 加仑", "罐", 20, 18),
    purchaseItem("底漆", "多表面 5 加仑", "桶", 6, 56),
    purchaseItem("天花板漆", "哑光白 1 加仑", "罐", 8, 16)
  ]),
  purchaseOrder("PO-20260623-002", "刷具滚筒批发", "2026-06-23", 190.2, 0, 190.2, "unpaid", [
    purchaseItem("滚筒刷", "9 英寸", "个", 18, 3.2),
    purchaseItem("滚筒替换头", "9 英寸超细纤维", "个", 30, 2.1),
    purchaseItem("腻子刀", "3 英寸", "把", 12, 2.3),
    purchaseItem("低粘美纹纸", "精细表面 1 英寸", "卷", 20, 2.1)
  ]),
  purchaseOrder("PO-20260622-001", "北区涂层仓库", "2026-06-22", 382.8, 200, 182.8, "partial", [
    purchaseItem("露台木蜡油", "雪松色 1 加仑", "罐", 10, 19),
    purchaseItem("混凝土密封剂", "透明 1 加仑", "罐", 8, 17.5),
    purchaseItem("喷漆", "哑光黑 12 盎司", "罐", 12, 4.4)
  ])
];

export const sampleInventoryMovements = [
  movement("内墙乳胶漆", "白色 1 加仑", "sale", -4, 20, "SO-20260623-001"),
  movement("滚筒刷", "9 英寸", "sale", -6, 34, "SO-20260623-001"),
  movement("美纹纸胶带", "1.5 英寸", "sale", -10, 50, "SO-20260623-001"),
  movement("底漆", "多表面 1 加仑", "sale", -1, 19, "SO-20260623-002"),
  movement("外墙漆", "半光 5 加仑", "sale", -3, 5, "SO-20260623-003"),
  movement("内墙乳胶漆", "白色 1 加仑", "purchase", 20, 40, "PO-20260623-001"),
  movement("底漆", "多表面 5 加仑", "purchase", 6, 15, "PO-20260623-001"),
  movement("滚筒刷", "9 英寸", "purchase", 18, 52, "PO-20260623-002"),
  movement("低粘美纹纸", "精细表面 1 英寸", "purchase", 20, 22, "PO-20260623-002"),
  movement("黄色色浆", "通用 16 盎司", "manual-adjustment", -2, 3, "ADJ-20260623-001"),
  movement("梯子稳定器", "通用款", "manual-adjustment", -1, 1, "ADJ-20260623-002")
];

export function getSampleDataSummary() {
  return {
    productCount: sampleProducts.length,
    customerCount: sampleCustomers.length,
    supplierCount: sampleSuppliers.length,
    salesOrderCount: sampleSavedOrders.length,
    purchaseOrderCount: sampleSavedPurchases.length,
    inventoryMovementCount: sampleInventoryMovements.length,
    lowStockCount: sampleProducts.filter((productItem) => productItem.currentStock <= productItem.lowStockThreshold).length,
    receivableOrderCount: sampleSavedOrders.filter((savedOrder) => savedOrder.order.receivableDelta > 0).length
  };
}

function product(name, spec, unit, costPrice, salePrice, currentStock, lowStockThreshold, category) {
  return {
    name,
    spec,
    unit,
    costPrice,
    salePrice,
    currentStock,
    lowStockThreshold,
    category
  };
}

function customer(name, phone, notes, receivableBalance, customerType) {
  return {
    name,
    phone,
    notes,
    receivableBalance,
    customerType
  };
}

function supplier(name, phone, notes, payableBalance) {
  return {
    name,
    phone,
    notes,
    payableBalance
  };
}

function salesOrder(orderNumber, customerNameSnapshot, orderDate, subtotal, discountAmount, totalAmount, paymentAmount, paymentStatus, items) {
  return {
    order: {
      orderNumber,
      customerNameSnapshot,
      orderDate,
      subtotal,
      discountAmount,
      totalAmount,
      paymentStatus,
      receivableDelta: roundMoney(totalAmount - paymentAmount),
      paymentAmount,
      notes: ""
    },
    items: items.map((item) => ({
      ...item,
      salesOrderNumber: orderNumber
    }))
  };
}

function salesItem(productNameSnapshot, specSnapshot, unit, quantity, unitPrice, discountAmount) {
  return {
    productNameSnapshot,
    specSnapshot,
    quantity,
    unit,
    unitPrice,
    discountAmount,
    lineTotal: roundMoney(quantity * unitPrice - discountAmount)
  };
}

function purchaseOrder(orderNumber, supplierNameSnapshot, receivedDate, totalAmount, paymentAmount, payableDelta, paymentStatus, items) {
  return {
    order: {
      orderNumber,
      supplierNameSnapshot,
      receivedDate,
      subtotal: totalAmount,
      totalAmount,
      paymentStatus,
      payableDelta,
      paymentAmount,
      notes: ""
    },
    items: items.map((item) => ({
      ...item,
      purchaseOrderNumber: orderNumber
    }))
  };
}

function purchaseItem(productNameSnapshot, specSnapshot, unit, quantity, unitCost) {
  return {
    productNameSnapshot,
    specSnapshot,
    unit,
    quantity,
    unitCost,
    lineTotal: roundMoney(quantity * unitCost)
  };
}

function movement(productNameSnapshot, specSnapshot, sourceType, quantityDelta, stockAfter, sourceOrderNumber) {
  return {
    productNameSnapshot,
    specSnapshot,
    movementType: sourceType,
    sourceType,
    quantityDelta,
    stockAfter,
    sourceTable: sourceType === "sale" ? "sales_orders" : sourceType === "purchase" ? "purchase_orders" : "inventory_adjustments",
    sourceOrderNumber,
    notes: "本地样例数据"
  };
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
