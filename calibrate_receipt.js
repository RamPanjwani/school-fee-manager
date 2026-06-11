/**
 * Generate test receipt PDFs to calibrate text placement coordinates.
 */
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

const SAMPLE = {
  rec: 'REC250611-1234',
  date: '11/06/2025',
  name: 'Rahul Sharma',
  section: 'PRIMARY',
  year: '2025-26',
  amount: '25000',
  mode: 'Cash',
  words: 'Twenty Five Thousand Only',
};

const INTL_LAYOUT = {
  recNo: { x: 118, y: 698, size: 11 },
  date: { x: 455, y: 698, size: 11 },
  name: { x: 118, y: 678, size: 11 },
  class: { x: 118, y: 658, size: 11 },
  roll: { x: 400, y: 658, size: 11 },
  tuitionAmt: { x: 505, y: 612, size: 11 },
  totalAmt: { x: 505, y: 502, size: 11 },
  words1: { x: 310, y: 468, size: 10 },
  words2: { x: 118, y: 452, size: 10 },
  mode: { x: 280, y: 436, size: 10 },
  drawnOn: { x: 170, y: 420, size: 10 },
};

const SARAS_LAYOUT = {
  recNo: { x: 130, y: 718, size: 11 },
  date: { x: 430, y: 718, size: 11 },
  name: { x: 115, y: 698, size: 11 },
  class: { x: 115, y: 678, size: 11 },
  roll: { x: 380, y: 678, size: 11 },
  tuitionAmt: { x: 505, y: 632, size: 11 },
  totalAmt: { x: 505, y: 522, size: 11 },
  words: { x: 200, y: 488, size: 10 },
  mode: { x: 220, y: 468, size: 10 },
};

async function generateTest(templateFile, layout, outFile) {
  const bytes = fs.readFileSync(templateFile);
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const draw = (text, pos) => {
    page.drawText(String(text), {
      x: pos.x,
      y: pos.y,
      size: pos.size || 11,
      font,
      color: rgb(0, 0, 0.8),
    });
  };

  draw(SAMPLE.rec, layout.recNo);
  draw(SAMPLE.date, layout.date);
  draw(SAMPLE.name, layout.name);
  draw(SAMPLE.section, layout.class);
  draw(SAMPLE.year, layout.roll);
  draw(SAMPLE.amount, layout.tuitionAmt);
  draw(SAMPLE.amount, layout.totalAmt);
  if (layout.words1) {
    draw(SAMPLE.words, layout.words1);
    draw('', layout.words2);
  } else {
    draw(SAMPLE.words, layout.words);
  }
  draw(SAMPLE.mode, layout.mode);
  if (layout.drawnOn) draw(SAMPLE.date, layout.drawnOn);

  fs.writeFileSync(outFile, await pdfDoc.save());
  console.log('Wrote', outFile);
}

async function main() {
  await generateTest(
    'New_City_International_School_Receipt.pdf',
    INTL_LAYOUT,
    'test_intl_receipt.pdf'
  );
  await generateTest(
    'New_City_Saraswati_Vidyalaya_Receipt_Fixed.pdf',
    SARAS_LAYOUT,
    'test_saras_receipt.pdf'
  );
}

main().catch(console.error);
