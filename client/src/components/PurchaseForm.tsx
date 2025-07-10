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
import { insertPurchaseSchema } from "@shared/schema";
import { calculatePurchaseTotal, formatCurrency, type VatType } from "@shared/vatUtils";
import type { Vehicle, Purchase } from "@shared/schema";
import { z } from "zod";

const purchaseFormSchema = insertPurchaseSchema.extend({
  vehicleId: z.number(),
  purchasePrice: z.number().positive("Inkoopprijs moet positief zijn"),
  vatType: z.enum(["21%", "marge", "geen_btw"]),
  bpmAmount: z.number().min(0, "BPM bedrag kan niet negatief zijn"),
  transportCost: z.number().min(0, "Transportkosten kunnen niet negatief zijn"),
  maintenanceCost: z.number().min(0, "Onderhoudskosten kunnen niet negatief zijn"),
  cleaningCost: z.number().min(0, "Schoonmaakkosten kunnen niet negatief zijn"),
  guaranteeCost: z.number().min(0, "Garantiekosten kunnen niet negatief zijn"),
  otherCosts: z.number().min(0, "Overige kosten kunnen niet negatief zijn"),
}).omit({ 
  vatAmount: true,
  totalCostInclVat: true
});

type PurchaseFormData = z.infer<typeof purchaseFormSchema>;

interface PurchaseFormProps {
  vehicle: Vehicle;
  purchase?: Purchase;
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function PurchaseForm({ vehicle, purchase, isOpen, onClose, token }: PurchaseFormProps) {
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
  const [vatAmount, setVatAmount] = useState<number>(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PurchaseFormData>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: {
      vehicleId: vehicle.id,
      purchasePrice: purchase?.purchasePrice ? Number(purchase.purchasePrice) : 0,
      vatType: purchase?.vatType as VatType || "21%",
      bpmAmount: purchase?.bpmAmount ? Number(purchase.bpmAmount) : 0,
      supplier: purchase?.supplier || "",
      invoiceNumber: purchase?.invoiceNumber || "",
      purchaseDate: purchase?.purchaseDate || new Date(),
      transportCost: purchase?.transportCost ? Number(purchase.transportCost) : 0,
      maintenanceCost: purchase?.maintenanceCost ? Number(purchase.maintenanceCost) : 0,
      cleaningCost: purchase?.cleaningCost ? Number(purchase.cleaningCost) : 0,
      guaranteeCost: purchase?.guaranteeCost ? Number(purchase.guaranteeCost) : 0,
      otherCosts: purchase?.otherCosts ? Number(purchase.otherCosts) : 0,
      notes: purchase?.notes || "",
    },
    mode: "onChange",
  });

