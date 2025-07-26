import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Upload, AlertCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MigrationResult {
  message: string;
  transferred?: number;
  updatedVehicles?: number;
  errors?: number;
  details?: any;
}

export function AdminImageMigration() {
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferResult, setTransferResult] = useState<MigrationResult | null>(null);
  const { toast } = useToast();

  const handleTransferImages = async () => {
    setIsTransferring(true);
    try {
      const result = await apiRequest('/api/admin/transfer-images', {
        method: 'POST'
      }) as MigrationResult;
      
      setTransferResult(result);
      toast({
        title: "Afbeeldingen succesvol overgedragen",
        description: `${result.transferred || 0} afbeeldingen gekopieerd naar static folder`,
      });
    } catch (error) {
      console.error('Transfer failed:', error);
      toast({
        title: "Overdracht mislukt",
        description: "Er is een fout opgetreden bij het overdragen van afbeeldingen",
        variant: "destructive"
      });
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Afbeelding Migratie
        </CardTitle>
        <CardDescription>
          Kopieer alle huidige afbeeldingen naar de static folder voor production deployment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!transferResult ? (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Wat doet dit?</strong> Deze functie kopieert alle huidige vehicle afbeeldingen 
                naar de client/public/uploads folder, zodat ze beschikbaar blijven na deployment naar ddcars.nl.
              </p>
            </div>
            
            <Button 
              onClick={handleTransferImages}
              disabled={isTransferring}
              className="w-full"
            >
              {isTransferring ? (
                <>Afbeeldingen overdragen...</>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Start Afbeelding Overdracht
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Overdracht Voltooid</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {transferResult.transferred || 0}
                </div>
                <div className="text-sm text-green-800">Afbeeldingen gekopieerd</div>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {transferResult.updatedVehicles || 0}
                </div>
                <div className="text-sm text-blue-800">Voertuigen bijgewerkt</div>
              </div>
            </div>
            
            {transferResult.errors && transferResult.errors > 0 && (
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">
                    {transferResult.errors} fouten opgetreden tijdens overdracht
                  </span>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                ✅ <strong>Klaar voor deployment!</strong> Alle afbeeldingen zijn nu beschikbaar 
                in de static folder en zullen correct werken op ddcars.nl.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}