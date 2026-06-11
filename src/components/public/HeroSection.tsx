"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as TerminalIcon, Brain, Gamepad2, RefreshCw, Shield, Cpu } from "lucide-react";
import { Button } from "@/components/ui/Button";

// ─── Countdown Hook ──────────────────────────────────────────────────────────
type CountdownTick = { days: number; hours: number; minutes: number; seconds: number };

function useCountdown(target: Date): CountdownTick {
  const calc = React.useCallback((): CountdownTick => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  }, [target]);

  const [t, setT] = React.useState<CountdownTick>(calc);
  React.useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [calc]);
  return t;
}

const TERMINAL_LINES = [
  "Initializing csefest2026-cli...",
  "Connecting to Supabase Database...",
  "Session Active: user_id = usr_smuct_4821",
  "Verifying Student ID profile status...",
  "SUCCESS: Student ID verified. Status: VERIFIED",
  "Fetching available competition list...",
  "Creating Team: 'ChronoStrider' (Members: 3)...",
  "Inviting team members via mail...",
  "Sending request to /api/public/registration...",
  "SUCCESS: Registration Draft saved (ID: reg_9201).",
  "Ready for Payment Verification."
];

type ConsoleTab = "overview" | "cli" | "leaderboard";

type TrackId = "hackathon" | "cp" | "ctf" | "robo";

interface Track {
  id: TrackId;
  name: string;
  category: string;
  prize: string;
  capacity: number;
  status: "ONLINE" | "STANDBY" | "CLOSING";
  description: string;
}

const TRACKS: Track[] = [
  {
    id: "hackathon",
    name: "HACKATHON 4.0",
    category: "Software Showcase",
    prize: "50,000 BDT",
    capacity: 82,
    status: "ONLINE",
    description: "36-hour intense product development sprint."
  },
  {
    id: "cp",
    name: "CP CONTEST",
    category: "Competitive Programming",
    prize: "30,000 BDT",
    capacity: 95,
    status: "ONLINE",
    description: "Solve algorithmic problems under IOI rules."
  },
  {
    id: "ctf",
    name: "CYBER CTF",
    category: "Capture The Flag",
    prize: "25,000 BDT",
    capacity: 64,
    status: "STANDBY",
    description: "Jeopardy-style ethical hacking challenge."
  },
  {
    id: "robo",
    name: "ROBO SOCCER",
    category: "Robotics Contest",
    prize: "40,000 BDT",
    capacity: 48,
    status: "CLOSING",
    description: "Autonomous soccer bots competing on the field."
  }
];

