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
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    const buffers: Buffer[] = [];
    
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    
    // Modern card-style layout with rounded corners effect
    const cardMargin = 20;
    const cardWidth = 555;
    const cardHeight = 750;
    
    // Background card with subtle border
    doc.rect(cardMargin, cardMargin, cardWidth, cardHeight)
       .lineWidth(1)
       .stroke('#e5e7eb');
    
    // Premium header section with subtle background
    doc.rect(cardMargin + 10, cardMargin + 10, cardWidth - 20, 70)
       .fill('#f8fafc');
    
    // Subtle accent line
    doc.rect(cardMargin + 10, cardMargin + 10, cardWidth - 20, 3)
       .fill('#D4AF37');
    
    // Enhanced company logo design with car icon
    // Create a circular logo background
    doc.circle(cardMargin + 45, cardMargin + 45, 20)
       .fill('#D4AF37');
    
    // Add simple car icon representation in the circle
    // Draw a simple car shape
    doc.fillColor('#1a1a1a')
       // Car body (rectangle)
       .rect(cardMargin + 35, cardMargin + 40, 20, 8)
       .fill()
       // Car roof (smaller rectangle)
       .rect(cardMargin + 38, cardMargin + 36, 14, 6)
       .fill()
       // Car wheels (circles)
       .circle(cardMargin + 38, cardMargin + 50, 2)
       .fill()
       .circle(cardMargin + 52, cardMargin + 50, 2)
       .fill();
    
    // Company name with enhanced styling
    doc.fillColor('#1a1a1a').fontSize(24).font('Helvetica-Bold')
       .text('DD CARS', cardMargin + 75, cardMargin + 30);
    
    // Add tagline under company name
    doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
       .text('Premium Performance • GTI & AMG Specialists', cardMargin + 75, cardMargin + 55);
    
    // Invoice type in header
    doc.fillColor('#374151').fontSize(16).font('Helvetica-Bold')
       .text(data.type === 'purchase' ? 'INKOOP FACTUUR' : 'VERKOOP FACTUUR', cardMargin + 350, cardMargin + 25);
    
    // Invoice details in header
    doc.fillColor('#6b7280').fontSize(10).font('Helvetica')
       .text(`Factuurnummer: ${data.invoiceNumber}`, cardMargin + 350, cardMargin + 45)
       .text(`Datum: ${data.date}`, cardMargin + 350, cardMargin + 60);
    
    // Reset to black for body content
    doc.fillColor('#1a1a1a');
    
    // Company information block with modern spacing
    doc.fontSize(12).font('Helvetica-Bold')
       .text('BEDRIJFSINFORMATIE', cardMargin + 25, cardMargin + 110);
    
    doc.fontSize(9).font('Helvetica')
       .text(COMPANY_INFO.name, cardMargin + 25, cardMargin + 130)
       .text(COMPANY_INFO.address, cardMargin + 25, cardMargin + 145)
       .text(COMPANY_INFO.city, cardMargin + 25, cardMargin + 160)
       .text(`Tel: ${COMPANY_INFO.phone}`, cardMargin + 25, cardMargin + 175)
       .text(`Email: ${COMPANY_INFO.email}`, cardMargin + 25, cardMargin + 190)
       .text(`KvK: ${COMPANY_INFO.kvk}`, cardMargin + 25, cardMargin + 205)
       .text(`BTW-nr: ${COMPANY_INFO.btw}`, cardMargin + 25, cardMargin + 220);
    
    // Bank information
    doc.text(`IBAN: ${COMPANY_INFO.iban}`, cardMargin + 320, cardMargin + 130)
       .text(`Website: ${COMPANY_INFO.website}`, cardMargin + 320, cardMargin + 145);
    
    // Client information with modern styling
    const clientLabel = data.type === 'purchase' ? 'LEVERANCIER' : 'KLANT';
    const clientName = data.purchase?.supplier || data.sale?.customerName || 'Onbekend';
    const clientEmail = data.sale?.customerEmail || '';
    
    doc.fontSize(12).font('Helvetica-Bold')
       .text(clientLabel, cardMargin + 25, cardMargin + 250);
    
    doc.fontSize(9).font('Helvetica')
       .text(clientName, cardMargin + 25, cardMargin + 270);
    
    if (clientEmail) {
      doc.text(clientEmail, cardMargin + 25, cardMargin + 285);
    }
    
    // Vehicle details in structured table format
    doc.fontSize(12).font('Helvetica-Bold')
       .text('VOERTUIGGEGEVENS', cardMargin + 25, cardMargin + 320);
    
    // Create table-like structure for vehicle details
    const vehicleY = cardMargin + 345;
    const leftCol = cardMargin + 25;
    const rightCol = cardMargin + 280;
    
    doc.fontSize(9).font('Helvetica-Bold')
       .text('Merk & Model:', leftCol, vehicleY)
       .text('Bouwjaar:', leftCol, vehicleY + 18)
       .text('Kilometerstand:', leftCol, vehicleY + 36)
       .text('Brandstof:', leftCol, vehicleY + 54)
       .text('Transmissie:', leftCol, vehicleY + 72)
       .text('Kleur:', leftCol, vehicleY + 90);
    
    doc.fontSize(9).font('Helvetica')
       .text(`${data.vehicle.brand} ${data.vehicle.model}`, rightCol, vehicleY)
       .text(`${data.vehicle.year}`, rightCol, vehicleY + 18)
       .text(`${data.vehicle.mileage.toLocaleString('nl-NL')} km`, rightCol, vehicleY + 36)
       .text(`${data.vehicle.fuel}`, rightCol, vehicleY + 54)
       .text(`${data.vehicle.transmission}`, rightCol, vehicleY + 72)
       .text(`${data.vehicle.color}`, rightCol, vehicleY + 90);
    
    // Add BPM information if available from purchase or sale
    const bpmAmount = data.purchase?.bpmAmount || data.sale?.bmpAmount || 0;
    if (bpmAmount > 0) {
      doc.fontSize(9).font('Helvetica-Bold')
         .text('BPM:', leftCol, vehicleY + 108);
      doc.fontSize(9).font('Helvetica')
         .text(`€${bpmAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, rightCol, vehicleY + 108);
    }
    
    // Financial details with proper VAT breakdown
    doc.fontSize(12).font('Helvetica-Bold')
       .text('FINANCIËLE GEGEVENS', cardMargin + 25, cardMargin + 480);
    
    let yPos = cardMargin + 505;
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
    doc.fontSize(10).font('Helvetica')
       .text(`${data.type === 'purchase' ? 'Inkoopprijs' : 'Verkoopprijs'} excl. BTW:`, leftCol, yPos)
       .text(`€${amountExclVat.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, cardMargin + 420, yPos);
    
    yPos += 20;
    
    // VAT line
    if (vatType === '21%') {
      doc.text(`BTW (21%):`, leftCol, yPos)
         .text(`€${vatAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, cardMargin + 420, yPos);
      yPos += 18;
    } else if (vatType === 'marge') {
      doc.fontSize(8).font('Helvetica-Oblique')
         .text('Deze verkoop valt onder de margeregeling. BTW niet aftrekbaar.', leftCol, yPos);
      yPos += 22;
    }
    
    // Additional costs for purchases
    if (data.purchase) {
      if (data.purchase.bpmAmount > 0) {
        doc.fontSize(10).font('Helvetica')
           .text('BPM:', leftCol, yPos)
           .text(`€${data.purchase.bpmAmount.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, cardMargin + 420, yPos);
        yPos += 18;
      }
      if (data.purchase.transportCost > 0) {
        doc.text('Transportkosten:', leftCol, yPos)
           .text(`€${data.purchase.transportCost.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, cardMargin + 420, yPos);
        yPos += 18;
      }
      if (data.purchase.maintenanceCost > 0) {
        doc.text('Onderhoudskosten:', leftCol, yPos)
           .text(`€${data.purchase.maintenanceCost.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, cardMargin + 420, yPos);
        yPos += 18;
      }
      if (data.purchase.cleaningCost > 0) {
        doc.text('Schoonmaakkosten:', leftCol, yPos)
           .text(`€${data.purchase.cleaningCost.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, cardMargin + 420, yPos);
        yPos += 18;
      }
      if (data.purchase.guaranteeCost > 0) {
        doc.text('Garantiekosten:', leftCol, yPos)
           .text(`€${data.purchase.guaranteeCost.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, cardMargin + 420, yPos);
        yPos += 18;
      }
      if (data.purchase.otherCosts > 0) {
        doc.text('Overige kosten:', leftCol, yPos)
           .text(`€${data.purchase.otherCosts.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, cardMargin + 420, yPos);
        yPos += 18;
      }
    }
    
    // Total line with emphasis
    yPos += 15;
    doc.rect(leftCol, yPos - 5, cardWidth - 60, 25).fill('#f8fafc');
    doc.fillColor('#1a1a1a').fontSize(12).font('Helvetica-Bold')
       .text('TOTAAL:', leftCol + 10, yPos + 5)
       .text(`€${amountInclVat.toLocaleString('nl-NL', { minimumFractionDigits: 2 })}`, cardMargin + 420, yPos + 5);
    
    // Payment information for sales
    if (data.type === 'sale') {
      yPos += 40;
      doc.fontSize(10).font('Helvetica-Bold')
         .text('BETAALGEGEVENS', leftCol, yPos);
      
      doc.fontSize(9).font('Helvetica')
         .text(`Betaaltermijn: 7 dagen`, leftCol, yPos + 18)
         .text(`IBAN: ${COMPANY_INFO.iban}`, leftCol, yPos + 33)
         .text(`Ten name van: ${COMPANY_INFO.name}`, leftCol, yPos + 48);
    }
    
    // Modern footer with subtle styling
    const footerY = cardMargin + cardHeight - 60;
    doc.rect(cardMargin + 10, footerY, cardWidth - 20, 45)
       .fill('#f8fafc');
    
    doc.fillColor('#D4AF37').fontSize(9).font('Helvetica-Bold')
       .text('Bedankt voor uw vertrouwen in DD Cars', cardMargin + 25, footerY + 12)
       .text('Premium Performance • GTI & AMG Specialists', cardMargin + 25, footerY + 25);
    
    doc.fillColor('#6b7280').fontSize(8).font('Helvetica')
       .text(`${COMPANY_INFO.website} | ${COMPANY_INFO.email} | ${COMPANY_INFO.phone}`, cardMargin + 25, footerY + 38);
    
    // Footer disclaimers
    doc.fontSize(7).font('Helvetica')
       .text('Alle prijzen zijn inclusief afleverkosten tenzij anders vermeld', cardMargin + 320, footerY + 12)
       .text('Algemene voorwaarden van toepassing', cardMargin + 320, footerY + 25);
    
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