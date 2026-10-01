import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { 
  Zap, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Layers, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Database,
  Radio,
  FileCheck2
} from "lucide-react";

interface ReactorSceneProps {
  runResult: string;
  mismatchedCount: number;
  matchedCount: number;
  totalClaims: number;
  latestClaimId?: string;
}

export function ReactorScene({
  runResult,
  mismatchedCount,
  matchedCount,
  totalClaims,
  latestClaimId,
}: ReactorSceneProps) {
  const [pulseActive, setPulseActive] = useState(true);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-slate-950/80 p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl md:p-8">
      {/* Background Cyber Grid & Glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(6,182,212,0.18)_0%,rgba(147,51,234,0.08)_45%,transparent_70%)]" />
      <div 
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage: "linear-gradient(to right, rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(6,182,212,0.3) 1px, transparent 1px)",
          backgroundSize: "32px 32px"
        }}
      />

      {/* Header Tagline & Engine Status */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-cyan-900/50 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 items-center justify-center">
            <span className="absolute h-3 w-3 animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-cyan-300" />
          </div>
          <span className="font-mono text-xs tracking-widest text-cyan-400 uppercase">
            AUTONOMOUS PROOF ENGINE // SCAN CYCLE ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Activity className="h-3.5 w-3.5 text-cyan-400" />
            LATENCY: <strong className="text-cyan-300">0.02s</strong>
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            PROOF: <strong className="text-emerald-300">VALIDATED</strong>
          </span>
        </div>
      </div>

      {/* Central Cyber Reactor Section */}
      <div className="relative z-10 my-8 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        {/* Left Telemetry: CLAIMED SPECIFICATION */}
        <div className="space-y-3 rounded-xl border border-cyan-500/20 bg-slate-900/60 p-4 font-mono text-xs backdrop-blur lg:col-span-3">
          <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
            <span className="flex items-center gap-2 font-semibold text-cyan-400 uppercase tracking-wider">
              <Cpu className="h-4 w-4 text-cyan-400" />
              CLAIMED SPEC
            </span>
            <span className="rounded bg-cyan-950 px-1.5 py-0.5 text-[10px] text-cyan-300 border border-cyan-700/50">
              EXPECTED
            </span>
          </div>
          <div className="space-y-2 text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">RECON KEY:</span>
              <span className="text-cyan-200">prod.edge.auth</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">VERSION:</span>
              <span className="text-slate-200">v2.4.1</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">AUTHORITY:</span>
              <span className="text-emerald-400">FOUNDER_KEY</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">TOTAL CLAIMS:</span>
              <span className="text-cyan-300 font-bold">{totalClaims}</span>
            </div>
          </div>
        </div>

        {/* Center: Glowing Cyber Reactor Core */}
        <div className="relative flex flex-col items-center justify-center lg:col-span-6">
          <div className="relative flex h-64 w-64 items-center justify-center md:h-72 md:w-72">
            {/* Outer Rotating Energy Ring */}
            <div className="absolute inset-0 animate-[spin_24s_linear_infinite] rounded-full border border-dashed border-cyan-400/40 shadow-[0_0_30px_rgba(6,182,212,0.2)]" />
            
            {/* Mid Counter-Rotating Accent Ring */}
            <div className="absolute inset-3 animate-[spin_16s_linear_infinite_reverse] rounded-full border border-cyan-500/30" />
            
            {/* Pulsing Energy Glow Ring */}
            <div className="absolute inset-8 animate-pulse rounded-full border border-purple-500/40 bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/20" />
            
            {/* Radial Core Orb */}
            <div className="relative flex h-44 w-44 flex-col items-center justify-center rounded-full border-2 border-cyan-400/70 bg-gradient-to-b from-slate-950 via-cyan-950/40 to-slate-950 shadow-[0_0_50px_rgba(6,182,212,0.5)]">
              {/* Scanline Sweep Effect */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
                <div className="h-1 w-full animate-[bounce_3s_ease-in-out_infinite] bg-cyan-400/30 opacity-75 blur-xs" />
              </div>

              <span className="font-mono text-[10px] tracking-widest text-cyan-400/80 uppercase">
                RECONCILIATION
              </span>
              <span className="my-1 font-mono text-3xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.9)] md:text-4xl">
                98.7%
              </span>
              <span className="rounded-full bg-cyan-950/90 px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-cyan-300 border border-cyan-500/50">
                {runResult}
              </span>
            </div>

            {/* Orbiting Satellite Badges */}
            <div className="absolute -top-3 rounded-full border border-cyan-400/60 bg-slate-900/90 px-3 py-1 font-mono text-[10px] text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              SYNCED // 12ms
            </div>
            <div className="absolute -bottom-3 rounded-full border border-purple-400/60 bg-slate-900/90 px-3 py-1 font-mono text-[10px] text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              DRIFT: 0.00%
            </div>
          </div>

          <p className="mt-4 text-center font-mono text-xs text-cyan-400/70">
            SYSTEM NOMINAL // CONTINUOUS FIELD-BY-FIELD RECONCILIATION
          </p>
        </div>

        {/* Right Telemetry: OBSERVED REALITY */}
        <div className="space-y-3 rounded-xl border border-purple-500/20 bg-slate-900/60 p-4 font-mono text-xs backdrop-blur lg:col-span-3">
          <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
            <span className="flex items-center gap-2 font-semibold text-purple-400 uppercase tracking-wider">
              <Zap className="h-4 w-4 text-purple-400" />
              OBSERVED STATE
            </span>
            <span className="rounded bg-purple-950 px-1.5 py-0.5 text-[10px] text-purple-300 border border-purple-700/50">
              WITNESSED
            </span>
          </div>
          <div className="space-y-2 text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">MATCHED:</span>
              <span className="text-emerald-400 font-bold">{matchedCount} fields</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">MISMATCHES:</span>
              <span className={mismatchedCount > 0 ? "text-amber-400 font-bold" : "text-slate-400"}>
                {mismatchedCount} detected
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">WITNESS SOURCE:</span>
              <span className="text-purple-300">Independent Ledger</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">RECEIPT STATUS:</span>
              <span className="text-cyan-300 font-semibold">CRYPTOGRAPHIC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cyber CTA Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-cyan-900/40">
        <Link
          to="/claims"
          className="group flex items-center gap-2 rounded-xl border border-cyan-400/80 bg-cyan-500/20 px-6 py-3 font-mono text-sm font-bold text-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all hover:bg-cyan-500/30 hover:shadow-[0_0_35px_rgba(6,182,212,0.55)]"
        >
          <Zap className="h-4 w-4 text-cyan-300 transition-transform group-hover:scale-110" />
          INITIALIZE RECON SCAN →
        </Link>
        <Link
          to="/receipts"
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-6 py-3 font-mono text-sm text-slate-300 transition-all hover:border-slate-500 hover:bg-slate-800 hover:text-white"
        >
          <FileCheck2 className="h-4 w-4 text-slate-400" />
          INSPECT WITNESS LEDGER
        </Link>
      </div>
    </section>
  );
}