export function HeroSection() {
  const FESTIVAL_DATE = React.useMemo(() => new Date("2026-07-18T09:00:00+06:00"), []);
  const timeLeft = useCountdown(FESTIVAL_DATE);
  const [consoleTab, setConsoleTab] = React.useState<ConsoleTab>("overview");
  const [activeTrack, setActiveTrack] = React.useState<TrackId>("hackathon");
  const [terminalLogs, setTerminalLogs] = React.useState<string[]>([]);
  const [isRunning, setIsRunning] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const runTerminalSimulation = React.useCallback(() => {
    setIsRunning(true);
    setTerminalLogs([]);
    let i = 0;
    const interval = setInterval(() => {
      if (i < TERMINAL_LINES.length) {
        setTerminalLogs((prev) => [...prev, TERMINAL_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsRunning(false);
      }
    }, 400);
  }, []);

  React.useEffect(() => {
    if (consoleTab === "cli" && terminalLogs.length === 0 && !isRunning) {
      const timer = setTimeout(() => {
        runTerminalSimulation();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [consoleTab, terminalLogs.length, isRunning, runTerminalSimulation]);

  const padZero = (num: number) => String(num).padStart(2, "0");

  return (
    <section className="relative z-10 max-w-[1280px] mx-auto px-4 md:px-16 pt-4 pb-12 md:pt-8 md:pb-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-center min-h-[500px] md:min-h-[600px]">
      {/* Left Column: Heading & Countdown */}
      <div className="space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary font-sans text-xs font-semibold uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          Registrations Open
        </div>
        
        <h1 className="font-heading text-6xl md:text-8xl font-black tracking-tight text-neutral-50 leading-tight">
          CSE FEST <br />
          <span className="text-primary">2026</span>
        </h1>

        {/* Dynamic Countdown */}
        {mounted ? (
          <div className="grid grid-cols-4 gap-4 max-w-md font-mono select-none">
            <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-850 p-4 rounded-xl text-center">
              <div className="text-3xl font-black text-primary tracking-tight">{padZero(timeLeft.days)}</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-sans font-bold mt-1">Days</div>
            </div>
            <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-850 p-4 rounded-xl text-center">
              <div className="text-3xl font-black text-primary tracking-tight">{padZero(timeLeft.hours)}</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-sans font-bold mt-1">Hrs</div>
            </div>
            <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-850 p-4 rounded-xl text-center">
              <div className="text-3xl font-black text-primary tracking-tight">{padZero(timeLeft.minutes)}</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-sans font-bold mt-1">Mins</div>
            </div>
            <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-850 p-4 rounded-xl text-center">
              <div className="text-3xl font-black text-primary tracking-tight">{padZero(timeLeft.seconds)}</div>
              <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-sans font-bold mt-1">Secs</div>
            </div>
          </div>
        ) : (
          <div className="h-20 max-w-md bg-neutral-900/30 rounded-xl animate-pulse" />
        )}

        <div className="flex flex-wrap gap-4 pt-4">
          <Link href="/register">
            <Button className="bg-primary hover:bg-primary/95 text-white font-heading text-sm font-bold px-8 py-4 h-auto rounded-xl hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-[0.98]">
              Register Now
            </Button>
          </Link>
          <Link href="#about">
            <Button variant="secondary" className="border border-neutral-800 hover:border-neutral-700 bg-neutral-900/40 text-neutral-300 hover:text-neutral-100 font-heading text-sm font-bold px-8 py-4 h-auto rounded-xl transition-all">
              Learn More
            </Button>
          </Link>
        </div>
      </div>

      {/* Right Column: Cyber Console */}
      <div className="relative bg-neutral-900/50 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-neutral-850">
        {/* Terminal Header */}
        <div className="bg-neutral-900/80 px-4 py-3 flex items-center justify-between border-b border-neutral-850">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
          </div>
          <div className="font-mono text-xs text-neutral-500">cyber_console — 80x24</div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-neutral-900/40 border-b border-neutral-850">
          <button
            onClick={() => setConsoleTab("overview")}
            className={`px-6 py-3 font-mono text-sm transition-all border-b-2 font-semibold ${
              consoleTab === "overview"
                ? "text-primary border-primary bg-primary/5"
                : "text-neutral-500 border-transparent hover:text-neutral-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setConsoleTab("cli")}
            className={`px-6 py-3 font-mono text-sm transition-all border-b-2 font-semibold ${
              consoleTab === "cli"
                ? "text-primary border-primary bg-primary/5"
                : "text-neutral-500 border-transparent hover:text-neutral-300"
            }`}
          >
            CLI
          </button>
          <button
            onClick={() => setConsoleTab("leaderboard")}
            className={`px-6 py-3 font-mono text-sm transition-all border-b-2 font-semibold ${
              consoleTab === "leaderboard"
                ? "text-primary border-primary bg-primary/5"
                : "text-neutral-500 border-transparent hover:text-neutral-300"
            }`}
          >
            Leaderboard
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 h-80 overflow-y-auto font-mono text-sm">
          <AnimatePresence mode="wait">
            {consoleTab === "overview" && (() => {
              const currentTrack = TRACKS.find((t) => t.id === activeTrack) || TRACKS[0];
              return (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-6 h-full font-mono text-sm"
                >
                  {/* Left Column: Interactive Cockpit SVG Dial */}
                  <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 120 120" className="w-full h-full">
                      {/* Connecting lines from center to nodes */}
                      <line
                        x1="60"
                        y1="60"
                        x2="60"
                        y2="20"
                        className={`transition-all duration-300 ${
                          activeTrack === "hackathon"
                            ? "stroke-primary stroke-2"
                            : "stroke-neutral-800 stroke-[1.5]"
                        }`}
                      />
                      <line
                        x1="60"
                        y1="60"
                        x2="100"
                        y2="60"
                        className={`transition-all duration-300 ${
                          activeTrack === "cp"
                            ? "stroke-primary stroke-2"
                            : "stroke-neutral-800 stroke-[1.5]"
                        }`}
                      />
                      <line
                        x1="60"
                        y1="60"
                        x2="60"
                        y2="100"
                        className={`transition-all duration-300 ${
                          activeTrack === "ctf"
                            ? "stroke-primary stroke-2"
                            : "stroke-neutral-800 stroke-[1.5]"
                        }`}
                      />
                      <line
                        x1="60"
                        y1="60"
                        x2="20"
                        y2="60"
                        className={`transition-all duration-300 ${
                          activeTrack === "robo"
                            ? "stroke-primary stroke-2"
                            : "stroke-neutral-800 stroke-[1.5]"
                        }`}
                      />

                      {/* Rotating Outer Coordinates ring */}
                      <circle
                        cx="60"
                        cy="60"
                        r="48"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="4 4"
                        className="stroke-neutral-800/60 stroke-[1] animate-[spin_40s_linear_infinite] origin-center"
                      />

                      {/* Rotating Inner ring */}
                      <circle
                        cx="60"
                        cy="60"
                        r="30"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray="6 3"
                        className="stroke-neutral-800 stroke-[1] animate-[spin_20s_linear_infinite_reverse] origin-center"
                      />

                      {/* Pulsing Core */}
                      <circle
                        cx="60"
                        cy="60"
                        r="8"
                        className="fill-primary/10 stroke-primary/30 stroke-[1]"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="4"
                        className="fill-primary animate-pulse"
                      />

                      {/* Nodes */}
                      {/* Top Node: Hackathon */}
                      <g className="cursor-pointer group" onClick={() => setActiveTrack("hackathon")}>
                        <circle
                          cx="60"
                          cy="20"
                          r="6"
                          className={`transition-all duration-300 ${
                            activeTrack === "hackathon"
                              ? "fill-primary stroke-primary/50 stroke-4"
                              : "fill-neutral-900 stroke-neutral-700 hover:stroke-neutral-500 hover:fill-neutral-850"
                          }`}
                        />
                        {activeTrack === "hackathon" && (
                          <circle cx="60" cy="20" r="10" fill="none" className="stroke-primary/40 stroke-[1.5] animate-ping" />
                        )}
                        <text x="60" y="10" textAnchor="middle" className="fill-neutral-500 text-[6px] font-sans font-bold group-hover:fill-neutral-400">HACK</text>
                      </g>

                      {/* Right Node: CP */}
                      <g className="cursor-pointer group" onClick={() => setActiveTrack("cp")}>
                        <circle
                          cx="100"
                          cy="60"
                          r="6"
                          className={`transition-all duration-300 ${
                            activeTrack === "cp"
                              ? "fill-primary stroke-primary/50 stroke-4"
                              : "fill-neutral-900 stroke-neutral-700 hover:stroke-neutral-500 hover:fill-neutral-850"
                          }`}
                        />
                        {activeTrack === "cp" && (
                          <circle cx="100" cy="60" r="10" fill="none" className="stroke-primary/40 stroke-[1.5] animate-ping" />
                        )}
                        <text x="112" y="62" textAnchor="start" className="fill-neutral-500 text-[6px] font-sans font-bold group-hover:fill-neutral-400">CP</text>
                      </g>

                      {/* Bottom Node: CTF */}
                      <g className="cursor-pointer group" onClick={() => setActiveTrack("ctf")}>
                        <circle
                          cx="60"
                          cy="100"
                          r="6"
                          className={`transition-all duration-300 ${
                            activeTrack === "ctf"
                              ? "fill-primary stroke-primary/50 stroke-4"
                              : "fill-neutral-900 stroke-neutral-700 hover:stroke-neutral-500 hover:fill-neutral-850"
                          }`}
                        />
                        {activeTrack === "ctf" && (
                          <circle cx="60" cy="100" r="10" fill="none" className="stroke-primary/40 stroke-[1.5] animate-ping" />
                        )}
                        <text x="60" y="113" textAnchor="middle" className="fill-neutral-500 text-[6px] font-sans font-bold group-hover:fill-neutral-400">CTF</text>
                      </g>

                      {/* Left Node: Robo */}
                      <g className="cursor-pointer group" onClick={() => setActiveTrack("robo")}>
                        <circle
                          cx="20"
                          cy="60"
                          r="6"
                          className={`transition-all duration-300 ${
                            activeTrack === "robo"
                              ? "fill-primary stroke-primary/50 stroke-4"
                              : "fill-neutral-900 stroke-neutral-700 hover:stroke-neutral-500 hover:fill-neutral-850"
                          }`}
                        />
                        {activeTrack === "robo" && (
                          <circle cx="20" cy="60" r="10" fill="none" className="stroke-primary/40 stroke-[1.5] animate-ping" />
                        )}
                        <text x="8" y="62" textAnchor="end" className="fill-neutral-500 text-[6px] font-sans font-bold group-hover:fill-neutral-400">ROBO</text>
                      </g>
                    </svg>
                  </div>

                  {/* Right Column: Track Information Dashboard */}
                  <div className="flex-1 w-full space-y-4 font-mono select-text">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">
                          [SYS_COCKPIT: {currentTrack.category}]
                        </span>
                        <span className="text-[10px] text-neutral-500 font-bold bg-neutral-950 px-2 py-0.5 rounded border border-neutral-850">
                          {activeTrack.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {activeTrack === "hackathon" && <TerminalIcon className="h-5 w-5 text-secondary" />}
                        {activeTrack === "cp" && <Brain className="h-5 w-5 text-primary" />}
                        {activeTrack === "ctf" && <Shield className="h-5 w-5 text-tertiary" />}
                        {activeTrack === "robo" && <Cpu className="h-5 w-5 text-accent" />}
                        <h3 className="text-base font-black text-neutral-100 font-heading">
                          {currentTrack.name}
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-400 font-sans mt-2 leading-relaxed">
                        {currentTrack.description}
                      </p>
                    </div>

                    {/* Progress Fill capacity */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-neutral-500 font-bold">
                        <span>FLOW_CAPACITY_LIMIT</span>
                        <span className="text-primary">{currentTrack.capacity}% FILLED</span>
                      </div>
                      <div className="h-3 w-full bg-neutral-950 rounded border border-neutral-850 overflow-hidden p-[2px] flex gap-[2px]">
                        {Array.from({ length: 12 }).map((_, i) => {
                          const filled = i < Math.round((currentTrack.capacity / 100) * 12);
                          return (
                            <div
                              key={i}
                              className={`h-full flex-1 rounded-[1px] transition-all duration-300 ${
                                filled
                                  ? "bg-primary shadow-[0_0_4px_rgba(99,102,241,0.6)]"
                                  : "bg-neutral-900/60"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Telemetry Metrics Footer */}
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-neutral-850/60 text-[9px] font-sans text-neutral-500">
                      <div>
                        <span className="block text-neutral-600 font-bold uppercase tracking-wider">PRIZE POOL</span>
                        <span className="text-xs font-mono font-bold text-accent">{currentTrack.prize}</span>
                      </div>
                      <div>
                        <span className="block text-neutral-600 font-bold uppercase tracking-wider">TELEMETRY_STATUS</span>
                        <span className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              currentTrack.status === "ONLINE"
                                ? "bg-success animate-pulse"
                                : currentTrack.status === "STANDBY"
                                ? "bg-warning animate-pulse"
                                : "bg-error"
                            }`}
                          />
                          <span className="font-mono font-bold text-neutral-300">
                            {currentTrack.status}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {consoleTab === "cli" && (
              <motion.div
                key="cli"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 font-mono text-xs"
              >
                <div className="flex justify-between items-center mb-4">
                  <span className="text-neutral-400">Activity CLI</span>
                  <button
                    onClick={runTerminalSimulation}
                    disabled={isRunning}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-neutral-950 border border-neutral-850 hover:bg-neutral-900/80 text-[10px] text-neutral-300 disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3 w-3 ${isRunning ? "animate-spin" : ""}`} />
                    <span>Restart</span>
                  </button>
                </div>
                <div className="space-y-1">
                  {terminalLogs.map((log, idx) => {
                    const isSuccess = log.startsWith("SUCCESS");
                    return (
                      <div key={idx} className={isSuccess ? "text-success" : "text-neutral-400"}>
                        &gt; {log}
                      </div>
                    );
                  })}
                  {isRunning && (
                    <div className="text-primary animate-pulse">&gt; _</div>
                  )}
                </div>
              </motion.div>
            )}

            {consoleTab === "leaderboard" && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="border border-neutral-850 rounded-xl overflow-hidden bg-neutral-950/40">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-neutral-850 bg-neutral-900/30 text-neutral-400 font-bold uppercase tracking-wider">
                        <th className="p-3">Team</th>
                        <th className="p-3">Institution</th>
                        <th className="p-3 text-right">Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850 text-neutral-300 font-mono">
                      {[
                        { rank: 1, name: "ChronoStrider", inst: "SMUCT", score: "960 pts", active: true },
                        { rank: 2, name: "ByteBenders", inst: "BUET", score: "935 pts" },
                        { rank: 3, name: "ZeroDay", inst: "DU", score: "895 pts" },
                        { rank: 4, name: "DU_Alpha", inst: "DU", score: "870 pts" },
                      ].map((team) => (
                        <tr key={team.name} className="hover:bg-neutral-900/20">
                          <td className="p-3 font-semibold flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] text-neutral-200">
                              {team.rank}
                            </span>
                            {team.name}
                          </td>
                          <td className="p-3 text-neutral-400 font-sans">{team.inst}</td>
                          <td className={`p-3 text-right font-bold ${team.active ? "text-primary" : "text-neutral-300"}`}>{team.score}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
