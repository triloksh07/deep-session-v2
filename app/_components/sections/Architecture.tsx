import { Database, Server, Code2 } from 'lucide-react';

const techStack = [
  {
    category: 'Frontend',
    items: ['React 18', 'TypeScript', 'Tailwind CSS', 'Lucide React'],
  },
  {
    category: 'Framework',
    items: ['Next.js', 'Vite Build System', 'Modern Tooling'],
  },
  {
    category: 'Backend & Data',
    items: ['Firebase', 'Firestore db/auth', 'Real-time Sync'],
  },
];

const stateLayers = [
  {
    title: 'Server State',
    subtitle: 'TanStack Query',
    description: 'Powerful caching, request de-duplication, and automatic background refetching for all server-side lists.',
    icon: Server,
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Live Client State',
    subtitle: 'Zustand',
    description: 'Fast, optimistic UI for live timer and immediate state, decoupled from component rendering.',
    icon: Code2,
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    title: 'Real-time & Offline',
    subtitle: 'Firestore Sync',
    description: 'Two-way sync with local persistence. Offline changes sync automatically when back online.',
    icon: Database,
    color: 'from-amber-500 to-orange-600',
  },
];

export function Architecture() {
  return (
    <section className="py-20 bg-slate-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Built for Scale
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Modern architecture with three distinct state layers for reliability and performance.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {stateLayers.map((layer, index) => {
            const Icon = layer.icon;
            return (
              <div
                key={index}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-8 hover:border-slate-600 transition-all duration-300"
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br ${layer.color} mb-6`}
                >
                  <Icon className="text-white" size={28} />
                </div>

                <h3 className="text-xl font-semibold text-white mb-1">
                  {layer.title}
                </h3>
                <p className="text-sm text-blue-400 font-medium mb-3">
                  {layer.subtitle}
                </p>
                <p className="text-slate-400 leading-relaxed">
                  {layer.description}
                </p>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-12">
          <h3 className="text-2xl font-semibold text-white mb-12">
            Complete Tech Stack
          </h3>

          <div className="grid md:grid-cols-3 gap-12">
            {techStack.map((stack, index) => (
              <div key={index}>
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  {stack.category}
                </h4>
                <ul className="space-y-3">
                  {stack.items.map((item, itemIndex) => (
                    <li
                      key={itemIndex}
                      className="text-slate-400 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-blue-500/5 border border-blue-500/20 rounded-xl p-8">
          <h4 className="text-lg font-semibold text-white mb-4">
            Why This Architecture?
          </h4>
          <ul className="space-y-3 text-slate-300">
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">✓</span>
              <span>Reliable offline experience with automatic sync when connected</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">✓</span>
              <span>Lightning-fast UI updates with optimistic state management</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">✓</span>
              <span>Seamless cross-device synchronization in real-time</span>
            </li>
            <li className="flex gap-3">
              <span className="text-blue-400 font-bold">✓</span>
              <span>Scalable foundation ready for production use</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
