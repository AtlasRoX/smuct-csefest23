"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import useSWR, { mutate } from "swr";
import {
  User,
  Phone,
  GraduationCap,
  Sparkles,
  Link as LinkIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCw,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Helper to normalize URL
function normalizeUrl(val: string | undefined): string {
  if (!val || val.trim() === "") return "";
  const trimmed = val.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const profileSchema = z.object({
  full_name: z.string().min(2, "Full Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be valid"),
  gender: z.string().min(1, "Gender is required"),
  university: z.string().min(2, "University is required"),
  department: z.string().min(2, "Department is required"),
  semester: z.string().min(1, "Semester is required"),
  student_id: z.string().min(2, "Student ID is required"),
  github: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val) => normalizeUrl(val))
    .pipe(
      z.string().refine(
        (val) => val === "" || z.string().url().safeParse(val).success,
        "Please enter a valid online profile URL (e.g. github.com/username)"
      )
    ),
  portfolio: z
    .string()
    .optional()
    .or(z.literal(""))
    .transform((val) => normalizeUrl(val))
    .pipe(
      z.string().refine(
        (val) => val === "" || z.string().url().safeParse(val).success,
        "Please enter a valid portfolio URL (e.g. mysite.com)"
      )
    ),
  skills: z.string().optional().or(z.literal("")),
  bio: z.string().max(250, "Bio must be under 250 characters").optional().or(z.literal("")),
  tshirt_size: z.string().min(1, "T-shirt size is required"),
});

type ProfileFormData = z.input<typeof profileSchema>;

interface ProfileDbRecord {
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  university: string | null;
  department: string | null;
  semester: string | null;
  student_id: string | null;
  github: string | null;
  portfolio: string | null;
  skills: string | null;
  bio: string | null;
  tshirt_size: string | null;
  verification_status: string | null;
}

