import Header from "@/components/Header";
import SimpleHero from "@/components/SimpleHero";
import Features from "@/components/Features";
import VehicleShowcase from "@/components/VehicleShowcase";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-primary">
      <Header />
      <SimpleHero />
      <Features />
      <VehicleShowcase />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}
