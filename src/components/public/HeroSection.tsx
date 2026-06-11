"use client";

import * as React from "react";
import Link from "next/link";
import { animate } from "animejs";
import { ArrowRight, Trophy, Users, School, Code } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { HERO_CONTENT, FESTIVAL_STATS } from "@/constants/content";

export function HeroSection() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const orbitRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // 3D Card Orbit Animation via AnimeJS
    if (orbitRef.current) {
      animate(orbitRef.current.querySelectorAll(".orbiting-card"), {
        translateX: function (_: unknown, i: number) {
          const angle = (i * 2 * Math.PI) / 3;
          return Math.cos(angle) * 160;
        },
        translateY: function (_: unknown, i: number) {
          const angle = (i * 2 * Math.PI) / 3;
          return Math.sin(angle) * 120;
        },
        scale: [0.9, 1.1, 0.9],
        rotate: "1turn",
        duration: 20000,
        loop: true,
        direction: "alternate",
        easing: "easeInOutQuad",
      });
    }

    // Gentle floating animation for background aurora mesh
    animate(".aurora-mesh", {
      translateX: ["-5%", "5%"],
      translateY: ["-5%", "5%"],
      duration: 12000,
      loop: true,
      direction: "alternate",
      easing: "easeInOutSine",
    });
  }, []);

  const getStatIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "participants":
        return <Users className="h-5 w-5 text-accent" />;
      case "universities":
        return <School className="h-5 w-5 text-secondary" />;
      case "competitions":
        return <Code className="h-5 w-5 text-primary" />;
      case "prize pool":
        return <Trophy className="h-5 w-5 text-amber-500" />;
      default:
        return null;
    }
  };

  const showcaseCompetitions = [
    { title: "Software Showcase", desc: "1.5L BDT Prize", color: "border-primary/40 shadow-primary/10" },
    { title: "IoT Showcase", desc: "1.8L BDT Prize", color: "border-secondary/40 shadow-secondary/10" },
    { title: "Idea Showcase", desc: "90K BDT Prize", color: "border-accent/40 shadow-accent/10" },
  ];

  return (
    <section
      ref={containerRef}
      className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden border-b border-neutral-900 py-16"
    >
      {/* Aurora Mesh Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="aurora-mesh absolute -top-1/4 -left-1/4 w-[70%] h-[70%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="aurora-mesh absolute -bottom-1/4 -right-1/4 w-[70%] h-[70%] bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-[1px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Side: Copywriting, stats & CTA */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-radius-full border border-neutral-800 bg-neutral-900/50 text-xs font-semibold text-accent font-sans uppercase tracking-wider">
              {HERO_CONTENT.tagline}
            </span>
            <h1 className="text-display-lg sm:text-display-xl font-extrabold tracking-tight font-heading leading-none">
              <span className="bg-linear-to-r from-neutral-50 via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
                {HERO_CONTENT.title}
              </span>
            </h1>
            <p className="text-body-lg sm:text-xl text-neutral-400 font-sans max-w-xl leading-relaxed">
              {HERO_CONTENT.subtitle}
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Link href="/register">
              <Button variant="primary" className="gap-2 group text-base py-3 px-6">
                <span>{HERO_CONTENT.ctaRegister}</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#competitions">
              <Button variant="secondary" className="text-base py-3 px-6">
                <span>{HERO_CONTENT.ctaExplore}</span>
              </Button>
            </Link>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-neutral-900">
            {FESTIVAL_STATS.map((stat) => (
              <div key={stat.label} className="p-4 rounded-radius-md bg-neutral-900/40 border border-neutral-800/50 backdrop-blur-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xl sm:text-2xl font-bold text-neutral-100">
                    {stat.value}
                  </span>
                  {getStatIcon(stat.label)}
                </div>
                <div className="text-xs font-medium text-neutral-500 font-sans uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Orbiting Showcase Cards */}
        <div aria-hidden="true" className="lg:col-span-5 h-[360px] sm:h-[420px] flex items-center justify-center relative select-none">
          {/* Orbit Core (Central Tech Node) */}
          <div className="absolute w-24 h-24 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center backdrop-blur-md shadow-level-4 z-20">
            <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 animate-ping absolute" />
            <Trophy className="h-8 w-8 text-neutral-50" />
          </div>

          {/* Orbit Paths Rings */}
          <div className="absolute w-[320px] h-[240px] rounded-full border border-neutral-800/30 border-dashed rotate-12" />
          <div className="absolute w-[280px] h-[200px] rounded-full border border-neutral-800/20 border-dashed -rotate-12" />

          {/* Orbit container */}
          <div ref={orbitRef} className="absolute inset-0 flex items-center justify-center">
            {showcaseCompetitions.map((comp, idx) => (
              <div
                key={comp.title}
                className={`orbiting-card absolute w-48 p-4 rounded-radius-md border bg-neutral-900/90 shadow-level-3 backdrop-blur-md flex flex-col justify-between ${comp.color} z-10 cursor-default hover:border-neutral-500 transition-colors`}
              >
                <div className="font-heading font-semibold text-sm text-neutral-200">{comp.title}</div>
                <div className="font-mono text-xs text-neutral-400 mt-2">{comp.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
