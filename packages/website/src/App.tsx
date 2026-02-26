import { useState, useEffect } from "react";
import Navbar from "./components/sections/Navbar";
import Hero from "./components/sections/Hero";
import { Features } from "./components/sections/Features";
import { HowItWorks } from "./components/sections/HowItWorks";
import { TechStack } from "./components/sections/TechStack";
import { Docs } from "./components/sections/Docs";
import { Footer } from "./components/sections/Footer";
import DocsPage from "./pages/DocsPage";

export function navigate(path: string) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function usePath() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  return path;
}

export default function App() {
  const path = usePath();
  const isDocsPage = path.startsWith("/docs");

  if (isDocsPage) {
    return <DocsPage />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <TechStack />
      <Docs />
      <Footer />
    </main>
  );
}
