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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { insertVehicleSchema } from "@shared/schema";
import type { Vehicle } from "@shared/schema";
import { z } from "zod";
import ImageUploader from "./ImageUploader";

const vehicleFormSchema = z.object({
  brand: z.string().min(1, "Merk is verplicht"),
  model: z.string().min(1, "Model is verplicht"),
  year: z.number().min(1900, "Bouwjaar moet na 1900 zijn"),
  price: z.string().min(1, "Prijs is verplicht").regex(/^\d+(\.\d{1,2})?$/, "Prijs moet een geldig bedrag zijn"),
  mileage: z.number().min(0, "Kilometerstand moet positief zijn"),
  fuel: z.string().min(1, "Brandstof is verplicht"),
  transmission: z.string().min(1, "Transmissie is verplicht"),
  color: z.string().min(1, "Kleur is verplicht"),
  description: z.string().min(1, "Beschrijving is verplicht"),
  featured: z.boolean().default(false),
  status: z.string().default("beschikbaar"),
  images: z.array(z.string()).optional(),
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
  
  // Debug wrapper for setImages
  const setImagesWithLog = (newImages: string[]) => {
    console.log('🎯 VehicleForm setImagesWithLog received:', newImages);
    console.log('🎯 VehicleForm current images before update:', images);
    setImages(newImages);
    console.log('🎯 VehicleForm setImages state updated');
  };
  const [marktplaatsUrl, setMarktplaatsUrl] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      brand: vehicle?.brand || "",
      model: vehicle?.model || "",
      year: vehicle?.year || new Date().getFullYear(),
      price: vehicle?.price ? vehicle.price.toString() : "",
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
      const vehicleImages = vehicle?.images || [];
      console.log('🎯 VehicleForm useEffect resetting form for vehicle:', vehicle?.id, 'with images:', vehicleImages);
      
      form.reset({
        brand: vehicle?.brand || "",
        model: vehicle?.model || "",
        year: vehicle?.year || new Date().getFullYear(),
        price: vehicle?.price ? vehicle.price.toString() : "",
        mileage: vehicle?.mileage || 0,
        fuel: vehicle?.fuel || "",
        transmission: vehicle?.transmission || "",
        color: vehicle?.color || "",
        description: vehicle?.description || "",
        featured: vehicle?.featured || false,
        status: vehicle?.status || "beschikbaar",
        images: vehicleImages,
      });
      
      // Only reset images when opening with a different vehicle or creating new vehicle
      if (!vehicle || vehicle.id !== images.length) {
        console.log('🎯 VehicleForm resetting images state to:', vehicleImages);
        setImages(vehicleImages);
      } else {
        console.log('🎯 VehicleForm keeping current images state:', images);
      }
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

  const handleLicensePlateLookup = async () => {
    if (!licensePlate.trim()) {
      toast({
        title: "Kenteken vereist",
        description: "Voer een kenteken in om op te zoeken.",
        variant: "destructive",
      });
      return;
    }

    setIsLookingUp(true);
    try {
      const response = await apiRequest('/api/admin/lookup-license-plate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { licensePlate: licensePlate.trim() }
      });

      // Fill form with RDW data
      form.reset({
        brand: response.brand || "",
        model: response.model || "",
        year: response.year || new Date().getFullYear(),
        price: "", // User must enter price
        mileage: 0, // User must enter mileage
        fuel: response.fuel || "",
        transmission: response.transmission || "",
        color: response.color || "",
        description: response.description || "",
        featured: false,
        status: "beschikbaar",
        images: [],
      });

      toast({
        title: "Kenteken gevonden!",
        description: "Voertuiggegevens zijn succesvol opgehaald van RDW. Vul nu de prijs en kilometerstand in.",
      });
      
      // Focus on price field since that's what user needs to enter
      setTimeout(() => {
        const priceField = document.querySelector('input[name="price"]') as HTMLInputElement;
        if (priceField) priceField.focus();
      }, 100);
      
    } catch (error: any) {
      toast({
        title: "Kenteken niet gevonden",
        description: error.message || "Kon geen voertuiggegevens vinden voor dit kenteken.",
        variant: "destructive",
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleImportFromUrl = async () => {
    if (!marktplaatsUrl.trim()) {
      toast({
        title: "URL vereist",
        description: "Voer een Marktplaats URL in om te importeren.",
        variant: "destructive",
      });
      return;
    }

    if (!marktplaatsUrl.includes('marktplaats.nl')) {
      toast({
        title: "Ongeldige URL",
        description: "Voer een geldige Marktplaats URL in.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const response = await apiRequest('/api/admin/import-marktplaats', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: { url: marktplaatsUrl }
      });

      // Fill form with imported data
      form.reset({
        brand: response.brand || "",
        model: response.model || "",
        year: response.year || new Date().getFullYear(),
        price: response.price || "",
        mileage: response.mileage || 0,
        fuel: response.fuel || "",
        transmission: response.transmission || "",
        color: response.color || "",
        description: response.description || "",
        featured: false,
        status: "beschikbaar",
        images: response.images || [],
      });
      
      setImages(response.images || []);
      
      toast({
        title: "Import succesvol",
        description: "Auto gegevens zijn geïmporteerd. Controleer en pas aan indien nodig.",
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Import mislukt",
        description: "Kon de auto gegevens niet importeren. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
    setIsImporting(false);
  };

  const onSubmit = (data: VehicleFormData) => {
    console.log('🚀 FORM SUBMISSION STARTED - Current images:', images);
    console.log('🚀 FORM DATA:', data);
    console.log('🚀 FORM ERRORS:', form.formState.errors);
    
    const formDataWithImages = {
      ...data,
      images: images,
      // Ensure new vehicles are available by default
      available: true,
      // Convert price to string to match schema
      price: String(data.price),
      // Remove undefined values to prevent validation issues
      ...Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && v !== "")),
    };
    
    console.log('🚀 FINAL FORM DATA WITH IMAGES:', formDataWithImages);
    
    // Critical check: ensure images are included
    if (images.length > 0 && formDataWithImages.images.length === 0) {
      console.error('🚨 CRITICAL: Images exist but not in form data!');
      formDataWithImages.images = images;
      console.log('🚨 FIXED: Added images to form data:', images);
    }
    
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
          <DialogDescription className="text-gray-400">
            {vehicle ? "Bewerk de voertuig informatie en sla de wijzigingen op." : "Voeg een nieuw voertuig toe aan de voorraad."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* License Plate Lookup Section - only show for new vehicles */}
          {!vehicle && (
            <Card className="bg-green-900 border-green-700">
              <CardHeader>
                <CardTitle className="text-green-400">🚗 Kenteken Opzoeken (Aanbevolen)</CardTitle>
                <CardDescription className="text-gray-300">
                  Voer een Nederlands kenteken in om automatisch alle officiële RDW gegevens op te halen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                    placeholder="12-ABC-3 of 12ABC3"
                    className="bg-gray-900 border-gray-600 text-white flex-1 font-mono text-lg"
                    maxLength={8}
                  />
                  <Button
                    type="button"
                    onClick={handleLicensePlateLookup}
                    disabled={isLookingUp}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {isLookingUp ? "Zoeken..." : "Opzoeken"}
                  </Button>
                </div>
                <p className="text-xs text-gray-400">
                  ✅ Officiële RDW gegevens • ✅ Automatische beschrijving • ⚡ Snelste methode
                </p>
              </CardContent>
            </Card>
          )}

          {/* Manual Vehicle Entry - Reliable Method */}
          <Card className="bg-blue-900 border-blue-700">
            <CardHeader>
              <CardTitle className="text-blue-400">✏️ Handmatige Invoer (Betrouwbaar)</CardTitle>
              <CardDescription className="text-gray-300">
                Vul alle voertuiggegevens handmatig in voor 100% controle en nauwkeurigheid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-gray-400">
                ✅ Altijd betrouwbaar • ✅ Volledige controle • ✅ Meerdere afbeeldingen uploaden
              </p>
            </CardContent>
          </Card>

          {/* Marktplaats Import Section - only show for new vehicles */}
          {!vehicle && (
            <Card className="bg-gray-800 border-gray-700 opacity-75">
              <CardHeader>
                <CardTitle className="text-yellow-500">📱 Import van Marktplaats (Experimenteel)</CardTitle>
                <CardDescription className="text-gray-400">
                  Let op: Marktplaats blokkeert vaak automatische imports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={marktplaatsUrl}
                    onChange={(e) => setMarktplaatsUrl(e.target.value)}
                    placeholder="https://www.marktplaats.nl/a/auto-s/..."
                    className="bg-gray-900 border-gray-600 text-white flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleImportFromUrl}
                    disabled={isImporting}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  >
                    {isImporting ? "Proberen..." : "Proberen"}
                  </Button>
                </div>
                <p className="text-xs text-gray-400">
                  ⚠️ Werkt niet altijd door anti-bot beveiliging • Gebruik kenteken lookup of handmatige invoer
                </p>
              </CardContent>
            </Card>
          )}

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
                type="text"
                {...form.register("price")}
                className="bg-gray-800 border-gray-700 text-white"
                placeholder="35000"
                pattern="[0-9]*"
                inputMode="numeric"
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
              initialImages={images}
              onImagesChange={setImagesWithLog}
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