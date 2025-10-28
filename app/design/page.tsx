"use client";

import type React from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { UXPilotFlow } from "@/components/UXPilotFlow";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function UXPilotPage() {
  return (
    <ProtectedRoute>
      <ReactFlowProvider>
        <UXPilotFlow />
      </ReactFlowProvider>
    </ProtectedRoute>
  );
}
