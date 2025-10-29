"use client";

import type React from "react";
import dynamic from "next/dynamic";
import { ReactFlowProvider } from "@xyflow/react";

const UXPilotFlow = dynamic(() => import("@/components/UXPilotFlow").then(m => m.UXPilotFlow), {
  ssr: false,
  loading: () => null,
});

export default function UXPilotPage() {
  return (
    <ReactFlowProvider>
      <UXPilotFlow />
    </ReactFlowProvider>
  );
}
