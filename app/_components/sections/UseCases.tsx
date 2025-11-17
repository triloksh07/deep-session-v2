import { Laptop, BookOpen, Briefcase, Zap } from 'lucide-react';

const useCases = [
  {
    icon: Laptop,
    title: 'Software Developers',
    description: 'Track coding sessions, maintain deep focus, and analyze productivity patterns across multiple projects.',
    benefit: 'Stay in the zone without distractions',
  },
  {
    icon: BookOpen,
    title: 'Writers & Creators',
    description: 'Monitor writing sessions, set daily word-count goals, and track creative momentum over time.',
    benefit: 'Publish consistently and hit deadlines',
  },
  {
    icon: Briefcase,
    title: 'Professionals',
    description: 'Log billable hours, track project time, and generate detailed reports for client invoicing.',
    benefit: 'Accurate time tracking on the go',
  },
  {
    icon: Zap,
    title: 'Students',
    description: 'Build study habits, track focus sessions, and visualize your academic progress weekly.',
    benefit: 'Study smarter and stay motivated',
  },
];

export function UseCases() {
  return (
    <section className="py-20 bg-slate-950 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Built for Everyone
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Whether you're coding, writing, working, or studying—DeepSession helps you track and improve your focus.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <div
                key={index}
                className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-8 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20 group-hover:from-emerald-500/30 group-hover:to-blue-500/30 transition-colors">
                      <Icon className="h-6 w-6 text-emerald-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-3">
                      {useCase.description}
                    </p>
                    <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium">
                      <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>
                      {useCase.benefit}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded-xl p-12">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                Productivity Insights
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="text-emerald-400 font-bold">•</span>
                  Visualize your best focus hours
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="text-emerald-400 font-bold">•</span>
                  Track long-term productivity trends
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="text-emerald-400 font-bold">•</span>
                  Identify what helps you focus best
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <span className="text-emerald-400 font-bold">•</span>
                  Export data for deeper analysis
                </li>
              </ul>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">This Week</span>
                  <span className="text-white font-semibold">24h 35m</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full w-3/4"></div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-700">
                  <div>
                    <p className="text-xs text-slate-400">Sessions</p>
                    <p className="text-xl font-bold text-white">12</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Avg. Duration</p>
                    <p className="text-xl font-bold text-white">2h 3m</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Best Day</p>
                    <p className="text-xl font-bold text-white">6h 24m</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
