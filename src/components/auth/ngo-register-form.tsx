"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconBuilding,
  IconFileDescription,
  IconMail,
  IconMapPin,
  IconPhone,
} from "@tabler/icons-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const registerSchema = z.object({
  organization_name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be less than 100 characters"),
  contact_email: z.string().email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits")
    .regex(/^[\d\s+\-()]+$/, "Please enter a valid phone number"),
  address: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(200, "Address must be less than 200 characters"),
  description: z
    .string()
    .min(
      50,
      "Please provide at least 50 characters describing your organization",
    )
    .max(1000, "Description must be less than 1000 characters"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface NgoRegisterFormProps {
  onSubmitSuccess: () => void;
}

export function NgoRegisterForm({ onSubmitSuccess }: NgoRegisterFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organization_name: "",
      contact_email: "",
      phone: "",
      address: "",
      description: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase.from("ngo_applications").insert({
        organization_name: values.organization_name,
        contact_email: values.contact_email,
        phone: values.phone,
        address: values.address,
        description: values.description,
        status: "pending",
      } as any);

      if (error) {
        console.error("Submission error:", error);
        toast.error("Submission failed", {
          description:
            "There was an error submitting your application. Please try again.",
        });
        setIsLoading(false);
        return;
      }

      toast.success("Application submitted!", {
        description:
          "Your NGO application has been submitted for review. We'll contact you soon.",
      });

      form.reset();
      onSubmitSuccess();
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Submission failed", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="organization_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Organization Name</FormLabel>
              <FormControl>
                <div className="relative">
                  <IconBuilding className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    placeholder="Your NGO Name"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <IconMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type="email"
                    placeholder="contact@ngo.org"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormDescription>
                This email will be used for login credentials after approval
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <IconPhone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Office Address</FormLabel>
              <FormControl>
                <div className="relative">
                  <IconMapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...field}
                    placeholder="123 Main Street, City, State, PIN"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>About Your Organization</FormLabel>
              <FormControl>
                <div className="relative">
                  <IconFileDescription className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <textarea
                    {...field}
                    placeholder="Tell us about your organization, its mission, and why you want to join UrbanFix..."
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading}
                  />
                </div>
              </FormControl>
              <FormDescription>
                Minimum 50 characters. Explain your organization's work and
                interest in urban issues.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Submitting...
            </>
          ) : (
            "Submit Application"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By submitting, you agree to our review process. You will be contacted
          via email once your application is reviewed.
        </p>
      </form>
    </Form>
  );
}
