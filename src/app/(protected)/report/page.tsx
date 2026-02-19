"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { CameraCapture } from "@/components/report/camera-capture";
import { LocationPicker } from "@/components/report/location-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { getTimeUntilMidnight, isMobileDevice } from "@/lib/utils";

const reportSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(100, "Title must be less than 100 characters"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface Location {
  lat: number;
  lng: number;
}

type Step = "camera" | "location" | "details";

export default function ReportPage() {
  const router = useRouter();
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>("camera");
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [isViewingPhoto, setIsViewingPhoto] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Check if mobile on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  // Handle image capture
  const handleImageCapture = (blob: Blob) => {
    setCapturedImage(blob);
    setCapturedImageUrl(URL.createObjectURL(blob));
    setIsViewingPhoto(false);
    setCurrentStep("location");
    toast.success("Photo captured!");
  };

  const handleCameraError = (error: Error) => {
    toast.error("Camera error", {
      description: error.message,
    });
  };

  // Handle location selection
  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
  }, []);

  const confirmLocation = () => {
    if (!selectedLocation) {
      toast.error("Please select a location");
      return;
    }
    setCurrentStep("details");
  };

  // Handle form submission
  const onSubmit = async (_values: ReportFormValues) => {
    if (!capturedImage || !selectedLocation) {
      toast.error("Missing information");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Upload image to Supabase storage
      // TODO: Create issue in database
      // TODO: Check for duplicates using find_nearby_issues

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success("Issue reported!", {
        description: "Your report has been submitted for verification.",
      });

      router.push("/");
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit report", {
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (currentStep === "location") {
      setIsViewingPhoto(false);
      setCurrentStep("camera");
    } else if (currentStep === "details") {
      setIsViewingPhoto(false);
      setCurrentStep("location");
    }
  };

  // Loading state
  if (isMobile === null) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Desktop warning
  if (!isMobile) {
    const { hours, minutes } = getTimeUntilMidnight();

    return (
      <div className="container mx-auto max-w-screen-md px-4 py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-yellow-500/10 p-4 mb-4">
              <IconAlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <h1 className="text-xl font-bold mb-2">Mobile Device Required</h1>
            <p className="text-muted-foreground mb-6 max-w-sm">
              To ensure accurate issue reporting with real-time photos and
              precise location, please access this page from a mobile device.
            </p>
            <Button asChild>
              <Link href="/">
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-screen-md px-4 py-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        {currentStep !== "camera" && (
          <Button variant="ghost" size="icon" onClick={goBack}>
            <IconArrowLeft className="h-5 w-5" />
            <span className="sr-only">Go back</span>
          </Button>
        )}
        <div>
          <h1 className="text-xl font-bold">Report an Issue</h1>
          <p className="text-sm text-muted-foreground">
            {currentStep === "camera" && "Take a photo of the issue"}
            {currentStep === "location" && "Select the exact location"}
            {currentStep === "details" && "Add details about the issue"}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {["camera", "location", "details"].map((step, index) => (
          <div key={step} className="flex items-center">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === step
                  ? "bg-primary text-primary-foreground"
                  : index <
                      ["camera", "location", "details"].indexOf(currentStep)
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>
            {index < 2 && (
              <div
                className={`h-0.5 w-8 mx-1 ${
                  index < ["camera", "location", "details"].indexOf(currentStep)
                    ? "bg-green-500"
                    : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      {currentStep === "camera" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capture the Issue</CardTitle>
          </CardHeader>
          <CardContent>
            <CameraCapture
              onCapture={handleImageCapture}
              onError={handleCameraError}
            />
          </CardContent>
        </Card>
      )}

      {currentStep === "location" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-lg">Select Location</CardTitle>
            {capturedImageUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsViewingPhoto((prev) => !prev)}
              >
                {isViewingPhoto ? "Close Photo" : "View Photo"}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {capturedImageUrl && isViewingPhoto && (
              <div className="relative min-h-[60dvh] overflow-hidden rounded-lg bg-muted">
                <img
                  src={capturedImageUrl}
                  alt="Captured issue"
                  className="absolute inset-0 h-full w-full object-contain"
                />
              </div>
            )}

            {!isViewingPhoto && (
              <>
                <LocationPicker onLocationSelect={handleLocationSelect} />

                <Button
                  className="w-full"
                  size="lg"
                  onClick={confirmLocation}
                  disabled={!selectedLocation}
                >
                  Confirm Location
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {currentStep === "details" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Issue Details</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Preview of captured image */}
            {capturedImageUrl && (
              <div className="relative aspect-video overflow-hidden rounded-lg mb-4">
                <img
                  src={capturedImageUrl}
                  alt="Captured issue"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Selected location */}
            {selectedLocation && (
              <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
                <span className="font-medium">Location: </span>
                <span className="text-muted-foreground">
                  {`${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`}
                </span>
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Brief description of the issue"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        E.g., "Pothole on Main Street" or "Broken streetlight"
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Details (Optional)</FormLabel>
                      <FormControl>
                        <textarea
                          {...field}
                          placeholder="Provide more context about the issue..."
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
