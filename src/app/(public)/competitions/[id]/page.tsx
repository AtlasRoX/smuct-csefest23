"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trophy, Users, Shield, Calendar, CreditCard, ChevronRight } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { COMPETITIONS_CATALOG } from "@/constants/content";

export default function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"overview" | "rules" | "prizes">("overview");

  const compId = params?.id as string;
  const competition = COMPETITIONS_CATALOG.find((c) => c.id === compId);

  if (!competition) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-950">
        <Navbar />
        <div className="grow flex flex-col items-center justify-center py-24 px-4 text-center">
          <h2 className="text-h3 font-heading font-bold text-neutral-300 mb-4">Competition Not Found</h2>
          <p className="text-sm text-neutral-500 font-sans mb-6">
            The competition you are looking for does not exist or has been archived.
          </p>
          <Link href="/competitions">
            <Button variant="primary">Return to Catalog</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href="/competitions"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Competitions</span>
          </Link>
        </div>

        {/* Hero Area */}
        <div className="relative rounded-radius-lg border border-neutral-800 bg-neutral-900/30 p-8 overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-r from-primary/10 to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="accent" className="text-xs uppercase">
                  {competition.type}
                </Badge>
                <Badge variant="primary" className="text-xs uppercase">
                  Registration Open
                </Badge>
              </div>
              <h1 className="text-h2 font-bold font-heading text-neutral-50">{competition.name}</h1>
              <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-2xl leading-relaxed">
                {competition.shortDescription}
              </p>
            </div>
            <div className="shrink-0">
              <Link href="/register">
                <Button variant="primary" className="w-full md:w-auto text-base py-3 px-6 gap-2">
                  <span>Register Now</span>
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Info Tabs */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tabs Selector */}
            <div className="flex border-b border-neutral-800/80 gap-6">
              {(["overview", "rules", "prizes"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3.5 text-sm font-semibold tracking-wide font-sans capitalize transition-colors border-b-2 outline-none ${
                    activeTab === tab
                      ? "border-accent text-accent"
                      : "border-transparent text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="bg-neutral-900/20 border border-neutral-850 p-6 rounded-radius-md font-sans leading-relaxed text-neutral-300">
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <h3 className="font-heading text-lg font-semibold text-neutral-200">Exhibition Overview</h3>
                  <p>{competition.description}</p>
                  <p className="text-sm text-neutral-400">
                    Proposals will be reviewed during Phase 1. High-performing teams will advance to Phase 2, requiring offline project presentation and hardware demos.
                  </p>
                </div>
              )}

              {activeTab === "rules" && (
                <div className="space-y-4">
                  <h3 className="font-heading text-lg font-semibold text-neutral-200">Exhibition Rules</h3>
                  <ul className="list-disc list-inside space-y-2.5 text-neutral-300 text-sm">
                    <li>Projects must be original software or hardware systems.</li>
                    <li>Plagiarism or using pre-compiled templates will result in instant disqualification.</li>
                    <li>One user can register in only one team for this competition.</li>
                    <li>Submissions must be uploaded as a Google Docs proposal before the deadline.</li>
                    <li>All team members must complete student profile verification prior to registration.</li>
                  </ul>
                </div>
              )}

              {activeTab === "prizes" && (
                <div className="space-y-4">
                  <h3 className="font-heading text-lg font-semibold text-neutral-200">Prize Distributions</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    <div className="p-4 rounded-radius-sm bg-neutral-950 border border-neutral-800 text-center">
                      <Trophy className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Champion</div>
                      <div className="font-mono text-base font-bold text-neutral-200">{competition.championPrize}</div>
                    </div>
                    <div className="p-4 rounded-radius-sm bg-neutral-950 border border-neutral-800 text-center">
                      <Trophy className="h-6 w-6 text-neutral-300 mx-auto mb-2" />
                      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Runner Up</div>
                      <div className="font-mono text-base font-bold text-neutral-200">{competition.runnerUpPrize}</div>
                    </div>
                    <div className="p-4 rounded-radius-sm bg-neutral-950 border border-neutral-800 text-center">
                      <Trophy className="h-6 w-6 text-amber-700 mx-auto mb-2" />
                      <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">2nd Runner Up</div>
                      <div className="font-mono text-base font-bold text-neutral-200">{competition.secondRunnerUp}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div className="lg:col-span-4 space-y-6">
            <Card variant="default">
              <CardHeader>
                <h3 className="text-base font-semibold font-heading text-neutral-200">Showcase Metadata</h3>
              </CardHeader>
              <CardContent className="space-y-4 font-sans text-sm">
                <div className="flex items-center gap-3 py-2 border-b border-neutral-800/60">
                  <Trophy className="h-4 w-4 text-accent shrink-0" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-neutral-500">Prize Pool</span>
                    <span className="font-semibold text-neutral-200">{competition.prizePool}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-neutral-800/60">
                  <Users className="h-4 w-4 text-secondary shrink-0" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-neutral-500">Team Members</span>
                    <span className="font-semibold text-neutral-200">{competition.teamSize}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2 border-b border-neutral-800/60">
                  <CreditCard className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-neutral-500">Registration Fee</span>
                    <span className="font-semibold text-neutral-200 font-mono">{competition.fee}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Shield className="h-4 w-4 text-success shrink-0" />
                  <div className="flex-1 flex justify-between">
                    <span className="text-neutral-500">Eligibility</span>
                    <span className="font-semibold text-neutral-200 capitalize">{competition.eligibility} Only</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
