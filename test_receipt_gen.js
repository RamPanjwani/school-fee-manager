/** Quick local test: generate sample receipt PDFs from embedded templates */
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

const b64Intl = fs.readFileSync('New_City_International_School_Receipt.pdf').toString('base64');

async function test() {
  const bytes = Buffer.from(b64Intl, 'base64');
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  page.drawText('REC250611-9999', { x: 118, y: 657, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText('25000', { x: 500, y: 513, size: 11, font, color: rgb(0, 0, 0) });
  fs.writeFileSync('test_intl_receipt.pdf', await pdfDoc.save());
  console.log('OK - wrote test_intl_receipt.pdf');
}

test().catch(e => { console.error('FAIL', e); process.exit(1); });
