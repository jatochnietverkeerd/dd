import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { Vehicle, Purchase, Sale } from '@shared/schema';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  vehicle: Vehicle;
  purchase?: Purchase;
  sale?: Sale;
  type: 'purchase' | 'sale';
  companyInfo: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email: string;
    kvk: string;
    btw: string;
    website: string;
    iban: string;
  };
}

const COMPANY_INFO = {
  name: "DD Cars",
  address: "Voorbeeldstraat 123",
  city: "1234 AB Amsterdam",
  phone: "+31 (0)20 123 4567",
  email: "info@ddcars.nl",
  kvk: "12345678",
  btw: "NL123456789B01",
  website: "www.ddcars.nl",
  iban: "NL91 ABNA 0417 1643 00"
};

// Register Handlebars helpers
handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

handlebars.registerHelper('formatCurrency', function(amount: number) {
  return amount.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

// Use external template file
const invoiceTemplate = readFileSync(join(process.cwd(), 'server/invoiceTemplate.html'), 'utf8');

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const template = handlebars.compile(invoiceTemplate);
  
  const templateData = {
    ...data,
    companyInfo: COMPANY_INFO
  };
  
  const html = template(templateData);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      margin: {
        top: '10mm',
        right: '10mm',
        bottom: '10mm',
        left: '10mm'
      },
      printBackground: true
    });
    
    return pdf;
  } finally {
    await browser.close();
  }
}

export function createInvoiceData(
  vehicle: Vehicle, 
  purchase?: Purchase, 
  sale?: Sale
): InvoiceData {
  const type = purchase ? 'purchase' : 'sale';
  const invoiceNumber = purchase ? 
    `INK-${purchase.id?.toString().padStart(4, '0')}` : 
    `VRK-${sale?.id?.toString().padStart(4, '0')}`;
    
  const date = purchase ? 
    new Date(purchase.purchaseDate).toLocaleDateString('nl-NL') : 
    new Date(sale?.saleDate || new Date()).toLocaleDateString('nl-NL');
  
  return {
    invoiceNumber,
    date,
    vehicle,
    purchase,
    sale,
    type,
    companyInfo: COMPANY_INFO
  };
}