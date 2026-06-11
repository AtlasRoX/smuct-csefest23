"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Calendar, Users, Sparkles } from "lucide-react";
import useSWR from "swr";
import { Navbar } from "@/components/shared/Navbar";
import { NewsTicker } from "@/components/public/NewsTicker";
import { HeroSection } from "@/components/public/HeroSection";
import { FeaturedCompetitions } from "@/components/public/FeaturedCompetitions";
import { Timeline } from "@/components/public/Timeline";
import { Footer } from "@/components/shared/Footer";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface FAQData {
  question: string;
  answer: string;
}

export default function PublicHomePage() {
  const [activeFaqIndex, setActiveFaqIndex] = React.useState<number | null>(null);
  const { data } = useSWR("/api/public/cms/faqs", fetcher);

  const faqList = React.useMemo<FAQData[]>(() => {
    if (data?.success && data?.data?.length > 0) return data.data as FAQData[];
    return [];
  }, [data]);

  const toggleFaq = (index: number) => {
    setActiveFaqIndex(activeFaqIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-background font-sans select-text">
      {/* Navigation */}
      <Navbar />

      {/* Scrolling News Ticker */}
      <NewsTicker />

      {/* Hero Section with Countdown & Cyber Console */}
      <main className="pt-4 relative min-h-screen bg-grid-pattern overflow-hidden">
        {/* Decorative background glows */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[10%] w-[30vw] h-[30vw] bg-primary/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[20%] right-[10%] w-[40vw] h-[40vw] bg-secondary/10 blur-[120px] rounded-full" />
        </div>

        {/* Hero Section */}
        <HeroSection />

        {/* Pioneering Technical Creativity (About Section) */}
        <section id="about" className="max-w-[1280px] mx-auto px-4 md:px-16 py-24 border-t border-neutral-850">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="font-heading text-4xl font-extrabold text-neutral-100">Pioneering Technical Creativity</h2>
              <p className="text-neutral-400 font-sans leading-relaxed text-sm">
                Organized by the <span className="text-primary font-bold">SMUCT CSE & CSIT Department</span>, CSE FEST 26 is the premier technology event of Shanto-Mariam University of Creative Technology. We bridge the gap between creative design and technical precision.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-850">
                  <div className="text-4xl font-black text-primary mb-1">500k+</div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold">Prize Pool BDT</div>
                </div>
                <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-850">
                  <div className="text-4xl font-black text-secondary mb-1">1500+</div>
                  <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-mono font-bold">Participants</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="aspect-square rounded-3xl bg-neutral-900/40 backdrop-blur-md border border-neutral-850/80 p-8 flex flex-col justify-between group hover:border-primary/50 transition-all duration-normal cursor-pointer">
                <Calendar className="text-primary h-10 w-10 group-hover:scale-105 transition-transform" />
                <div>
                  <div className="text-3xl font-heading font-bold text-neutral-200">15+</div>
                  <div className="text-xs text-neutral-500 font-sans">Tech Events</div>
                </div>
              </div>
              <div className="aspect-square rounded-3xl bg-neutral-900/40 backdrop-blur-md border border-neutral-850/80 p-8 flex flex-col justify-between group hover:border-secondary/50 transition-all duration-normal cursor-pointer translate-y-8">
                <Users className="text-secondary h-10 w-10 group-hover:scale-105 transition-transform" />
                <div>
                  <div className="text-3xl font-heading font-bold text-neutral-200">20+</div>
                  <div className="text-xs text-neutral-500 font-sans">Partners</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Competitions Section */}
        <FeaturedCompetitions />

        {/* Timeline Section */}
        <Timeline />

        {/* FAQ Section */}
        <section id="faq" className="max-w-[1280px] mx-auto px-4 md:px-16 py-24 border-t border-neutral-850">
          <h2 className="font-heading text-4xl font-extrabold text-neutral-100 mb-12 text-center">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto space-y-4">
            {faqList.length > 0 ? (
              faqList.map((faq, idx) => {
                const isOpen = activeFaqIndex === idx;
                return (
                  <div key={idx} className="bg-neutral-900/30 backdrop-blur-md border border-neutral-850 rounded-2xl overflow-hidden transition-all duration-normal">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex justify-between items-center p-6 cursor-pointer hover:bg-neutral-900/40 transition-colors text-left"
                    >
                      <span className="font-bold text-neutral-200 text-sm sm:text-base">{faq.question}</span>
                      <ChevronDown className={`h-5 w-5 text-neutral-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 text-neutral-400 text-xs sm:text-sm border-t border-neutral-850/40 pt-4 leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center rounded-xl border border-dashed border-neutral-850 bg-neutral-900/10 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-extrabold text-lg text-neutral-300">FAQs Loading Soon</h3>
                <p className="text-xs sm:text-sm text-neutral-500 font-sans max-w-sm leading-relaxed">
                  The FAQs are currently being updated by the organizers. Please check back later!
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
