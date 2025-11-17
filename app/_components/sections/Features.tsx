import {
  Wifi,
  Smartphone,
  Clock,
  Lock,
  BarChart3,
  Download,
  Target,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Wifi,
    title: 'Offline-First',
    description: 'Start, stop, and manage your timer with zero internet connection. Data syncs automatically when online.',
  },
  {
    icon: Smartphone,
    title: 'Real-Time Cross-Device',
    description: 'Start a timer on desktop and see it ticking live on your phone instantly.',
  },
  {
    icon: Clock,
    title: 'Robust Timer',
    description: 'The timer survives browser reloads and tab closures with persistent session tracking.',
  },
  {
    icon: Lock,
    title: 'Secure Auth',
    description: 'Sign in with Email/Password, Google, or GitHub with enterprise-grade security.',
  },
  {
    icon: BarChart3,
    title: 'Session History',
    description: 'Detailed logs of all past sessions with seamless data migration from previous versions.',
  },
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Create and manage daily, weekly, or monthly focus goals with progress visualization.',
  },
  {
    icon: BarChart3,
    title: 'Data Analytics',
    description: 'Visualize productivity with interactive charts, graphs, and performance metrics.',
  },
  {
    icon: Download,
    title: 'Data Export',
    description: 'Download session and goal data as JSON or CSV for backup and external analysis.',
  },
];

export function Features() {
  return (
    <section className="py-20 bg-slate-950 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Powerful features designed for deep work, built on a modern, scalable architecture.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-blue-500/50 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-lg mb-4 group-hover:from-blue-500/30 group-hover:to-emerald-500/30 transition-colors">
                  <Icon className="text-blue-400" size={24} />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
