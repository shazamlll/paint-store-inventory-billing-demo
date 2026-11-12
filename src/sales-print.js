import { getSalesOrderDetailStatusLabel } from "./sales-detail.js";

const salesBillPaper = {
  width: "241mm",
  height: "140mm",
  cssSize: "241mm 140mm",
  approximateInches: "9.5in x 5.5in"
};

const copyLabel = "①白存根 ②红客户 ③黄回单";
const titlePrefix = "示例涂料门店";
const footerContact = "示例城市示例路 100 号 电话：000-00000000 手机：00000000000";
const salesBillSignatures = ["客户确认签字", "搬运工"];
const fixedPrintLineCount = 8;
const chineseMoneyDigits = ["零", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖"];

export function createPrintableSalesBill(savedOrder, shopOptions = {}) {
  const shop = {
    name: shopOptions.shopName ?? "涂料门店",
    phone: shopOptions.shopPhone ?? "门店电话",
    address: shopOptions.shopAddress ?? "门店地址"
  };
  const lines = savedOrder.items.map((item, index) => ({
    lineNumber: index + 1,
    description: `${item.productNameSnapshot} - ${item.specSnapshot}`,
    unit: item.unit,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountAmount: item.discountAmount,
    lineTotal: item.lineTotal
  }));

  return {
    shop,
    header: {
      title: "销售单",
      copyLabel,
      orderNumber: savedOrder.order.orderNumber,
      customer: savedOrder.order.customerNameSnapshot,
      orderDate: savedOrder.order.orderDate,
      paymentStamp: getPrintablePaymentStamp(savedOrder.order.paymentStatus),
      paymentStatus: getSalesOrderDetailStatusLabel(savedOrder.order.paymentStatus)
    },
    lines,
    totals: {
      subtotal: savedOrder.order.subtotal,
      discountAmount: savedOrder.order.discountAmount,
      totalAmount: savedOrder.order.totalAmount,
      paymentAmount: savedOrder.order.paymentAmount,
      receivableDelta: savedOrder.order.receivableDelta,
      balanceLabel: savedOrder.order.receivableDelta > 0 ? "待收款" : "无欠款"
    },
    titlePrefix,
    notes: savedOrder.order.notes,
    template: createSalesBillTemplate(savedOrder, lines),
    printFooter: "由当前数据库销售单生成。交给客户前请核对收款和库存。"
  };
}

export function getPrintablePaymentStamp(status) {
  const stamps = {
    paid: "已收清",
    partial: "部分收款",
    unpaid: "未收款"
  };

  return stamps[status] ?? "待确认";
}

export function formatChineseAmountUppercase(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "零元整";
  }

  const amountInFen = Math.round(Math.abs(numericValue) * 100);
  const yuan = Math.floor(amountInFen / 100);
  const jiao = Math.floor((amountInFen % 100) / 10);
  const fen = amountInFen % 10;
  const yuanText = `${numericValue < 0 ? "负" : ""}${formatChineseInteger(yuan)}元`;

  if (jiao === 0 && fen === 0) {
    return `${yuanText}整`;
  }

  if (jiao === 0) {
    return `${yuanText}零${chineseMoneyDigits[fen]}分`;
  }

  return `${yuanText}${chineseMoneyDigits[jiao]}角${fen > 0 ? `${chineseMoneyDigits[fen]}分` : ""}`;
}

function createSalesBillTemplate(savedOrder, lines) {
  return {
    paper: salesBillPaper,
    titlePrefix,
    fields: {
      customerName: savedOrder.order.customerNameSnapshot,
      deliveryDate: savedOrder.order.orderDate,
      orderNumber: savedOrder.order.orderNumber,
      contactPerson: "",
      customerPhone: savedOrder.order.customerPhoneSnapshot ?? "",
      customerLandline: "",
      contactAddress: "",
      summary: savedOrder.order.notes ?? ""
    },
    table: {
      fixedLineCount: fixedPrintLineCount,
      rows: createFixedPrintRows(savedOrder.items, lines)
    },
    totals: {
      totalQuantity: sumLineQuantity(lines),
      totalAmount: savedOrder.order.totalAmount,
      totalAmountUppercase: formatChineseAmountUppercase(savedOrder.order.totalAmount)
    },
    footerContact,
    signatures: salesBillSignatures
  };
}

function createFixedPrintRows(items, lines) {
  return Array.from({ length: fixedPrintLineCount }, (_, index) => {
    const item = items[index];
    const line = lines[index];

    if (!item || !line) {
      return {
        lineNumber: "",
        productName: "",
        spec: "",
        unit: "",
        quantity: "",
        unitPrice: "",
        amount: "",
        notes: ""
      };
    }

    return {
      lineNumber: line.lineNumber,
      productName: item.productNameSnapshot,
      spec: item.specSnapshot,
      unit: line.unit,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      amount: line.lineTotal,
      notes: ""
    };
  });
}

function sumLineQuantity(lines) {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

function formatChineseInteger(value) {
  const integer = Math.trunc(Math.abs(value));

  if (integer === 0) {
    return chineseMoneyDigits[0];
  }

  if (integer < 10000) {
    return formatChineseSection(integer);
  }

  const higher = Math.floor(integer / 10000);
  const lower = integer % 10000;
  const lowerText = lower === 0 ? "" : `${lower < 1000 ? "零" : ""}${formatChineseSection(lower)}`;

  return `${formatChineseInteger(higher)}万${lowerText}`;
}

function formatChineseSection(value) {
  const units = ["仟", "佰", "拾", ""];
  const digits = String(value).padStart(4, "0").split("").map(Number);
  let result = "";
  let pendingZero = false;

  digits.forEach((digit, index) => {
    if (digit === 0) {
      if (result) {
        pendingZero = true;
      }
      return;
    }

    if (pendingZero) {
      result += chineseMoneyDigits[0];
      pendingZero = false;
    }

    result += `${chineseMoneyDigits[digit]}${units[index]}`;
  });

  return result;
}
