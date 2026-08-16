const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { formatProductTitle } = require('./productTitle');

const ASSETS = path.join(__dirname, '../assets/quotation');
const LOGO_PATH = path.join(ASSETS, 'logo-header.png');
const LOGO_FALLBACK = path.join(ASSETS, 'logo-dark.png');
const FOOTER_PATH = path.join(ASSETS, 'footer.png');

const COLORS = {
  navy: '#0b2c5f',
  navyDark: '#071f42',
  cyan: '#78c6d4',
  ink: '#1e293b',
  muted: '#64748b',
  line: '#e2e8f0',
  soft: '#f1f7fa',
  white: '#ffffff',
  rowAlt: '#f8fafc',
};

const PAGE = {
  marginLeft: 40,
  marginRight: 40,
  // Logo bar + company info strip
  marginTop: 128,
  marginBottom: 92,
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

function drawHeader(doc, { sentAtLabel, orderNumber }) {
  const pageW = doc.page.width;
  const barH = 56;
  const infoH = 46;
  const totalH = barH + 3 + infoH;

  doc.save();
  // Brand bar
  doc.rect(0, 0, pageW, barH).fill(COLORS.navy);
  doc.rect(0, barH, pageW, 3).fill(COLORS.cyan);

  const logoFile = fs.existsSync(LOGO_PATH)
    ? LOGO_PATH
    : fs.existsSync(LOGO_FALLBACK)
      ? LOGO_FALLBACK
      : null;

  if (logoFile) {
    try {
      doc.image(logoFile, PAGE.marginLeft, 6, { fit: [140, 44], valign: 'center' });
    } catch {
      doc
        .fillColor(COLORS.white)
        .font('Helvetica-Bold')
        .fontSize(16)
        .text('MarineKart', PAGE.marginLeft, 20, { width: 180 });
    }
  } else {
    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(16)
      .text('MarineKart', PAGE.marginLeft, 20, { width: 180 });
  }

  const rightX = pageW - PAGE.marginRight - 200;
  doc
    .fillColor(COLORS.cyan)
    .font('Helvetica')
    .fontSize(8)
    .text('DATE OF SENT', rightX, 12, { width: 200, align: 'right' });
  doc
    .fillColor(COLORS.white)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(sentAtLabel || '—', rightX, 24, { width: 200, align: 'right' });
  if (orderNumber) {
    doc
      .fillColor(COLORS.cyan)
      .font('Helvetica')
      .fontSize(8)
      .text(`Quotation · ${orderNumber}`, rightX, 40, { width: 200, align: 'right' });
  }

  // Company info strip (every page)
  const infoY = barH + 3;
  doc.rect(0, infoY, pageW, infoH).fill(COLORS.soft);
  doc
    .moveTo(0, infoY + infoH)
    .lineTo(pageW, infoY + infoH)
    .lineWidth(0.6)
    .strokeColor(COLORS.line)
    .stroke();

  const colGap = 16;
  const usableW = pageW - PAGE.marginLeft - PAGE.marginRight;
  const colW = (usableW - colGap) / 2;
  const leftX = PAGE.marginLeft;
  const rightColX = PAGE.marginLeft + colW + colGap;
  const textTop = infoY + 7;

  // Divider between office / showroom
  const midX = PAGE.marginLeft + colW + colGap / 2;
  doc
    .moveTo(midX, infoY + 8)
    .lineTo(midX, infoY + infoH - 8)
    .lineWidth(0.8)
    .strokeColor(COLORS.cyan)
    .stroke();

  doc
    .fillColor(COLORS.navy)
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .text(COMPANY.registered.title.toUpperCase(), leftX, textTop, { width: colW });
  doc
    .fillColor(COLORS.ink)
    .font('Helvetica')
    .fontSize(7.5)
    .text(COMPANY.registered.lines.join('\n'), leftX, textTop + 11, {
      width: colW,
      lineGap: 1.5,
    });

  doc
    .fillColor(COLORS.navy)
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .text(COMPANY.showroom.title.toUpperCase(), rightColX, textTop, { width: colW });
  doc
    .fillColor(COLORS.ink)
    .font('Helvetica')
    .fontSize(7.5)
    .text(COMPANY.showroom.lines.join('\n'), rightColX, textTop + 11, {
      width: colW,
      lineGap: 1.5,
    });

  doc.restore();
  // Keep content clear of header chrome
  if (doc.y < totalH + 8) {
    doc.y = totalH + 8;
  }
}

function drawFooter(doc) {
  const pageW = doc.page.width;
  const pageH = doc.page.height;
  // Footer asset is ~1024×140 → keep aspect on A4 width
  const footerH = Math.round((pageW * 140) / 1024);
  const y = pageH - footerH;

  if (fs.existsSync(FOOTER_PATH)) {
    try {
      doc.image(FOOTER_PATH, 0, y, { width: pageW, height: footerH });
      return;
    } catch {
      /* fall through */
    }
  }

  doc.save();
  doc.rect(0, y + 14, pageW, footerH - 14).fill(COLORS.navy);
  doc
    .fillColor(COLORS.white)
    .font('Helvetica')
    .fontSize(8)
    .text('+91-9923026865  +91-9518999484', 30, y + 28, { width: 180 })
    .text('www.marinekartindia.com', 220, y + 28, { width: 160, align: 'center' })
    .text('info@marinekartindia.com', pageW - 210, y + 28, { width: 180, align: 'right' });
  doc.restore();
}

function ensureSpace(doc, needed) {
  const bottom = doc.page.height - PAGE.marginBottom;
  if (doc.y + needed > bottom) {
    doc.addPage();
  }
}

function sectionTitle(doc, title) {
  ensureSpace(doc, 28);
  doc
    .fillColor(COLORS.navy)
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(title, PAGE.marginLeft, doc.y);
  const underlineY = doc.y + 2;
  doc
    .moveTo(PAGE.marginLeft, underlineY)
    .lineTo(PAGE.marginLeft + 120, underlineY)
    .lineWidth(1.5)
    .strokeColor(COLORS.cyan)
    .stroke();
  doc.moveDown(0.7);
}

/**
 * Build quotation PDF buffer.
 * @param {{ order: object, customer: object, customerName: string, sentAtLabel: string }} opts
 * @returns {Promise<Buffer>}
 */
function buildQuotationPdf({ order, customer, customerName, sentAtLabel }) {
  return new Promise((resolve, reject) => {
    const q = order.quotation || {};
    const addr = order.shippingAddress || order.billingAddress || {};
    const email = customer?.email || '';
    const phone = customer?.phone || addr.phone || '';
    const address = formatAddress(addr);

    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: PAGE.marginTop,
        bottom: PAGE.marginBottom,
        left: PAGE.marginLeft,
        right: PAGE.marginRight,
      },
      info: {
        Title: `Quotation ${order.orderNumber || ''}`,
        Author: 'MarineKart India',
        Subject: 'Product quotation',
      },
    });

    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const headerOpts = {
      sentAtLabel,
      orderNumber: order.orderNumber || '',
    };

    const paintChrome = () => {
      const savedX = doc.x;
      const savedY = doc.y;
      drawHeader(doc, headerOpts);
      drawFooter(doc);
      doc.x = savedX;
      doc.y = Math.max(savedY, PAGE.marginTop);
    };

    doc.on('pageAdded', () => {
      paintChrome();
      doc.x = PAGE.marginLeft;
      doc.y = PAGE.marginTop;
    });
    paintChrome();

    // Title band
    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(18)
      .text('QUOTATION', PAGE.marginLeft, PAGE.marginTop - 8, {
        width: doc.page.width - PAGE.marginLeft - PAGE.marginRight,
        align: 'center',
      });
    doc.moveDown(0.6);

    // To block
    const toBoxTop = doc.y;
    const toBoxW = doc.page.width - PAGE.marginLeft - PAGE.marginRight;
    doc.roundedRect(PAGE.marginLeft, toBoxTop, toBoxW, 92, 8).fill(COLORS.soft);
    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('To,', PAGE.marginLeft + 14, toBoxTop + 12);
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text(safeText(customerName || addr.fullName, 'Customer'), PAGE.marginLeft + 14, toBoxTop + 28, {
        width: toBoxW - 28,
      });
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(9)
      .text(`Address: ${safeText(address)}`, PAGE.marginLeft + 14, toBoxTop + 46, {
        width: toBoxW - 28,
      })
      .text(`Email: ${safeText(email)}`, PAGE.marginLeft + 14, toBoxTop + 60, {
        width: (toBoxW - 28) / 2,
        continued: false,
      })
      .text(`Mobile: ${safeText(phone)}`, PAGE.marginLeft + 14 + (toBoxW - 28) / 2, toBoxTop + 60, {
        width: (toBoxW - 28) / 2,
      });

    doc.y = toBoxTop + 104;

    // Intro
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica')
      .fontSize(10)
      .text(
        'Dear Sir / Madam,\n\nPlease find below our quotation for the items as per your enquiry. We look forward to your confirmation.',
        PAGE.marginLeft,
        doc.y,
        { width: toBoxW, align: 'left', lineGap: 2 }
      );
    doc.moveDown(1);

    // Table
    sectionTitle(doc, 'QUOTATION DETAILS');

    const col = {
      no: 28,
      item: 210,
      qty: 36,
      rate: 70,
      disc: 55,
      amount: 76,
    };
    const tableX = PAGE.marginLeft;
    const tableW = col.no + col.item + col.qty + col.rate + col.disc + col.amount;

    const drawTableHeader = () => {
      ensureSpace(doc, 24);
      const y = doc.y;
      doc.rect(tableX, y, tableW, 22).fill(COLORS.navy);
      doc.fillColor(COLORS.white).font('Helvetica-Bold').fontSize(8);
      let x = tableX;
      const cells = [
        ['#', col.no, 'center'],
        ['Item / Description', col.item, 'left'],
        ['Qty', col.qty, 'center'],
        ['Unit amount', col.rate, 'right'],
        ['Discount', col.disc, 'right'],
        ['Line total', col.amount, 'right'],
      ];
      for (const [label, w, align] of cells) {
        doc.text(label, x + 4, y + 7, { width: w - 8, align });
        x += w;
      }
      doc.y = y + 22;
    };

    drawTableHeader();

    const items = Array.isArray(q.items) ? q.items : [];
    items.forEach((item, idx) => {
      const qty = Number(item.quantity) || 0;
      const amount = Number(item.amount) || 0;
      const lineTotal =
        item.lineTotal != null
          ? Number(item.lineTotal)
          : Math.round(amount * qty * 100) / 100;
      const gross = Math.round(amount * qty * 100) / 100;
      const disc = Math.max(0, Math.round((gross - lineTotal) * 100) / 100);
      const title = formatProductTitle(item);
      const titleH = doc.heightOfString(title, { width: col.item - 8, fontSize: 8 });
      const rowH = Math.max(28, titleH + 10);

      ensureSpace(doc, rowH + 4);
      if (doc.y < PAGE.marginTop + 5) {
        drawTableHeader();
      }

      const y = doc.y;
      if (idx % 2 === 1) {
        doc.rect(tableX, y, tableW, rowH).fill(COLORS.rowAlt);
      }
      doc
        .moveTo(tableX, y + rowH)
        .lineTo(tableX + tableW, y + rowH)
        .lineWidth(0.5)
        .strokeColor(COLORS.line)
        .stroke();

      doc.fillColor(COLORS.ink).font('Helvetica').fontSize(8);
      let x = tableX;
      doc.text(String(idx + 1), x + 4, y + 8, { width: col.no - 8, align: 'center' });
      x += col.no;
      doc.font('Helvetica-Bold').text(title, x + 4, y + 8, { width: col.item - 8 });
      x += col.item;
      doc.font('Helvetica').text(String(qty), x + 4, y + 8, { width: col.qty - 8, align: 'center' });
      x += col.qty;
      doc.text(money(amount), x + 4, y + 8, { width: col.rate - 8, align: 'right' });
      x += col.rate;
      doc.text(disc > 0 ? money(disc) : '—', x + 4, y + 8, { width: col.disc - 8, align: 'right' });
      x += col.disc;
      doc
        .font('Helvetica-Bold')
        .fillColor(COLORS.navy)
        .text(money(lineTotal), x + 4, y + 8, { width: col.amount - 8, align: 'right' });

      doc.y = y + rowH;
    });

    if (!items.length) {
      ensureSpace(doc, 30);
      doc
        .fillColor(COLORS.muted)
        .font('Helvetica-Oblique')
        .fontSize(9)
        .text('No line items in this quotation.', tableX, doc.y + 8);
      doc.moveDown(1);
    }

    // Totals panel
    doc.moveDown(0.8);
    ensureSpace(doc, 110);
    const totalsW = 220;
    const totalsX = PAGE.marginLeft + tableW - totalsW;
    const itemsGross = Number(q.itemsSubtotal || 0) + Number(q.discountTotal || 0);

    const totalRows = [
      ['Items subtotal', money(itemsGross)],
      Number(q.discountTotal) > 0 ? ['Discount', `- ${money(q.discountTotal)}`] : null,
      ['Courier charges', money(q.courierCharges)],
      [`GST (${q.gstPercent || 0}%)`, money(q.gstAmount)],
    ].filter(Boolean);

    let ty = doc.y;
    for (const [label, value] of totalRows) {
      doc
        .fillColor(COLORS.muted)
        .font('Helvetica')
        .fontSize(9)
        .text(label, totalsX, ty, { width: 110 });
      doc
        .fillColor(COLORS.ink)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(value, totalsX + 110, ty, { width: 110, align: 'right' });
      ty += 16;
    }

    const grandH = 34;
    const grandY = ty + 2;
    doc.roundedRect(totalsX, grandY, totalsW, grandH, 6).fill(COLORS.navy);
    const grandTextY = grandY + (grandH - 12) / 2;
    doc
      .fillColor(COLORS.cyan)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('GRAND TOTAL', totalsX + 12, grandTextY, { width: 100 });
    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(money(q.grandTotal), totalsX + 100, grandTextY - 1, { width: 108, align: 'right' });

    doc.y = grandY + grandH + 16;

    // Terms & Bank — equal height cards, roomy bank spacing
    ensureSpace(doc, 160);
    sectionTitle(doc, 'TERMS, CONDITIONS & BANK DETAILS');

    const gap = 14;
    const halfW = (toBoxW - gap) / 2;
    const boxTop = doc.y;
    const headerH = 24;
    const boxH = 132;
    const bankX = PAGE.marginLeft + halfW + gap;

    // Shared card shells (same height)
    doc.roundedRect(PAGE.marginLeft, boxTop, halfW, boxH, 8).fill(COLORS.soft);
    doc.roundedRect(PAGE.marginLeft, boxTop, halfW, headerH, 8).fill(COLORS.navy);
    doc.rect(PAGE.marginLeft, boxTop + headerH - 8, halfW, 8).fill(COLORS.navy);

    doc.roundedRect(bankX, boxTop, halfW, boxH, 8).fill(COLORS.soft);
    doc.roundedRect(bankX, boxTop, halfW, headerH, 8).fill(COLORS.navy);
    doc.rect(bankX, boxTop + headerH - 8, halfW, 8).fill(COLORS.navy);

    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('TERMS AND CONDITIONS', PAGE.marginLeft + 12, boxTop + 7, { width: halfW - 24 });
    doc
      .fillColor(COLORS.white)
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('BANK DETAILS', bankX + 12, boxTop + 7, { width: halfW - 24 });

    // Terms content — spaced to fill equal card height
    const termsBodyTop = boxTop + headerH + 14;
    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(8)
      .text('PAYMENT', PAGE.marginLeft + 14, termsBodyTop);
    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('100% ADVANCE', PAGE.marginLeft + 14, termsBodyTop + 14);

    doc
      .fillColor(COLORS.muted)
      .font('Helvetica')
      .fontSize(8)
      .text('DELIVERY', PAGE.marginLeft + 14, termsBodyTop + 48);
    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('EX-STOCK', PAGE.marginLeft + 14, termsBodyTop + 62);

    // Bank content — clearer line spacing
    const bankLines = [
      ['Bank name', 'BANK OF BARODA'],
      ['Account name', 'MARINEKART INDIA'],
      ['Account no.', '26080400000547'],
      ['IFSC & branch', 'BARB0PONDAX & PONDA BRANCH'],
    ];
    let by = boxTop + headerH + 10;
    for (const [label, value] of bankLines) {
      doc
        .fillColor(COLORS.muted)
        .font('Helvetica')
        .fontSize(7)
        .text(label.toUpperCase(), bankX + 12, by, { width: halfW - 24 });
      doc
        .fillColor(COLORS.ink)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(value, bankX + 12, by + 10, { width: halfW - 24 });
      by += 24;
    }

    doc.y = boxTop + boxH + 20;

    // Closing
    ensureSpace(doc, 70);
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica')
      .fontSize(10)
      .text(
        'We hope the above quotation meets your requirements. Kindly confirm to proceed with the order. For any clarification, feel free to contact us.',
        PAGE.marginLeft,
        doc.y,
        { width: toBoxW, lineGap: 2 }
      );
    doc.moveDown(1.2);
    doc
      .fillColor(COLORS.navy)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('Thanking you,', PAGE.marginLeft, doc.y);
    doc.moveDown(0.35);
    doc
      .fillColor(COLORS.ink)
      .font('Helvetica')
      .fontSize(10)
      .text('For Marine Kart India Team', PAGE.marginLeft, doc.y);

    doc.end();
  });
}

module.exports = { buildQuotationPdf };
