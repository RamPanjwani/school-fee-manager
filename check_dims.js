const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function checkDimensions(filename) {
  const bytes = fs.readFileSync(filename);
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPage(0);
  const { width, height } = page.getSize();
  console.log(`\n--- ${filename} ---`);
  console.log(`Width: ${width}, Height: ${height}`);
}

checkDimensions('New_City_International_School_Receipt.pdf');
checkDimensions('New_City_Saraswati_Vidyalaya_Receipt_Fixed.pdf');
