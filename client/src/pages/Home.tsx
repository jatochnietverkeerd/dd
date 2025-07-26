import React from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import VehicleShowcase from "@/components/VehicleShowcase";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-primary">
      <Header />
      <Hero />
      <Features />
      <VehicleShowcase />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}
