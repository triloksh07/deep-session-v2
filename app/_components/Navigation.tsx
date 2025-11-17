import { useState } from 'react';
import { Clock, Menu, X } from 'lucide-react';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-linear-to-br from-blue-500 to-emerald-500">
              <Clock className="text-white" size={24} />
            </div>
            <span className="text-white font-bold text-lg hidden sm:inline">DeepSession</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-slate-300 hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('architecture')}
              className="text-slate-300 hover:text-white transition-colors"
            >
              Architecture
            </button>
            <button
              onClick={() => scrollToSection('usecases')}
              className="text-slate-300 hover:text-white transition-colors"
            >
              Use Cases
            </button>
            <button
              onClick={() => scrollToSection('quickstart')}
              className="text-slate-300 hover:text-white transition-colors"
            >
              Get Started
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
              Try Now
            </button>
          </div>

          <button
            className="md:hidden p-2 text-slate-300 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 space-y-3">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('architecture')}
              className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Architecture
            </button>
            <button
              onClick={() => scrollToSection('usecases')}
              className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Use Cases
            </button>
            <button
              onClick={() => scrollToSection('quickstart')}
              className="block w-full text-left px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Get Started
            </button>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
              Try Now
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