  // Calculate totals when form values change
  useEffect(() => {
    const subscription = form.watch((values) => {
      if (values.purchasePrice && values.vatType) {
        const calculation = calculatePurchaseTotal(
          values.purchasePrice,
          values.vatType as VatType,
          values.bpmAmount || 0,
          values.transportCost || 0,
          values.maintenanceCost || 0,
          values.cleaningCost || 0,
          values.guaranteeCost || 0,
          values.otherCosts || 0
        );
        setCalculatedTotal(calculation.totalCostInclVat);
        setVatAmount(calculation.vatAmount);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const savePurchaseMutation = useMutation({
    mutationFn: async (data: PurchaseFormData) => {
      const calculation = calculatePurchaseTotal(
        data.purchasePrice,
        data.vatType as VatType,
        data.bpmAmount,
        data.transportCost,
        data.maintenanceCost,
        data.cleaningCost,
        data.guaranteeCost,
        data.otherCosts
      );

      const purchaseData = {
        ...data,
        vatAmount: calculation.vatAmount,
        totalCostInclVat: calculation.totalCostInclVat,
        purchaseDate: new Date(data.purchaseDate).toISOString(),
      };

      if (purchase) {
        return await apiRequest(`/api/admin/purchases/${purchase.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: purchaseData,
        });
      } else {
        return await apiRequest("/api/admin/purchases", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: purchaseData,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/purchases"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/financial-overview"] });
      toast({
        title: purchase ? "Inkoop bijgewerkt" : "Inkoop geregistreerd",
        description: "De inkoopgegevens zijn succesvol opgeslagen.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij opslaan",
        description: error.message || "Er is een fout opgetreden bij het opslaan van de inkoopgegevens.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PurchaseFormData) => {
    savePurchaseMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-yellow-500">
            {purchase ? "Inkoop bewerken" : "Inkoop registreren"} - {vehicle.brand} {vehicle.model}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="purchasePrice">Inkoopprijs (excl. BTW)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                {...form.register("purchasePrice", { valueAsNumber: true })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="25000.00"
              />
              {form.formState.errors.purchasePrice && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.purchasePrice.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="vatType">BTW-type</Label>
              <Select value={form.watch("vatType")} onValueChange={(value) => form.setValue("vatType", value as VatType, { shouldValidate: true })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Selecteer BTW-type" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="21%">21% BTW</SelectItem>
                  <SelectItem value="marge">Marge regeling</SelectItem>
                  <SelectItem value="geen_btw">Geen BTW</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.vatType && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.vatType.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="bpmAmount">BPM-bedrag</Label>
              <Input
                id="bpmAmount"
                type="number"
                step="0.01"
                {...form.register("bpmAmount", { valueAsNumber: true })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="2500.00"
              />
              {form.formState.errors.bpmAmount && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.bpmAmount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="supplier">Leverancier</Label>
              <Input
                id="supplier"
                {...form.register("supplier")}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Volkswagen Dealer"
              />
              {form.formState.errors.supplier && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.supplier.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="invoiceNumber">Factuurnummer</Label>
              <Input
                id="invoiceNumber"
                {...form.register("invoiceNumber")}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="INV-2024-001"
              />
              {form.formState.errors.invoiceNumber && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.invoiceNumber.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="purchaseDate">Inkoopdatum</Label>
              <Input
                id="purchaseDate"
                type="date"
                {...form.register("purchaseDate")}
                className="bg-gray-800 border-gray-700 text-white"
              />
              {form.formState.errors.purchaseDate && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.purchaseDate.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="transportCost">Transportkosten</Label>
              <Input
                id="transportCost"
                type="number"
                step="0.01"
                {...form.register("transportCost", { valueAsNumber: true })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="200.00"
              />
            </div>

            <div>
              <Label htmlFor="maintenanceCost">Onderhoudskosten</Label>
              <Input
                id="maintenanceCost"
                type="number"
                step="0.01"
                {...form.register("maintenanceCost", { valueAsNumber: true })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="500.00"
              />
            </div>

            <div>
              <Label htmlFor="cleaningCost">Schoonmaakkosten</Label>
              <Input
                id="cleaningCost"
                type="number"
                step="0.01"
                {...form.register("cleaningCost", { valueAsNumber: true })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="150.00"
              />
            </div>

            <div>
              <Label htmlFor="guaranteeCost">Garantiekosten</Label>
              <Input
                id="guaranteeCost"
                type="number"
                step="0.01"
                {...form.register("guaranteeCost", { valueAsNumber: true })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="300.00"
              />
            </div>

            <div>
              <Label htmlFor="otherCosts">Overige kosten</Label>
              <Input
                id="otherCosts"
                type="number"
                step="0.01"
                {...form.register("otherCosts", { valueAsNumber: true })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="100.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notities</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Opmerkingen over de inkoop..."
              rows={3}
            />
          </div>

          {/* Calculation Summary */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-yellow-500">Kostenberekening</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Inkoopprijs (excl. BTW):</span>
                <span>{formatCurrency(form.watch("purchasePrice") || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>BTW-bedrag:</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>BPM-bedrag:</span>
                <span>{formatCurrency(form.watch("bpmAmount") || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Overige kosten:</span>
                <span>{formatCurrency(
                  (form.watch("transportCost") || 0) +
                  (form.watch("maintenanceCost") || 0) +
                  (form.watch("cleaningCost") || 0) +
                  (form.watch("guaranteeCost") || 0) +
                  (form.watch("otherCosts") || 0)
                )}</span>
              </div>
              <div className="border-t border-gray-600 pt-2 flex justify-between font-bold text-yellow-500">
                <span>Totale kosten (incl. BTW):</span>
                <span>{formatCurrency(calculatedTotal)}</span>
              </div>
            </CardContent>
          </Card>

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
              disabled={savePurchaseMutation.isPending}
              className="bg-yellow-600 hover:bg-yellow-700 text-black"
            >
              {savePurchaseMutation.isPending ? "Opslaan..." : (purchase ? "Bijwerken" : "Registreren")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}