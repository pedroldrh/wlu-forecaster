"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateDisplayName } from "@/actions/profile";
import { toast } from "sonner";

export function DisplayNameForm({ currentDisplayName }: { currentDisplayName: string }) {
  const [name, setName] = useState(currentDisplayName);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDisplayName(name);
      toast.success("Display name updated!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Display name"
        maxLength={30}
        className="max-w-xs"
      />
      <Button type="submit" variant="outline" size="sm" disabled={loading || name === currentDisplayName}>
        {loading ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}
