/**
 * Build receipt PDF templates from source images and encode for index.html
 */
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(process.env.USERPROFILE || '', '.cursor', 'projects', 'c-Users-ram-Desktop-school-fee-manager', 'assets');
const INTL_IMG = path.join(ASSETS, 'c__Users_ram_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_New_City_International_School_Receipt_page-0001-d1c35670-f373-4b9b-8d45-7df17c228f76.png');
const SARASWATI_IMG = path.join(ASSETS, 'c__Users_ram_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_New_City_Saraswati_Vidyalaya_Receipt_Fixed_page-0001-b96a56e6-e77e-41ef-9e48-68010d13a116.png');

async function imageToPdf(imagePath, outPath) {
  const imgBytes = fs.readFileSync(imagePath);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const isJpeg = imgBytes[0] === 0xff && imgBytes[1] === 0xd8;
  const img = isJpeg ? await pdfDoc.embedJpg(imgBytes) : await pdfDoc.embedPng(imgBytes);
  const scale = page.getWidth() / width;
  const w = page.getWidth();
  const h = height * scale;
  page.drawImage(img, {
    x: 0,
    y: page.getHeight() - h,
    width: w,
    height: h,
  });
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`Created ${outPath} (${pdfBytes.length} bytes)`);
}

async function main() {
  const intlOut = 'New_City_International_School_Receipt.pdf';
  const sarasOut = 'New_City_Saraswati_Vidyalaya_Receipt_Fixed.pdf';

  if (fs.existsSync(INTL_IMG)) {
    await imageToPdf(INTL_IMG, intlOut);
  } else {
    console.warn('International image not found:', INTL_IMG);
  }
  if (fs.existsSync(SARASWATI_IMG)) {
    await imageToPdf(SARASWATI_IMG, sarasOut);
  } else {
    console.warn('Saraswati image not found:', SARASWATI_IMG);
  }

  // Encode for browser
  const b64Intl = fs.readFileSync(intlOut, { encoding: 'base64' });
  const b64Saras = fs.readFileSync(sarasOut, { encoding: 'base64' });
  fs.writeFileSync('pdf_base64.js', `const B64_INTL_PDF = "${b64Intl}";\nconst B64_SARASWATI_PDF = "${b64Saras}";\n`);
  console.log('Wrote pdf_base64.js');
}

main().catch(console.error);
