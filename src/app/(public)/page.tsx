"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronDown, Trophy, Users, Shield, Calendar, ArrowUpRight } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface FAQData {
  question: string;
  answer: string;
}
import { Navbar } from "@/components/shared/Navbar";
import { NewsTicker } from "@/components/public/NewsTicker";
import { HeroSection } from "@/components/public/HeroSection";
import { Footer } from "@/components/shared/Footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { COMPETITIONS_CATALOG, TIMELINE_ITEMS, HOMEPAGE_FAQS } from "@/constants/content";

export default function PublicHomePage() {
  const [activeFaqIndex, setActiveFaqIndex] = React.useState<number | null>(null);
  const { data } = useSWR("/api/public/cms/faqs", fetcher);

  const faqList = React.useMemo(() => {
    if (data && data.success && data.data && data.data.length > 0) {
      return data.data as FAQData[];
    }
    return HOMEPAGE_FAQS;
  }, [data]);

  const toggleFaq = (index: number) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
  };

  const getCompIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "showcase":
        return <Trophy className="h-5 w-5 text-accent" />;
      case "programming":
        return <Users className="h-5 w-5 text-secondary" />;
      case "security":
        return <Shield className="h-5 w-5 text-primary" />;
      default:
        return <Calendar className="h-5 w-5 text-neutral-400" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Navbar Navigation */}
      <Navbar />

      {/* Scrolling News Ticker Updates */}
      <NewsTicker />

      {/* Main Hero Showcase */}
      <HeroSection />

      {/* About Section */}
      <section id="about" className="py-24 border-b border-neutral-900 bg-neutral-950/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-6 text-left">
            <h2 className="text-h3 sm:text-h2 font-bold font-heading text-neutral-50">
              About The Festival
            </h2>
            <p className="text-body sm:text-body-lg text-neutral-400 font-sans leading-relaxed">
              Jointly organized by the <strong>Department of Computer Science & Engineering (CSE)</strong> and the <strong>Department of Computer Science & Information Technology (CSIT)</strong> of Shanto-Mariam University of Creative Technology (SMUCT). 
            </p>
            <p className="text-body text-neutral-400 font-sans leading-relaxed">
              CSE Fest 2026 brings together brilliant minds from academic institutions across Bangladesh. Over the course of the event, participants will showcase software products, build hardware prototypes, write competitive algorithms, and engage with technology professionals.
            </p>
          </div>
        </div>
      </section>

      {/* Competitions Showcase Grid */}
      <section id="competitions" className="py-24 border-b border-neutral-900 bg-neutral-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 space-y-4">
            <h2 className="text-h3 sm:text-h2 font-bold font-heading text-neutral-50">
              External Showcases
            </h2>
            <p className="text-body text-neutral-400 font-sans max-w-2xl leading-relaxed">
              Open to students from all public and private universities across Bangladesh. Form your team and compete for massive rewards.
            </p>
          </div>

          {/* Cards catalog grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {COMPETITIONS_CATALOG.map((comp) => (
              <Card key={comp.id} hoverable variant="default" className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 rounded-radius-sm bg-neutral-950 border border-neutral-800">
                      {getCompIcon(comp.type)}
                    </div>
                    <Badge variant="accent" className="capitalize">
                      {comp.eligibility}
                    </Badge>
                  </div>
                  <CardTitle className="mb-2 text-xl font-heading">{comp.name}</CardTitle>
                  <CardDescription className="text-neutral-400 line-clamp-3 leading-relaxed">
                    {comp.shortDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-4">
                  <div className="space-y-2.5 font-sans text-sm border-t border-neutral-800/60 pt-4">
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-medium">Team Limit:</span>
                      <span className="text-neutral-300 font-semibold">{comp.teamSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-medium">Entry Fee:</span>
                      <span className="text-neutral-300 font-semibold font-mono">{comp.fee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500 font-medium">Prize Pool:</span>
                      <span className="text-accent font-semibold font-mono">{comp.prizePool}</span>
                    </div>
                  </div>
                  <div className="pt-6">
                    <Link href={`/competitions/${comp.id}`}>
                      <Button variant="secondary" className="w-full gap-2 justify-center">
                        <span>View Details</span>
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Timeline Section */}
      <section id="timeline" className="py-24 border-b border-neutral-900 bg-neutral-950/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 space-y-4">
            <h2 className="text-h3 sm:text-h2 font-bold font-heading text-neutral-50">
              Event Timeline
            </h2>
            <p className="text-body text-neutral-400 font-sans max-w-2xl leading-relaxed">
              Track the milestones leading up to the main exhibition and offline contests on July 18, 2026.
            </p>
          </div>

          {/* Timeline Nodes */}
          <div className="relative pl-6 md:pl-8 border-l border-neutral-800 space-y-12 max-w-3xl ml-4">
            {TIMELINE_ITEMS.map((item, idx) => (
              <div key={item.title} className="relative group">
                {/* Node Dot indicator */}
                <span className="absolute left-[-31px] md:left-[-39px] top-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-neutral-950 border border-neutral-700 group-hover:border-accent group-hover:bg-accent/20 transition-all duration-150">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 group-hover:bg-accent transition-all duration-150" />
                </span>
                <div className="space-y-1.5">
                  <span className="font-mono text-xs font-semibold text-accent tracking-wider uppercase block">
                    {item.date}
                  </span>
                  <h3 className="font-heading font-semibold text-lg text-neutral-200">
                    {item.title}
                  </h3>
                  <p className="text-sm font-sans text-neutral-400 leading-relaxed max-w-xl">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-24 border-b border-neutral-900 bg-neutral-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 space-y-4">
            <h2 className="text-h3 sm:text-h2 font-bold font-heading text-neutral-50">
              Frequently Asked Questions
            </h2>
            <p className="text-body text-neutral-400 font-sans max-w-2xl leading-relaxed">
              Everything you need to know about registering, submissions, and competition rules.
            </p>
          </div>

          {/* Accordion Panels */}
          <div className="space-y-4 max-w-3xl">
            {faqList.map((faq, idx) => {
              const isExpanded = activeFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-radius-sm border border-neutral-800/80 bg-neutral-900/40 overflow-hidden transition-all duration-150"
                >
                  <button
                    id={`faq-button-${idx}`}
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isExpanded}
                    aria-controls={`faq-answer-${idx}`}
                    className="w-full flex items-center justify-between p-5 text-left font-heading font-medium text-neutral-200 hover:text-neutral-50 transition-colors focus:outline-none cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-neutral-500 transition-transform duration-normal ${
                        isExpanded ? "rotate-180 text-accent" : ""
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div
                      id={`faq-answer-${idx}`}
                      role="region"
                      aria-labelledby={`faq-button-${idx}`}
                      className="px-5 pb-5 pt-0 border-t border-neutral-800/40 mt-1 text-sm font-sans text-neutral-400 leading-relaxed animate-fade-in"
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <Footer />
    </div>
  );
}
