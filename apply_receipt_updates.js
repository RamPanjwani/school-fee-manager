/**
 * Apply PDF receipt generation, layout fixes, and embed updated base64 templates.
 */
const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
const base64 = fs.readFileSync('pdf_base64.js', 'utf8');

// --- 1. CSS: students layout with left filters ---
if (!html.includes('.students-layout{')) {
  html = html.replace(
    '/* ===== SEARCH / FILTER BAR ===== */',
    `/* ===== STUDENTS LAYOUT ===== */
.students-layout{display:flex;gap:20px;align-items:flex-start}
.filter-sidebar{width:220px;flex-shrink:0;background:var(--card);border-radius:var(--radius);padding:16px;border:1px solid var(--border);box-shadow:var(--shadow);position:sticky;top:80px}
.filter-sidebar-title{font-weight:700;margin-bottom:12px;font-size:.9rem;border-bottom:1px solid var(--border);padding-bottom:8px}
.students-content{flex:1;min-width:0}
.filter-sidebar .filter-bar{flex-direction:column;align-items:stretch;margin-bottom:0}
.filter-sidebar .filter-bar input,.filter-sidebar .filter-bar select{width:100%;min-width:0}
.filter-sidebar .filter-bar button{width:100%}
@media(max-width:900px){.students-layout{flex-direction:column}.filter-sidebar{width:100%;position:static}}

/* ===== SEARCH / FILTER BAR ===== */`
  );
}

// --- 2. Fix broken students page HTML ---
const studentsBlock = `    <!-- ===== STUDENTS PAGE ===== -->
    <div class="page" id="pageStudents">
      <div class="students-layout">
        <div class="filter-sidebar">
          <div class="filter-sidebar-title">Filters</div>
          <div class="filter-bar">
            <input type="text" id="studentSearch" placeholder="🔍 Search students..." oninput="filterStudents()">
            <select id="filterSchool" onchange="filterStudents()"><option value="">All Schools</option><option>Saraswati Vidyalaya</option><option>International School</option></select>
            <select id="filterSection" onchange="filterStudents()"><option value="">All Sections</option><option>PRE-PRIMARY</option><option>PRIMARY</option><option>SECONDARY</option><option>JR.COLLEGE</option></select>
            <select id="filterYear" onchange="filterStudents()"><option value="">All Years</option></select>
            <select id="filterStatus" onchange="filterStudents()"><option value="">All Status</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="unpaid">Unpaid</option><option value="overpaid">Overpaid</option></select>
            <button class="btn btn-outline btn-sm" onclick="clearFilters()">Clear</button>
            <button class="btn btn-sm btn-outline" onclick="exportStudentsCSV()">📤 Export CSV</button>
          </div>
        </div>
        <div class="students-content">
          <div class="card">
            <div class="table-wrap" id="studentsTable"></div>
            <div class="pagination" id="studentsPagination"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== ADD PAYMENT PAGE ===== -->`;

html = html.replace(
  /    <!-- ===== STUDENTS PAGE ===== -->[\s\S]*?    <!-- ===== ADD PAYMENT PAGE ===== -->/,
  studentsBlock
);

// --- 3. Update embedded base64 PDFs ---
html = html.replace(
  /<script>\s*const B64_INTL_PDF[\s\S]*?<\/script>\s*<\/head>/,
  `<script>\n${base64.trim()}\n</script>\n</head>`
);

// --- 4. Receipt modal: add Download PDF button ---
html = html.replace(
  `<button class="btn btn-primary btn-sm" onclick="printReceipt()">🖨 Print Receipt</button>`,
  `<button class="btn btn-primary btn-sm" id="receiptDownloadBtn" onclick="downloadCurrentReceiptPDF()">📥 Download PDF</button>
      <button class="btn btn-outline btn-sm" onclick="printReceipt()">🖨 Print</button>`
);

