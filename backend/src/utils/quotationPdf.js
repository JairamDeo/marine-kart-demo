const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { formatProductTitle } = require('./productTitle');

const ASSETS = path.join(__dirname, '../assets/quotation');
const LOGO_PATH = path.join(ASSETS, 'logo-header.png');
const LOGO_FALLBACK = path.join(ASSETS, 'logo-dark.png');

const COLORS = {
  navy: '#0b2c5f',
  cyan: '#78c6d4',
  ink: '#1e293b',
  muted: '#64748b',
  line: '#e2e8f0',
  soft: '#f1f7fa',
  white: '#ffffff',
  rowAlt: '#f8fafc',
};

const HEADER_H = 72;
const FOOTER_H = 40;

const PAGE = {
  marginLeft: 40,
  marginRight: 40,
  marginTop: HEADER_H + 12,
  marginBottom: FOOTER_H + 10,
};

const COMPANY = {
  registered: {
    title: 'Registered Office',
    lines: ['F8, Vinayaki Building, Opp. Fire Station,', 'Warkhandem, Ponda, Goa-403401'],
  },
  showroom: {
    title: 'Showroom',
    lines: ['Supreme by The Valley Shop No: C-10,', 'Near Mandovi Clinic, Porvorim, Goa-403501'],
  },
};

