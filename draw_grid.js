const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

async function drawGrid(templateFile, outFile) {
  const bytes = fs.readFileSync(templateFile);
  const pdfDoc = await PDFDocument.load(bytes);
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  // Draw horizontal lines (y-coordinates)
  for (let y = 50; y < height; y += 10) {
    const isMajor = y % 50 === 0;
    page.drawLine({
      start: { x: 0, y: y },
      end: { x: width, y: y },
      thickness: isMajor ? 0.8 : 0.3,
      color: isMajor ? rgb(1, 0, 0) : rgb(0.8, 0.8, 0.8),
    });
    
    if (y % 20 === 0) {
      page.drawText(String(y), {
        x: 5,
        y: y + 2,
        size: 7,
        color: rgb(1, 0, 0),
      });
      page.drawText(String(y), {
        x: width - 25,
        y: y + 2,
        size: 7,
        color: rgb(1, 0, 0),
      });
    }
  }

  // Draw vertical lines (x-coordinates)
  for (let x = 50; x < width; x += 50) {
    page.drawLine({
      start: { x: x, y: 0 },
      end: { x: x, y: height },
      thickness: 0.5,
      color: rgb(0, 0, 1),
    });
    page.drawText(String(x), {
      x: x + 2,
      y: 10,
      size: 7,
      color: rgb(0, 0, 1),
    });
    page.drawText(String(x), {
      x: x + 2,
      y: height - 15,
      size: 7,
      color: rgb(0, 0, 1),
    });
  }

  fs.writeFileSync(outFile, await pdfDoc.save());
  console.log(`Saved grid PDF to ${outFile}`);
}

async function main() {
  await drawGrid('New_City_International_School_Receipt.pdf', 'grid_intl.pdf');
  await drawGrid('New_City_Saraswati_Vidyalaya_Receipt_Fixed.pdf', 'grid_saras.pdf');
}

main().catch(console.error);
