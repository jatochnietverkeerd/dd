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
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { insertVehicleSchema, insertPurchaseSchema } from "@shared/schema";
import type { Vehicle } from "@shared/schema";
import { z } from "zod";
import ImageUploader from "./ImageUploader";
import { calculatePurchaseTotal, calculateSaleTotal, type VatType } from "@shared/vatUtils";

const vehicleFormSchema = insertVehicleSchema.extend({
  images: z.array(z.string()).optional(),
  // Inkoop gegevens
  purchasePrice: z.number().min(0).optional(),
  purchaseVatType: z.enum(["21%", "marge", "geen_btw"]).optional(),
  bpmAmount: z.number().min(0).optional(),
  supplier: z.string().optional(),
  invoiceNumber: z.string().optional(),
  purchaseDate: z.date().optional(),
  transportCost: z.number().min(0).optional(),
  maintenanceCost: z.number().min(0).optional(),
  cleaningCost: z.number().min(0).optional(),
  guaranteeCost: z.number().min(0).optional(),
  otherCosts: z.number().min(0).optional(),
}).omit({ 
  slug: true,
  metaTitle: true,
  metaDescription: true,
  availableDate: true,
  available: true
});

type VehicleFormData = z.infer<typeof vehicleFormSchema>;

interface VehicleFormProps {
  vehicle?: Vehicle;
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function VehicleForm({ vehicle, isOpen, onClose, token }: VehicleFormProps) {
  const [images, setImages] = useState<string[]>(vehicle?.images || []);
  const [showPurchaseDetails, setShowPurchaseDetails] = useState(false);
  const [showProfitCalculation, setShowProfitCalculation] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      brand: vehicle?.brand || "",
      model: vehicle?.model || "",
      year: vehicle?.year || new Date().getFullYear(),
      price: vehicle?.price || 0,
      mileage: vehicle?.mileage || 0,
      fuel: vehicle?.fuel || "",
      transmission: vehicle?.transmission || "",
      color: vehicle?.color || "",
      description: vehicle?.description || "",
      featured: vehicle?.featured || false,
      status: vehicle?.status || "beschikbaar",
      images: vehicle?.images || [],
      // Inkoop gegevens
      purchasePrice: 0,
      purchaseVatType: "21%",
      bpmAmount: 0,
      supplier: "",
      invoiceNumber: "",
      purchaseDate: new Date(),
      transportCost: 0,
      maintenanceCost: 0,
      cleaningCost: 0,
      guaranteeCost: 0,
      otherCosts: 0,
    },
    mode: "onChange",
  });

  // Reset form when vehicle changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        brand: vehicle?.brand || "",
        model: vehicle?.model || "",
        year: vehicle?.year || new Date().getFullYear(),
        price: vehicle?.price || 0,
        mileage: vehicle?.mileage || 0,
        fuel: vehicle?.fuel || "",
        transmission: vehicle?.transmission || "",
        color: vehicle?.color || "",
        description: vehicle?.description || "",
        featured: vehicle?.featured || false,
        status: vehicle?.status || "beschikbaar",
        images: vehicle?.images || [],
      });
      setImages(vehicle?.images || []);
    }
  }, [vehicle, isOpen, form]);

  const createVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      return await apiRequest("/api/admin/vehicles", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/featured"] });
      // Clear all query cache to force refresh
      queryClient.clear();
      toast({
        title: "Voertuig toegevoegd",
        description: "Het voertuig is succesvol toegevoegd.",
      });
      onClose();
      form.reset();
      setImages([]);
      // Force page refresh to ensure cache is cleared
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van het voertuig.",
        variant: "destructive",
      });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: VehicleFormData) => {
      return await apiRequest(`/api/admin/vehicles/${vehicle!.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/featured"] });
      // Clear all query cache to force refresh
      queryClient.clear();
      toast({
        title: "Voertuig bijgewerkt",
        description: "Het voertuig is succesvol bijgewerkt.",
      });
      onClose();
      // Force page refresh to ensure cache is cleared
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van het voertuig.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VehicleFormData) => {
    const formDataWithImages = {
      ...data,
      images: images,
      // Ensure new vehicles are available by default
      available: true
    };
    
    if (vehicle) {
      updateVehicleMutation.mutate(formDataWithImages);
    } else {
      createVehicleMutation.mutate(formDataWithImages);
    }
  };

  // Calculate profit when purchase data is available
  const watchedValues = form.watch();
  const purchaseCalculation = watchedValues.purchasePrice > 0 ? calculatePurchaseTotal(
    watchedValues.purchasePrice,
    watchedValues.purchaseVatType as VatType,
    watchedValues.bpmAmount || 0,
    watchedValues.transportCost || 0,
    watchedValues.maintenanceCost || 0,
    watchedValues.cleaningCost || 0,
    watchedValues.guaranteeCost || 0,
    watchedValues.otherCosts || 0
  ) : null;

  const saleCalculation = purchaseCalculation && watchedValues.price > 0 ? calculateSaleTotal(
    watchedValues.price,
    watchedValues.purchaseVatType as VatType,
    0,
    purchaseCalculation
  ) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-yellow-500">
            {vehicle ? "Voertuig bewerken" : "Nieuw voertuig toevoegen"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="brand">Merk</Label>
              <Input
                id="brand"
                {...form.register("brand")}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Volkswagen"
              />
              {form.formState.errors.brand && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.brand.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                {...form.register("model")}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Golf GTI"
              />
              {form.formState.errors.model && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.model.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="year">Jaar</Label>
              <Input
                id="year"
                type="number"
                {...form.register("year", { valueAsNumber: true })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="2024"
              />
              {form.formState.errors.year && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.year.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="price">Prijs (€)</Label>
              <Input
                id="price"
                type="number"
                {...form.register("price", { valueAsNumber: true })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="35000"
              />
              {form.formState.errors.price && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.price.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="mileage">Kilometerstand</Label>
              <Input
                id="mileage"
                type="number"
                {...form.register("mileage", { valueAsNumber: true })}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="15000"
              />
              {form.formState.errors.mileage && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.mileage.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="fuel">Brandstof</Label>
              <Select value={form.watch("fuel")} onValueChange={(value) => form.setValue("fuel", value, { shouldValidate: true })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Selecteer brandstof" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="benzine">Benzine</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="elektrisch">Elektrisch</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.fuel && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.fuel.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="transmission">Transmissie</Label>
              <Select value={form.watch("transmission")} onValueChange={(value) => form.setValue("transmission", value, { shouldValidate: true })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Selecteer transmissie" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="handgeschakeld">Handgeschakeld</SelectItem>
                  <SelectItem value="automaat">Automaat</SelectItem>
                  <SelectItem value="semi-automaat">Semi-automaat</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.transmission && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.transmission.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="color">Kleur</Label>
              <Input
                id="color"
                {...form.register("color")}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="Tornado Red"
              />
              {form.formState.errors.color && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.color.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={form.watch("status")} onValueChange={(value) => form.setValue("status", value, { shouldValidate: true })}>
                <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                  <SelectValue placeholder="Selecteer status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="beschikbaar">Beschikbaar</SelectItem>
                  <SelectItem value="gereserveerd">Gereserveerd</SelectItem>
                  <SelectItem value="verkocht">Verkocht</SelectItem>
                  <SelectItem value="in_onderhoud">In onderhoud</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-red-400 text-sm mt-1">{form.formState.errors.status.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="featured"
                checked={form.watch("featured")}
                onCheckedChange={(checked) => form.setValue("featured", checked as boolean, { shouldValidate: true })}
              />
              <Label htmlFor="featured">Uitgelicht</Label>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Beschrijving</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              className="bg-gray-800 border-gray-700 text-white"
              placeholder="Gedetailleerde beschrijving van het voertuig..."
              rows={4}
            />
            {form.formState.errors.description && (
              <p className="text-red-400 text-sm mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div>
            <ImageUploader
              key={vehicle?.id || 'new'}
              initialImages={images}
              onImagesChange={setImages}
              maxImages={20}
              token={token}
            />
          </div>

          {/* Inkoop gegevens sectie */}
          <div className="border-t border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-yellow-500">Inkoop gegevens</h3>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPurchaseDetails(!showPurchaseDetails)}
                className="border-gray-700 text-white hover:bg-gray-800"
              >
                {showPurchaseDetails ? "Verbergen" : "Tonen"}
              </Button>
            </div>

            {showPurchaseDetails && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchasePrice">Inkoopprijs (excl. BTW)</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      step="0.01"
                      {...form.register("purchasePrice", { valueAsNumber: true })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="25000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="purchaseVatType">BTW Type</Label>
                    <Select value={form.watch("purchaseVatType")} onValueChange={(value) => form.setValue("purchaseVatType", value, { shouldValidate: true })}>
                      <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                        <SelectValue placeholder="Selecteer BTW type" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="21%">21% BTW</SelectItem>
                        <SelectItem value="marge">Marge regeling</SelectItem>
                        <SelectItem value="geen_btw">Geen BTW</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bpmAmount">BPM Bedrag</Label>
                    <Input
                      id="bpmAmount"
                      type="number"
                      step="0.01"
                      {...form.register("bpmAmount", { valueAsNumber: true })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="supplier">Leverancier</Label>
                    <Input
                      id="supplier"
                      {...form.register("supplier")}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="Leverancier naam"
                    />
                  </div>

                  <div>
                    <Label htmlFor="transportCost">Transportkosten</Label>
                    <Input
                      id="transportCost"
                      type="number"
                      step="0.01"
                      {...form.register("transportCost", { valueAsNumber: true })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="0"
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
                      placeholder="0"
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
                      placeholder="0"
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
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Winstberekening */}
                {purchaseCalculation && (
                  <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                    <h4 className="text-lg font-semibold text-yellow-500 mb-3">Kostenberekening</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Inkoopprijs (excl. BTW):</span>
                        <span className="text-white ml-2">€{purchaseCalculation.purchasePrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">BTW:</span>
                        <span className="text-white ml-2">€{purchaseCalculation.vatAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">BPM:</span>
                        <span className="text-white ml-2">€{purchaseCalculation.bpmAmount.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Totale kosten (incl. BTW):</span>
                        <span className="text-yellow-500 ml-2 font-semibold">€{purchaseCalculation.totalCostInclVat.toFixed(2)}</span>
                      </div>
                    </div>

                    {saleCalculation && (
                      <div className="mt-4 pt-4 border-t border-gray-700">
                        <h4 className="text-lg font-semibold text-green-500 mb-3">Winstberekening</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Verkoopprijs:</span>
                            <span className="text-white ml-2">€{watchedValues.price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Totale kosten:</span>
                            <span className="text-white ml-2">€{purchaseCalculation.totalCostInclVat.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Bruto winst:</span>
                            <span className={`ml-2 font-semibold ${saleCalculation.profitInclVat > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              €{saleCalculation.profitInclVat.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Winstmarge:</span>
                            <span className={`ml-2 font-semibold ${saleCalculation.profitInclVat > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {watchedValues.price > 0 ? ((saleCalculation.profitInclVat / watchedValues.price) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-700 text-white hover:bg-gray-800"
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
              disabled={createVehicleMutation.isPending || updateVehicleMutation.isPending}

            >
              {createVehicleMutation.isPending || updateVehicleMutation.isPending
                ? "Bezig..."
                : vehicle
                ? "Bijwerken"
                : "Toevoegen"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}