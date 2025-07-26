import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Database, Car, ShoppingCart, Receipt, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SyncResult {
  synced: number;
  errors: any[];
}

interface FullSyncResult {
  vehicles: SyncResult;
  purchases: SyncResult;
  sales: SyncResult;
}

export default function SyncPanel() {
  const [isVehicleSync, setIsVehicleSync] = useState(false);
  const [isFullSync, setIsFullSync] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<FullSyncResult | null>(null);
  const { toast } = useToast();

  const syncVehicles = async () => {
    setIsVehicleSync(true);
    try {
      const result = await apiRequest('/api/admin/sync/vehicles', {
        method: 'POST'
      });

      toast({
        title: "Vehicle Sync Completed",
        description: `Synced ${result.synced} vehicles${result.errors?.length ? ` with ${result.errors.length} errors` : ''}`,
        variant: result.errors?.length ? "destructive" : "default"
      });

      // Update partial result
      setLastSyncResult(prev => ({
        ...prev,
        vehicles: result
      } as FullSyncResult));

    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: error?.message || "Failed to sync vehicles from ddcars.nl",
        variant: "destructive"
      });
    } finally {
      setIsVehicleSync(false);
    }
  };

  const syncFull = async () => {
    setIsFullSync(true);
    try {
      const result = await apiRequest('/api/admin/sync/full', {
        method: 'POST'
      });

      const totalSynced = result.vehicles.synced + result.purchases.synced + result.sales.synced;
      const totalErrors = result.vehicles.errors.length + result.purchases.errors.length + result.sales.errors.length;

      toast({
        title: "Full Sync Completed",
        description: `Synced ${totalSynced} items${totalErrors ? ` with ${totalErrors} errors` : ''}`,
        variant: totalErrors ? "destructive" : "default"
      });

      setLastSyncResult(result);

    } catch (error: any) {
      console.error('Full sync error:', error);
      toast({
        title: "Full Sync Failed", 
        description: error?.message || "Failed to perform full sync from ddcars.nl",
        variant: "destructive"
      });
    } finally {
      setIsFullSync(false);
    }
  };

  const getSyncStatusIcon = (result: SyncResult | undefined) => {
    if (!result) return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    if (result.errors.length > 0) return <XCircle className="h-4 w-4 text-red-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getSyncStatusText = (result: SyncResult | undefined) => {
    if (!result) return "Not synced";
    if (result.errors.length > 0) return `${result.synced} synced, ${result.errors.length} errors`;
    return `${result.synced} synced successfully`;
  };

  return (
    <div className="space-y-6">
      {/* Sync Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            DDCars.nl Synchronization
          </CardTitle>
          <CardDescription>
            Sync data from the production ddcars.nl website to this Replit project.
            This ensures all uploads and changes from the main site appear here automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={syncVehicles}
              disabled={isVehicleSync || isFullSync}
              className="flex items-center gap-2"
            >
              {isVehicleSync ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Car className="h-4 w-4" />
              )}
              Sync Vehicles Only
            </Button>

            <Button 
              onClick={syncFull}
              disabled={isVehicleSync || isFullSync}
              variant="secondary"
              className="flex items-center gap-2"
            >
              {isFullSync ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Full Sync (All Data)
            </Button>
          </div>

          <div className="text-sm text-gray-600">
            <p><strong>Vehicle Sync:</strong> Syncs all vehicles and their images from ddcars.nl</p>
            <p><strong>Full Sync:</strong> Syncs vehicles, purchases, sales, and all related data</p>
          </div>
        </CardContent>
      </Card>

      {/* Sync Status */}
      {lastSyncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Last Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span className="font-medium">Vehicles</span>
                </div>
                <div className="flex items-center gap-2">
                  {getSyncStatusIcon(lastSyncResult.vehicles)}
                  <span className="text-sm">{getSyncStatusText(lastSyncResult.vehicles)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  <span className="font-medium">Purchases</span>
                </div>
                <div className="flex items-center gap-2">
                  {getSyncStatusIcon(lastSyncResult.purchases)}
                  <span className="text-sm">{getSyncStatusText(lastSyncResult.purchases)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4" />
                  <span className="font-medium">Sales</span>
                </div>
                <div className="flex items-center gap-2">
                  {getSyncStatusIcon(lastSyncResult.sales)}
                  <span className="text-sm">{getSyncStatusText(lastSyncResult.sales)}</span>
                </div>
              </div>
            </div>

            {/* Error Details */}
            {lastSyncResult && (
              <>
                {lastSyncResult.vehicles?.errors?.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2">Vehicle Sync Errors:</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {lastSyncResult.vehicles.errors.map((error, index) => (
                        <li key={index}>Vehicle {error.vehicleId}: {error.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sync Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How Synchronization Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <div>
              <p className="font-medium">Data Retrieval</p>
              <p className="text-sm text-gray-600">Connects to ddcars.nl API endpoints to fetch the latest vehicle, purchase, and sales data</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <div>
              <p className="font-medium">Image Synchronization</p>
              <p className="text-sm text-gray-600">Downloads and saves all vehicle images from ddcars.nl to this project's uploads folder</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <div>
              <p className="font-medium">Data Merging</p>
              <p className="text-sm text-gray-600">Compares existing data and updates or creates new records as needed</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-0.5">4</Badge>
            <div>
              <p className="font-medium">Live Updates</p>
              <p className="text-sm text-gray-600">The ddcars.nl site can trigger automatic syncs via webhook when new data is added</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}