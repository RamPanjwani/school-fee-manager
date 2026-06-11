const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

async function checkPdf(filename) {
  const bytes = fs.readFileSync(filename);
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  console.log(`\n--- ${filename} ---`);
  console.log(`Fields count: ${fields.length}`);
  fields.forEach(field => {
    console.log(`- ${field.getName()} (${field.constructor.name})`);
  });
}

checkPdf('New_City_International_School_Receipt.pdf');
checkPdf('New_City_Saraswati_Vidyalaya_Receipt_Fixed.pdf');