function money(n) {
  const v = Number(n) || 0;
  return `Rs. ${v.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAddress(addr = {}) {
  return [addr.line1, addr.line2, addr.city, addr.state, addr.postalCode, addr.country]
    .filter(Boolean)
    .join(', ');
}

function safeText(v, fallback = '—') {
  const s = String(v == null ? '' : v).trim();
  return s || fallback;
}

/** Draw fixed header — logo left (vertically centred), office + showroom on the right. */
function drawHeader(doc) {
  const pageW = doc.page.width;
  const ml = PAGE.marginLeft;
  const mr = PAGE.marginRight;

  doc.save();
  doc.rect(0, 0, pageW, HEADER_H).fill(COLORS.navy);
  doc.rect(0, HEADER_H, pageW, 2).fill(COLORS.cyan);

  const logoH = 34;
  const logoY = (HEADER_H - logoH) / 2;
  const logoFile = fs.existsSync(LOGO_PATH)
    ? LOGO_PATH
    : fs.existsSync(LOGO_FALLBACK)
      ? LOGO_FALLBACK
      : null;

  if (logoFile) {
    try {
      doc.image(logoFile, ml, logoY, { fit: [120, logoH] });
    } catch {
      doc
        .fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .fontSize(13)
        .text('MarineKart', ml, logoY + 8, { lineBreak: false });
    }
  } else {
    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text('MarineKart', ml, logoY + 8, { lineBreak: false });
  }

  const blockW = 195;
  const gap = 12;
  const totalW = blockW * 2 + gap;
  const startX = pageW - mr - totalW;
  const regX = startX;
  const showX = startX + blockW + gap;
  const infoBlockH = 38;
  const infoY = (HEADER_H - infoBlockH) / 2;

  doc.font('Helvetica-Bold').fontSize(8);
  doc.fillColor(COLORS.cyan).text(COMPANY.registered.title.toUpperCase(), regX, infoY, {
    lineBreak: false,
  });
  doc.fillColor(COLORS.white).font('Helvetica').fontSize(7.5);
  COMPANY.registered.lines.forEach((line, i) => {
    doc.text(line, regX, infoY + 11 + i * 10, { lineBreak: false });
  });

  doc.fillColor(COLORS.cyan).font('Helvetica-Bold').fontSize(8);
  doc.text(COMPANY.showroom.title.toUpperCase(), showX, infoY, { lineBreak: false });
  doc.fillColor(COLORS.white).font('Helvetica').fontSize(7.5);
  COMPANY.showroom.lines.forEach((line, i) => {
    doc.text(line, showX, infoY + 11 + i * 10, { lineBreak: false });
  });

  doc.restore();
}

function drawPhoneIcon(doc, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  doc.save();
  doc.strokeColor(COLORS.white).lineWidth(0.65);
  doc.circle(cx, cy, size / 2 - 0.5).stroke();
  doc
    .moveTo(cx - size * 0.18, cy - size * 0.12)
    .lineTo(cx + size * 0.22, cy + size * 0.22)
    .stroke();
  doc.restore();
}

function drawGlobeIcon(doc, x, y, size) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2 - 0.5;
  doc.save();
  doc.strokeColor(COLORS.white).lineWidth(0.65);
  doc.circle(cx, cy, r).stroke();
  doc.moveTo(x + 1, cy).lineTo(x + size - 1, cy).stroke();
  doc
    .moveTo(cx, y + 1)
    .bezierCurveTo(cx + r * 0.9, cy, cx + r * 0.9, cy, cx, y + size - 1)
    .stroke();
  doc
    .moveTo(cx, y + 1)
    .bezierCurveTo(cx - r * 0.9, cy, cx - r * 0.9, cy, cx, y + size - 1)
    .stroke();
  doc.restore();
}

function drawEmailIcon(doc, x, y, size) {
  doc.save();
  doc.strokeColor(COLORS.white).lineWidth(0.65);
  doc.rect(x + 0.5, y + 1.5, size - 1, size - 3).stroke();
  doc
    .moveTo(x + 0.5, y + 1.5)
    .lineTo(x + size / 2, y + size / 2)
    .lineTo(x + size - 0.5, y + 1.5)
    .stroke();
  doc.restore();
}

function drawFooter(doc) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const barTop = pageH - FOOTER_H;

  doc.rect(0, barTop, pageW, 2).fill(COLORS.cyan);
  doc.rect(0, barTop + 2, pageW, FOOTER_H - 2).fill(COLORS.navy);

  const midY = barTop + FOOTER_H / 2;
  const iconSize = 10;
  const iconY = midY - iconSize / 2;
  const textY = midY - 4;

  doc.fillColor(COLORS.white).font('Helvetica').fontSize(8);

  const phoneX = PAGE.marginLeft;
  drawPhoneIcon(doc, phoneX, iconY, iconSize);
  doc.text('+91-9923026865  +91-9518999484', phoneX + 14, textY, { lineBreak: false });

  const webLabel = 'www.marinekartindia.com';
  doc.font('Helvetica').fontSize(8);
  const webW = doc.widthOfString(webLabel);
  const webX = (pageW - webW - iconSize - 6) / 2;
  drawGlobeIcon(doc, webX, iconY, iconSize);
  doc.text(webLabel, webX + 14, textY, { lineBreak: false });

  const emailLabel = 'info@marinekartindia.com';
  const emailW = doc.widthOfString(emailLabel);
  const emailX = pageW - PAGE.marginRight - emailW - iconSize - 6;
  drawEmailIcon(doc, emailX, iconY, iconSize);
  doc.text(emailLabel, emailX + 14, textY, { lineBreak: false });
}

function paintAllPages(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    drawHeader(doc);
    drawFooter(doc);
  }
}

function contentBottom(doc) {
  return doc.page.height - PAGE.marginBottom;
}

function ensureSpace(doc, needed) {
  if (doc.y + needed > contentBottom(doc)) {
    doc.addPage();
  }
}

function sectionTitle(doc, title) {
  ensureSpace(doc, 26);
  const y = doc.y;
  const contentW = doc.page.width - PAGE.marginLeft - PAGE.marginRight;
  doc
    .fillColor(COLORS.navy)
    .font('Helvetica-Bold')
    .fontSize(10)
    .text(title, PAGE.marginLeft, y, { lineBreak: false });
  const underlineY = y + 13;
  doc
    .moveTo(PAGE.marginLeft, underlineY)
    .lineTo(PAGE.marginLeft + contentW, underlineY)
    .lineWidth(1.2)
    .strokeColor(COLORS.cyan)
    .stroke();
  doc.x = PAGE.marginLeft;
  doc.y = underlineY + 8;
}

function buildQuotationPdf({ order, customer, customerName, sentAtLabel: _sentAtLabel }) {
  return new Promise((resolve, reject) => {
    const q = order.quotation || {};
    const addr = order.shippingAddress || order.billingAddress || {};
    const phone = customer?.phone || addr.phone || '';
    const address = formatAddress(addr);
    const orderNumber = order.orderNumber || '';

    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: PAGE.marginTop,
        bottom: PAGE.marginBottom,
        left: PAGE.marginLeft,
        right: PAGE.marginRight,
      },
      bufferPages: true,
      info: {
        Title: `Quotation ${orderNumber}`,
        Author: 'MarineKart India',
        Subject: 'Product quotation',
      },
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const contentW = doc.page.width - PAGE.marginLeft - PAGE.marginRight;

    // Title
    doc.fillColor(COLORS.navy).font('Helvetica-Bold').fontSize(17).text('QUOTATION', {
      width: contentW,
      align: 'center',
    });
    doc.moveDown(0.6);

    // To box
    const toTop = doc.y;
    const toH = 78;
    doc.roundedRect(PAGE.marginLeft, toTop, contentW, toH, 6).fill(COLORS.soft);

    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('To,', PAGE.marginLeft + 12, toTop + 10, { lineBreak: false });

    doc
      .fillColor(COLORS.ink)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(safeText(customerName || addr.fullName, 'Customer'), PAGE.marginLeft + 12, toTop + 24, {
        width: contentW - 24,
        lineBreak: false,
      });

    doc
      .fillColor(COLORS.ink)
      .font('Helvetica')
      .fontSize(8.5)
      .text(safeText(address), PAGE.marginLeft + 12, toTop + 38, { width: contentW - 24, lineBreak: false });

    doc
      .fillColor(COLORS.ink)
      .font('Helvetica')
      .fontSize(8.5)
      .text(`Mobile: ${safeText(phone)}`, PAGE.marginLeft + 12, toTop + 50, { lineBreak: false });

    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .text(`Quotation: ${safeText(orderNumber)}`, PAGE.marginLeft + 12, toTop + 62, {
        lineBreak: false,
      });

    doc.y = toTop + toH + 10;

    sectionTitle(doc, 'QUOTATION DETAILS');

    const col = { no: 26, qty: 34, rate: 68, disc: 52, amount: 76 };
    const fixedCols = col.no + col.qty + col.rate + col.disc + col.amount;
    col.item = contentW - fixedCols;
    const tableX = PAGE.marginLeft;
    const tableW = contentW;

    const drawTableHeader = () => {
      ensureSpace(doc, 22);
      const y = doc.y;
      doc.rect(tableX, y, tableW, 20).fill(COLORS.navy);
      doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(7.5);
      let x = tableX;
      for (const [label, w, align] of [
        ['#', col.no, 'center'],
        ['Item / Description', col.item, 'left'],
        ['Qty', col.qty, 'center'],
        ['Unit amount', col.rate, 'right'],
        ['Discount', col.disc, 'right'],
        ['Line total', col.amount, 'right'],
      ]) {
        doc.text(label, x + 4, y + 6, { width: w - 8, align, lineBreak: false });
        x += w;
      }
      doc.y = y + 20;
    };

    drawTableHeader();

    const items = Array.isArray(q.items) ? q.items : [];
    items.forEach((item, idx) => {
      const qty = Number(item.quantity) || 0;
      const amount = Number(item.amount) || 0;
      const lineTotal =
        item.lineTotal != null ? Number(item.lineTotal) : Math.round(amount * qty * 100) / 100;
      const gross = Math.round(amount * qty * 100) / 100;
      const disc = Math.max(0, Math.round((gross - lineTotal) * 100) / 100);
      const title = formatProductTitle(item);
      doc.font('Helvetica-Bold').fontSize(7.5);
      const titleH = doc.heightOfString(title, { width: col.item - 8 });
      const rowH = Math.max(24, titleH + 8);

      ensureSpace(doc, rowH + 4);
      if (doc.y < PAGE.marginTop) drawTableHeader();

      const y = doc.y;
      if (idx % 2 === 1) doc.rect(tableX, y, tableW, rowH).fill(COLORS.rowAlt);
      doc
        .moveTo(tableX, y + rowH)
        .lineTo(tableX + tableW, y + rowH)
        .lineWidth(0.5)
        .strokeColor(COLORS.line)
        .stroke();

      let x = tableX;
      doc.fillColor(COLORS.ink).font('Helvetica').fontSize(7.5);
      doc.text(String(idx + 1), x + 4, y + 7, { width: col.no - 8, align: 'center', lineBreak: false });
      x += col.no;
      doc.font('Helvetica-Bold').text(title, x + 4, y + 7, { width: col.item - 8, lineBreak: false });
      x += col.item;
      doc.font('Helvetica').text(String(qty), x + 4, y + 7, { width: col.qty - 8, align: 'center', lineBreak: false });
      x += col.qty;
      doc.text(money(amount), x + 4, y + 7, { width: col.rate - 8, align: 'right', lineBreak: false });
      x += col.rate;
      doc.text(disc > 0 ? money(disc) : '—', x + 4, y + 7, { width: col.disc - 8, align: 'right', lineBreak: false });
      x += col.disc;
      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.navy)
        .text(money(lineTotal), x + 4, y + 7, { width: col.amount - 8, align: 'right', lineBreak: false });

      doc.y = y + rowH;
    });

    if (!items.length) {
      doc.fillColor(COLORS.muted).font('Helvetica-Oblique').fontSize(8).text('No line items.');
      doc.moveDown(0.5);
    }

    doc.moveDown(0.6);
    ensureSpace(doc, 100);

    const totalsW = 215;
    const totalsX = PAGE.marginLeft + tableW - totalsW;
    const itemsGross = Number(q.itemsSubtotal || 0) + Number(q.discountTotal || 0);

    let ty = doc.y;
    for (const [label, value] of [
      ['Items subtotal', money(itemsGross)],
      ...(Number(q.discountTotal) > 0 ? [['Discount', `- ${money(q.discountTotal)}`]] : []),
      ['Courier charges', money(q.courierCharges)],
      [`GST (${q.gstPercent || 0}%)`, money(q.gstAmount)],
    ]) {
      doc.fillColor(COLORS.muted).font('Helvetica').fontSize(8.5);
      doc.text(label, totalsX, ty, { width: 105, lineBreak: false });
      doc
        .fillColor(COLORS.ink)
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .text(value, totalsX + 105, ty, { width: 110, align: 'right', lineBreak: false });
      ty += 14;
    }

    const grandH = 30;
    const grandY = ty + 3;
    doc.roundedRect(totalsX, grandY, totalsW, grandH, 5).fill(COLORS.navy);
    const midY = grandY + (grandH - 10) / 2;
    doc
      .fillColor(COLORS.cyan)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('GRAND TOTAL', totalsX + 10, midY, { lineBreak: false });
    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(money(q.grandTotal), totalsX + 100, midY - 1, { width: 105, align: 'right', lineBreak: false });

    doc.y = grandY + grandH + 10;
    doc.x = PAGE.marginLeft;

    // Terms + bank + thank-you — keep on one page when possible (no extra blank page)
    const termsSectionH = 150;
    ensureSpace(doc, termsSectionH);
    sectionTitle(doc, 'TERMS, CONDITIONS & BANK DETAILS');

    const gap = 12;
    const halfW = (contentW - gap) / 2;
    const boxTop = doc.y;
    const barH = 20;
    const boxH = 92;
    const bankX = PAGE.marginLeft + halfW + gap;

    for (const [x, label] of [
      [PAGE.marginLeft, 'TERMS AND CONDITIONS'],
      [bankX, 'BANK DETAILS'],
    ]) {
      doc.roundedRect(x, boxTop, halfW, boxH, 6).fill(COLORS.soft);
      doc.roundedRect(x, boxTop, halfW, barH, 6).fill(COLORS.navy);
      doc.rect(x, boxTop + barH - 6, halfW, 6).fill(COLORS.navy);
      doc
        .fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .fontSize(8)
        .text(label, x + 10, boxTop + 6, { lineBreak: false });
    }

    const bodyY = boxTop + barH + 10;
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7);
    doc.text('PAYMENT', PAGE.marginLeft + 10, bodyY, { lineBreak: false });
    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('100% ADVANCE', PAGE.marginLeft + 10, bodyY + 11, { lineBreak: false });
    doc.fillColor(COLORS.muted).font('Helvetica').fontSize(7);
    doc.text('DELIVERY', PAGE.marginLeft + 10, bodyY + 34, { lineBreak: false });
    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('EX-STOCK', PAGE.marginLeft + 10, bodyY + 45, { lineBreak: false });

    const bankLines = [
      ['Bank name', 'BANK OF BARODA'],
      ['Account name', 'MARINEKART INDIA'],
      ['Account no.', '26080400000547'],
      ['IFSC & branch', 'BARB0PONDAX & PONDA BRANCH'],
    ];
    let by = bodyY + 2;
    for (const [label, value] of bankLines) {
      doc
        .fillColor(COLORS.ink)
        .font('Helvetica')
        .fontSize(7.5)
        .text(`${label} - ${value}`, bankX + 10, by, { width: halfW - 20, lineBreak: false });
      by += 14;
    }

    doc.y = boxTop + boxH + 18;
    doc.x = PAGE.marginLeft;

    const thanksY = doc.y;
    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('Thanking you,', PAGE.marginLeft, thanksY, { lineBreak: false });
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica')
      .fontSize(9)
      .text('For Marine Kart India Team', PAGE.marginLeft, thanksY + 14, { lineBreak: false });
    doc.x = PAGE.marginLeft;
    doc.y = thanksY + 28;

    paintAllPages(doc);
    doc.end();
  });
}

module.exports = { buildQuotationPdf };
