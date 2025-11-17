import { ArrowRight, Play } from 'lucide-react';

export function Hero() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-32 pb-20">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-blue-300 font-medium">Deep Work Reimagined</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight">
                Track Deep Work,
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400"> Offline</span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                DeepSession is a modern web app that helps you track focus sessions with an offline-first architecture. Start anywhere, sync everywhere.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl">
                <Play size={20} />
                Get Started Free
              </button>
              <button className="inline-flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 border border-slate-600">
                Learn More
                <ArrowRight size={20} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-700">
              <div>
                <p className="text-3xl font-bold text-white">100%</p>
                <p className="text-sm text-slate-400">Offline First</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">Instant</p>
                <p className="text-sm text-slate-400">Cross-Device Sync</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-white">Zero</p>
                <p className="text-sm text-slate-400">Data Loss</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl blur-3xl opacity-20"></div>
              <div className="relative bg-slate-800 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Current Session</h3>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>

                  <div className="text-center">
                    <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 font-mono">
                      2:45:32
                    </div>
                    <p className="text-slate-400 text-sm mt-2">Deep Work Session</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-xs text-slate-400">Status</p>
                      <p className="text-white font-semibold mt-1">Active</p>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <p className="text-xs text-slate-400">Syncing</p>
                      <p className="text-white font-semibold mt-1">All Devices</p>
                    </div>
                  </div>

                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-lg transition-colors">
                    End Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
