const fs = require('fs');
const path = require('path');

// Test if we can create a simple PDF without Puppeteer
const testPDFContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources 4 0 R /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 6 0 R >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 24 Tf
100 700 Td
(Test Factuur) Tj
ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000225 00000 n 
0000000262 00000 n 
0000000356 00000 n 
trailer
<< /Size 7 /Root 1 0 R >>
startxref
426
%%EOF`;

fs.writeFileSync('test_invoice.pdf', testPDFContent);
console.log('Simple PDF created successfully');