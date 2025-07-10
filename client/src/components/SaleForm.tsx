import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { insertSaleSchema } from "@shared/schema";
import { calculateSaleTotal, formatCurrency, type VatType } from "@shared/vatUtils";
import type { Vehicle, Sale, Purchase } from "@shared/schema";
import { z } from "zod";

const saleFormSchema = insertSaleSchema.extend({
  vehicleId: z.number(),
  salePrice: z.number().positive("Verkoopprijs moet positief zijn"),
  salePriceInclVat: z.number().positive("Verkoopprijs incl. BTW moet positief zijn"),
  discount: z.number().min(0, "Korting kan niet negatief zijn").default(0),
  finalPrice: z.number().positive("Eindprijs moet positief zijn"),
  saleDate: z.string().transform(val => new Date(val)),
  deliveryDate: z.string().optional().transform(val => val && val !== "" ? new Date(val) : null),
}).omit({ 
  vatAmount: true,
  profitExclVat: true,
  profitInclVat: true
});

type SaleFormData = z.infer<typeof saleFormSchema>;

interface SaleFormProps {
  vehicle: Vehicle;
  purchase?: Purchase;
  sale?: Sale;
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function SaleForm({ vehicle, purchase, sale, isOpen, onClose, token }: SaleFormProps) {
  const [calculatedSale, setCalculatedSale] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const vatType = purchase?.vatType as VatType || "21%";

  const form = useForm<SaleFormData>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      vehicleId: vehicle.id,
      purchaseId: purchase?.id || undefined,
      salePrice: sale?.salePrice ? Number(sale.salePrice) : undefined,
      vatType: vatType,
      salePriceInclVat: sale?.salePriceInclVat ? Number(sale.salePriceInclVat) : undefined,
      customerName: sale?.customerName || "",
      customerEmail: sale?.customerEmail || "",
      customerPhone: sale?.customerPhone || "",
      customerAddress: sale?.customerAddress || "",
      discount: sale?.discount ? Number(sale.discount) : 0,
      finalPrice: sale?.finalPrice ? Number(sale.finalPrice) : undefined,
      paymentMethod: sale?.paymentMethod || "bank",
      saleDate: sale?.saleDate ? new Date(sale.saleDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      deliveryDate: sale?.deliveryDate ? new Date(sale.deliveryDate).toISOString().split('T')[0] : undefined,
      warrantyMonths: sale?.warrantyMonths || 12,
      invoiceNumber: sale?.invoiceNumber || "",
      notes: sale?.notes || "",
    },
    mode: "onChange",
  });

  // Calculate sale totals when form values change
  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        if (values.salePrice && typeof values.salePrice === 'number' && values.salePrice > 0 && purchase) {
          const purchaseCalculation = {
            purchasePrice: Number(purchase.purchasePrice),
            vatType: purchase.vatType as VatType,
            vatAmount: Number(purchase.vatAmount),
            bpmAmount: Number(purchase.bpmAmount),
            transportCost: Number(purchase.transportCost),
            maintenanceCost: Number(purchase.maintenanceCost),
            cleaningCost: Number(purchase.cleaningCost),
            guaranteeCost: Number(purchase.guaranteeCost),
            otherCosts: Number(purchase.otherCosts),
            totalCostInclVat: Number(purchase.totalCostInclVat),
          };

          const calculation = calculateSaleTotal(
            values.salePrice,
            vatType,
            values.discount || 0,
            purchaseCalculation
          );

          setCalculatedSale(calculation);
          
          // Update form values with calculated amounts safely
          if (calculation && typeof calculation.salePriceInclVat === 'number') {
            form.setValue("salePriceInclVat", calculation.salePriceInclVat, { shouldValidate: false });
          }
          if (calculation && typeof calculation.finalPrice === 'number') {
            form.setValue("finalPrice", calculation.finalPrice, { shouldValidate: false });
          }
        }
      } catch (error) {
        console.warn("Error in sale calculation:", error);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, purchase, vatType]);

  const saveSaleMutation = useMutation({
    mutationFn: async (data: SaleFormData) => {
      console.log("Submitting sale data:", data);
      
      // Calculate sale totals if not already calculated
      let finalCalculation = calculatedSale;
      if (!finalCalculation && purchase) {
        const purchaseCalculation = {
          purchasePrice: Number(purchase.purchasePrice),
          vatType: purchase.vatType as VatType,
          vatAmount: Number(purchase.vatAmount),
          bpmAmount: Number(purchase.bpmAmount),
          transportCost: Number(purchase.transportCost),
          maintenanceCost: Number(purchase.maintenanceCost),
          cleaningCost: Number(purchase.cleaningCost),
          guaranteeCost: Number(purchase.guaranteeCost),
          otherCosts: Number(purchase.otherCosts),
          totalCostInclVat: Number(purchase.totalCostInclVat),
        };

        finalCalculation = calculateSaleTotal(
          data.salePrice,
          vatType,
          data.discount || 0,
          purchaseCalculation
        );
      }

      if (!finalCalculation) {
        throw new Error("Verkoopberekening kon niet worden uitgevoerd");
      }

      const saleData = {
        ...data,
        vatAmount: finalCalculation.vatAmount,
        profitExclVat: finalCalculation.profitExclVat,
        profitInclVat: finalCalculation.profitInclVat,
        saleDate: new Date(data.saleDate).toISOString(),
        deliveryDate: data.deliveryDate && data.deliveryDate !== "" ? new Date(data.deliveryDate).toISOString() : null,
      };

      if (sale) {
        return await apiRequest(`/api/admin/sales/${sale.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: saleData,
        });
      } else {
        return await apiRequest("/api/admin/sales", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: saleData,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sales"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/financial-overview"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicles"] });
      toast({
        title: sale ? "Verkoop bijgewerkt" : "Verkoop geregistreerd",
        description: "De verkoopgegevens zijn succesvol opgeslagen.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij opslaan",
        description: error.message || "Er is een fout opgetreden bij het opslaan van de verkoopgegevens.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SaleFormData) => {
    saveSaleMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-yellow-500">
            {sale ? "Verkoop bewerken" : "Verkoop registreren"} - {vehicle.brand} {vehicle.model}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Pricing Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-yellow-500">Prijsinformatie</CardTitle>
              <CardDescription className="text-gray-400">
                BTW-type: {vatType === "21%" ? "21% BTW" : vatType === "marge" ? "Marge regeling" : "Geen BTW"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salePrice">Verkoopprijs (excl. BTW)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  step="0.01"
                  {...form.register("salePrice", { valueAsNumber: true })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="35000.00"
                />
                {form.formState.errors.salePrice && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.salePrice.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="salePriceInclVat">Verkoopprijs (incl. BTW)</Label>
                <Input
                  id="salePriceInclVat"
                  type="number"
                  step="0.01"
                  {...form.register("salePriceInclVat", { valueAsNumber: true })}
                  className="bg-gray-700 border-gray-600 text-gray-300"
                  placeholder="42350.00"
                  disabled
                />
              </div>

              <div>
                <Label htmlFor="discount">Korting</Label>
                <Input
                  id="discount"
                  type="number"
                  step="0.01"
                  {...form.register("discount", { valueAsNumber: true })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="finalPrice">Eindprijs</Label>
                <Input
                  id="finalPrice"
                  type="number"
                  step="0.01"
                  {...form.register("finalPrice", { valueAsNumber: true })}
                  className="bg-gray-700 border-gray-600 text-gray-300"
                  placeholder="42350.00"
                  disabled
                />
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-yellow-500">Klantgegevens</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Naam</Label>
                <Input
                  id="customerName"
                  {...form.register("customerName")}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Jan Janssen"
                />
                {form.formState.errors.customerName && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.customerName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="customerEmail">E-mail</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  {...form.register("customerEmail")}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="jan@example.com"
                />
                {form.formState.errors.customerEmail && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.customerEmail.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="customerPhone">Telefoon</Label>
                <Input
                  id="customerPhone"
                  {...form.register("customerPhone")}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="06-12345678"
                />
                {form.formState.errors.customerPhone && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.customerPhone.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="paymentMethod">Betaalmethode</Label>
                <Select value={form.watch("paymentMethod")} onValueChange={(value) => form.setValue("paymentMethod", value)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Selecteer betaalmethode" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="bank">Bankoverschrijving</SelectItem>
                    <SelectItem value="cash">Contant</SelectItem>
                    <SelectItem value="financing">Financiering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="customerAddress">Adres</Label>
                <Textarea
                  id="customerAddress"
                  {...form.register("customerAddress")}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Straat 123, 1234 AB Plaats"
                  rows={2}
                />
                {form.formState.errors.customerAddress && (
                  <p className="text-red-400 text-sm mt-1">{form.formState.errors.customerAddress.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sale Details */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-yellow-500">Verkoopdetails</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="saleDate">Verkoopdatum</Label>
                <Input
                  id="saleDate"
                  type="date"
                  {...form.register("saleDate")}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="deliveryDate">Leveringsdatum</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  {...form.register("deliveryDate")}
                  className="bg-gray-800 border-gray-700 text-white"
                />
              </div>

              <div>
                <Label htmlFor="warrantyMonths">Garantie (maanden)</Label>
                <Input
                  id="warrantyMonths"
                  type="number"
                  {...form.register("warrantyMonths", { valueAsNumber: true })}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="12"
                />
              </div>

              <div>
                <Label htmlFor="invoiceNumber">Factuurnummer</Label>
                <Input
                  id="invoiceNumber"
                  {...form.register("invoiceNumber")}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="V-2024-001"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="notes">Notities</Label>
                <Textarea
                  id="notes"
                  {...form.register("notes")}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="Opmerkingen over de verkoop..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Profit Calculation */}
          {calculatedSale && purchase && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-yellow-500">Winstberekening</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Verkoopprijs (excl. BTW):</span>
                  <span>{formatCurrency(calculatedSale.salePrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>BTW-bedrag:</span>
                  <span>{formatCurrency(calculatedSale.vatAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Korting:</span>
                  <span>-{formatCurrency(calculatedSale.discount)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Eindprijs:</span>
                  <span>{formatCurrency(calculatedSale.finalPrice)}</span>
                </div>
                <div className="border-t border-gray-600 pt-2">
                  <div className="flex justify-between text-sm">
                    <span>Inkoopprijs totaal:</span>
                    <span>{formatCurrency(purchase.totalCostInclVat)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Winst (excl. BTW):</span>
                    <span className={calculatedSale.profitExclVat >= 0 ? "text-green-400" : "text-red-400"}>
                      {formatCurrency(calculatedSale.profitExclVat)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-yellow-500">
                    <span>Winst (incl. BTW):</span>
                    <span className={calculatedSale.profitInclVat >= 0 ? "text-green-400" : "text-red-400"}>
                      {formatCurrency(calculatedSale.profitInclVat)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Annuleren
            </Button>
            <Button 
              type="submit" 
              disabled={saveSaleMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700 text-black"
            >
              {saveSaleMutation.isPending ? "Opslaan..." : (sale ? "Bijwerken" : "Registreren")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}