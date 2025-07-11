import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Mail, Printer, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Vehicle, Purchase, Sale } from '@shared/schema';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  purchase?: Purchase;
  sale?: Sale;
  token: string;
}

export default function InvoiceModal({ isOpen, onClose, vehicle, purchase, sale, token }: InvoiceModalProps) {
  const [emailAddress, setEmailAddress] = useState(sale?.customerEmail || '');
  const [isEmailSending, setIsEmailSending] = useState(false);
  const { toast } = useToast();
  
  const invoiceType = purchase ? 'purchase' : 'sale';
  const invoiceNumber = purchase?.invoiceNumber || sale?.invoiceNumber || '';
  const customerName = sale?.customerName || purchase?.supplier || '';
  const amount = purchase?.purchasePrice || sale?.salePrice || 0;
  const date = purchase?.purchaseDate || sale?.saleDate || new Date().toISOString();

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceType}/${vehicle.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceType}_${invoiceNumber}_${vehicle.brand}_${vehicle.model}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF gedownload",
        description: "De factuur is succesvol gedownload."
      });
    } catch (error) {
      toast({
        title: "Download gefaald",
        description: "Er is een fout opgetreden bij het downloaden van de PDF.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = async () => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceType}/${vehicle.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast({
        title: "Print gestart",
        description: "De factuur wordt geopend voor printen."
      });
    } catch (error) {
      toast({
        title: "Print gefaald",
        description: "Er is een fout opgetreden bij het printen van de PDF.",
        variant: "destructive"
      });
    }
  };

  const handlePreview = async () => {
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceType}/${vehicle.id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      toast({
        title: "Factuur geopend",
        description: "De factuur is geopend in een nieuw tabblad."
      });
    } catch (error) {
      toast({
        title: "Preview gefaald",
        description: "Er is een fout opgetreden bij het openen van de factuur.",
        variant: "destructive"
      });
    }
  };

  const handleEmailSend = async () => {
    if (!emailAddress.trim()) {
      toast({
        title: "Email vereist",
        description: "Voer een geldig email adres in.",
        variant: "destructive"
      });
      return;
    }

    setIsEmailSending(true);
    try {
      const response = await fetch(`/api/admin/invoices/${invoiceType}/${vehicle.id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: emailAddress })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: "Email verzonden",
          description: `De factuur is succesvol verzonden naar ${emailAddress}.`
        });
      } else {
        throw new Error(data.error || 'Failed to send email');
      }
    } catch (error) {
      toast({
        title: "Email gefaald",
        description: "Er is een fout opgetreden bij het verzenden van de email.",
        variant: "destructive"
      });
    } finally {
      setIsEmailSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-gray-900 border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">
            {purchase ? 'Inkoop' : 'Verkoop'} Factuur
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Invoice Summary */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-white mb-2">Voertuig</h3>
                <p className="text-gray-300">{vehicle.brand} {vehicle.model}</p>
                <p className="text-sm text-gray-400">Bouwjaar: {vehicle.year}</p>
                <p className="text-sm text-gray-400">Kilometerstand: {vehicle.mileage.toLocaleString()} km</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Factuur Details</h3>
                <p className="text-gray-300">Factuurnummer: {invoiceNumber}</p>
                <p className="text-sm text-gray-400">Datum: {new Date(date).toLocaleDateString('nl-NL')}</p>
                <p className="text-sm text-gray-400">{purchase ? 'Leverancier' : 'Klant'}: {customerName}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Totaalbedrag:</span>
                <span className="text-xl font-bold text-white">€{amount.toLocaleString('nl-NL')}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button
              onClick={handlePreview}
              variant="outline"
              className="flex items-center gap-2 border-gray-700 text-white hover:bg-gray-800"
            >
              <Eye className="w-4 h-4" />
              Bekijk
            </Button>
            
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex items-center gap-2 border-gray-700 text-white hover:bg-gray-800"
            >
              <Download className="w-4 h-4" />
              Download
            </Button>
            
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex items-center gap-2 border-gray-700 text-white hover:bg-gray-800"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>

          {/* Email Section */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-white mb-3">Email Factuur</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="email" className="text-gray-300">Email adres</Label>
                <Input
                  id="email"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  placeholder="email@example.com"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleEmailSend}
                  disabled={isEmailSending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isEmailSending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Verzenden...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Verzend
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}