export default function ProfilePage() {
  const [mounted, setMounted] = React.useState(false);
  const [saveLoading, setSaveLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const { data: profileRes, isLoading, error } = useSWR<{ success: boolean; data: ProfileDbRecord }>(
    mounted ? "/api/profile" : null,
    fetcher
  );

  const profile = React.useMemo(() => (profileRes?.success ? profileRes.data : null), [profileRes]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Sync form default values once profile data is loaded
  React.useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        gender: profile.gender || "",
        university: profile.university || "",
        department: profile.department || "",
        semester: profile.semester || "",
        student_id: profile.student_id || "",
        github: profile.github || "",
        portfolio: profile.portfolio || "",
        skills: profile.skills || "",
        bio: profile.bio || "",
        tshirt_size: profile.tshirt_size || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setSaveLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || "Failed to update profile.");
      }

      setMessage({ type: "success", text: "Your profile has been updated successfully!" });
      mutate("/api/profile");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Something went wrong.";
      setMessage({ type: "error", text: errorMsg });
    } finally {
      setSaveLoading(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-neutral-900 w-48 rounded" />
        <div className="h-64 bg-neutral-900 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-40 bg-neutral-900 rounded-xl" />
          <div className="h-40 bg-neutral-900 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="grow flex flex-col items-center justify-center py-20 px-4 text-center">
        <AlertCircle className="h-12 w-12 text-error mb-4" />
        <h3 className="font-heading font-extrabold text-lg text-neutral-300">Failed to load profile</h3>
        <p className="text-neutral-500 font-sans text-sm mt-1 max-w-sm">
          Please check your internet connection or reload the dashboard page to try again.
        </p>
      </div>
    );
  }

  const statusMap = {
    verified: { label: "Verified Profile", variant: "success" as const, icon: CheckCircle2 },
    pending: { label: "Pending Verification", variant: "warning" as const, icon: Clock },
    incomplete: { label: "Incomplete Profile", variant: "error" as const, icon: AlertCircle },
  };

  const status = profile.verification_status || "incomplete";
  const statusConfig = statusMap[status as keyof typeof statusMap] || statusMap.incomplete;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-900">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-neutral-50 tracking-tight">
            MY PROFILE
          </h1>
          <p className="text-xs text-neutral-400 font-sans mt-1">
            Manage your personal records, contact information, and registration credentials.
          </p>
        </div>

        {/* Verification Status Badge */}
        <div className="flex items-center gap-2">
          <Badge variant={statusConfig.variant} className="gap-1.5 px-3 py-1 text-xs uppercase font-sans font-bold tracking-wider">
            <StatusIcon className="h-3.5 w-3.5" />
            <span>{statusConfig.label}</span>
          </Badge>
        </div>
      </div>

      {/* Main Alert Message */}
      {message && (
        <div
          className={`flex gap-3 items-start p-4 rounded-xl border ${
            message.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              : "bg-error/10 border-error/20 text-error-foreground"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-error mt-0.5" />
          )}
          <span className="text-xs sm:text-sm font-sans">{message.text}</span>
        </div>
      )}

      {/* Form Area */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1 & 2: Form Details (Left 70%) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Section 1: Basic Info */}
            <Card className="border-neutral-900 bg-neutral-900/30">
              <CardHeader className="border-b border-neutral-900 pb-4">
                <CardTitle className="text-sm uppercase font-mono tracking-widest text-neutral-400 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span>Personal Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300 font-sans">Full Name</label>
                    <Input
                      placeholder="Your full name"
                      className="h-10 border-neutral-850 bg-neutral-950/40"
                      {...register("full_name")}
                    />
                    {errors.full_name && (
                      <span className="text-xs text-error font-sans font-medium">{errors.full_name.message}</span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300 font-sans">Phone Number</label>
                    <Input
                      type="tel"
                      placeholder="e.g. 017XXXXXXXX"
                      className="h-10 border-neutral-850 bg-neutral-950/40"
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <span className="text-xs text-error font-sans font-medium">{errors.phone.message}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 font-sans">Gender</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-neutral-850 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans"
                    {...register("gender")}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <span className="text-xs text-error font-sans font-medium">{errors.gender.message}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Academic Info */}
            <Card className="border-neutral-900 bg-neutral-900/30">
              <CardHeader className="border-b border-neutral-900 pb-4">
                <CardTitle className="text-sm uppercase font-mono tracking-widest text-neutral-400 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-secondary" />
                  <span>Academic Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 font-sans">University / Institution</label>
                  <Input
                    placeholder="e.g. Shanto-Mariam University of Creative Technology"
                    className="h-10 border-neutral-850 bg-neutral-950/40"
                    {...register("university")}
                  />
                  {errors.university && (
                    <span className="text-xs text-error font-sans font-medium">{errors.university.message}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-neutral-300 font-sans">Department</label>
                    <Input
                      placeholder="e.g. CSE"
                      className="h-10 border-neutral-850 bg-neutral-950/40"
                      {...register("department")}
                    />
                    {errors.department && (
                      <span className="text-xs text-error font-sans font-medium">{errors.department.message}</span>
                    )}
                  </div>

                  <div className="flex flex-col space-y-1.5">
                    <label className="text-xs font-semibold text-neutral-300 font-sans">Semester</label>
                    <Input
                      placeholder="e.g. 8th"
                      className="h-10 border-neutral-850 bg-neutral-950/40"
                      {...register("semester")}
                    />
                    {errors.semester && (
                      <span className="text-xs text-error font-sans font-medium">{errors.semester.message}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 font-sans">Student ID</label>
                  <Input
                    placeholder="Your ID card registration code"
                    className="h-10 border-neutral-850 bg-neutral-950/40"
                    {...register("student_id")}
                  />
                  {errors.student_id && (
                    <span className="text-xs text-error font-sans font-medium">{errors.student_id.message}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column 3: Secondary Info (Right 30%) */}
          <div className="space-y-6">
            {/* Section 3: Professional Info */}
            <Card className="border-neutral-900 bg-neutral-900/30">
              <CardHeader className="border-b border-neutral-900 pb-4">
                <CardTitle className="text-sm uppercase font-mono tracking-widest text-neutral-400 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-accent" />
                  <span>Developer Profile</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                
                {/* Online Profile */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 font-sans">Online Profile URL</label>
                  <Input
                    type="url"
                    placeholder="e.g. https://github.com/username"
                    className="h-10 border-neutral-850 bg-neutral-950/40 font-mono text-xs"
                    {...register("github")}
                  />
                  {errors.github && (
                    <span className="text-xs text-error font-sans font-medium">{errors.github.message}</span>
                  )}
                </div>

                {/* Portfolio */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 font-sans">Portfolio URL</label>
                  <Input
                    type="url"
                    placeholder="e.g. https://portfolio.com"
                    className="h-10 border-neutral-850 bg-neutral-950/40 font-mono text-xs"
                    {...register("portfolio")}
                  />
                  {errors.portfolio && (
                    <span className="text-xs text-error font-sans font-medium">{errors.portfolio.message}</span>
                  )}
                </div>

                {/* T-Shirt Size */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 font-sans">T-Shirt Size</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-neutral-850 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans"
                    {...register("tshirt_size")}
                  >
                    <option value="">Select Size</option>
                    <option value="S">Small (S)</option>
                    <option value="M">Medium (M)</option>
                    <option value="L">Large (L)</option>
                    <option value="XL">Extra Large (XL)</option>
                    <option value="XXL">Double Extra Large (XXL)</option>
                  </select>
                  {errors.tshirt_size && (
                    <span className="text-xs text-error font-sans font-medium">{errors.tshirt_size.message}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Skills & Bio */}
            <Card className="border-neutral-900 bg-neutral-900/30">
              <CardHeader className="border-b border-neutral-900 pb-4">
                <CardTitle className="text-sm uppercase font-mono tracking-widest text-neutral-400 flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-neutral-400" />
                  <span>Bio & Skills</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                
                {/* Skills */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 font-sans">Skills / Tech Stack</label>
                  <textarea
                    placeholder="e.g. React, Node.js, Python"
                    rows={2}
                    className="flex w-full rounded-md border border-neutral-850 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans placeholder:text-neutral-600 resize-none"
                    {...register("skills")}
                  />
                </div>

                {/* Bio */}
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-300 font-sans">Short Biography</label>
                  <textarea
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="flex w-full rounded-md border border-neutral-850 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans placeholder:text-neutral-600 resize-none"
                    {...register("bio")}
                  />
                  {errors.bio && (
                    <span className="text-xs text-error font-sans font-medium">{errors.bio.message}</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Save Buttons */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={saveLoading}
                className="w-full bg-primary hover:bg-primary/95 text-white py-3 h-auto rounded-xl font-sans font-bold flex items-center justify-center gap-2"
              >
                {saveLoading ? (
                  <RotateCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>{saveLoading ? "Saving Changes..." : "Save Profile Details"}</span>
              </Button>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
}
