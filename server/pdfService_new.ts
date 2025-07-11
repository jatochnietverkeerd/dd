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
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    
    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);
    
    // Header
    doc.fontSize(20)
       .text('DD Cars', 50, 50)
       .fontSize(12)
       .text(COMPANY_INFO.address, 50, 80)
       .text(COMPANY_INFO.city, 50, 95)
       .text(`Tel: ${COMPANY_INFO.phone}`, 50, 110)
       .text(`Email: ${COMPANY_INFO.email}`, 50, 125)
       .text(`KvK: ${COMPANY_INFO.kvk}`, 50, 140)
       .text(`BTW: ${COMPANY_INFO.btw}`, 50, 155);
    
    // Invoice Title
    doc.fontSize(18)
       .text(data.type === 'purchase' ? 'INKOOP FACTUUR' : 'VERKOOP FACTUUR', 350, 50)
       .fontSize(12)
       .text(`Factuurnummer: ${data.invoiceNumber}`, 350, 80)
       .text(`Datum: ${data.date}`, 350, 95);
    
    // Customer/Supplier Info
    const clientLabel = data.type === 'purchase' ? 'Leverancier:' : 'Klant:';
    const clientName = data.purchase?.supplier || data.sale?.customerName || 'Onbekend';
    const clientEmail = data.sale?.customerEmail || '';
    
    doc.text(clientLabel, 50, 200)
       .text(clientName, 50, 215);
    
    if (clientEmail) {
      doc.text(clientEmail, 50, 230);
    }
    
    // Vehicle Details
    doc.fontSize(14)
       .text('VOERTUIG GEGEVENS', 50, 280)
       .fontSize(12)
       .text(`${data.vehicle.brand} ${data.vehicle.model}`, 50, 305)
       .text(`Bouwjaar: ${data.vehicle.year}`, 50, 320)
       .text(`Kilometerstand: ${data.vehicle.mileage.toLocaleString()} km`, 50, 335)
       .text(`Brandstof: ${data.vehicle.fuel}`, 50, 350)
       .text(`Transmissie: ${data.vehicle.transmission}`, 50, 365)
       .text(`Kleur: ${data.vehicle.color}`, 50, 380);
    
    // Financial Details
    doc.fontSize(14)
       .text('FINANCIËLE GEGEVENS', 50, 420);
    
    let yPos = 445;
    const amount = data.purchase?.purchasePrice || data.sale?.salePrice || 0;
    const vatType = data.purchase?.vatType || data.sale?.vatType || 'geen_btw';
    
    doc.fontSize(12)
       .text(`${data.type === 'purchase' ? 'Inkoopprijs' : 'Verkoopprijs'}: €${amount.toLocaleString('nl-NL')}`, 50, yPos);
    
    yPos += 20;
    doc.text(`BTW Type: ${vatType}`, 50, yPos);
    
    if (data.purchase) {
      yPos += 20;
      if (data.purchase.transportCost > 0) {
        doc.text(`Transportkosten: €${data.purchase.transportCost.toLocaleString('nl-NL')}`, 50, yPos);
        yPos += 15;
      }
      if (data.purchase.maintenanceCost > 0) {
        doc.text(`Onderhoudskosten: €${data.purchase.maintenanceCost.toLocaleString('nl-NL')}`, 50, yPos);
        yPos += 15;
      }
      if (data.purchase.cleaningCost > 0) {
        doc.text(`Schoonmaakkosten: €${data.purchase.cleaningCost.toLocaleString('nl-NL')}`, 50, yPos);
        yPos += 15;
      }
    }
    
    // Total
    yPos += 20;
    doc.fontSize(14)
       .text(`TOTAAL: €${amount.toLocaleString('nl-NL')}`, 50, yPos);
    
    // Footer
    doc.fontSize(10)
       .text('Bedankt voor uw vertrouwen in DD Cars', 50, 700)
       .text(`${COMPANY_INFO.website} | ${COMPANY_INFO.email}`, 50, 715);
    
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