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
import { LogOut, Car, Users, Plus, Edit, Trash2, Eye, CreditCard, Clock, CheckCircle, XCircle } from "lucide-react";
import type { Vehicle, Contact, Reservation } from "@shared/schema";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
    queryKey: ["/api/admin/vehicles"],
    queryFn: () => apiRequest("/api/admin/vehicles", { headers: authHeaders }),
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

  const handleUpdateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const updates = {
      brand: formData.get("brand") as string,
      model: formData.get("model") as string,
      year: parseInt(formData.get("year") as string),
      price: parseInt(formData.get("price") as string),
      mileage: parseInt(formData.get("mileage") as string),
      fuelType: formData.get("fuelType") as string,
      transmission: formData.get("transmission") as string,
      color: formData.get("color") as string,
      description: formData.get("description") as string,
      featured: formData.get("featured") === "true",
    };

    updateVehicleMutation.mutate({ id: editingVehicle.id, updates });
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
          <TabsList className="grid w-full grid-cols-3 bg-gray-900">
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
          </TabsList>

          <TabsContent value="vehicles" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Voertuigen Beheren</h2>
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                <Plus className="w-4 h-4 mr-2" />
                Voertuig Toevoegen
              </Button>
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
        </Tabs>
      </div>

      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Voertuig Bewerken</DialogTitle>
          </DialogHeader>
          {editingVehicle && (
            <form onSubmit={handleUpdateVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand">Merk</Label>
                  <Input
                    id="brand"
                    name="brand"
                    defaultValue={editingVehicle.brand}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    defaultValue={editingVehicle.model}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="year">Jaar</Label>
                  <Input
                    id="year"
                    name="year"
                    type="number"
                    defaultValue={editingVehicle.year}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price">Prijs</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    defaultValue={editingVehicle.price}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="mileage">Kilometerstand</Label>
                  <Input
                    id="mileage"
                    name="mileage"
                    type="number"
                    defaultValue={editingVehicle.mileage}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="color">Kleur</Label>
                  <Input
                    id="color"
                    name="color"
                    defaultValue={editingVehicle.color}
                    className="bg-gray-800 border-gray-700"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="fuelType">Brandstof</Label>
                  <Select name="fuelType" defaultValue={editingVehicle.fuelType}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="Benzine">Benzine</SelectItem>
                      <SelectItem value="Diesel">Diesel</SelectItem>
                      <SelectItem value="Elektrisch">Elektrisch</SelectItem>
                      <SelectItem value="Hybride">Hybride</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="transmission">Transmissie</Label>
                  <Select name="transmission" defaultValue={editingVehicle.transmission}>
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="Automaat">Automaat</SelectItem>
                      <SelectItem value="Handgeschakeld">Handgeschakeld</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Beschrijving</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingVehicle.description}
                  className="bg-gray-800 border-gray-700"
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  value="true"
                  defaultChecked={editingVehicle.featured}
                  className="rounded"
                />
                <Label htmlFor="featured">Uitgelicht</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-gray-700 text-white hover:bg-gray-800"
                >
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black"
                  disabled={updateVehicleMutation.isPending}
                >
                  {updateVehicleMutation.isPending ? "Opslaan..." : "Opslaan"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}