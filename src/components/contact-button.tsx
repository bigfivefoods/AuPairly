"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui";

export function ContactButton({
  recipientId,
  recipientName,
}: {
  recipientId: string;
  recipientName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleContact() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId,
          body: `Hi ${recipientName.split(" ")[0]}! I'd love to learn more about a possible au pair match. Looking forward to connecting.`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        setError(data.error || "Could not start conversation");
        return;
      }
      router.push(`/messages/${data.conversationId}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleContact} disabled={loading} className="w-full sm:w-auto">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
        Message
      </Button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
