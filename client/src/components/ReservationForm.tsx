import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertReservationSchema } from "@shared/schema";
import { CreditCard, Shield, Phone, Mail, User } from "lucide-react";

const reservationFormSchema = insertReservationSchema.extend({
  customerName: z.string().min(2, "Naam moet minimaal 2 karakters bevatten"),
  customerEmail: z.string().email("Ongeldig e-mailadres"),
  customerPhone: z.string().min(10, "Telefoonnummer moet minimaal 10 cijfers bevatten"),
  notes: z.string().optional(),
});

type ReservationFormData = z.infer<typeof reservationFormSchema>;

interface ReservationFormProps {
  vehicleId: number;
  vehicleBrand: string;
  vehicleModel: string;
  vehiclePrice: number;
  onSuccess?: () => void;
}

export default function ReservationForm({ 
  vehicleId, 
  vehicleBrand, 
  vehicleModel, 
  vehiclePrice,
  onSuccess 
}: ReservationFormProps) {
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const { toast } = useToast();
  
  const depositAmount = Math.round(vehiclePrice * 0.1); // 10% deposit
  
  const form = useForm<ReservationFormData>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      vehicleId,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      depositAmount,
      status: "pending",
      notes: "",
    },
  });

  const createPaymentIntent = useMutation({
    mutationFn: async ({ amount, vehicleId }: { amount: number; vehicleId: number }) => {
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount,
        vehicleId,
      });
      return response.json();
    },
  });

  const createReservation = useMutation({
    mutationFn: async (data: ReservationFormData) => {
      const response = await apiRequest("POST", "/api/reservations", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reservering succesvol!",
        description: "Uw reservering is geplaatst. U ontvangt binnenkort een bevestiging per e-mail.",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Reservering mislukt",
        description: "Er is een fout opgetreden bij het plaatsen van uw reservering. Probeer het opnieuw.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ReservationFormData) => {
    setIsProcessingPayment(true);
    
    try {
      // Create payment intent (mock for now)
      const paymentResult = await createPaymentIntent.mutateAsync({
        amount: depositAmount,
        vehicleId,
      });

      // In a real implementation, you would handle Stripe payment here
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create reservation with payment intent ID
      await createReservation.mutateAsync({
        ...data,
        stripePaymentIntentId: paymentResult.paymentIntentId,
      });

      toast({
        title: "Betaling succesvol!",
        description: "Uw aanbetaling is verwerkt en de reservering is bevestigd.",
      });
      
    } catch (error) {
      toast({
        title: "Betalingsfout",
        description: "Er is een fout opgetreden bij de betaling. Probeer het opnieuw.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-dark-secondary border-dark-quaternary">
      <CardHeader>
        <CardTitle className="text-2xl text-luxury-gold flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Reserveer {vehicleBrand} {vehicleModel}
        </CardTitle>
        <CardDescription className="text-gray-400">
          Reserveer deze prachtige auto met een aanbetaling van 10% van de totaalprijs.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Price Summary */}
        <div className="bg-dark-tertiary p-4 rounded-lg border border-dark-quaternary">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-300">Totaalprijs:</span>
            <span className="text-xl font-bold text-white">€{vehiclePrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">Aanbetaling (10%):</span>
            <span className="text-xl font-bold text-luxury-gold">€{depositAmount.toLocaleString()}</span>
          </div>
          <Separator className="my-3 bg-dark-quaternary" />
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Resterend bedrag bij aflevering:</span>
            <span>€{(vehiclePrice - depositAmount).toLocaleString()}</span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Volledige naam
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Voor- en achternaam"
                        {...field}
                        className="bg-dark-tertiary border-dark-quaternary text-white placeholder-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Telefoonnummer
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+31 6 12345678"
                        {...field}
                        className="bg-dark-tertiary border-dark-quaternary text-white placeholder-gray-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-mailadres
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="uw.email@example.com"
                      {...field}
                      className="bg-dark-tertiary border-dark-quaternary text-white placeholder-gray-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-gray-300">
                    Opmerkingen (optioneel)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Eventuele vragen of opmerkingen..."
                      {...field}
                      className="bg-dark-tertiary border-dark-quaternary text-white placeholder-gray-500"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-dark-tertiary p-4 rounded-lg border border-dark-quaternary">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-luxury-gold" />
                <h3 className="text-lg font-semibold text-white">Veilige betaling</h3>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Uw betaling wordt veilig verwerkt via Stripe. Uw gegevens worden versleuteld en veilig opgeslagen.
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Shield className="w-4 h-4" />
                <span>SSL-beveiligd • 256-bit encryptie • PCI-DSS gecertificeerd</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isProcessingPayment || createReservation.isPending}
              className="w-full bg-luxury-gold hover:bg-white text-dark-primary font-bold py-3 text-lg transition-colors duration-300"
            >
              {isProcessingPayment ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2" />
                  Betaling verwerken...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Reserveren voor €{depositAmount.toLocaleString()}
                </>
              )}
            </Button>
          </form>
        </Form>

        <div className="text-xs text-gray-500 text-center">
          Door op "Reserveren" te klikken, gaat u akkoord met onze algemene voorwaarden en privacyverklaring.
        </div>
      </CardContent>
    </Card>
  );
}