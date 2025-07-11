import nodemailer from 'nodemailer';
import { generateInvoicePDF, createInvoiceData } from './pdfService';
import type { Vehicle, Purchase, Sale } from '@shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Default configuration for development (can be overridden with environment variables)
const getEmailConfig = (): EmailConfig => ({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || 'info@ddcars.nl',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

export async function sendInvoiceEmail(
  to: string,
  vehicle: Vehicle,
  purchase?: Purchase,
  sale?: Sale
): Promise<boolean> {
  try {
    const config = getEmailConfig();
    const transporter = nodemailer.createTransport(config);
    
    // Generate PDF
    const invoiceData = createInvoiceData(vehicle, purchase, sale);
    const pdfBuffer = await generateInvoicePDF(invoiceData);
    
    const isPurchase = !!purchase;
    const invoiceType = isPurchase ? 'Inkoopfactuur' : 'Verkoopfactuur';
    const invoiceNumber = purchase?.invoiceNumber || sale?.invoiceNumber || 'ONBEKEND';
    
    const subject = `${invoiceType} ${invoiceNumber} - ${vehicle.brand} ${vehicle.model}`;
    const filename = `${invoiceType.toLowerCase()}_${invoiceNumber}_${vehicle.brand}_${vehicle.model}.pdf`;
    
    let htmlContent = '';
    let textContent = '';
    
    if (isPurchase) {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: #d9c89e; margin: 0; font-size: 28px;">DD Cars</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Premium Auto Dealership</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Inkoopfactuur ${invoiceNumber}</h2>
            
            <p>Beste ${purchase?.supplier},</p>
            
            <p>Hierbij ontvangt u de inkoopfactuur voor de volgende auto:</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d9c89e;">
              <h3 style="margin: 0 0 15px 0; color: #333;">${vehicle.brand} ${vehicle.model}</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                <div><strong>Bouwjaar:</strong> ${vehicle.year}</div>
                <div><strong>Kilometerstand:</strong> ${vehicle.mileage} km</div>
                <div><strong>Brandstof:</strong> ${vehicle.fuel}</div>
                <div><strong>Transmissie:</strong> ${vehicle.transmission}</div>
                <div><strong>Kleur:</strong> ${vehicle.color}</div>
                <div><strong>Inkoopprijs:</strong> €${purchase?.purchasePrice.toLocaleString()}</div>
              </div>
            </div>
            
            <p>De volledige factuur vindt u als bijlage bij deze email.</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
              <p><strong>DD Cars</strong><br>
              Voorbeeldstraat 123<br>
              1234 AB Amsterdam<br>
              Tel: +31 (0)20 123 4567<br>
              Email: info@ddcars.nl</p>
            </div>
          </div>
        </div>
      `;
      
      textContent = `
Inkoopfactuur ${invoiceNumber}

Beste ${purchase?.supplier},

Hierbij ontvangt u de inkoopfactuur voor de volgende auto:

${vehicle.brand} ${vehicle.model}
- Bouwjaar: ${vehicle.year}
- Kilometerstand: ${vehicle.mileage} km
- Brandstof: ${vehicle.fuel}
- Transmissie: ${vehicle.transmission}
- Kleur: ${vehicle.color}
- Inkoopprijs: €${purchase?.purchasePrice.toLocaleString()}

De volledige factuur vindt u als bijlage bij deze email.

Met vriendelijke groet,
DD Cars
      `;
    } else if (sale) {
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: #d9c89e; margin: 0; font-size: 28px;">DD Cars</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Premium Auto Dealership</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Verkoopfactuur ${invoiceNumber}</h2>
            
            <p>Beste ${sale.customerName},</p>
            
            <p>Hartelijk dank voor uw aankoop! Hierbij ontvangt u de factuur voor uw nieuwe auto:</p>
            
            <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d9c89e;">
              <h3 style="margin: 0 0 15px 0; color: #333;">${vehicle.brand} ${vehicle.model}</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
                <div><strong>Bouwjaar:</strong> ${vehicle.year}</div>
                <div><strong>Kilometerstand:</strong> ${vehicle.mileage} km</div>
                <div><strong>Brandstof:</strong> ${vehicle.fuel}</div>
                <div><strong>Transmissie:</strong> ${vehicle.transmission}</div>
                <div><strong>Kleur:</strong> ${vehicle.color}</div>
                <div><strong>Verkoopprijs:</strong> €${sale.salePrice.toLocaleString()}</div>
              </div>
            </div>
            
            <p>We wensen u veel rijplezier met uw nieuwe auto!</p>
            
            <div style="background: #fff9e6; padding: 15px; border-radius: 8px; border-left: 4px solid #d9c89e; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px;"><strong>Service na verkoop:</strong><br>
              Voor vragen over onderhoud, garantie of andere zaken kunt u altijd contact met ons opnemen.</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666;">
              <p><strong>DD Cars</strong><br>
              Voorbeeldstraat 123<br>
              1234 AB Amsterdam<br>
              Tel: +31 (0)20 123 4567<br>
              Email: info@ddcars.nl</p>
            </div>
          </div>
        </div>
      `;
      
      textContent = `
Verkoopfactuur ${invoiceNumber}

Beste ${sale.customerName},

Hartelijk dank voor uw aankoop! Hierbij ontvangt u de factuur voor uw nieuwe auto:

${vehicle.brand} ${vehicle.model}
- Bouwjaar: ${vehicle.year}
- Kilometerstand: ${vehicle.mileage} km
- Brandstof: ${vehicle.fuel}
- Transmissie: ${vehicle.transmission}
- Kleur: ${vehicle.color}
- Verkoopprijs: €${sale.salePrice.toLocaleString()}

We wensen u veel rijplezier met uw nieuwe auto!

Service na verkoop:
Voor vragen over onderhoud, garantie of andere zaken kunt u altijd contact met ons opnemen.

Met vriendelijke groet,
DD Cars
      `;
    }
    
    const mailOptions = {
      from: config.auth.user,
      to: to,
      subject: subject,
      text: textContent,
      html: htmlContent,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };
    
    // In development, we'll simulate sending
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Simulating email send to: ${to}`);
      console.log(`📄 Subject: ${subject}`);
      console.log(`📎 Attachment: ${filename} (${pdfBuffer.length} bytes)`);
      return true;
    }
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Invoice email sent successfully to: ${to}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error sending invoice email:', error);
    return false;
  }
}

export async function sendTestEmail(to: string): Promise<boolean> {
  try {
    const config = getEmailConfig();
    const transporter = nodemailer.createTransport(config);
    
    const mailOptions = {
      from: config.auth.user,
      to: to,
      subject: 'Test Email from DD Cars',
      text: 'This is a test email to verify email configuration.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d9c89e;">Test Email - DD Cars</h2>
          <p>This is a test email to verify that the email configuration is working correctly.</p>
          <p>If you receive this email, the email service is functioning properly.</p>
        </div>
      `
    };
    
    // In development, we'll simulate sending
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 Simulating test email send to: ${to}`);
      return true;
    }
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Test email sent successfully to: ${to}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return false;
  }
}