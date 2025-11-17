"use client";
import { Navigation } from './_components/Navigation';
import { Hero } from './_components/sections/Hero';
import { Features } from './_components/sections/Features';
import { Architecture } from './_components/sections/Architecture';
import { UseCases } from './_components/sections/UseCases';
import { QuickStart } from './_components/sections/QuickStart';
import { Footer } from './_components/Footer';

function App() {
  return (
    <div className="bg-slate-950">
      <Navigation />
      <Hero />
      <section id="features">
        <Features />
      </section>
      <section id="architecture">
        <Architecture />
      </section>
      <section id="usecases">
        <UseCases />
      </section>
      <section id="quickstart">
        <QuickStart />
      </section>
      <Footer />
    </div>
  );
}

export default App;
