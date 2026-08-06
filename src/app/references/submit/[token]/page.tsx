"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Card, Input, Label, Textarea, PageHeader } from "@/components/ui";

export default function ReferenceSubmitPage() {
  const params = useParams();
  const token = String(params.token || "");
  const [subjectName, setSubjectName] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [relationship, setRelationship] = useState("");
  const [refereeName, setRefereeName] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/references/submit/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.subjectName) setSubjectName(d.subjectName);
        if (d.status === "SUBMITTED") setDone(true);
      });
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/references/submit/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment, relationship, refereeName }),
    });
    const d = await res.json();
    if (!res.ok) {
      setError(d.error || "Failed");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-16">
        <Card className="text-center">
          <h1 className="font-display text-2xl font-semibold">Thank you</h1>
          <p className="mt-2 text-sm text-stone-500">Your reference has been recorded.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <PageHeader
        title="Leave a reference"
        description={subjectName ? `For ${subjectName}` : "AuPairly reference form"}
      />
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Your name</Label>
            <Input value={refereeName} onChange={(e) => setRefereeName(e.target.value)} required />
          </div>
          <div>
            <Label>Relationship</Label>
            <Input
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              placeholder="Former host family / employer"
            />
          </div>
          <div>
            <Label>Rating (1–5)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Comments</Label>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full">
            Submit reference
          </Button>
        </form>
      </Card>
    </div>
  );
}
