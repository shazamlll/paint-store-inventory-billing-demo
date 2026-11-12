import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  createPrintableSalesBill,
  formatChineseAmountUppercase,
  getPrintablePaymentStamp
} from "../src/sales-print.js";
import {
  createSalesLine,
  saveSalesOrder
} from "../src/sales-form.js";
import { seedCustomers } from "./fixtures/catalog.js";
import { seedProducts } from "./fixtures/catalog.js";
import { homeCopy } from "../src/ux-copy.js";

const root = fileURLToPath(new URL("..", import.meta.url));

test("Day 022 creates a browser-print sales bill from a saved order", () => {
  const bill = createPrintableSalesBill(savedOrderFixture(), {
    shopName: "北城涂料店",
    shopPhone: "555-0199"
  });

  assert.deepEqual(bill.shop, {
    name: "北城涂料店",
    phone: "555-0199",
    address: "门店地址"
  });
  assert.deepEqual(bill.header, {
    title: "销售单",
    copyLabel: "①白存根 ②红客户 ③黄回单",
    orderNumber: "SO-20260623-001",
    customer: "常客施工队甲",
    orderDate: "2026-06-23",
    paymentStamp: "部分收款",
    paymentStatus: "部分收款"
  });
  assert.deepEqual(bill.lines[0], {
    lineNumber: 1,
    description: "内墙乳胶漆 - 白色 1 加仑",
    unit: "罐",
    quantity: 2,
    unitPrice: 29,
    discountAmount: 3,
    lineTotal: 55
  });
  assert.deepEqual(bill.totals, {
    subtotal: 88,
    discountAmount: 3,
    totalAmount: 85,
    paymentAmount: 40,
    receivableDelta: 45,
    balanceLabel: "待收款"
  });
  assert.equal(bill.notes, "下午 5 点后自提");
  assert.match(bill.printFooter, /当前数据库销售单/);
});

test("Day 022 payment stamps stay short enough for print", () => {
  assert.equal(getPrintablePaymentStamp("paid"), "已收清");
  assert.equal(getPrintablePaymentStamp("partial"), "部分收款");
  assert.equal(getPrintablePaymentStamp("unpaid"), "未收款");
  assert.equal(getPrintablePaymentStamp("unknown"), "待确认");
});

test("sales bill print template targets 241mm by 140mm blank paper", () => {
  const bill = createPrintableSalesBill(savedOrderFixture(), {
    shopName: "示例建材商行",
    shopPhone: "000-00000000",
    shopAddress: "示例城市"
  });

  assert.deepEqual(bill.template.paper, {
    width: "241mm",
    height: "140mm",
    cssSize: "241mm 140mm",
    approximateInches: "9.5in x 5.5in"
  });
  assert.deepEqual(bill.template.fields, {
    customerName: "常客施工队甲",
    deliveryDate: "2026-06-23",
    orderNumber: "SO-20260623-001",
    contactPerson: "",
    customerPhone: "",
    customerLandline: "",
    contactAddress: "",
    summary: "下午 5 点后自提"
  });
  assert.equal(bill.template.table.fixedLineCount, 8);
  assert.equal(bill.template.table.rows.length, 8);
  assert.deepEqual(bill.template.signatures, ["客户确认签字", "搬运工"]);
  assert.equal(
    bill.template.footerContact,
    "示例城市示例路 100 号 电话：000-00000000 手机：00000000000"
  );
});

test("sales bill template exposes the revised copy labels and title line", () => {
  const bill = createPrintableSalesBill(savedOrderFixture(), {
    shopName: "示例涂料门店"
  });

  assert.equal(bill.header.copyLabel, "①白存根 ②红客户 ③黄回单");
  assert.equal(bill.template.titlePrefix, "示例涂料门店");
  assert.equal(bill.template.footerContact, "示例城市示例路 100 号 电话：000-00000000 手机：00000000000");
});

test("sales bill template formats total amount in Chinese uppercase", () => {
  assert.equal(formatChineseAmountUppercase(85), "捌拾伍元整");
  assert.equal(formatChineseAmountUppercase(1700), "壹仟柒佰元整");
  assert.equal(formatChineseAmountUppercase(1700.5), "壹仟柒佰元伍角");

  const bill = createPrintableSalesBill(savedOrderFixture());

  assert.equal(bill.template.totals.totalAmountUppercase, "捌拾伍元整");
});

test("Day 022 creates a database-backed print route without direct Supabase writes", () => {
  const pagePath = join(root, "app", "sales", "print", "page.js");

  assert.ok(existsSync(pagePath), "app/sales/print/page.js is missing");

  const page = readFileSync(pagePath, "utf8");

  assert.match(page, /createPrintableSalesBill/);
  assert.match(page, /useDatabasePageData/);
  assert.match(page, /打印销售单/);
  assert.match(page, /浏览器打印/);
  assert.match(page, /①白存根 ②红客户 ③黄回单/);
  assert.match(page, /writing-mode:\s*vertical-rl/);
  assert.match(page, /示例涂料门店/);
  assert.match(page, /footerContact/);
  assert.match(page, /window\.print/);
  assert.match(page, /@media print/);
  assert.match(page, /size:\s*140mm 241mm/);
  assert.match(page, /rotate\(90deg\)/);
  assert.match(page, /sales-print-form/);
  assert.match(page, /客户名称/);
  assert.match(page, /送货日期/);
  assert.match(page, /单据编号/);
  assert.match(page, /商品全名/);
  assert.match(page, /template\.table\.rows/);
  assert.doesNotMatch(page, /业务员|发货员|驾驶员|自提/);
  assert.doesNotMatch(page, /seedProducts|seedCustomers|supabase\.from|insert\(|update\(/);
});

test("sales print route keeps the shop address only in the footer contact line", () => {
  const page = readFileSync(join(root, "app", "sales", "print", "page.js"), "utf8");

  assert.doesNotMatch(page, /<span>\{bill\.shop\.address\}<\/span>/);
  assert.match(page, /\{bill\.template\.footerContact\}/);
});

test("home and sales pages link to the print sales bill route", () => {
  const homePage = readFileSync(join(root, "app", "page.js"), "utf8");
  const salesPage = readFileSync(join(root, "app", "sales", "page.js"), "utf8");

  assert.ok(homeCopy.navItems.some((item) => item.href === "/sales/print"));
  assert.match(salesPage, /href="\/sales\/print"/);
});

test("Day 046 documents the 241mm sales print template boundary", () => {
  const sprintDocPath = join(root, "docs", "sprints", "day046_sales_print_template.md");
  assert.ok(existsSync(sprintDocPath), "Day 046 sprint doc is missing");

  const sprintDoc = readFileSync(sprintDocPath, "utf8");

  assert.match(sprintDoc, /241mm x 140mm/);
  assert.match(sprintDoc, /OKI MICROLINE 5200F/);
  assert.match(sprintDoc, /blank paper/i);
  assert.match(sprintDoc, /Missing contact/);
});

function savedOrderFixture() {
  return saveSalesOrder(
    [],
    {
      customer: seedCustomers[0],
      lines: [
        createSalesLine(seedProducts[0], { quantity: 2, discountAmount: 3 }),
        createSalesLine(seedProducts[12], { quantity: 4 })
      ],
      paymentAmount: 40,
      notes: "下午 5 点后自提"
    },
    { orderDate: "2026-06-23" }
  ).savedOrder;
}
