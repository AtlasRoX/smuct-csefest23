"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Terminal, Lock, Mail, ArrowRight, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

const registerSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      setSuccessMsg("Registration successful! Check your email to confirm your account.");
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "An unexpected error occurred during registration.";
      setErrorMsg(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "OAuth redirection failed.";
      setErrorMsg(errMsg);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-neutral-950">
      {/* Left Column: Branding / Stats */}
      <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-12 bg-linear-to-br from-neutral-900 via-neutral-950 to-primary/10 border-r border-neutral-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

        {/* Header */}
        <Link href="/" className="flex items-center gap-2 z-10">
          <Terminal className="h-6 w-6 text-accent" />
          <span className="font-heading font-bold text-lg tracking-wider text-neutral-50">
            CSE FEST '26
          </span>
        </Link>

        {/* Branding Slogan */}
        <div className="space-y-4 z-10">
          <h2 className="text-display-sm font-extrabold font-heading text-neutral-100 leading-tight">
            Begin Your Journey.
          </h2>
          <p className="text-neutral-400 font-sans leading-relaxed">
            Create your account today. Fill out your academic details, verify your student identity, build your roster team, and register for national-level showcases and contests.
          </p>
        </div>

        {/* Footer info */}
        <div className="text-xs text-neutral-500 font-sans z-10">
          © {new Date().getFullYear()} Dept of CSE & CSIT, SMUCT.
        </div>
      </div>

      {/* Right Column: Register Form */}
      <div className="lg:col-span-7 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h1 className="text-h3 font-heading font-bold text-neutral-50">Create Account</h1>
            <p className="text-sm text-neutral-400 font-sans">
              Sign up with your academic email address to join.
            </p>
          </div>

          <Card variant="default" className="p-0 border-0 bg-transparent shadow-none">
            <CardContent className="p-0 space-y-6">
              {/* OAuth Trigger */}
              <Button
                variant="secondary"
                type="button"
                onClick={handleGoogleLogin}
                className="w-full justify-center gap-2.5 font-sans"
              >
                <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Sign up with Google</span>
              </Button>

              {/* Separator Divider */}
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-800" />
                </div>
                <span className="relative bg-neutral-950 px-4 text-xs uppercase text-neutral-600 font-sans font-medium">
                  Or email credentials
                </span>
              </div>

              {/* Register Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {errorMsg && (
                  <div className="p-4 rounded-radius-sm bg-error/10 border border-error/20 text-xs text-error font-sans font-medium leading-relaxed">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="p-4 rounded-radius-sm bg-success/10 border border-success/20 text-xs text-success font-sans font-medium leading-relaxed">
                    {successMsg}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="relative">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="name@university.edu.bd"
                      error={errors.email?.message}
                      disabled={loading}
                      className="pl-10"
                      {...register("email")}
                    />
                    <Mail className="absolute left-3.5 top-10 h-4 w-4 text-neutral-600" />
                  </div>

                  <div className="relative">
                    <Input
                      label="Password"
                      type="password"
                      placeholder="••••••••"
                      error={errors.password?.message}
                      disabled={loading}
                      className="pl-10"
                      {...register("password")}
                    />
                    <Lock className="absolute left-3.5 top-10 h-4 w-4 text-neutral-600" />
                  </div>

                  <div className="relative">
                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="••••••••"
                      error={errors.confirmPassword?.message}
                      disabled={loading}
                      className="pl-10"
                      {...register("confirmPassword")}
                    />
                    <UserCheck className="absolute left-3.5 top-10 h-4 w-4 text-neutral-600" />
                  </div>
                </div>

                <div className="pt-2">
                  <Button variant="primary" type="submit" isLoading={loading} className="w-full justify-center gap-2">
                    <span>Sign Up</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>

              {/* Footer CTA */}
              <div className="text-center text-sm font-sans text-neutral-500">
                Already have an account?{" "}
                <Link href="/login" className="text-accent font-semibold hover:underline">
                  Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
