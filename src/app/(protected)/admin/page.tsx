"use client";

import { IconShield, IconTrash } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/providers/auth-provider";

export default function AdminPage() {
  const router = useRouter();
  const role = useUserRole();
  const supabase = createClient();

  const [adminEmails, setAdminEmails] = useState<{ email: string }[]>([]);
  const [ngos, setNgos] = useState<
    { id: string; organization_name: string; contact_email: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Forms state
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newNgoEmail, setNewNgoEmail] = useState("");
  const [newNgoName, setNewNgoName] = useState("");

  useEffect(() => {
    if (role && role !== "admin") {
      router.push("/");
    }
  }, [role, router]);

  // Wrap fetchData in useCallback to satisfy exhaustive-deps
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: admins } = await supabase
        .from("admin_emails")
        .select("email");
      const { data: ngoList } = await supabase
        .from("ngos")
        .select("id, organization_name, contact_email")
        .eq("status", "approved");

      if (admins) setAdminEmails(admins);
      if (ngoList) setNgos(ngoList);
    } catch (error) {
      console.error("Failed to fetch admin data", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (role === "admin") {
      fetchData();
    }
  }, [role, fetchData]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail) return;

    try {
      const { error } = await supabase
        .from("admin_emails")
        .insert([{ email: newAdminEmail }] as any);
      if (error) throw error;
      toast.success("Admin email added");
      setNewAdminEmail("");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add admin");
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (adminEmails.length <= 1) {
      toast.error("Cannot remove the last admin");
      return;
    }

    try {
      const { error } = await supabase
        .from("admin_emails")
        .delete()
        .eq("email", email);
      if (error) throw error;
      toast.success("Admin revoked");
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove admin",
      );
    }
  };

  const handleAddNgo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNgoEmail || !newNgoName) return;

    try {
      const { error } = await supabase.from("ngos").insert([
        {
          organization_name: newNgoName,
          contact_email: newNgoEmail,
          phone: "N/A", // minimal placeholder since they bypass application
          address: "N/A",
          description: "Whitelisted by Admin",
          status: "approved",
        },
      ] as any);
      if (error) throw error;
      toast.success("NGO email whitelisted");
      setNewNgoEmail("");
      setNewNgoName("");
      fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to whitelist NGO",
      );
    }
  };

  const handleRemoveNgo = async (id: string) => {
    try {
      const { error } = await supabase.from("ngos").delete().eq("id", id);
      if (error) throw error;
      toast.success("NGO removed");
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove NGO");
    }
  };

  if (role !== "admin") {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <IconShield className="h-6 w-6 text-primary" />
          Admin Control Panel
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage system administrators and approved NGOs.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-8">
          {/* Admin Emails Management */}
          <Card>
            <CardHeader>
              <CardTitle>System Administrators</CardTitle>
              <CardDescription>
                Users with these emails will be automatically granted admin
                privileges upon signing in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleAddAdmin} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  required
                />
                <Button type="submit">Add</Button>
              </form>

              <div className="space-y-2">
                {adminEmails.map((admin) => (
                  <div
                    key={admin.email}
                    className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                  >
                    <span className="font-medium">{admin.email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveAdmin(admin.email)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* NGO Whitelist Management */}
          <Card>
            <CardHeader>
              <CardTitle>Approved NGOs</CardTitle>
              <CardDescription>
                NGOs listed here bypass the application process.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleAddNgo} className="space-y-3 flex flex-col">
                <Input
                  type="text"
                  placeholder="Organization Name"
                  value={newNgoName}
                  onChange={(e) => setNewNgoName(e.target.value)}
                  required
                />
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="contact@ngo.org"
                    value={newNgoEmail}
                    onChange={(e) => setNewNgoEmail(e.target.value)}
                    required
                  />
                  <Button type="submit">Whitelist</Button>
                </div>
              </form>

              <div className="space-y-2">
                {ngos.map((ngo) => (
                  <div
                    key={ngo.id}
                    className="flex items-center justify-between p-3 border rounded-md bg-muted/30"
                  >
                    <div>
                      <p className="font-medium">{ngo.organization_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ngo.contact_email}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleRemoveNgo(ngo.id)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {ngos.length === 0 && (
                  <p className="text-sm text-center py-4 text-muted-foreground">
                    No approved NGOs found.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