// --- 5. Replace receipt generation functions ---
const receiptFunctions = `
let lastReceiptContext = null;

function numberToWords(num) {
  num = Math.round(Number(num) || 0);
  if (num === 0) return 'Zero Only';
  const ones = ['','One ','Two ','Three ','Four ','Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function chunk(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ones[n % 10] : '');
  }
  if (num >= 10000000) return String(num);
  let str = '';
  if (num >= 10000000) { str += chunk(Math.floor(num / 10000000)) + 'Crore '; num %= 10000000; }
  if (num >= 100000) { str += chunk(Math.floor(num / 100000)) + 'Lakh '; num %= 100000; }
  if (num >= 1000) { str += chunk(Math.floor(num / 1000)) + 'Thousand '; num %= 1000; }
  if (num >= 100) { str += chunk(Math.floor(num / 100)) + 'Hundred '; num %= 100; }
  if (num > 0) str += (str ? 'and ' : '') + chunk(num);
  return (str.trim() + ' Only');
}

function getPaymentModeLabel(p) {
  if (Number(p.online)) return 'Online';
  if (Number(p.cheque)) return 'Cheque';
  return 'Cash';
}

function getReceiptFilePrefix(school) {
  return school.includes('International')
    ? 'New_City_International_School'
    : 'New_City_Saraswati_Vidyalaya';
}

function sanitizeFileName(str) {
  return (str || '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
}

const RECEIPT_LAYOUT = {
  'International School': {
    recNo: { x: 118, y: 657, size: 11 },
    date: { x: 455, y: 657, size: 11 },
    name: { x: 118, y: 623, size: 11 },
    class: { x: 118, y: 589, size: 11 },
    roll: { x: 400, y: 589, size: 11 },
    tuitionAmt: { x: 500, y: 513, size: 11 },
    totalAmt: { x: 500, y: 353, size: 11 },
    words1: { x: 280, y: 320, size: 10 },
    words2: { x: 118, y: 304, size: 10 },
    mode: { x: 330, y: 282, size: 10 },
    drawnOn: { x: 150, y: 260, size: 10 },
  },
  'Saraswati Vidyalaya': {
    recNo: { x: 135, y: 670, size: 11 },
    date: { x: 420, y: 670, size: 11 },
    name: { x: 115, y: 640, size: 11 },
    class: { x: 115, y: 610, size: 11 },
    roll: { x: 380, y: 610, size: 11 },
    tuitionAmt: { x: 500, y: 530, size: 11 },
    totalAmt: { x: 500, y: 380, size: 11 },
    words: { x: 210, y: 348, size: 10 },
    mode: { x: 240, y: 326, size: 10 },
  },
};

async function generatePDFReceipt(school, studentName, paymentIndex, autoDownload = true) {
  const s = findStudentGlobal(school, studentName);
  if (!s || !s.payments || !s.payments[paymentIndex]) {
    toast('Receipt data not found', 'error');
    return null;
  }
  const p = s.payments[paymentIndex];
  const amount = Number(p.amount) || Number(p.cash) || Number(p.online) || Number(p.cheque) || 0;
  const isIntl = school.includes('International');
  const b64 = isIntl ? B64_INTL_PDF : B64_SARASWATI_PDF;
  const layout = RECEIPT_LAYOUT[school];
  if (!layout) { toast('Unknown school for receipt', 'error'); return null; }

  try {
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const pdfDoc = await PDFDocument.load(b64);
    const page = pdfDoc.getPages()[0];
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const draw = (text, pos, opts = {}) => {
      const t = String(text || '');
      if (!t) return;
      page.drawText(t, {
        x: pos.x,
        y: pos.y,
        size: pos.size || 11,
        font,
        color: rgb(0, 0, 0),
        ...opts,
      });
    };

    const recStr = p.rec || generateReceiptNo();
    const dateStr = p.date || '';
    const amtStr = String(amount);
    const amtWords = numberToWords(amount);
    const modeStr = getPaymentModeLabel(p);

    draw(recStr, layout.recNo);
    draw(dateStr, layout.date);
    draw(s.name, layout.name);
    draw(s.section || '-', layout.class);
    draw(s.year || '-', layout.roll);
    draw(amtStr, layout.tuitionAmt);
    draw(amtStr, layout.totalAmt);
    if (layout.words1) {
      draw(amtWords, layout.words1);
      draw('', layout.words2);
      draw(modeStr, layout.mode);
      draw(dateStr, layout.drawnOn);
    } else {
      draw(amtWords, layout.words);
      draw(modeStr, layout.mode);
    }

    const pdfBytes = await pdfDoc.save();
    const prefix = getReceiptFilePrefix(school);
    const fileName = \`\${prefix}_Receipt_\${sanitizeFileName(recStr)}_\${sanitizeFileName(s.name)}.pdf\`;

    lastReceiptContext = { school, studentName, paymentIndex, fileName, pdfBytes };

    if (autoDownload) {
      download(pdfBytes, fileName, 'application/pdf');
      toast('PDF receipt downloaded: ' + fileName, 'success');
    }
    return { pdfBytes, fileName };
  } catch (err) {
    console.error(err);
    toast('Failed to generate PDF receipt', 'error');
    return null;
  }
}

async function showReceipt(school, studentName, paymentIndex) {
  await generatePDFReceipt(school, studentName, paymentIndex, true);
}

async function downloadCurrentReceiptPDF() {
  if (lastReceiptContext) {
    download(lastReceiptContext.pdfBytes, lastReceiptContext.fileName, 'application/pdf');
    return;
  }
  toast('No receipt loaded', 'error');
}

function buildReceiptHTML(student, payment, amount, mode, runningBalance, paymentIndex) {
  return \`<div class="receipt" id="receiptPrintArea"><p>PDF receipt was downloaded. Use Download PDF to save again.</p></div>\`;
}
`;

html = html.replace(
  /\/\* ===== RECEIPT GENERATION ===== \*\/[\s\S]*?\/\* ===== REPORTS ===== \*\//,
  `/* ===== RECEIPT GENERATION ===== */${receiptFunctions}

/* ===== REPORTS ===== */`
);

// --- 6. Make addPayment await PDF generation ---
html = html.replace(
  '  // Show receipt\n  showReceipt(school, s.name, s.payments.length - 1);',
  '  // Generate & download PDF receipt\n  await showReceipt(school, s.name, s.payments.length - 1);'
);

// --- 7. Hide receipt no input placeholder - show auto-gen note ---
html = html.replace(
  '<input type="text" id="payReceipt" placeholder="Auto-generated if empty">',
  '<input type="text" id="payReceipt" placeholder="Auto-generated on save" readonly style="background:#f8fafc">'
);

fs.writeFileSync('index.html', html);
console.log('Applied receipt updates to index.html');
