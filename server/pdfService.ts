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
  };
}

const COMPANY_INFO = {
  name: "DD Cars",
  address: "Voorbeeldstraat 123",
  city: "1234 AB Amsterdam",
  phone: "+31 (0)20 123 4567",
  email: "info@ddcars.nl",
  kvk: "12345678",
  btw: "NL123456789B01"
};

const invoiceTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 40px;
            border-bottom: 3px solid #d4af37;
            padding-bottom: 20px;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-name {
            font-size: 32px;
            font-weight: bold;
            color: #d4af37;
            margin-bottom: 10px;
        }
        
        .invoice-info {
            text-align: right;
            flex: 1;
        }
        
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 18px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .invoice-date {
            font-size: 16px;
            color: #666;
        }
        
        .customer-info {
            margin-bottom: 30px;
        }
        
        .customer-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        
        .vehicle-section {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #d4af37;
        }
        
        .vehicle-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
        }
        
        .vehicle-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .detail-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        
        .detail-label {
            font-weight: bold;
            color: #666;
        }
        
        .detail-value {
            color: #333;
            text-align: right;
        }
        
        .costs-section {
            margin-bottom: 30px;
        }
        
        .costs-table {
            width: 100%;
            border-collapse: collapse;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .costs-table th {
            background: #d4af37;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: bold;
        }
        
        .costs-table td {
            padding: 15px;
            border-bottom: 1px solid #eee;
        }
        
        .costs-table tr:last-child td {
            border-bottom: none;
        }
        
        .amount {
            text-align: right;
            font-weight: bold;
        }
        
        .total-section {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            border: 2px solid #d4af37;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 16px;
        }
        
        .total-final {
            font-size: 20px;
            font-weight: bold;
            color: #d4af37;
            border-top: 2px solid #d4af37;
            padding-top: 10px;
            margin-top: 10px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        
        .notes {
            background: #fff9e6;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #d4af37;
            margin-bottom: 20px;
        }
        
        .notes-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #333;
        }
        
        @media print {
            .container {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="company-info">
                <div class="company-name">{{companyInfo.name}}</div>
                <div>{{companyInfo.address}}</div>
                <div>{{companyInfo.city}}</div>
                <div>Tel: {{companyInfo.phone}}</div>
                <div>Email: {{companyInfo.email}}</div>
                <div>KvK: {{companyInfo.kvk}}</div>
                <div>BTW: {{companyInfo.btw}}</div>
            </div>
            <div class="invoice-info">
                <div class="invoice-title">
                    {{#if isPurchase}}INKOOPFACTUUR{{else}}VERKOOPFACTUUR{{/if}}
                </div>
                <div class="invoice-number">{{invoiceNumber}}</div>
                <div class="invoice-date">{{date}}</div>
            </div>
        </div>

        {{#if sale}}
        <div class="customer-info">
            <div class="customer-title">Klantgegevens</div>
            <div><strong>{{sale.customerName}}</strong></div>
            <div>{{sale.customerEmail}}</div>
            <div>{{sale.customerPhone}}</div>
        </div>
        {{/if}}

        {{#if purchase}}
        <div class="customer-info">
            <div class="customer-title">Leverancier</div>
            <div><strong>{{purchase.supplier}}</strong></div>
        </div>
        {{/if}}

        <div class="vehicle-section">
            <div class="vehicle-title">Voertuiggegevens</div>
            <div class="vehicle-details">
                <div class="detail-item">
                    <span class="detail-label">Merk & Model:</span>
                    <span class="detail-value">{{vehicle.brand}} {{vehicle.model}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Bouwjaar:</span>
                    <span class="detail-value">{{vehicle.year}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Kilometerstand:</span>
                    <span class="detail-value">{{vehicle.mileage}} km</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Brandstof:</span>
                    <span class="detail-value">{{vehicle.fuel}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Transmissie:</span>
                    <span class="detail-value">{{vehicle.transmission}}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Kleur:</span>
                    <span class="detail-value">{{vehicle.color}}</span>
                </div>
            </div>
        </div>

        <div class="costs-section">
            <table class="costs-table">
                <thead>
                    <tr>
                        <th>Omschrijving</th>
                        <th style="text-align: right;">Bedrag (excl. BTW)</th>
                    </tr>
                </thead>
                <tbody>
                    {{#if purchase}}
                    <tr>
                        <td>Inkoopprijs voertuig</td>
                        <td class="amount">€ {{formatCurrency purchase.purchasePrice}}</td>
                    </tr>
                    {{#if purchase.transportCost}}
                    <tr>
                        <td>Transportkosten</td>
                        <td class="amount">€ {{formatCurrency purchase.transportCost}}</td>
                    </tr>
                    {{/if}}
                    {{#if purchase.maintenanceCost}}
                    <tr>
                        <td>Onderhoudskosten</td>
                        <td class="amount">€ {{formatCurrency purchase.maintenanceCost}}</td>
                    </tr>
                    {{/if}}
                    {{#if purchase.cleaningCost}}
                    <tr>
                        <td>Reinigingskosten</td>
                        <td class="amount">€ {{formatCurrency purchase.cleaningCost}}</td>
                    </tr>
                    {{/if}}
                    {{#if purchase.otherCosts}}
                    <tr>
                        <td>Overige kosten</td>
                        <td class="amount">€ {{formatCurrency purchase.otherCosts}}</td>
                    </tr>
                    {{/if}}
                    {{/if}}

                    {{#if sale}}
                    <tr>
                        <td>Verkoopprijs voertuig</td>
                        <td class="amount">€ {{formatCurrency sale.salePrice}}</td>
                    </tr>
                    {{#if sale.discount}}
                    <tr>
                        <td>Korting</td>
                        <td class="amount">- € {{formatCurrency sale.discount}}</td>
                    </tr>
                    {{/if}}
                    {{/if}}
                </tbody>
            </table>
        </div>

        <div class="total-section">
            {{#if purchase}}
            <div class="total-row">
                <span>Subtotaal (excl. BTW):</span>
                <span>€ {{formatCurrency totalExclVat}}</span>
            </div>
            <div class="total-row">
                <span>BTW (21%):</span>
                <span>€ {{formatCurrency vatAmount}}</span>
            </div>
            <div class="total-row total-final">
                <span>Totaal (incl. BTW):</span>
                <span>€ {{formatCurrency totalInclVat}}</span>
            </div>
            {{/if}}

            {{#if sale}}
            <div class="total-row">
                <span>Subtotaal (excl. BTW):</span>
                <span>€ {{formatCurrency totalExclVat}}</span>
            </div>
            <div class="total-row">
                <span>BTW ({{sale.vatRate}}%):</span>
                <span>€ {{formatCurrency vatAmount}}</span>
            </div>
            <div class="total-row total-final">
                <span>Totaal (incl. BTW):</span>
                <span>€ {{formatCurrency totalInclVat}}</span>
            </div>
            {{/if}}
        </div>

        {{#if hasNotes}}
        <div class="notes">
            <div class="notes-title">Opmerkingen:</div>
            <div>{{notes}}</div>
        </div>
        {{/if}}

        <div class="footer">
            <div>Deze factuur is gegenereerd door {{companyInfo.name}}</div>
            <div>{{companyInfo.email}} | {{companyInfo.phone}}</div>
        </div>
    </div>
</body>
</html>
`;

// Register Handlebars helpers
handlebars.registerHelper('formatCurrency', function(amount: number) {
  return amount.toLocaleString('nl-NL');
});

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const template = handlebars.compile(invoiceTemplate);
  
  // Calculate totals
  let totalExclVat = 0;
  let vatRate = 21; // Default VAT rate
  
  if (data.purchase) {
    totalExclVat = data.purchase.purchasePrice + 
                   (data.purchase.transportCost || 0) + 
                   (data.purchase.maintenanceCost || 0) + 
                   (data.purchase.cleaningCost || 0) + 
                   (data.purchase.otherCosts || 0);
  }
  
  if (data.sale) {
    totalExclVat = data.sale.salePrice - (data.sale.discount || 0);
    vatRate = data.sale.vatRate;
  }
  
  const vatAmount = Math.round((totalExclVat * vatRate / 100) * 100) / 100;
  const totalInclVat = totalExclVat + vatAmount;
  
  const templateData = {
    ...data,
    companyInfo: COMPANY_INFO,
    isPurchase: data.type === 'purchase',
    isSale: data.type === 'sale',
    totalExclVat,
    vatAmount,
    totalInclVat,
    hasNotes: (data.purchase?.notes || data.sale?.notes) ? true : false,
    notes: data.purchase?.notes || data.sale?.notes
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
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
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
  const invoiceNumber = purchase ? purchase.invoiceNumber : sale?.invoiceNumber || '';
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