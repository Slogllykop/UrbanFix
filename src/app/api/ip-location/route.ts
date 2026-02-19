import { NextResponse } from "next/server";
import { DEFAULT_MAP_CENTER } from "@/lib/constants";

const PRIVATE_IP_PREFIXES = [
  "10.",
  "127.",
  "192.168.",
  "172.16.",
  "172.17.",
  "172.18.",
  "172.19.",
  "172.2",
  "::1",
  "fc",
  "fd",
];

function isPrivateOrLocalIp(ip: string): boolean {
  const normalized = ip.trim().toLowerCase();
  return PRIVATE_IP_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function getClientIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return null;
}

async function lookupIpCoordinates(ip: string): Promise<{
  lat: number;
  lng: number;
} | null> {
  // ipwho.is supports both public IP and explicit IP lookup without browser CORS.
  const target = encodeURIComponent(ip);
  const response = await fetch(`https://ipwho.is/${target}`, {
    cache: "no-store",
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    success?: boolean;
    latitude?: number;
    longitude?: number;
  };

  if (!data.success) return null;
  if (typeof data.latitude !== "number" || typeof data.longitude !== "number") {
    return null;
  }

  return {
    lat: data.latitude,
    lng: data.longitude,
  };
}

export async function GET(request: Request) {
  const ip = getClientIp(request);

  if (!ip || isPrivateOrLocalIp(ip)) {
    return NextResponse.json(DEFAULT_MAP_CENTER, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const location = await lookupIpCoordinates(ip);
    if (location) {
      return NextResponse.json(location, {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      });
    }
  } catch {
    // Fall through to default location
  }

  return NextResponse.json(DEFAULT_MAP_CENTER, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
