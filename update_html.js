const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');
const base64Code = fs.readFileSync('pdf_base64.js', 'utf8');

// 1. Add Scripts
if (!html.includes('pdf-lib.min.js')) {
    html = html.replace('</head>', `
<script src="https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
<script src="https://unpkg.com/downloadjs@1.4.7/download.js"></script>
<script>
${base64Code}
</script>
</head>`);
}

// 2. Change CSS for Students layout
if (!html.includes('.students-layout')) {
    html = html.replace('.filter-bar { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }', 
    `.students-layout { display: flex; gap: 20px; align-items: flex-start; }
.filter-sidebar { width: 220px; flex-shrink: 0; background: var(--card); border-radius: var(--radius); padding: 16px; border: 1px solid var(--border); box-shadow: var(--shadow); }
.filter-bar { display: flex; flex-direction: column; gap: 12px; }
.students-content { flex: 1; min-width: 0; }`);
}

// 3. Change HTML layout for Students Page
if (html.includes('<div class="filter-bar">')) {
    html = html.replace(
        '<div class="filter-bar">',
        '<div class="students-layout">\n    <div class="filter-sidebar">\n      <div style="font-weight:700;margin-bottom:10px;font-size:14px;border-bottom:1px solid #e2e8f0;padding-bottom:8px;">Filters</div>\n      <div class="filter-bar">'
    );
    html = html.replace(
        '<button class="btn btn-success btn-sm" onclick="exportCSV()">⬇ Export CSV</button>\n    </div>',
        '<button class="btn btn-success btn-sm" onclick="exportCSV()">⬇ Export CSV</button>\n      </div>\n    </div>\n    <div class="students-content">'
    );
    html = html.replace(
        '</div>\n  </div>\n\n  <!-- ADD PAYMENT PAGE -->',
        '</div>\n  </div>\n  </div>\n\n  <!-- ADD PAYMENT PAGE -->'
    );
}

// 4. Add number to words function
const numToWordsFunc = `
function numberToWords(num) {
  const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
  const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
  if ((num = num.toString()).length > 9) return 'overflow';
  let n = ('000000000' + num).substr(-9).match(/^(\\d{2})(\\d{2})(\\d{2})(\\d{1})(\\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : '';
  return str.trim() || 'Zero';
}
`;

// 5. Replace showReceipt and buildReceiptHTML with generatePDFReceipt
if (!html.includes('async function generatePDFReceipt')) {
    const newFunc = `
${numToWordsFunc}

async function showReceipt(school, name, payIdx) {
  await generatePDFReceipt(school, name, payIdx);
}

async function generatePDFReceipt(school, name, payIdx) {
  const student = RAW_DATA[school].find(s => s.name === name);
  if(!student) return;
  const pay = student.payments[payIdx];
  if(!pay) return;

  const isIntl = school.includes('International');
  const b64 = isIntl ? B64_INTL_PDF : B64_SARASWATI_PDF;
  
  try {
    const pdfDoc = await PDFLib.PDFDocument.load(b64);
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const drawOpt = { font, size: 12, color: PDFLib.rgb(0,0,0) };

    const recStr = pay.rec || ('REC'+Math.floor(Math.random()*10000));
    const dateStr = pay.date || new Date().toISOString().split('T')[0];
    const totalAmt = String(pay.amount);
    const amtWords = numberToWords(pay.amount);

    if (isIntl) {
      page.drawText(recStr, { x: 160, y: 732, ...drawOpt });
      page.drawText(dateStr, { x: 340, y: 732, ...drawOpt });
      page.drawText(student.name, { x: 180, y: 715, ...drawOpt });
      page.drawText(student.section, { x: 170, y: 698, ...drawOpt });
      page.drawText(student.year, { x: 410, y: 698, ...drawOpt });
      page.drawText(totalAmt, { x: 480, y: 650, ...drawOpt }); // Tuition fee row
      page.drawText(totalAmt, { x: 480, y: 500, ...drawOpt }); // Total
      page.drawText(amtWords, { x: 280, y: 462, ...drawOpt });
      page.drawText(pay.mode, { x: 330, y: 446, ...drawOpt });
    } else {
      page.drawText(recStr, { x: 180, y: 748, ...drawOpt });
      page.drawText(dateStr, { x: 320, y: 748, ...drawOpt });
      page.drawText(student.name, { x: 160, y: 730, ...drawOpt });
      page.drawText(student.section, { x: 160, y: 712, ...drawOpt });
      page.drawText(student.year, { x: 320, y: 712, ...drawOpt });
      page.drawText(totalAmt, { x: 480, y: 660, ...drawOpt }); // Tuition fee row
      page.drawText(totalAmt, { x: 480, y: 510, ...drawOpt }); // Total
      page.drawText(amtWords, { x: 200, y: 472, ...drawOpt });
      page.drawText(pay.mode, { x: 260, y: 455, ...drawOpt });
    }

    const pdfBytes = await pdfDoc.save();
    const safeName = student.name.replace(/\\s+/g, '_');
    const safeSchool = school.replace(/\\s+/g, '_');
    const fileName = \`\${safeSchool}_Receipt_\${recStr}_\${safeName}.pdf\`;
    download(pdfBytes, fileName, "application/pdf");
    showToast('PDF Receipt Downloaded!', 'success');
  } catch (err) {
    console.error(err);
    showToast('Failed to generate PDF', 'error');
  }
}
`;
    // We just replace buildReceiptHTML entirely since it's no longer used, and overwrite showReceipt
    html = html.replace(/function showReceipt\([\s\S]*?<\/div>'\s*;\s*}/, newFunc);
}

fs.writeFileSync('index.html', html);
console.log('Successfully updated index.html');
