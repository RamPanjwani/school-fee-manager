const fs = require('fs');

const b64Intl = fs.readFileSync('New_City_International_School_Receipt.pdf', {encoding: 'base64'});
const b64Saraswati = fs.readFileSync('New_City_Saraswati_Vidyalaya_Receipt_Fixed.pdf', {encoding: 'base64'});

const content = `const B64_INTL_PDF = "${b64Intl}";\nconst B64_SARASWATI_PDF = "${b64Saraswati}";\n`;
fs.writeFileSync('pdf_base64.js', content);
console.log('Successfully wrote pdf_base64.js');
