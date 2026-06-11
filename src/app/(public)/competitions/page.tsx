"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Search, Star } from "lucide-react";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { COMPETITIONS_CATALOG } from "@/constants/content";

export default function CompetitionsListingPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredCompetitions = COMPETITIONS_CATALOG.filter((comp) =>
    comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    comp.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-1 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full">
        {/* Back navigation */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-50 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Headings & Search filter */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <h1 className="text-h2 font-bold font-heading text-neutral-50">Competitions Directory</h1>
            <p className="text-sm sm:text-base text-neutral-400 font-sans max-w-xl">
              Explore external showcases and internal challenges. Register your team to demonstrate your engineering skills.
            </p>
          </div>
          <div className="w-full md:max-w-sm">
            <div className="relative">
              <Input
                placeholder="Search competitions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
            </div>
          </div>
        </div>

        {/* Competitions Grid */}
        {filteredCompetitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompetitions.map((comp) => (
              <Card key={comp.id} hoverable variant="default" className="flex flex-col justify-between">
                <CardHeader>
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 bg-neutral-950 border border-neutral-800 rounded-radius-sm">
                      <Trophy className="h-4 w-4 text-accent" />
                    </div>
                    <Badge variant="accent" className="capitalize">
                      {comp.eligibility}
                    </Badge>
                  </div>
                  <CardTitle className="mb-2 text-lg font-heading">{comp.name}</CardTitle>
                  <CardDescription className="text-sm text-neutral-400 font-sans line-clamp-2 leading-relaxed">
                    {comp.shortDescription}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-4 border-t border-neutral-800/60 pt-4 font-sans text-sm space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Eligibility:</span>
                    <span className="text-neutral-300 font-medium capitalize">{comp.eligibility} Only</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Prize Pool:</span>
                    <span className="text-accent font-semibold">{comp.prizePool}</span>
                  </div>
                  <div className="pt-6">
                    <Link href={`/competitions/${comp.id}`}>
                      <Button variant="secondary" className="w-full justify-center">
                        Explore Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center rounded-radius-md border border-neutral-800 bg-neutral-900/10">
            <Star className="h-8 w-8 text-neutral-600 mx-auto mb-4" />
            <h3 className="font-heading font-semibold text-neutral-300 mb-2">No Competitions Found</h3>
            <p className="text-sm text-neutral-500 font-sans">
              We couldn't find any competitions matching your search term.
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
