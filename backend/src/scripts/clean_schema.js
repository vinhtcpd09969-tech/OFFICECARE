const fs = require('fs');
const path = require('path');

const inputPath = 'd:/VLTT/VLTT/office_care_schema.sql';
const outputPath = 'd:/VLTT/VLTT/office_care_dbdiagram.sql';

if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`);
  process.exit(1);
}

const content = fs.readFileSync(inputPath, 'utf8');
const lines = content.split('\n');

const cleanedLines = lines.filter(line => {
  const trimmed = line.trim();
  // Loại bỏ các lệnh psql bắt đầu bằng dấu \
  if (trimmed.startsWith('\\')) return false;
  // Loại bỏ các lệnh gán quyền OWNER TO (không cần thiết cho dbdiagram)
  if (trimmed.toUpperCase().includes('OWNER TO')) return false;
  return true;
});

fs.writeFileSync(outputPath, cleanedLines.join('\n'), 'utf8');
console.log(`Đã tối ưu hóa tệp tin schema cho dbdiagram.io tại: ${outputPath}`);
