import { CheckCircle2, Github, Code2 } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Clone the Repository',
    description: 'Get the latest version of DeepSession from GitHub',
    code: 'git clone https://github.com/yourusername/deepsession-v2.git',
  },
  {
    number: 2,
    title: 'Configure Supabase',
    description: 'Set up your database and authentication',
    code: 'cp .env.example .env.local\n# Add your Supabase credentials',
  },
  {
    number: 3,
    title: 'Start Building',
    description: 'Install dependencies and run the dev server',
    code: 'npm install\nnpm run dev',
  },
];

export function QuickStart() {
  return (
    <section className="py-20 bg-slate-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Get Started in Minutes
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Three simple steps to start building with DeepSession.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative"
            >
              {step.number < 3 && (
                <div className="hidden md:block absolute top-16 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-transparent"></div>
              )}

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 mb-4">
                  <span className="text-white font-bold">{step.number}</span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-sm mb-4">
                  {step.description}
                </p>

                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto">
                  {step.code}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded-xl p-12">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-6">
                What's Included
              </h3>
              <ul className="space-y-4">
                {[
                  'Offline-first timer with persistent storage',
                  'Real-time cross-device synchronization',
                  'Secure authentication (Email, Google, GitHub)',
                  'Session history and analytics dashboard',
                  'Goal tracking and progress visualization',
                  'Data export (JSON & CSV formats)',
                  'Responsive design for all devices',
                  'Production-ready architecture',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="text-emerald-400 flex-shrink-0 mt-0.5" size={20} />
                    <span className="text-slate-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Code2 size={20} className="text-blue-400" />
                  Tech Stack
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {['React 18', 'TypeScript', 'Tailwind CSS', 'Supabase', 'TanStack Query', 'Zustand', 'Next.js', 'Firebase'].map(
                    (tech, index) => (
                      <div key={index} className="bg-slate-700/50 rounded px-3 py-2 text-sm text-slate-300">
                        {tech}
                      </div>
                    )
                  )}
                </div>
              </div>

              <a
                href="#"
                className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                <Github size={20} />
                View Full Documentation
              </a>

              <p className="text-center text-slate-400 text-sm">
                Questions? Check out our comprehensive guides and API documentation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
