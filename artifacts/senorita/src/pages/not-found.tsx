import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="text-center z-10">
          <h1 className="font-display text-8xl md:text-[12rem] text-primary text-glow-primary leading-none mb-4">404</h1>
          <h2 className="text-2xl md:text-4xl text-white uppercase tracking-widest font-light mb-8">Lost in the dark?</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-10">
            The page you're looking for doesn't exist or has been moved. Let's get you back to the collection.
          </p>
          <Link href="/">
            <button className="px-10 py-4 border border-primary text-primary uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300 box-glow-primary">
              Return Home
            </button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
