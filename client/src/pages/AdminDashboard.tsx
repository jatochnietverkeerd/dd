import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Car, Users, Plus, Edit, Trash2, Eye, CreditCard, Clock, CheckCircle, XCircle, Calculator, Download, FileText, TrendingUp, Mail } from "lucide-react";
import type { Vehicle, Contact, Reservation, Purchase, Sale } from "@shared/schema";
import VehicleForm from "@/components/VehicleForm";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState("2024");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const storedToken = localStorage.getItem("adminToken");
    const storedUser = localStorage.getItem("adminUser");
    
    if (!storedToken || !storedUser) {
      setLocation("/admin/login");
      return;
    }
    
    setToken(storedToken);
    setUser(JSON.parse(storedUser));
  }, [setLocation]);

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["/api/admin/vehicles", statusFilter],
    queryFn: () => {
      const params = statusFilter !== "all" ? `?status=${statusFilter}` : "";
      return apiRequest(`/api/admin/vehicles${params}`, { headers: authHeaders });
    },
    enabled: !!token,
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["/api/admin/contacts"],
    queryFn: () => apiRequest("/api/admin/contacts", { headers: authHeaders }),
    enabled: !!token,
  });

  const { data: reservations, isLoading: reservationsLoading } = useQuery({
    queryKey: ["/api/reservations"],
    queryFn: () => apiRequest("/api/reservations", { headers: authHeaders }),
    enabled: !!token,
  });

  const { data: purchases, isLoading: purchasesLoading } = useQuery({
    queryKey: ["/api/admin/purchases"],
    queryFn: () => apiRequest("/api/admin/purchases", { headers: authHeaders }),
    enabled: !!token,
  });

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ["/api/admin/sales"],
    queryFn: () => apiRequest("/api/admin/sales", { headers: authHeaders }),
    enabled: !!token,
  });

  const { data: financialOverview, isLoading: financialLoading } = useQuery({
    queryKey: ["/api/admin/financial-overview", selectedYear, selectedMonth],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedYear !== "all") params.append("year", selectedYear);
      if (selectedMonth !== "all") params.append("month", selectedMonth);
      return apiRequest(`/api/admin/financial-overview${params.toString() ? `?${params.toString()}` : ""}`, { headers: authHeaders });
    },
    enabled: !!token,
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/logout", {
        method: "POST",
        headers: authHeaders,
      });
    },
    onSuccess: () => {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      setLocation("/admin/login");
    },
    onError: () => {
      // Even if logout fails, clear local storage
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      setLocation("/admin/login");
    },
  });

  const deleteVehicleMutation = useMutation({
    mutationFn: async (vehicleId: number) => {
      return await apiRequest(`/api/admin/vehicles/${vehicleId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicles"] });
      toast({
        title: "Voertuig verwijderd",
        description: "Het voertuig is succesvol verwijderd.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van het voertuig.",
        variant: "destructive",
      });
    },
  });

  const updateVehicleStatusMutation = useMutation({
    mutationFn: async ({ vehicleId, status }: { vehicleId: number; status: string }) => {
      return await apiRequest(`/api/admin/vehicles/${vehicleId}/status`, {
        method: "PUT",
        headers: authHeaders,
        body: { status },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicles"] });
      toast({
        title: "Status bijgewerkt",
        description: "De voertuigstatus is succesvol bijgewerkt.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de status.",
        variant: "destructive",
      });
    },
  });

  const updateVehicleMutation = useMutation({
    mutationFn: async (data: { id: number; updates: Partial<Vehicle> }) => {
      return await apiRequest(`/api/admin/vehicles/${data.id}`, {
        method: "PUT",
        headers: authHeaders,
        body: data.updates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/vehicles"] });
      setIsEditDialogOpen(false);
      setEditingVehicle(null);
      toast({
        title: "Voertuig bijgewerkt",
        description: "Het voertuig is succesvol bijgewerkt.",
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van het voertuig.",
        variant: "destructive",
      });
    },
  });

  const handleEditVehicle = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsEditDialogOpen(true);
  };

  const handleAddVehicle = () => {
    setEditingVehicle(null);
    setIsAddDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      beschikbaar: { label: "Beschikbaar", variant: "default" as const, color: "bg-green-500" },
      gereserveerd: { label: "Gereserveerd", variant: "secondary" as const, color: "bg-yellow-500" },
      verkocht: { label: "Verkocht", variant: "destructive" as const, color: "bg-red-500" },
      gearchiveerd: { label: "Gearchiveerd", variant: "outline" as const, color: "bg-gray-500" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.beschikbaar;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${config.color}`}></div>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Onbekend";
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDaysAvailable = (availableDate: string | Date) => {
    if (!availableDate) return "Onbekend";
    const date = new Date(availableDate);
    const today = new Date();
    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? `${diffDays} dagen` : "Vandaag";
  };



  const handleDeleteVehicle = (vehicleId: number) => {
    if (confirm("Weet je zeker dat je dit voertuig wilt verwijderen?")) {
      deleteVehicleMutation.mutate(vehicleId);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user || !token) {
    return <div className="min-h-screen bg-black flex items-center justify-center text-white">Laden...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400">Welkom, {user.username}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Uitloggen
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="vehicles" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900">
            <TabsTrigger value="vehicles" className="data-[state=active]:bg-gray-800">
              <Car className="w-4 h-4 mr-2" />
              Voertuigen
            </TabsTrigger>
            <TabsTrigger value="contacts" className="data-[state=active]:bg-gray-800">
              <Users className="w-4 h-4 mr-2" />
              Contacten
            </TabsTrigger>
            <TabsTrigger value="reservations" className="data-[state=active]:bg-gray-800">
              <CreditCard className="w-4 h-4 mr-2" />
              Reserveringen
            </TabsTrigger>
            <TabsTrigger value="accounting" className="data-[state=active]:bg-gray-800">
              <Calculator className="w-4 h-4 mr-2" />
              Boekhouding
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vehicles" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Voertuigen Beheren</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="status-filter" className="text-sm text-gray-400">Filter op status:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger id="status-filter" className="w-40 bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Alle statussen" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">Alle statussen</SelectItem>
                      <SelectItem value="beschikbaar">Beschikbaar</SelectItem>
                      <SelectItem value="gereserveerd">Gereserveerd</SelectItem>
                      <SelectItem value="verkocht">Verkocht</SelectItem>
                      <SelectItem value="gearchiveerd">Gearchiveerd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  onClick={handleAddVehicle}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Voertuig Toevoegen
                </Button>
              </div>
            </div>

            {vehiclesLoading ? (
              <div className="text-center py-8">Laden...</div>
            ) : (
              <div className="grid gap-4">
                {vehicles?.map((vehicle: Vehicle) => (
                  <Card key={vehicle.id} className="bg-gray-900 border-gray-800">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white">
                            {vehicle.brand} {vehicle.model}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {vehicle.year} • {vehicle.color} • {vehicle.transmission}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          {vehicle.featured && (
                            <Badge className="bg-yellow-500 text-black">Uitgelicht</Badge>
                          )}
                          {getStatusBadge(vehicle.status || 'beschikbaar')}
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/vehicle/${vehicle.id}`)}
                              className="border-gray-700 text-white hover:bg-gray-800"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditVehicle(vehicle)}
                              className="border-gray-700 text-white hover:bg-gray-800"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                              className="border-red-700 text-red-400 hover:bg-red-900"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <p className="text-gray-400">Prijs</p>
                          <p className="font-semibold text-yellow-500">€{vehicle.price?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Kilometerstand</p>
                          <p className="font-semibold">{vehicle.mileage?.toLocaleString()} km</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Brandstof</p>
                          <p className="font-semibold">{vehicle.fuelType}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Transmissie</p>
                          <p className="font-semibold">{vehicle.transmission}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-gray-400 text-sm">Status:</p>
                            <Select 
                              value={vehicle.status || 'beschikbaar'} 
                              onValueChange={(status) => 
                                updateVehicleStatusMutation.mutate({ vehicleId: vehicle.id, status })
                              }
                            >
                              <SelectTrigger className="w-32 h-8 bg-gray-800 border-gray-700 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700">
                                <SelectItem value="beschikbaar">Beschikbaar</SelectItem>
                                <SelectItem value="gereserveerd">Gereserveerd</SelectItem>
                                <SelectItem value="verkocht">Verkocht</SelectItem>
                                <SelectItem value="gearchiveerd">Gearchiveerd</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {vehicle.status === 'beschikbaar' && vehicle.availableDate && (
                            <div>
                              <p className="text-gray-400 text-sm">Beschikbaar sinds:</p>
                              <p className="text-xs text-gray-300">
                                {formatDate(vehicle.availableDate)} ({getDaysAvailable(vehicle.availableDate)})
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <h2 className="text-xl font-semibold">Contact Berichten</h2>
            
            {contactsLoading ? (
              <div className="text-center py-8">Laden...</div>
            ) : (
              <div className="grid gap-4">
                {contacts?.map((contact: Contact) => (
                  <Card key={contact.id} className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white">{contact.name}</CardTitle>
                          <CardDescription className="text-gray-400">
                            {contact.email} • {contact.phone}
                          </CardDescription>
                        </div>
                        <div className="text-sm text-gray-400">
                          {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : ''}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-300">{contact.message}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reservations" className="space-y-4">
            <h2 className="text-xl font-semibold">Reserveringen</h2>
            
            {reservationsLoading ? (
              <div className="text-center py-8">Laden...</div>
            ) : (
              <div className="grid gap-4">
                {reservations?.map((reservation: Reservation) => {
                  const vehicle = vehicles?.find((v: Vehicle) => v.id === reservation.vehicleId);
                  const statusIcon = {
                    pending: <Clock className="w-4 h-4 text-yellow-500" />,
                    confirmed: <CheckCircle className="w-4 h-4 text-green-500" />,
                    cancelled: <XCircle className="w-4 h-4 text-red-500" />
                  }[reservation.status] || <Clock className="w-4 h-4 text-gray-500" />;
                  
                  return (
                    <Card key={reservation.id} className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white flex items-center gap-2">
                              {statusIcon}
                              {reservation.customerName}
                            </CardTitle>
                            <CardDescription className="text-gray-400">
                              {reservation.customerEmail} • {reservation.customerPhone}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <Badge 
                              className={`${
                                reservation.status === 'confirmed' ? 'bg-green-500' :
                                reservation.status === 'cancelled' ? 'bg-red-500' :
                                'bg-yellow-500'
                              } text-black`}
                            >
                              {reservation.status === 'confirmed' ? 'Bevestigd' :
                               reservation.status === 'cancelled' ? 'Geannuleerd' :
                               'In afwachting'}
                            </Badge>
                            <p className="text-sm text-gray-400 mt-1">
                              {reservation.createdAt ? new Date(reservation.createdAt).toLocaleDateString() : ''}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold text-white mb-2">Voertuig:</h4>
                            <p className="text-gray-300">
                              {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})` : 'Voertuig niet gevonden'}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-white mb-2">Aanbetaling:</h4>
                            <p className="text-yellow-500 font-bold">
                              €{(reservation.depositAmount / 100).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        {reservation.notes && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-white mb-2">Opmerkingen:</h4>
                            <p className="text-gray-300">{reservation.notes}</p>
                          </div>
                        )}
                        
                        {reservation.stripePaymentIntentId && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-white mb-2">Betaling ID:</h4>
                            <p className="text-gray-400 text-sm font-mono">{reservation.stripePaymentIntentId}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
                
                {(!reservations || reservations.length === 0) && (
                  <div className="text-center py-8 text-gray-400">
                    Nog geen reserveringen ontvangen.
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="accounting" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Boekhouding</h2>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/api/admin/export/purchases';
                    link.download = 'purchases.csv';
                    link.click();
                  }}
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Inkoop
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/api/admin/export/sales';
                    link.download = 'sales.csv';
                    link.click();
                  }}
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Verkoop
                </Button>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Overzicht
                </TabsTrigger>
                <TabsTrigger value="purchases" className="data-[state=active]:bg-gray-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Inkopen
                </TabsTrigger>
                <TabsTrigger value="sales" className="data-[state=active]:bg-gray-700">
                  <Calculator className="w-4 h-4 mr-2" />
                  Verkopen
                </TabsTrigger>
                <TabsTrigger value="reports" className="data-[state=active]:bg-gray-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Rapporten
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {financialLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-400 mt-2">Financiële gegevens laden...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-500" />
                          Omzet
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                          €{financialOverview?.totalRevenue?.toLocaleString() || '0'}
                        </div>
                        <p className="text-sm text-gray-400">Dit jaar</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-red-500" />
                          Inkoop
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-red-500">
                          €{financialOverview?.totalPurchases?.toLocaleString() || '0'}
                        </div>
                        <p className="text-sm text-gray-400">Dit jaar</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-gray-900 border-gray-800">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Calculator className="w-5 h-5 text-yellow-500" />
                          Winst
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-500">
                          €{financialOverview?.totalProfit?.toLocaleString() || '0'}
                        </div>
                        <p className="text-sm text-gray-400">Dit jaar</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="purchases" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Inkoop Registratie</h3>
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuwe Inkoop
                  </Button>
                </div>
                
                {purchasesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-400 mt-2">Inkopen laden...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {purchases && purchases.length > 0 ? (
                      purchases.map((purchase: Purchase) => {
                        const vehicle = vehicles?.find((v: Vehicle) => v.id === purchase.vehicleId);
                        return (
                          <Card key={purchase.id} className="bg-gray-900 border-gray-800">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-white">
                                    {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Voertuig niet gevonden'}
                                  </CardTitle>
                                  <CardDescription className="text-gray-400">
                                    {purchase.supplier} • {purchase.invoiceNumber}
                                  </CardDescription>
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold text-red-500">
                                    €{purchase.purchasePrice.toLocaleString()}
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    {new Date(purchase.purchaseDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm text-gray-400">Transport</p>
                                  <p className="text-white">€{purchase.transportCost}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">Onderhoud</p>
                                  <p className="text-white">€{purchase.maintenanceCost}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">Reiniging</p>
                                  <p className="text-white">€{purchase.cleaningCost}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">Overig</p>
                                  <p className="text-white">€{purchase.otherCosts}</p>
                                </div>
                              </div>
                              {purchase.notes && (
                                <div className="mt-4">
                                  <p className="text-sm text-gray-400">Notities:</p>
                                  <p className="text-white">{purchase.notes}</p>
                                </div>
                              )}
                              <div className="mt-4 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`/api/admin/invoices/purchase/${purchase.vehicleId}/pdf`, '_blank')}
                                  className="border-gray-700 text-white hover:bg-gray-800"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download PDF
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const email = prompt('Email adres voor factuur:');
                                    if (email) {
                                      fetch(`/api/admin/invoices/purchase/${purchase.vehicleId}/email`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                                        },
                                        body: JSON.stringify({ email })
                                      })
                                      .then(res => res.json())
                                      .then(data => {
                                        if (data.message) {
                                          alert('Email verzonden!');
                                        } else {
                                          alert('Fout bij verzenden email');
                                        }
                                      })
                                      .catch(() => alert('Fout bij verzenden email'));
                                    }
                                  }}
                                  className="border-gray-700 text-white hover:bg-gray-800"
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Email PDF
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        Nog geen inkopen geregistreerd.
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="sales" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Verkoop Registratie</h3>
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuwe Verkoop
                  </Button>
                </div>
                
                {salesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-400 mt-2">Verkopen laden...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sales && sales.length > 0 ? (
                      sales.map((sale: Sale) => {
                        const vehicle = vehicles?.find((v: Vehicle) => v.id === sale.vehicleId);
                        return (
                          <Card key={sale.id} className="bg-gray-900 border-gray-800">
                            <CardHeader>
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-white">
                                    {vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Voertuig niet gevonden'}
                                  </CardTitle>
                                  <CardDescription className="text-gray-400">
                                    {sale.customerName} • {sale.invoiceNumber}
                                  </CardDescription>
                                </div>
                                <div className="text-right">
                                  <div className="text-xl font-bold text-green-500">
                                    €{sale.salePrice.toLocaleString()}
                                  </div>
                                  <p className="text-sm text-gray-400">
                                    {new Date(sale.saleDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-sm text-gray-400">Klant</p>
                                  <p className="text-white">{sale.customerName}</p>
                                  <p className="text-sm text-gray-400">{sale.customerEmail}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">Telefoon</p>
                                  <p className="text-white">{sale.customerPhone}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">Korting</p>
                                  <p className="text-white">€{sale.discount}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-400">BTW</p>
                                  <p className="text-white">{sale.vatRate}%</p>
                                </div>
                              </div>
                              {sale.notes && (
                                <div className="mt-4">
                                  <p className="text-sm text-gray-400">Notities:</p>
                                  <p className="text-white">{sale.notes}</p>
                                </div>
                              )}
                              <div className="mt-4 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(`/api/admin/invoices/sale/${sale.vehicleId}/pdf`, '_blank')}
                                  className="border-gray-700 text-white hover:bg-gray-800"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  Download PDF
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const email = prompt('Email adres voor factuur:', sale.customerEmail);
                                    if (email) {
                                      fetch(`/api/admin/invoices/sale/${sale.vehicleId}/email`, {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                                        },
                                        body: JSON.stringify({ email })
                                      })
                                      .then(res => res.json())
                                      .then(data => {
                                        if (data.message) {
                                          alert('Email verzonden!');
                                        } else {
                                          alert('Fout bij verzenden email');
                                        }
                                      })
                                      .catch(() => alert('Fout bij verzenden email'));
                                    }
                                  }}
                                  className="border-gray-700 text-white hover:bg-gray-800"
                                >
                                  <Mail className="w-4 h-4 mr-2" />
                                  Email PDF
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        Nog geen verkopen geregistreerd.
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Financiële Rapporten</h3>
                  <div className="flex items-center space-x-2">
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-24 bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2023">2023</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="all">Alle maanden</SelectItem>
                        <SelectItem value="1">Januari</SelectItem>
                        <SelectItem value="2">Februari</SelectItem>
                        <SelectItem value="3">Maart</SelectItem>
                        <SelectItem value="4">April</SelectItem>
                        <SelectItem value="5">Mei</SelectItem>
                        <SelectItem value="6">Juni</SelectItem>
                        <SelectItem value="7">Juli</SelectItem>
                        <SelectItem value="8">Augustus</SelectItem>
                        <SelectItem value="9">September</SelectItem>
                        <SelectItem value="10">Oktober</SelectItem>
                        <SelectItem value="11">November</SelectItem>
                        <SelectItem value="12">December</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {financialLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto" />
                    <p className="text-gray-400 mt-2">Rapporten laden...</p>
                  </div>
                ) : (
                  <Card className="bg-gray-900 border-gray-800">
                    <CardHeader>
                      <CardTitle className="text-white">Financieel Overzicht</CardTitle>
                      <CardDescription className="text-gray-400">
                        {selectedMonth !== "all" ? `${selectedMonth}/${selectedYear}` : selectedYear}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-500">
                            €{financialOverview?.totalRevenue?.toLocaleString() || '0'}
                          </div>
                          <p className="text-sm text-gray-400">Totale Omzet</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-red-500">
                            €{financialOverview?.totalPurchases?.toLocaleString() || '0'}
                          </div>
                          <p className="text-sm text-gray-400">Totale Inkoop</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-yellow-500">
                            €{financialOverview?.totalProfit?.toLocaleString() || '0'}
                          </div>
                          <p className="text-sm text-gray-400">Winst</p>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-500">
                            €{financialOverview?.vatCollected?.toLocaleString() || '0'}
                          </div>
                          <p className="text-sm text-gray-400">BTW</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-800">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">
                              {financialOverview?.vehiclesSold || 0}
                            </div>
                            <p className="text-sm text-gray-400">Verkochte Voertuigen</p>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-white">
                              {financialOverview?.vehiclesPurchased || 0}
                            </div>
                            <p className="text-sm text-gray-400">Ingekochte Voertuigen</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Vehicle Forms */}
      <VehicleForm 
        vehicle={editingVehicle}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        token={token!}
      />
      
      <VehicleForm 
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        token={token!}
      />
    </div>
  );
}