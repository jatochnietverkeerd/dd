import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";
import { Home } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Gebruikersnaam is verplicht"),
  password: z.string().min(1, "Wachtwoord is verplicht"),
});

type LoginData = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("/api/admin/login", {
        method: "POST",
        body: data,
      });
      return response;
    },
    onSuccess: (data) => {
      console.log("✅ Login successful, received data:", data);
      // Store token in localStorage
      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      console.log("✅ Token and user stored in localStorage");
      console.log("✅ Redirecting to /admin/dashboard");
      setLocation("/admin/dashboard");
    },
    onError: (error: any) => {
      setError(error.message || "Login mislukt");
    },
  });

  const onSubmit = (data: LoginData) => {
    setError(null);
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Home Button */}
      <Button
        onClick={() => setLocation("/")}
        className="fixed top-4 left-4 bg-yellow-500 hover:bg-yellow-600 text-black p-3 rounded-full shadow-lg"
        size="sm"
      >
        <Home size={20} />
      </Button>
      
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Admin Login</CardTitle>
          <CardDescription className="text-gray-400">
            Log in om toegang te krijgen tot het admin dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-white">
                Gebruikersnaam
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Voer je gebruikersnaam in"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                {...register("username")}
              />
              {errors.username && (
                <p className="text-red-400 text-sm">{errors.username.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Wachtwoord
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Voer je wachtwoord in"
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-red-400 text-sm">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <Alert className="bg-red-900 border-red-700">
                <AlertDescription className="text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Inloggen..." : "Inloggen"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}