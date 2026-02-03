// Application constants

// Duplicate detection settings
export const DUPLICATE_RADIUS_METERS = Number(
  process.env.NEXT_PUBLIC_DUPLICATE_RADIUS_METERS || 50,
);
export const DUPLICATE_WINDOW_DAYS = Number(
  process.env.NEXT_PUBLIC_DUPLICATE_WINDOW_DAYS || 7,
);

// Rate limiting
export const MAX_ISSUES_PER_DAY = 1;

// Image constraints
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Map settings (Pune, India as default center)
export const DEFAULT_MAP_CENTER = {
  lat: 18.5204,
  lng: 73.8567,
};
export const DEFAULT_MAP_ZOOM = 15;

// Issue status labels and colors
export const ISSUE_STATUS_CONFIG = {
  pending: {
    label: "Pending Verification",
    color: "bg-yellow-500",
    textColor: "text-yellow-500",
  },
  verified: {
    label: "Verified",
    color: "bg-blue-500",
    textColor: "text-blue-500",
  },
  addressed: {
    label: "Addressed",
    color: "bg-green-500",
    textColor: "text-green-500",
  },
} as const;

// User role labels
export const USER_ROLE_LABELS = {
  user: "User",
  ngo: "NGO",
  admin: "Admin",
} as const;

// Navigation items for different roles
export const NAV_ITEMS = {
  user: [
    { href: "/", label: "Home", icon: "home" },
    { href: "/report", label: "Report", icon: "camera", mobileOnly: true },
  ],
  ngo: [
    { href: "/", label: "Home", icon: "home" },
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  ],
  admin: [
    { href: "/", label: "Home", icon: "home" },
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  ],
} as const;

// API routes
export const API_ROUTES = {
  issues: "/api/issues",
  votes: "/api/votes",
  ngoApplications: "/api/ngo-applications",
} as const;
