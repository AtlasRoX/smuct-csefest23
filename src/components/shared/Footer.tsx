import * as React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Terminal } from "lucide-react";
import { CONTACT_DETAILS } from "@/constants/content";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="bg-neutral-950 border-t border-neutral-900 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-accent" />
              <span className="font-heading font-bold text-lg text-neutral-50">CSE FEST '26</span>
            </div>
            <p className="text-sm text-neutral-400 font-sans leading-relaxed">
              SMUCT's premier national technology festival, empowering future computer science innovators.
            </p>
            <div className="flex space-x-4">
              <a
                href={CONTACT_DETAILS.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-accent transition-colors"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              <a
                href={CONTACT_DETAILS.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-accent transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-neutral-200 mb-4 uppercase tracking-wider text-xs">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-neutral-400 font-sans">
              <li>
                <Link href="#competitions" className="hover:text-neutral-50 transition-colors">
                  Competitions
                </Link>
              </li>
              <li>
                <Link href="#timeline" className="hover:text-neutral-50 transition-colors">
                  Timeline
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-neutral-50 transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="font-heading font-semibold text-neutral-200 mb-4 uppercase tracking-wider text-xs">
              Contact Info
            </h4>
            <ul className="space-y-3 text-sm text-neutral-400 font-sans">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent shrink-0" />
                <a href={`mailto:${CONTACT_DETAILS.email}`} className="hover:text-neutral-50 transition-colors truncate">
                  {CONTACT_DETAILS.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent shrink-0" />
                <a href={`tel:${CONTACT_DETAILS.phone}`} className="hover:text-neutral-50 transition-colors">
                  {CONTACT_DETAILS.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <span className="leading-relaxed">{CONTACT_DETAILS.address}</span>
              </li>
            </ul>
          </div>

          {/* Google Maps link block */}
          <div>
            <h4 className="font-heading font-semibold text-neutral-200 mb-4 uppercase tracking-wider text-xs">
              Venue
            </h4>
            <div className="rounded-radius-sm overflow-hidden border border-neutral-800 bg-neutral-900/50 p-3 space-y-3">
              <span className="text-xs text-neutral-400 font-sans block leading-normal">
                Shanto-Mariam University of Creative Technology Campus.
              </span>
              <a
                href={CONTACT_DETAILS.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-xs font-semibold text-accent hover:underline items-center gap-1 font-sans"
              >
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-900 mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-sans">
          <p>© {currentYear} Department of CSE & CSIT, SMUCT. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-neutral-300">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-neutral-300">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
