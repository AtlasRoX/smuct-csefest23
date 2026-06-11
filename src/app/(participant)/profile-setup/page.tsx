"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Terminal, Upload, AlertCircle, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

// Skills checklist (no hardcoded strings in renders)
const AVAILABLE_SKILLS = [
  "React / Next.js",
  "Node.js / Express",
  "Python / Django",
  "Embedded Systems / IoT",
  "Robotics / Arduino",
  "UI/UX Design",
  "Database (SQL/NoSQL)",
  "Cybersecurity / CTF",
];

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
  github: z.string().url("Please enter a valid GitHub profile URL").optional().or(z.literal("")),
  portfolio: z.string().url("Please enter a valid portfolio URL").optional().or(z.literal("")),
  skills: z.array(z.string()).min(1, "Select at least one skill"),
  bio: z.string().max(250, "Bio must be under 250 characters").optional().or(z.literal("")),
  tshirt_size: z.string().min(1, "T-shirt size is required"),
});

type WizardFormData = z.infer<typeof wizardSchema>;

export default function ProfileSetupWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // File Upload State (Base64 data)
  const [idFront, setIdFront] = React.useState<string | null>(null);
  const [idBack, setIdBack] = React.useState<string | null>(null);
  const [idFrontError, setIdFrontError] = React.useState<string | null>(null);
  const [idBackError, setIdBackError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<WizardFormData>({
    resolver: zodResolver(wizardSchema),
    mode: "all",
    defaultValues: {
      skills: [],
    },
  });

  const selectedSkills = watch("skills") || [];

  const handleSkillToggle = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setValue(
        "skills",
        selectedSkills.filter((s) => s !== skill),
        { shouldValidate: true }
      );
    } else {
      setValue("skills", [...selectedSkills, skill], { shouldValidate: true });
    }
  };

  // Base64 File Loader Converter
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  const nextStep = () => {
    if (step === 3 && (!idFront || !idBack)) {
      if (!idFront) setIdFrontError("Student ID front card image is required.");
      if (!idBack) setIdBackError("Student ID back card image is required.");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 5));
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
        body: JSON.stringify(data),
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
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred during profile setup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mx-auto w-full max-w-xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-accent" />
          <span className="font-heading font-bold text-lg tracking-wider text-neutral-50">
            Profile Completion
          </span>
        </div>
        <span className="text-xs font-mono font-medium text-neutral-400">Step {step} of 5</span>
      </div>

      {/* Progress Bar */}
      <div className="mx-auto w-full max-w-xl h-1 bg-neutral-900 rounded-full mb-8 overflow-hidden">
        <div
          className="bg-accent h-full transition-all duration-300"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>

      {/* Steps Panels */}
      <Card className="mx-auto w-full max-w-xl bg-neutral-900/60 border border-neutral-800/80 p-8">
        <CardContent className="p-0 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-radius-sm bg-error/10 border border-error/20 text-xs text-error font-sans font-medium flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Personal Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-heading font-semibold text-neutral-200">Personal Details</h2>
              <Input
                label="Full Name"
                placeholder="John Doe"
                error={errors.full_name?.message}
                {...register("full_name")}
              />
              <Input
                label="Phone Number"
                placeholder="+8801700000000"
                error={errors.phone?.message}
                {...register("phone")}
              />
              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-neutral-300 font-sans">Gender</label>
                <select
                  className="flex h-10 w-full rounded-radius-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                  {...register("gender")}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.gender && (
                  <span className="text-xs text-error font-medium">{errors.gender.message}</span>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Academic Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-heading font-semibold text-neutral-200">Academic Details</h2>
              <Input
                label="University"
                placeholder="Shanto-Mariam University of Creative Technology"
                error={errors.university?.message}
                {...register("university")}
              />
              <Input
                label="Department"
                placeholder="Computer Science & Engineering"
                error={errors.department?.message}
                {...register("department")}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Semester"
                  placeholder="8th"
                  error={errors.semester?.message}
                  {...register("semester")}
                />
                <Input
                  label="Student ID"
                  placeholder="201071000"
                  error={errors.student_id?.message}
                  {...register("student_id")}
                />
              </div>
            </div>
          )}

          {/* Step 3: Student ID Verification (Cloudinary upload placeholders) */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-heading font-semibold text-neutral-200">Student ID Upload</h2>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Please upload clean, high-resolution photos of your Student ID card. File size must be under 5MB. Format supported: JPG, JPEG, PNG.
              </p>

              {/* Front Side Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 font-sans">ID Card Front Side</label>
                <div className="relative border-2 border-dashed border-neutral-800 rounded-radius-md p-6 flex flex-col items-center justify-center bg-neutral-950 hover:border-neutral-700 transition-colors">
                  {idFront ? (
                    <div className="relative max-h-40 w-full overflow-hidden flex items-center justify-center">
                      <img src={idFront} alt="ID Front preview" className="max-h-36 rounded-radius-sm object-cover" />
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Upload className="h-8 w-8 text-neutral-600 mx-auto" />
                      <div className="text-xs text-neutral-500 font-sans">Drag and drop or click to upload front image</div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "front")}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {idFrontError && <span className="text-xs text-error font-medium">{idFrontError}</span>}
              </div>

              {/* Back Side Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-neutral-300 font-sans">ID Card Back Side</label>
                <div className="relative border-2 border-dashed border-neutral-800 rounded-radius-md p-6 flex flex-col items-center justify-center bg-neutral-950 hover:border-neutral-700 transition-colors">
                  {idBack ? (
                    <div className="relative max-h-40 w-full overflow-hidden flex items-center justify-center">
                      <img src={idBack} alt="ID Back preview" className="max-h-36 rounded-radius-sm object-cover" />
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Upload className="h-8 w-8 text-neutral-600 mx-auto" />
                      <div className="text-xs text-neutral-500 font-sans">Drag and drop or click to upload back image</div>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "back")}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
                {idBackError && <span className="text-xs text-error font-medium">{idBackError}</span>}
              </div>
            </div>
          )}

          {/* Step 4: Professional Info */}
          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-heading font-semibold text-neutral-200">Professional Info</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="GitHub Profile (URL)"
                  placeholder="https://github.com/username"
                  error={errors.github?.message}
                  {...register("github")}
                />
                <Input
                  label="Portfolio Website (URL)"
                  placeholder="https://portfolio.com"
                  error={errors.portfolio?.message}
                  {...register("portfolio")}
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-neutral-300 font-sans">Skills & Interests</label>
                <div className="flex flex-wrap gap-2 pt-1.5">
                  {AVAILABLE_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3 py-1.5 rounded-radius-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-accent/15 border-accent text-accent"
                            : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
                {errors.skills && (
                  <span className="text-xs text-error font-medium">{errors.skills.message}</span>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-neutral-300 font-sans">Short Bio</label>
                <textarea
                  placeholder="Tell us about yourself..."
                  className="flex min-h-[80px] w-full rounded-radius-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                  {...register("bio")}
                />
                {errors.bio && (
                  <span className="text-xs text-error font-medium">{errors.bio.message}</span>
                )}
              </div>

              <div className="flex flex-col space-y-1.5">
                <label className="text-sm font-medium text-neutral-300 font-sans">T-Shirt Size</label>
                <select
                  className="flex h-10 w-full rounded-radius-sm border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-sans"
                  {...register("tshirt_size")}
                >
                  <option value="">Select Size</option>
                  <option value="S">S</option>
                  <option value="M">M</option>
                  <option value="L">L</option>
                  <option value="XL">XL</option>
                  <option value="XXL">XXL</option>
                </select>
                {errors.tshirt_size && (
                  <span className="text-xs text-error font-medium">{errors.tshirt_size.message}</span>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-heading font-semibold text-neutral-200">Review Roster Data</h2>
              <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                Review your profile details below. Once submitted, your profile is locked for student verification check.
              </p>

              <div className="border border-neutral-800 bg-neutral-950 p-4 rounded-radius-sm text-sm font-sans space-y-3">
                <div className="grid grid-cols-2 border-b border-neutral-900 pb-2">
                  <span className="text-neutral-500">Full Name:</span>
                  <span className="text-neutral-200 font-medium">{watch("full_name")}</span>
                </div>
                <div className="grid grid-cols-2 border-b border-neutral-900 pb-2">
                  <span className="text-neutral-500">University:</span>
                  <span className="text-neutral-200 font-medium">{watch("university")}</span>
                </div>
                <div className="grid grid-cols-2 border-b border-neutral-900 pb-2">
                  <span className="text-neutral-500">Student ID:</span>
                  <span className="text-neutral-200 font-medium font-mono">{watch("student_id")}</span>
                </div>
                <div className="grid grid-cols-2 border-b border-neutral-900 pb-2">
                  <span className="text-neutral-500">T-Shirt Size:</span>
                  <span className="text-neutral-200 font-medium">{watch("tshirt_size")}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-neutral-900 pb-2">
                  <span className="text-neutral-500">Selected Skills:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedSkills.map((s) => (
                      <Badge key={s} variant="neutral">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-neutral-800/60 mt-6">
            <Button
              variant="secondary"
              type="button"
              onClick={prevStep}
              disabled={step === 1 || loading}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>

            {step < 5 ? (
              <Button variant="primary" type="button" onClick={nextStep} className="gap-2">
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="primary"
                type="button"
                onClick={handleSubmit(onSubmit)}
                isLoading={loading}
                className="gap-2"
              >
                <span>Submit Profile</span>
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
