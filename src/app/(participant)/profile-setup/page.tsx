"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Terminal, Upload, AlertCircle, ArrowLeft, ArrowRight, Check, X, ShieldCheck, Fingerprint, GraduationCap, Lock, Info, HelpCircle, Shield, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { createClient } from "@/lib/supabase/client";


// Normalizes a URL by prepending https:// if no protocol is present
function normalizeUrl(val: string | undefined): string {
  if (!val || val.trim() === "") return "";
  const trimmed = val.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const wizardSchema = z.object({
  // Step 1: Personal
  full_name: z.string().min(2, "Full Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be valid"),
  gender: z.string().min(1, "Please select your gender"),
  // Step 2: Academic
  university: z.string().min(2, "University name is required"),
  department: z.string().min(2, "Department name is required"),
  semester: z.string().min(1, "Semester is required"),
  student_id: z.string().min(2, "Student ID is required"),
  // Step 4: Professional
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
  bio: z.string().max(500, "Bio must be under 500 characters").optional().or(z.literal("")),
  tshirt_size: z.string().min(1, "T-shirt size is required"),
});

type WizardFormData = z.input<typeof wizardSchema>;

export default function ProfileSetupWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [userEmail, setUserEmail] = React.useState<string>("");

  // File Upload State (Base64 data for API processing)
  const [idFront, setIdFront] = React.useState<string | null>(null);
  const [idBack, setIdBack] = React.useState<string | null>(null);
  const [idFrontError, setIdFrontError] = React.useState<string | null>(null);
  const [idBackError, setIdBackError] = React.useState<string | null>(null);

  // Drag and drop hover states
  const [dragActiveFront, setDragActiveFront] = React.useState(false);
  const [dragActiveBack, setDragActiveBack] = React.useState(false);

  // Retrieve user email from Supabase session and guard re-entry
  React.useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);

        // If profile is already complete, redirect to dashboard
        const { data: profile } = await supabase
          .from("profiles")
          .select("profile_complete")
          .eq("id", user.id)
          .single();

        if (profile?.profile_complete) {
          router.replace("/dashboard");
        }
      }
    };
    fetchUser();
  }, [router]);


  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    mode: "all",
    defaultValues: {
      skills: "",
    },
  });



  // Convert uploaded file to Base64
  const processFile = (file: File, type: "front" | "back") => {
    // Validate size limit (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      const msg = "File exceeds the 5MB size limit. Please upload a smaller image.";
      if (type === "front") setIdFrontError(msg);
      else setIdBackError(msg);
      return;
    }

    // Validate type limit (jpg/png)
    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      const msg = "Only JPG, JPEG, and PNG images are supported.";
      if (type === "front") setIdFrontError(msg);
      else setIdBackError(msg);
      return;
    }

    if (type === "front") setIdFrontError(null);
    else setIdBackError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "front") {
        setIdFront(reader.result as string);
      } else {
        setIdBack(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "front" | "back") => {
    const file = e.target.files?.[0];
    if (file) processFile(file, type);
  };

  // Drag handlers
  const handleDrag = (e: React.DragEvent, type: "front" | "back", status: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "front") setDragActiveFront(status);
    else setDragActiveBack(status);
  };

  const handleDrop = (e: React.DragEvent, type: "front" | "back") => {
    e.preventDefault();
    e.stopPropagation();
    if (type === "front") setDragActiveFront(false);
    else setDragActiveBack(false);

    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file, type);
  };

  const nextStep = async () => {
    // Validate current fields before advancing step
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(["full_name", "phone", "gender"]);
    } else if (step === 2) {
      isValid = await trigger(["university", "department", "semester", "student_id"]);
    } else if (step === 3) {
      if (!idFront || !idBack) {
        if (!idFront) setIdFrontError("Student ID front card image is required.");
        if (!idBack) setIdBackError("Student ID back card image is required.");
        return;
      }
      isValid = true;
    } else if (step === 4) {
      isValid = await trigger(["github", "portfolio", "skills", "bio", "tshirt_size"]);
    }

    if (isValid) {
      setErrorMsg(null);
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (data: WizardFormData) => {
    if (!idFront || !idBack) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Save Profile Text Data
      const profileRes = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          github: normalizeUrl(data.github) || "",
          portfolio: normalizeUrl(data.portfolio) || "",
        }),
      });
      const profileData = await profileRes.json();
      if (!profileData.success) {
        throw new Error(profileData.message || "Failed to update profile information.");
      }

      // 2. Upload Verification Files
      const verifyRes = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_front_base64: idFront,
          id_back_base64: idBack,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        throw new Error(verifyData.message || "Failed to upload Student ID documents.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred during profile setup.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const stepsConfig = [
    { id: 1, label: "Identity", icon: Fingerprint },
    { id: 2, label: "Academic", icon: GraduationCap },
    { id: 3, label: "Verification", icon: ShieldCheck },
    { id: 4, label: "Technical", icon: Terminal },
    { id: 5, label: "Review", icon: CheckCircle2 },
  ];

  return (
    <div className="w-full space-y-6 py-2 max-w-5xl animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-neutral-800/40 pb-4">
        <div>
          <h1 className="text-lg md:text-xl font-heading font-bold text-neutral-100 flex items-center gap-2.5 tracking-tight uppercase">
            <Terminal className="h-5 w-5 text-neutral-405" />
            <span>Delegate Onboarding Wizard</span>
          </h1>
          <p className="text-xs text-neutral-500 font-sans mt-1">
            Complete your official festival registration wizard to unlock competition entries and team setups.
          </p>
        </div>
        <div className="shrink-0">
          <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400 bg-neutral-900/50 border border-neutral-800/60 px-3 py-1.5 rounded">
            STEP {step} OF 5
          </span>
        </div>
      </div>

      {/* Horizontal Stepper */}
      <div className="bg-neutral-900/10 border border-neutral-800/40 rounded p-4 shadow-none">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {stepsConfig.map((item, idx) => {
            const isCompleted = step > item.id;
            const isActive = step === item.id;
            return (
              <React.Fragment key={item.id}>
                {/* Step Item */}
                <button
                  type="button"
                  onClick={() => {
                    if (item.id < step) {
                      setStep(item.id);
                    }
                  }}
                  disabled={item.id >= step}
                  className="flex items-center gap-2 outline-none focus:outline-none text-left disabled:cursor-not-allowed group"
                >
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center border text-[10px] font-mono transition-all duration-150 shrink-0 ${
                      isActive
                        ? "border-neutral-400 bg-neutral-900 text-neutral-100 font-bold"
                        : isCompleted
                        ? "border-neutral-800 bg-neutral-900/45 text-neutral-300 group-hover:border-neutral-700 cursor-pointer"
                        : "border-neutral-900 bg-neutral-950 text-neutral-605"
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : item.id}
                  </div>
                  <div className="hidden md:block">
                    <p
                      className={`text-[9px] font-mono tracking-widest uppercase transition-colors ${
                        isActive
                          ? "text-neutral-200 font-semibold"
                          : isCompleted
                          ? "text-neutral-400 group-hover:text-neutral-200 cursor-pointer"
                          : "text-neutral-600"
                      }`}
                    >
                      {item.label}
                    </p>
                  </div>
                </button>
                {/* Connector Line */}
                {idx < stepsConfig.length - 1 && (
                  <div
                    className={`grow h-px mx-3 transition-colors duration-155 ${
                      step > item.id ? "bg-neutral-800/80" : "bg-neutral-900/85"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Area */}
        <div className="lg:col-span-8 bg-neutral-900/10 border border-neutral-800/40 rounded-lg p-6 flex flex-col min-h-[440px] justify-between">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 grow flex flex-col justify-between">
            <div className="space-y-6">
              <AnimatePresence mode="wait">
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 rounded bg-error/20 border border-error/30 text-xs text-error font-mono flex items-start gap-2"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-neutral-800/30 pb-3 mb-4">
                      <h2 className="text-xs uppercase font-mono tracking-widest text-neutral-400 font-semibold">Identity Details</h2>
                      <p className="text-xs text-neutral-500 font-sans mt-1">Let&apos;s start with your basic identification for your official festival pass.</p>
                    </div>

                    <div className="flex flex-col space-y-1.5 w-full">
                      <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">Full Name (As per NID/Passport)</label>
                      <Input
                        placeholder="e.g. Abdullah Al Mamun"
                        error={errors.full_name?.message}
                        className="h-9 border-neutral-800/80 bg-neutral-950 text-xs focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20 transition-all duration-150"
                        {...register("full_name")}
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5 w-full relative">
                      <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">University Email Address</label>
                      <div className="relative">
                        <Input
                          value={userEmail}
                          readOnly
                          disabled
                          className="pl-9 h-9 border-neutral-800/30 bg-neutral-900/50 text-neutral-500 select-all cursor-not-allowed text-xs"
                        />
                        <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-600 pointer-events-none" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1.5 w-full">
                        <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">Phone Number</label>
                        <Input
                          placeholder="+880 1XXX-XXXXXX"
                          error={errors.phone?.message}
                          className="h-9 border-neutral-800/80 bg-neutral-950 text-xs focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20 transition-all duration-150"
                          {...register("phone")}
                        />
                      </div>

                      <div className="flex flex-col space-y-1.5 w-full">
                        <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">
                          Gender
                        </label>
                        <div className="grid grid-cols-2 gap-2 h-9">
                          {(["male", "female"] as const).map((g) => {
                            const watched = watch("gender");
                            const isSelected = watched === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setValue("gender", g, { shouldValidate: true })}
                                className={`h-full rounded border text-xs font-mono transition-all duration-150 capitalize tracking-wider ${
                                  isSelected
                                    ? "border-neutral-400 bg-neutral-900 text-neutral-100 font-semibold"
                                    : "border-neutral-900 bg-neutral-950/40 text-neutral-500 hover:border-neutral-800 hover:text-neutral-300"
                                }`}
                              >
                                {g === "male" ? "Male" : "Female"}
                              </button>
                            );
                          })}
                        </div>
                        <input type="hidden" {...register("gender")} />
                        {errors.gender && (
                          <span className="text-xs text-error font-sans font-medium">{errors.gender.message}</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-neutral-800/30 pb-3 mb-4">
                      <h2 className="text-xs uppercase font-mono tracking-widest text-neutral-400 font-semibold">Academic Records</h2>
                      <p className="text-xs text-neutral-500 font-sans mt-1">Provide your current university status to check registration eligibility.</p>
                    </div>

                    <div className="flex flex-col space-y-1.5 w-full">
                      <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">University Name</label>
                      <Input
                        placeholder="e.g. Shanto-Mariam University of Creative Technology"
                        error={errors.university?.message}
                        className="h-9 border-neutral-800/80 bg-neutral-950 text-xs focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20 transition-all duration-150"
                        {...register("university")}
                      />
                    </div>

                    <div className="flex flex-col space-y-1.5 w-full">
                      <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">Department</label>
                      <Input
                        placeholder="e.g. Computer Science & Engineering"
                        error={errors.department?.message}
                        className="h-9 border-neutral-800/80 bg-neutral-950 text-xs focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20 transition-all duration-150"
                        {...register("department")}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col space-y-1.5 w-full">
                        <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">Semester</label>
                        <Input
                          placeholder="e.g. 8th"
                          error={errors.semester?.message}
                          className="h-9 border-neutral-800/80 bg-neutral-950 text-xs focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20 transition-all duration-150"
                          {...register("semester")}
                        />
                      </div>

                      <div className="flex flex-col space-y-1.5 w-full">
                        <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">Student ID</label>
                        <Input
                          placeholder="e.g. 201071000"
                          error={errors.student_id?.message}
                          className="h-9 border-neutral-800/80 bg-neutral-950 text-xs focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20 transition-all duration-150"
                          {...register("student_id")}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-neutral-800/30 pb-3 mb-4">
                      <h2 className="text-xs uppercase font-mono tracking-widest text-neutral-400 font-semibold">Student ID Verification</h2>
                      <p className="text-xs text-neutral-500 font-sans mt-1">Upload clear images of your Student ID card. Limits: Max 5MB, JPG/PNG only.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Front ID Dropzone */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase select-none">ID Front Side</label>
                        <div
                          onDragOver={(e) => handleDrag(e, "front", true)}
                          onDragLeave={(e) => handleDrag(e, "front", false)}
                          onDrop={(e) => handleDrop(e, "front")}
                          className={`relative h-32 border border-dashed rounded flex flex-col items-center justify-center bg-neutral-950 transition-all duration-150 ${
                            dragActiveFront ? "border-neutral-500 bg-neutral-900/30" : "border-neutral-800/85 hover:border-neutral-700/60"
                          }`}
                        >
                          {idFront ? (
                            <div className="relative w-full h-full p-2 flex items-center justify-center">
                              <img src={idFront} alt="ID Front preview" className="max-h-full rounded object-contain" />
                              <button
                                type="button"
                                onClick={() => setIdFront(null)}
                                className="absolute top-1.5 right-1.5 p-1 bg-neutral-900 border border-neutral-850 rounded-full text-neutral-400 hover:text-neutral-100 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center p-3 space-y-1.5 pointer-events-none">
                              <Upload className="h-4 w-4 text-neutral-500 mx-auto" />
                              <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">
                                Drop front side, or <span className="text-neutral-200 underline font-semibold cursor-pointer">Browse</span>
                              </div>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={(e) => handleFileChange(e, "front")}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                        {idFrontError && <span className="text-xs text-error font-sans font-medium">{idFrontError}</span>}
                      </div>

                      {/* Back ID Dropzone */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase select-none">ID Back Side</label>
                        <div
                          onDragOver={(e) => handleDrag(e, "back", true)}
                          onDragLeave={(e) => handleDrag(e, "back", false)}
                          onDrop={(e) => handleDrop(e, "back")}
                          className={`relative h-32 border border-dashed rounded flex flex-col items-center justify-center bg-neutral-950 transition-all duration-150 ${
                            dragActiveBack ? "border-neutral-500 bg-neutral-900/30" : "border-neutral-800/85 hover:border-neutral-700/60"
                          }`}
                        >
                          {idBack ? (
                            <div className="relative w-full h-full p-2 flex items-center justify-center">
                              <img src={idBack} alt="ID Back preview" className="max-h-full rounded object-contain" />
                              <button
                                type="button"
                                onClick={() => setIdBack(null)}
                                className="absolute top-1.5 right-1.5 p-1 bg-neutral-900 border border-neutral-850 rounded-full text-neutral-400 hover:text-neutral-100 transition-colors"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center p-3 space-y-1.5 pointer-events-none">
                              <Upload className="h-4 w-4 text-neutral-550 mx-auto" />
                              <div className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest">
                                Drop back side, or <span className="text-neutral-200 underline font-semibold cursor-pointer">Browse</span>
                              </div>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={(e) => handleFileChange(e, "back")}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                        {idBackError && <span className="text-xs text-error font-sans font-medium">{idBackError}</span>}
                      </div>
                    </div>

                    {(idFront || idBack) && (
                      <div className="space-y-2 pt-2">
                        <label className="text-[10px] font-mono font-bold tracking-widest text-neutral-500 uppercase">Uploaded Attachments</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {idFront && (
                            <div className="bg-neutral-900/20 border border-neutral-800/60 rounded p-2 flex items-center gap-3">
                              <div className="w-10 h-8 bg-neutral-950 rounded overflow-hidden shrink-0 flex items-center justify-center border border-neutral-800/60">
                                <img src={idFront} alt="Thumbnail Front" className="h-full w-full object-cover" />
                              </div>
                              <div className="grow min-w-0">
                                <p className="text-[11px] font-semibold text-neutral-300 truncate">id_card_front.png</p>
                                <p className="text-[9px] font-mono text-success font-bold">READY • VERIFIABLE</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIdFront(null)}
                                className="text-neutral-500 hover:text-error transition-colors p-1"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                          {idBack && (
                            <div className="bg-neutral-900/20 border border-neutral-800/60 rounded p-2 flex items-center gap-3">
                              <div className="w-10 h-8 bg-neutral-950 rounded overflow-hidden shrink-0 flex items-center justify-center border border-neutral-800/60">
                                <img src={idBack} alt="Thumbnail Back" className="h-full w-full object-cover" />
                              </div>
                              <div className="grow min-w-0">
                                <p className="text-[11px] font-semibold text-neutral-300 truncate">id_card_back.png</p>
                                <p className="text-[9px] font-mono text-success font-bold">READY • VERIFIABLE</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIdBack(null)}
                                className="text-neutral-500 hover:text-error transition-colors p-1"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {step === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-neutral-800/30 pb-3 mb-4">
                      <h2 className="text-xs uppercase font-mono tracking-widest text-neutral-400 font-semibold">Professional Roster</h2>
                      <p className="text-xs text-neutral-500 font-sans mt-1">Highlight your coding profiles, skills, and size details.</p>
                    </div>

                    {/* Online Profile URL */}
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none font-mono">Online Profile</label>
                        <span className="text-[9px] font-mono text-neutral-500 bg-neutral-905 border border-neutral-800/40 px-2 py-0.5 rounded">OPTIONAL</span>
                      </div>
                      <Input
                        type="url"
                        placeholder="e.g. https://github.com/username or https://linkedin.com/in/username"
                        className="h-9 border-neutral-800/80 bg-neutral-950 placeholder:text-neutral-600 font-mono text-xs focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20"
                        {...register("github")}
                      />
                      {errors.github && (
                        <span className="text-xs text-error font-sans font-medium">{errors.github.message}</span>
                      )}
                    </div>

                    {/* Skills — freeform text */}
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">Skills & Tech Stack</label>
                      <textarea
                        placeholder="Describe your tech stack naturally — e.g. I work with React, Node.js, and Python."
                        rows={3}
                        className="flex w-full rounded border border-neutral-800/80 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20 outline-none font-sans placeholder:text-neutral-600 transition-colors resize-none leading-relaxed"
                        {...register("skills")}
                      />
                      <p className="text-[10px] text-neutral-500 font-sans leading-normal">Tell us about your developer skillset in your own words.</p>
                      {errors.skills && (
                        <span className="text-xs text-error font-sans font-medium">{errors.skills.message}</span>
                      )}
                    </div>

                    {/* Bio — optional */}
                    <div className="flex flex-col space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none">Short Biography</label>
                        <span className="text-[9px] font-mono text-neutral-550 bg-neutral-905 border border-neutral-800/40 px-2 py-0.5 rounded">OPTIONAL</span>
                      </div>
                      <textarea
                        placeholder="A quick intro about yourself..."
                        rows={3}
                        className="flex w-full rounded border border-neutral-800/80 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 focus:border-neutral-700 focus:ring-1 focus:ring-neutral-700/20 outline-none font-sans placeholder:text-neutral-600 transition-colors resize-none leading-relaxed"
                        {...register("bio")}
                      />
                      {errors.bio && (
                        <span className="text-xs text-error font-sans font-medium">{errors.bio.message}</span>
                      )}
                    </div>

                    {/* T-Shirt Size — button toggle */}
                    <div className="flex flex-col space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-400 font-mono uppercase tracking-widest select-none font-mono">Festival T-Shirt Size</label>
                      <div className="grid grid-cols-5 gap-2">
                        {(["S", "M", "L", "XL", "XXL"] as const).map((size) => {
                          const isSelected = watch("tshirt_size") === size;
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => setValue("tshirt_size", size, { shouldValidate: true })}
                              className={`h-9 rounded border text-xs font-mono transition-all duration-155 tracking-wider ${
                                isSelected
                                  ? "border-neutral-400 bg-neutral-900 text-neutral-100 font-bold"
                                  : "border-neutral-900 bg-neutral-950/40 text-neutral-500 hover:border-neutral-850 hover:text-neutral-350"
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                      <input type="hidden" {...register("tshirt_size")} />
                      {errors.tshirt_size && (
                        <span className="text-xs text-error font-sans font-medium">{errors.tshirt_size.message}</span>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 5 && (
                  <motion.div
                    key="step-5"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-4"
                  >
                    <div className="border-b border-neutral-800/30 pb-3 mb-4">
                      <h2 className="text-xs uppercase font-mono tracking-widest text-neutral-400 font-semibold">Confirm Profile Details</h2>
                      <p className="text-xs text-neutral-500 font-sans mt-1">Verify details before submission. Information is locked for verification review.</p>
                    </div>

                    <div className="bg-neutral-900/10 border border-neutral-800/40 rounded p-4 space-y-2.5 font-sans animate-fade-in">
                      <div className="grid grid-cols-2 border-b border-neutral-800/20 pb-2">
                        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">FULL NAME</span>
                        <span className="text-xs text-neutral-200 font-semibold text-right truncate">{watch("full_name")}</span>
                      </div>
                      <div className="grid grid-cols-2 border-b border-neutral-800/20 pb-2">
                        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">CONTACT PHONE</span>
                        <span className="text-xs text-neutral-350 font-mono text-right">{watch("phone")}</span>
                      </div>
                      <div className="grid grid-cols-2 border-b border-neutral-800/20 pb-2">
                        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">UNIVERSITY</span>
                        <span className="text-xs text-neutral-200 font-semibold text-right truncate">{watch("university")}</span>
                      </div>
                      <div className="grid grid-cols-2 border-b border-neutral-800/20 pb-2">
                        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">DEPARTMENT</span>
                        <span className="text-xs text-neutral-300 text-right truncate">{watch("department")}</span>
                      </div>
                      <div className="grid grid-cols-2 border-b border-neutral-800/20 pb-2">
                        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">SEMESTER & ID</span>
                        <span className="text-xs text-neutral-350 font-mono text-right">{watch("semester")} Semester / ID: {watch("student_id")}</span>
                      </div>
                      <div className="grid grid-cols-2 border-b border-neutral-800/20 pb-2">
                        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase">T-SHIRT SIZE</span>
                        <span className="text-xs text-neutral-200 font-mono font-bold text-right">{watch("tshirt_size")}</span>
                      </div>
                      <div className="space-y-1 pt-1.5">
                        <span className="text-[10px] font-mono tracking-widest text-neutral-500 uppercase block">SKILLS & TECH STACK</span>
                        <p className="text-neutral-350 text-xs font-sans leading-relaxed mt-1">{watch("skills") || <span className="text-neutral-600 italic font-mono">Not provided</span>}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex justify-between items-center pt-5 border-t border-neutral-800/40 mt-8">
              <Button
                variant="secondary"
                type="button"
                onClick={prevStep}
                disabled={step === 1 || loading}
                className="gap-2 px-4 h-9 text-xs font-mono uppercase tracking-wider cursor-pointer border border-neutral-800 hover:border-neutral-700 bg-neutral-950 text-neutral-300 active:scale-98"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </Button>

              {step < 5 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-transparent gap-2 px-5 h-9 text-xs font-mono uppercase tracking-wider cursor-pointer active:scale-98"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  isLoading={loading}
                  className="bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-transparent gap-2 px-6 h-9 text-xs font-mono uppercase tracking-wider cursor-pointer active:scale-98"
                >
                  <span>Submit Profile</span>
                  <Check className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Right Sidebar Column */}
        <aside className="lg:col-span-4 flex flex-col justify-between h-full space-y-6">
          <div className="bg-neutral-900/10 border border-neutral-800/40 rounded-lg p-5 space-y-5 grow">
            <div className="w-10 h-10 bg-neutral-900 border border-neutral-800/60 rounded flex items-center justify-center mb-2">
              <Info className="h-4.5 w-4.5 text-neutral-400" />
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="info-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 font-sans"
                >
                  <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-200">Why Identity?</h3>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Your name and gender details are mapped directly onto the printed Delegate Badges and certificates. Please double-check spelling.
                  </p>
                  <div className="bg-neutral-900/40 border border-neutral-800/40 rounded p-3 mt-4">
                    <div className="flex gap-2">
                      <Shield className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <h4 className="text-[9px] font-mono font-bold text-neutral-300 uppercase tracking-widest">Encrypted Storage</h4>
                        <p className="text-[10px] text-neutral-500 leading-tight">All personal records are encrypted and kept strictly confidential.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="info-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 font-sans"
                >
                  <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-200">Academic Check</h3>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    CSE Fest 2026 hosts contests targeting specific student demographics (e.g. internal university vs national level external hackathons).
                  </p>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Providing your accurate department and registration ID allows instant verification rules to be met.
                  </p>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="info-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 font-sans"
                >
                  <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-200">Verification Tips</h3>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Please upload high-resolution photos of your physical student ID card.
                  </p>
                  <ul className="text-[11px] text-neutral-500 list-disc pl-4 space-y-1 leading-relaxed">
                    <li>Avoid heavy glare or shadows on text.</li>
                    <li>Ensure registration/roll number is legible.</li>
                    <li>Expired cards will be flagged by admins.</li>
                  </ul>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="info-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 font-sans"
                >
                  <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-200">Build Your Roster</h3>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Connecting GitHub and portfolio profiles enables prospective team organizers to view your coding accomplishments.
                  </p>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    T-shirt size is final and cannot be modified once delegate packages are queued for manufacturing.
                  </p>
                </motion.div>
              )}

              {step === 5 && (
                <motion.div
                  key="info-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 font-sans"
                >
                  <h3 className="text-xs font-mono uppercase tracking-widest text-neutral-200">Final Verification</h3>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    Once submitted, details are queued for verification. Approvals generally take under 24 hours.
                  </p>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    You can register for draft status events in the meantime, but team publications require verified profiles.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-3 pt-4 border-t border-neutral-800/40 font-sans">
            <div className="p-3 bg-neutral-900/10 border border-neutral-800/40 rounded">
              <div className="flex items-start gap-2.5">
                <HelpCircle className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest">Need Assistance?</h4>
                  <p className="text-[9px] text-neutral-500 font-sans leading-tight mt-0.5">Contact the registration helpline at register@csefest2026.com</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

