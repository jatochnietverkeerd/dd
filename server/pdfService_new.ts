import PDFDocument from 'pdfkit';
import type { Vehicle, Purchase, Sale } from '@shared/schema';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  vehicle: Vehicle;
  purchase?: Purchase;
  sale?: Sale;
  type: 'purchase' | 'sale';
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

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 0, size: 'A4' });
    const buffers: Buffer[] = [];
    
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    
    // Premium header with dark background
    doc.rect(0, 0, 595, 80).fill('#1a1a1a');
    
    // Company logo/name in header
    doc.fillColor('#D4AF37').fontSize(28).font('Helvetica-Bold')
       .text('DD CARS', 50, 25);
    
    // Invoice type in header
    doc.fillColor('white').fontSize(18).font('Helvetica-Bold')
       .text(data.type === 'purchase' ? 'INKOOP FACTUUR' : 'VERKOOP FACTUUR', 350, 25);
    
    // Invoice details in header
    doc.fillColor('white').fontSize(11).font('Helvetica')
       .text(`Factuurnummer: ${data.invoiceNumber}`, 350, 48)
       .text(`Datum: ${data.date}`, 350, 62);
    
    // Reset to black for body content
    doc.fillColor('black');
    
    // Company information block
    doc.fontSize(14).font('Helvetica-Bold')
       .text('BEDRIJFSINFORMATIE', 50, 110);
    
    doc.fontSize(10).font('Helvetica')
       .text(COMPANY_INFO.name, 50, 135)
       .text(COMPANY_INFO.address, 50, 150)
       .text(COMPANY_INFO.city, 50, 165)
       .text(`Tel: ${COMPANY_INFO.phone}`, 50, 180)
       .text(`Email: ${COMPANY_INFO.email}`, 50, 195)
       .text(`KvK: ${COMPANY_INFO.kvk}`, 50, 210)
       .text(`BTW-nr: ${COMPANY_INFO.btw}`, 50, 225);
    
    // Bank information
    doc.text(`IBAN: ${COMPANY_INFO.iban}`, 320, 135)
       .text(`Website: ${COMPANY_INFO.website}`, 320, 150);
    
    // Client information
    const clientLabel = data.type === 'purchase' ? 'LEVERANCIER' : 'KLANT';
    const clientName = data.purchase?.supplier || data.sale?.customerName || 'Onbekend';
    const clientEmail = data.sale?.customerEmail || '';
    
    doc.fontSize(14).font('Helvetica-Bold')
       .text(clientLabel, 50, 260);
    
    doc.fontSize(10).font('Helvetica')
       .text(clientName, 50, 285);
    
    if (clientEmail) {
      doc.text(clientEmail, 50, 300);
    }
    
    // Vehicle details in structured table format
    doc.fontSize(14).font('Helvetica-Bold')
       .text('VOERTUIGGEGEVENS', 50, 340);
    
    // Create table-like structure for vehicle details
    const vehicleY = 365;
    const leftCol = 50;
    const rightCol = 300;
    
    doc.fontSize(10).font('Helvetica-Bold')
       .text('Merk & Model:', leftCol, vehicleY)
       .text('Bouwjaar:', leftCol, vehicleY + 20)
       .text('Kilometerstand:', leftCol, vehicleY + 40)
       .text('Brandstof:', leftCol, vehicleY + 60)
       .text('Transmissie:', leftCol, vehicleY + 80)
       .text('Kleur:', leftCol, vehicleY + 100);
    
    doc.fontSize(10).font('Helvetica')
       .text(`${data.vehicle.brand} ${data.vehicle.model}`, rightCol, vehicleY)
       .text(`${data.vehicle.year}`, rightCol, vehicleY + 20)
       .text(`${data.vehicle.mileage.toLocaleString('nl-NL')} km`, rightCol, vehicleY + 40)
       .text(`${data.vehicle.fuel}`, rightCol, vehicleY + 60)
       .text(`${data.vehicle.transmission}`, rightCol, vehicleY + 80)
       .text(`${data.vehicle.color}`, rightCol, vehicleY + 100);
    
    // Add BPM information if available
    if (data.purchase?.bpmAmount && data.purchase.bpmAmount > 0) {
      doc.fontSize(10).font('Helvetica-Bold')
         .text('BPM:', leftCol, vehicleY + 120);
      doc.fontSize(10).font('Helvetica')
         .text(`€${data.purchase.bpmAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, rightCol, vehicleY + 120);
    }
    
    // Financial details with proper VAT breakdown
    doc.fontSize(14).font('Helvetica-Bold')
       .text('FINANCIËLE GEGEVENS', 50, 510);
    
    let yPos = 535;
    const amount = data.purchase?.purchasePrice || data.sale?.salePrice || 0;
    const vatType = data.purchase?.vatType || data.sale?.vatType || 'geen_btw';
    
    // Calculate VAT amounts
    let vatAmount = 0;
    let amountExclVat = amount;
    let amountInclVat = amount;
    
    if (vatType === '21%') {
      // If amount includes VAT, calculate backwards
      amountExclVat = amount / 1.21;
      vatAmount = amount - amountExclVat;
      amountInclVat = amount;
    }
    
    // Main amount line
    doc.fontSize(11).font('Helvetica')
       .text(`${data.type === 'purchase' ? 'Inkoopprijs' : 'Verkoopprijs'} excl. BTW:`, leftCol, yPos)
       .text(`€${amountExclVat.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, 400, yPos);
    
    yPos += 20;
    
    // VAT line
    if (vatType === '21%') {
      doc.text(`BTW (21%):`, leftCol, yPos)
         .text(`€${vatAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, 400, yPos);
      yPos += 20;
    } else if (vatType === 'marge') {
      doc.fontSize(9).font('Helvetica-Oblique')
         .text('Deze verkoop valt onder de margeregeling. BTW niet aftrekbaar.', leftCol, yPos);
      yPos += 25;
    }
    
    // Additional costs for purchases
    if (data.purchase) {
      if (data.purchase.bpmAmount > 0) {
        doc.fontSize(11).font('Helvetica')
           .text('BPM:', leftCol, yPos)
           .text(`€${data.purchase.bpmAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, 400, yPos);
        yPos += 20;
      }
      if (data.purchase.transportCost > 0) {
        doc.text('Transportkosten:', leftCol, yPos)
           .text(`€${data.purchase.transportCost.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, 400, yPos);
        yPos += 20;
      }
      if (data.purchase.maintenanceCost > 0) {
        doc.text('Onderhoudskosten:', leftCol, yPos)
           .text(`€${data.purchase.maintenanceCost.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, 400, yPos);
        yPos += 20;
      }
      if (data.purchase.cleaningCost > 0) {
        doc.text('Schoonmaakkosten:', leftCol, yPos)
           .text(`€${data.purchase.cleaningCost.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, 400, yPos);
        yPos += 20;
      }
      if (data.purchase.guaranteeCost > 0) {
        doc.text('Garantiekosten:', leftCol, yPos)
           .text(`€${data.purchase.guaranteeCost.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, 400, yPos);
        yPos += 20;
      }
      if (data.purchase.otherCosts > 0) {
        doc.text('Overige kosten:', leftCol, yPos)
           .text(`€${data.purchase.otherCosts.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, 400, yPos);
        yPos += 20;
      }
    }
    
    // Total line with emphasis
    yPos += 15;
    doc.rect(leftCol, yPos - 5, 495, 25).fill('#f5f5f5');
    doc.fillColor('black').fontSize(14).font('Helvetica-Bold')
       .text('TOTAAL:', leftCol + 10, yPos + 5)
       .text(`€${amountInclVat.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, 400, yPos + 5);
    
    // Payment information for sales
    if (data.type === 'sale') {
      yPos += 50;
      doc.fontSize(12).font('Helvetica-Bold')
         .text('BETAALGEGEVENS', leftCol, yPos);
      
      doc.fontSize(10).font('Helvetica')
         .text(`Betaaltermijn: 7 dagen`, leftCol, yPos + 20)
         .text(`IBAN: ${COMPANY_INFO.iban}`, leftCol, yPos + 35)
         .text(`Ten name van: ${COMPANY_INFO.name}`, leftCol, yPos + 50);
    }
    
    // Footer with premium styling
    doc.rect(0, 750, 595, 80).fill('#1a1a1a');
    doc.fillColor('#D4AF37').fontSize(10).font('Helvetica')
       .text('Bedankt voor uw vertrouwen in DD Cars', 50, 770)
       .text('Premium Performance • GTI & AMG Specialists', 50, 785);
    
    doc.fillColor('white').fontSize(9)
       .text(`${COMPANY_INFO.website} | ${COMPANY_INFO.email} | ${COMPANY_INFO.phone}`, 50, 800);
    
    // Footer disclaimers
    doc.fontSize(8).font('Helvetica')
       .text('Alle prijzen zijn inclusief afleverkosten tenzij anders vermeld', 320, 770)
       .text('Algemene voorwaarden van toepassing', 320, 785);
    
    doc.end();
  });
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
    type
  };
}