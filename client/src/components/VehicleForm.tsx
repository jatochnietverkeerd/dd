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
import { insertVehicleSchema } from "@shared/schema";
import type { Vehicle } from "@shared/schema";
import { z } from "zod";
import ImageUploader from "./ImageUploader";

const vehicleFormSchema = insertVehicleSchema.extend({
  images: z.array(z.string()).optional(),
}).omit({ 
  slug: true,
  metaTitle: true,
  metaDescription: true,
  availableDate: true,
  available: true,
  // Remove all purchase-related fields
  purchasePrice: true,
  purchaseVatType: true,
  bpmAmount: true,
  supplier: true,
  invoiceNumber: true,
  purchaseDate: true,
  transportCost: true,
  maintenanceCost: true,
  cleaningCost: true,
  guaranteeCost: true,
  otherCosts: true,
  totalCostInclVat: true,
  notes: true,
  co2Uitstoot: true,
  datumEersteToelating: true,
  nettoCatalogusprijs: true,
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
      toast({
        title: "Voertuig toegevoegd",
        description: "Het voertuig is succesvol toegevoegd.",
      });
      onClose();
      form.reset();
      setImages([]);
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
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/vehicles/featured"] });
      
      // Check if we need to show sale form
      if (result.requireSaleForm) {
        toast({
          title: "Status bijgewerkt naar verkocht",
          description: "Vul nu de verkoop details in.",
        });
        onClose();
        // Trigger sale form - we'll need to communicate this to parent component
        window.dispatchEvent(new CustomEvent('showSaleForm', { 
          detail: { vehicleId: vehicle!.id } 
        }));
      } else {
        toast({
          title: "Voertuig bijgewerkt",
          description: "Het voertuig is succesvol bijgewerkt.",
        });
        onClose();
      }
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
      available: true,
      // Remove undefined values to prevent validation issues
      ...Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && v !== "")),
    };
    
    if (vehicle) {
      updateVehicleMutation.mutate(formDataWithImages);
    } else {
      createVehicleMutation.mutate(formDataWithImages);
    }
  };

  // No profit calculation in vehicle form - this is done in purchase/sale forms

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

          <div className="flex justify-between items-center pt-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm">
              Gebruik de 'Inkoop' en 'Verkoop' knoppen in het dashboard voor financiële registratie
            </p>
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