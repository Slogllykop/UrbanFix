"use client";

import { IconBuilding } from "@tabler/icons-react";
import Link from "next/link";
import { useState } from "react";
import { NgoLoginForm } from "@/components/auth/ngo-login-form";
import { NgoRegisterForm } from "@/components/auth/ngo-register-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NgoLoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "apply">("login");
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  const handleApplicationSuccess = () => {
    setApplicationSubmitted(true);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-8">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        {/* Logo and branding */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <IconBuilding className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">NGO Portal</h1>
          <p className="text-sm text-muted-foreground">
            Manage urban issues and help your community
          </p>
        </div>

        {/* Tabs for Login / Apply */}
        <Card>
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "login" | "apply")}
          >
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="apply">Apply</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="login" className="mt-0">
                <div className="space-y-4">
                  <div>
                    <CardTitle className="text-lg">Welcome back</CardTitle>
                    <CardDescription>
                      Enter your credentials to access the dashboard
                    </CardDescription>
                  </div>
                  <NgoLoginForm />
                </div>
              </TabsContent>

              <TabsContent value="apply" className="mt-0">
                {applicationSubmitted ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-4 rounded-full bg-green-500/10 p-4">
                      <svg
                        className="h-8 w-8 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <CardTitle className="text-lg">
                      Application Submitted!
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Thank you for your interest in joining UrbanFix. We'll
                      review your application and contact you via email within
                      2-3 business days.
                    </CardDescription>
                    <button
                      className="mt-4 text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                      onClick={() => {
                        setApplicationSubmitted(false);
                        setActiveTab("login");
                      }}
                    >
                      Back to login
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <CardTitle className="text-lg">Join UrbanFix</CardTitle>
                      <CardDescription>
                        Apply to become a verified NGO partner
                      </CardDescription>
                    </div>
                    <NgoRegisterForm
                      onSubmitSuccess={handleApplicationSuccess}
                    />
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Back to user login */}
        <p className="text-center text-sm text-muted-foreground">
          Not an NGO?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Login as a user
          </Link>
        </p>
      </div>
    </div>
  );
}
