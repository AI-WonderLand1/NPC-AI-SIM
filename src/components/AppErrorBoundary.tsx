import React from 'react';

interface AppErrorBoundaryState {
  error: string | null;
}

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      error: error instanceof Error ? error.message : 'The NPC editor hit an unexpected browser error.',
    };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error('[NPC-AI-SIM] application error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#030811] p-6 text-zinc-100">
          <section className="w-full max-w-xl rounded-2xl border border-red-500/30 bg-[#08111f] p-7 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-300">NPC-AI-SIM recovery mode</p>
            <h1 className="mt-3 text-2xl font-semibold">The editor failed to initialize.</h1>
            <p className="mt-3 break-words text-sm leading-6 text-zinc-300">{this.state.error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-medium text-sky-200 hover:bg-sky-500/20"
            >
              Reload editor
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
