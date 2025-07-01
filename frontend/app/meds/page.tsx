"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button"; 

type Med = { name: string; time: string; dosage: string };

export default function MedsPage() {
  const [meds, setMeds] = useState<Med[]>([
    { name: "Panadol",   time: "8:00 AM",  dosage: "2 tablets" },
    { name: "Metformin", time: "12:00 PM", dosage: "1 tablet" },
    { name: "Vitamin D", time: "6:00 PM",  dosage: "1 capsule" },
  ]);

  const handleAddMed = () => {
    const name   = prompt("Medication name:");
    if (!name) return;

    const time   = prompt("Time to take (e.g. 9:00 AM):") || "";
    const dosage = prompt("Dosage (e.g. 1 tablet):")      || "";

    setMeds(prev => [...prev, { name, time, dosage }]);
  };

  return (
    <div className="px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Today’s Medications</h1>

        <Button variant="outline" size="sm" onClick={handleAddMed} className="gap-1">
          <Plus size={16} strokeWidth={2} />
          Add
        </Button>
      </div>

      {meds.map((med, idx) => (
        <div
          key={idx}
          className="rounded-xl border p-4 shadow-sm bg-white dark:bg-zinc-800"
        >
          <div className="text-sm text-zinc-500">Time: {med.time}</div>
          <div className="text-lg font-medium">{med.name}</div>
          <div className="text-sm text-zinc-500">Dosage: {med.dosage}</div>
        </div>
      ))}
    </div>
  );
}
