const fs = require('fs');
const path = require('path');

// We don't have standard image libraries, but we can parse PNG header for dimensions:
// PNG width is at bytes 16-19, height at 20-23 (big-endian)
function getPngDims(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`${filePath} does not exist`);
    return null;
  }
  const buf = fs.readFileSync(filePath);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  console.log(`File: ${path.basename(filePath)} | Width: ${width} | Height: ${height}`);
  return { width, height };
}

const ASSETS = path.join(process.env.USERPROFILE || '', '.cursor', 'projects', 'c-Users-ram-Desktop-school-fee-manager', 'assets');
getPngDims(path.join(ASSETS, 'c__Users_ram_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_New_City_International_School_Receipt_page-0001-d1c35670-f373-4b9b-8d45-7df17c228f76.png'));
getPngDims(path.join(ASSETS, 'c__Users_ram_AppData_Roaming_Cursor_User_workspaceStorage_empty-window_images_New_City_Saraswati_Vidyalaya_Receipt_Fixed_page-0001-b96a56e6-e77e-41ef-9e48-68010d13a116.png'));
