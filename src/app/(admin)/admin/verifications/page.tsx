"use client";

import * as React from "react";
import {
  Search,
  Check,
  X,
  Eye,
  AlertCircle,
  Clock,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

interface VerificationItem {
  id: string;
  user_id: string;
  id_front_url: string;
  id_back_url: string;
  status: string;
  created_at: string;
  profiles: {
    full_name: string;
    university: string;
    student_id: string;
    department: string;
    email: {
      email: string;
    } | null;
  } | null;
}

export default function VerificationsPage() {
  const [verifications, setVerifications] = React.useState<VerificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"pending" | "verified" | "incomplete" | "all">("pending");
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  // Lightbox modal state
  const [lightboxImages, setLightboxImages] = React.useState<{ front: string; back: string; name: string } | null>(null);

  const supabase = createClient();

  React.useEffect(() => {
    let active = true;
    async function loadVerifications() {
      setLoading(true);
      setErrorMsg(null);
      try {
        let query = supabase
          .from("student_verifications")
          .select("*, profiles:user_id(full_name, university, student_id, department, email:user_id(email))")
          .order("created_at", { ascending: false });

        if (statusFilter !== "all") {
          query = query.eq("status", statusFilter);
        }

        const { data, error } = await query;
        if (error) throw error;
        if (active) {
          setVerifications((data as unknown as VerificationItem[]) || []);
        }
      } catch (err) {
        if (active) {
          const errorMessage = err instanceof Error ? err.message : "Failed to load verifications data.";
          setErrorMsg(errorMessage);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadVerifications();

    return () => {
      active = false;
    };
  }, [supabase, statusFilter, refreshTrigger]);

  const handleAction = async (userId: string, action: "approve" | "reject") => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, action }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to process verification action.");
      }
      setSuccessMsg(data.message);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred.";
      setErrorMsg(errorMessage);
    }
  };

  // Filter lists based on search term
  const filteredVerifications = verifications.filter((v) => {
    const name = v.profiles?.full_name?.toLowerCase() || "";
    const uni = v.profiles?.university?.toLowerCase() || "";
    const idNum = v.profiles?.student_id?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return name.includes(search) || uni.includes(search) || idNum.includes(search);
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-h3 font-heading font-bold text-neutral-50">Student ID Verification</h1>
        <p className="text-sm text-neutral-400 font-sans mt-1">
          Review academic documents submitted by participants and approve eligibility.
        </p>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="p-4 rounded-radius-sm bg-error/10 border border-error/20 text-xs text-error font-sans font-medium flex items-start gap-2">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-radius-sm bg-success/10 border border-success/20 text-xs text-success font-sans font-medium flex items-start gap-2">
          <Check className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Tabs Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-850 pb-4">
        {/* Tabs */}
        <div className="flex gap-4">
          {(["pending", "verified", "incomplete", "all"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`py-2 px-3 text-xs font-semibold tracking-wide font-sans capitalize transition-colors border-b-2 outline-none ${
                statusFilter === status
                  ? "border-accent text-accent"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {status} ({status === statusFilter ? filteredVerifications.length : "..."})
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72 relative">
          <Input
            placeholder="Search name, ID, university..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
        </div>
      </div>

      {/* Verification Items List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 bg-neutral-900 rounded-radius-md" />
          ))}
        </div>
      ) : filteredVerifications.length > 0 ? (
        <div className="space-y-6">
          {filteredVerifications.map((v) => (
            <Card key={v.id} variant="default" className="border-neutral-800/80 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-heading font-semibold text-neutral-100">
                      {v.profiles?.full_name || "Unknown"}
                    </h3>
                    <Badge
                      variant={
                        v.status === "verified"
                          ? "success"
                          : v.status === "pending"
                          ? "warning"
                          : "neutral"
                      }
                      className="capitalize"
                    >
                      {v.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-400 font-sans">
                    Email: <span className="text-neutral-300">{v.profiles?.email?.email || "N/A"}</span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1.5 pt-2 text-xs font-sans text-neutral-400">
                    <div>
                      University: <span className="text-neutral-200 font-semibold">{v.profiles?.university || "N/A"}</span>
                    </div>
                    <div>
                      Department: <span className="text-neutral-200 font-semibold">{v.profiles?.department || "N/A"}</span>
                    </div>
                    <div>
                      Student ID: <span className="text-neutral-200 font-semibold font-mono">{v.profiles?.student_id || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {v.status === "pending" && (
                  <div className="flex sm:flex-col lg:flex-row gap-2 shrink-0">
                    <Button
                      variant="primary"
                      onClick={() => handleAction(v.user_id, "approve")}
                      className="text-xs py-1.5 px-3 flex items-center gap-1.5 bg-success hover:bg-success/90 border-success"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Approve</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleAction(v.user_id, "reject")}
                      className="text-xs py-1.5 px-3 flex items-center gap-1.5 hover:border-error hover:text-error"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Decline</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* ID Document Previews */}
              <div className="pt-4 border-t border-neutral-850 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider font-sans">
                    Uploaded Credentials
                  </h4>
                  <button
                    onClick={() =>
                      setLightboxImages({
                        front: v.id_front_url,
                        back: v.id_back_url,
                        name: v.profiles?.full_name || "Participant ID",
                      })
                    }
                    className="text-xxs text-accent hover:underline flex items-center gap-1 font-sans"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Expand Side-by-Side</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front View */}
                  <div className="relative group rounded-radius-sm border border-neutral-850 overflow-hidden bg-neutral-950 aspect-8/5 flex items-center justify-center">
                    {v.id_front_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.id_front_url}
                        alt="Student ID Front"
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <div className="text-center text-neutral-600 font-sans text-xs">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-neutral-700" />
                        <span>No Front Image Uploaded</span>
                      </div>
                    )}
                  </div>
                  {/* Back View */}
                  <div className="relative group rounded-radius-sm border border-neutral-850 overflow-hidden bg-neutral-950 aspect-8/5 flex items-center justify-center">
                    {v.id_back_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={v.id_back_url}
                        alt="Student ID Back"
                        className="object-contain w-full h-full"
                      />
                    ) : (
                      <div className="text-center text-neutral-600 font-sans text-xs">
                        <FileText className="h-8 w-8 mx-auto mb-2 text-neutral-700" />
                        <span>No Back Image Uploaded</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center border border-dashed border-neutral-800 rounded-radius-md bg-neutral-900/10">
          <Clock className="h-10 w-10 text-neutral-700 mb-4 mx-auto" />
          <h3 className="font-heading font-semibold text-neutral-300 mb-1">No Verifications Found</h3>
          <p className="text-xs text-neutral-500 font-sans max-w-xs mx-auto">
            There are no student ID documents matching this search or status.
          </p>
        </div>
      )}

      {/* Lightbox / Modal Overlay */}
      {lightboxImages && (
        <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950/90 backdrop-blur-md justify-center items-center p-4">
          <div className="w-full max-w-5xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
              <h3 className="font-heading font-bold text-neutral-50 text-base">
                Credentials Zoom: {lightboxImages.name}
              </h3>
              <button
                onClick={() => setLightboxImages(null)}
                className="p-1.5 rounded-full bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-colors text-neutral-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="border border-neutral-800 rounded-radius-md overflow-hidden bg-neutral-950 aspect-8/5 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxImages.front}
                  alt="Student ID Front Expanded"
                  className="object-contain w-full h-full max-h-[60vh]"
                />
              </div>
              <div className="border border-neutral-800 rounded-radius-md overflow-hidden bg-neutral-950 aspect-8/5 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxImages.back}
                  alt="Student ID Back Expanded"
                  className="object-contain w-full h-full max-h-[60vh]"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
