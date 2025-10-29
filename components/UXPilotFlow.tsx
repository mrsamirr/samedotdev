import type React from "react";
import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import {
  Trash2,
  Maximize2,
  Code2,
  History,
  Share2,
  Menu,
  Sparkles,
  Download,
  Copy,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast, ToastContainer } from "./Toast";
import { PageProgressBar } from "./PageProgressBar";
import { useGenerationProgress } from "@/hooks/useGenerationProgress";
import {
  DbDesign,
  DbGroup,
  GeneratedDesign,
  GenerationRequest,
} from "@/types/design";
import {
  ReactFlow,
  applyNodeChanges,
  type Node,
  type Edge,
  Controls,
  Background,
  useReactFlow,
  type FitViewOptions,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DesignNode } from "./RawDesign";
import { Sidebar } from "./Sidebar";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Toast } from "@/lib/ui/toast";

const UXPilotFlowContent: React.FC = () => {
  const [designs, setDesigns] = useState<GeneratedDesign[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [generationCount, setGenerationCount] = useState(0);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [previewDesign, setPreviewDesign] = useState<GeneratedDesign | null>(
    null
  );
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    designId: string;
  } | null>(null);
  const [editDropdownOpen, setEditDropdownOpen] = useState(false);
  const [moreOptionsOpen, setMoreOptionsOpen] = useState(false);
  const [measuredHeights, setMeasuredHeights] = useState<
    Record<string, number>
  >({});
  const [followUp, setFollowUp] = useState<{
    design: GeneratedDesign;
    prompt: string;
  } | null>(null);
  const [historyView, setHistoryView] = useState<{
    design: GeneratedDesign;
    history: { prompt: string; at: string }[];
  } | null>(null);
  const [groups, setGroups] = useState<DbGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [codeSidebar, setCodeSidebar] = useState<{
    design: GeneratedDesign | null;
    format: "react" | "html";
  }>({
    design: null,
    format: "react",
  });
  const [autoLayout, setAutoLayout] = useState(true);

  const toast = useToast();
  const progressTracker = useGenerationProgress();

  const { fitView } = useReactFlow();
  const searchParams = useSearchParams();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editDropdownOpen || moreOptionsOpen) {
        setEditDropdownOpen(false);
        setMoreOptionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [editDropdownOpen, moreOptionsOpen]);

  // Stable refs to avoid referencing handlers before declaration in callbacks
  const deleteDesignRef = useRef<(id: string) => void>(() => {});
  const toggleNodeExpandedRef = useRef<(id: string) => void>(() => {});
  const onMeasuredHeightRef = useRef<(id: string, h: number) => void>(() => {});

  function openContextMenu(id: string, x: number, y: number) {
    const rect = canvasRef.current?.getBoundingClientRect();
    const rx = rect ? x - rect.left : x;
    const ry = rect ? y - rect.top : y;
    setContextMenu({ x: rx, y: ry, designId: id });
  }
  function closeContextMenu() {
    setContextMenu(null);
    setEditDropdownOpen(false);
    setMoreOptionsOpen(false);
  }

  const fitViewOptions: FitViewOptions = {
    padding: 0.2,
    maxZoom: 1,
  };

  const nodeTypes = {
    designNode: DesignNode,
  };

  const convertDesignsToNodes = useCallback(
    (designs: GeneratedDesign[]) => {
      return designs.map((design) => ({
        id: design.id,
        type: "designNode",
        position: design.position,
        dragHandle: ".node-drag-handle",
        data: {
          design,
          onDelete: deleteDesignRef.current,
          isExpanded: expandedNodes.has(design.id),
          onToggleExpanded: toggleNodeExpandedRef.current,
          onPreview: (d: GeneratedDesign) => openPreviewInNewTab(d),
          onOpenMenu: openContextMenu,
          measuredHeight: measuredHeights[design.id],
          onMeasuredHeight: onMeasuredHeightRef.current,
          onOpenSource: (d: GeneratedDesign) => openSourceInNewTab(d),
          onFollowUp: (d: GeneratedDesign) =>
            setFollowUp({ design: d, prompt: "" }),
          onShowHistory: (id: string) => openHistory(id),
        },
        style: (() => {
          const width = expandedNodes.has(design.id) ? 800 : design.size.width;
          const baseH =
            measuredHeights[design.id] && measuredHeights[design.id] > 0
              ? measuredHeights[design.id]
              : 1000;
          const scale = Math.min(1, width / 800);
          const height = Math.round(baseH * scale) + 80;
          return { width, height };
        })(),
      }));
    },
    [expandedNodes, measuredHeights]
  );

  // Calculate grid position with better spacing
  const calculateGridPosition = (index: number) => {
    const cols = 3;
    const spacingX = 900; // Better spacing for cards
    const spacingY = 800; // More vertical space
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      x: 120 + col * spacingX,
      y: 120 + row * spacingY,
    };
  };

  // Load groups and designs on mount / group change (parallelized)
  useEffect(() => {
    (async () => {
      try {
        const qp = searchParams?.get("group");
        const resolvedGroupId = qp ?? activeGroupId;

        const designsQuery = resolvedGroupId ? `?group=${resolvedGroupId}&limit=100` : `?limit=100`;

        const fetchGroups = groups.length
          ? null
          : fetch("/api/groups");
        const fetchDesigns = fetch(`/api/designs${designsQuery}`);

        const [groupsRes, designsRes] = await Promise.all([
          fetchGroups,
          fetchDesigns,
        ]);

        if (groupsRes && groupsRes.ok) {
          const data = await groupsRes.json();
          setGroups(data.groups || []);
          if (qp) {
            setActiveGroupId(qp);
          } else if (!activeGroupId && data.groups?.[0]) {
            setActiveGroupId(data.groups[0].id);
          }
        }

        if (designsRes.ok) {
          const data = await designsRes.json();
          const fetched: DbDesign[] = data.designs || [];
          const repositionedDesigns = fetched.map(
            (design: DbDesign, index: number) => ({
              id: design.id,
              html: design.html,
              css: design.css ?? "",
              elements: design.elements ?? [],
              timestamp: new Date(design.createdAt).getTime(),
              prompt: design.prompt,
              position: calculateGridPosition(index),
              size: design.size,
              useCase: design.useCase,
              screenType: design.screenType,
              deepDesign: design.deepDesign,
              autoflow: design.autoflow,
            })
          );
          setDesigns(repositionedDesigns);
          setGenerationCount(repositionedDesigns.length);
        }
      } catch (e) {
        console.error("Failed to fetch designs from DB", e);
      }

      const savedExpanded = localStorage.getItem("uxpilot-expanded-nodes");
      if (savedExpanded) setExpandedNodes(new Set(JSON.parse(savedExpanded)));
      setTimeout(() => fitView(fitViewOptions), 300);
    })();
  }, [fitView, activeGroupId, searchParams, groups.length]);

  // Update nodes and persist expanded state only
  useEffect(() => {
    const newNodes = convertDesignsToNodes(designs);
    localStorage.setItem(
      "uxpilot-expanded-nodes",
      JSON.stringify(Array.from(expandedNodes))
    );
    setNodes(newNodes);
  }, [designs, expandedNodes, convertDesignsToNodes]);

  const generateDesign = async (request: GenerationRequest) => {
    setIsGenerating(true);

    // Create a unique session ID for progress tracking
    const sessionId = `gen-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Start progress tracking
    progressTracker.startGeneration(
      sessionId,
      `Creating ${request.useCase} design...`
    );

    // Create a placeholder design immediately to prevent UI freezing
    const existingCount = designs.length;
    const position = calculateGridPosition(existingCount);
    const tempId = `temp-${Date.now()}`;

    const getDimensions = () => {
      switch (request.screenType) {
        case "mobile":
          return { width: 300, height: 600 };
        default:
          return { width: 500, height: 400 };
      }
    };

    const placeholderDesign: GeneratedDesign = {
      id: tempId,
      html: `<div class="flex items-center justify-center h-64 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 mx-auto mb-3"></div>
          <p class="text-gray-600 font-medium">Generating design...</p>
          <p class="text-sm text-gray-500">${request.context.substring(0, 50)}${
        request.context.length > 50 ? "..." : ""
      }</p>
        </div>
      </div>`,
      css: "",
      elements: [],
      timestamp: Date.now(),
      prompt: request.context,
      position,
      size: getDimensions(),
      useCase: request.useCase,
      screenType: request.screenType,
      deepDesign: request.deepDesign,
      autoflow: request.autoflow,
    };

    // Add placeholder immediately
    setDesigns((prev) => [...prev, placeholderDesign]);
    setGenerationCount((prev) => prev + 1);

    try {
      // Use setTimeout to make the API call non-blocking
      setTimeout(async () => {
        try {
          // Update progress
          progressTracker.updateProgress(
            sessionId,
            20,
            "Analyzing your prompt..."
          );

          const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(request),
          });

          progressTracker.updateProgress(
            sessionId,
            60,
            "Generating HTML structure..."
          );

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          if (data.error) throw new Error(data.error);

          progressTracker.updateProgress(sessionId, 80, "Saving design...");

          const toPersist = {
            html: data.html,
            css: data.css || "",
            elements: data.elements || [],
            prompt: request.context,
            position,
            size: getDimensions(),
            useCase: request.useCase,
            screenType: request.screenType,
            deepDesign: request.deepDesign,
            autoflow: request.autoflow,
          };

          // Save to DB
          const saveRes = await fetch("/api/designs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...toPersist, groupId: activeGroupId }),
          });

          if (!saveRes.ok) throw new Error("Failed to save design");

          const saved = await saveRes.json();
          const created = saved.design;

          const newDesign: GeneratedDesign = {
            id: created.id,
            html: created.html,
            css: created.css || "",
            elements: created.elements || [],
            timestamp: new Date(created.createdAt).getTime(),
            prompt: created.prompt,
            position: created.position,
            size: created.size,
            useCase: created.useCase,
            screenType: created.screenType,
            deepDesign: created.deepDesign,
            autoflow: created.autoflow,
          };

          progressTracker.updateProgress(sessionId, 100, "Design completed!");

          // Replace placeholder with actual design
          setDesigns((prev) => {
            const updated = prev.map((d) => (d.id === tempId ? newDesign : d));
            setTimeout(() => fitView(fitViewOptions), 100);
            return updated;
          });

          // Complete progress tracking
          progressTracker.completeGeneration(sessionId);
          toast.success("Design created!", "Your new design is ready to view");
        } catch (error) {
          console.error("Generation failed:", error);

          // Cancel progress tracking
          progressTracker.cancelGeneration(sessionId);

          // Replace placeholder with error state
          const errorDesign: GeneratedDesign = {
            ...placeholderDesign,
            html: `<div class="flex items-center justify-center h-64 bg-red-50 rounded-lg border-2 border-red-200">
              <div class="text-center">
                <div class="text-red-500 text-4xl mb-3">⚠️</div>
                <p class="text-red-600 font-medium">Generation Failed</p>
                <p class="text-sm text-red-500 mt-1">${
                  error instanceof Error ? error.message : "Unknown error"
                }</p>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" class="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600">
                  Remove
                </button>
              </div>
            </div>`,
          };

          setDesigns((prev) =>
            prev.map((d) => (d.id === tempId ? errorDesign : d))
          );

          // Show error notification
          toast.error(
            "Generation failed",
            error instanceof Error ? error.message : "Unknown error"
          );
        } finally {
          setIsGenerating(false);
        }
      }, 100); // Small delay to ensure UI updates
    } catch (error) {
      console.error("Generation setup failed:", error);
      // Remove placeholder if setup fails
      setDesigns((prev) => prev.filter((d) => d.id !== tempId));
      setGenerationCount((prev) => prev - 1);
      setIsGenerating(false);
      toast.error(
        "Failed to start generation",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };
  const handleFollowUp = async () => {
    if (!followUp) return;

    setIsGenerating(true);

    // Create session for progress tracking
    const sessionId = `update-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    progressTracker.startGeneration(
      sessionId,
      `Updating ${followUp.design.useCase} design...`
    );

    // Show loading state immediately in the design
    const originalDesign = followUp.design;
    const loadingHtml = `<div class="relative">
      <div class="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 border-t-purple-600 mx-auto mb-3"></div>
          <p class="text-gray-600 font-medium">Updating design...</p>
          <p class="text-sm text-gray-500">${followUp.prompt.substring(0, 50)}${
      followUp.prompt.length > 50 ? "..." : ""
    }</p>
        </div>
      </div>
      ${originalDesign.html}
    </div>`;

    // Update UI immediately with loading state
    setDesigns((prev) =>
      prev.map((design) =>
        design.id === followUp.design.id
          ? { ...design, html: loadingHtml }
          : design
      )
    );

    try {
      // Use setTimeout to make the API call non-blocking
      setTimeout(async () => {
        try {
          progressTracker.updateProgress(sessionId, 20, "Analyzing changes...");

          // Call the generate API with the existing design as baseHtml
          const response = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              context: followUp.prompt,
              useCase: followUp.design.useCase,
              screenType: followUp.design.screenType,
              deepDesign: followUp.design.deepDesign,
              autoflow: followUp.design.autoflow,
              baseHtml: followUp.design.html,
              prevPrompt: followUp.design.prompt,
            }),
          });

          progressTracker.updateProgress(sessionId, 60, "Applying updates...");

          if (!response.ok)
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);

          const data = await response.json();
          if (data.error) throw new Error(data.error);

          progressTracker.updateProgress(sessionId, 80, "Saving changes...");

          // Update the design in the database
          const updateRes = await fetch(`/api/designs/${followUp.design.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              html: data.html,
              css: data.css || followUp.design.css,
              elements: data.elements || followUp.design.elements,
              prompt: followUp.prompt,
            }),
          });

          if (!updateRes.ok) throw new Error("Failed to update design");

          const updatedData = await updateRes.json();
          const updated = updatedData.design;

          progressTracker.updateProgress(sessionId, 100, "Update completed!");

          // Update the local state with the new design
          setDesigns((prev) =>
            prev.map((design) =>
              design.id === followUp.design.id
                ? {
                    ...design,
                    html: updated.html,
                    css: updated.css || "",
                    elements: updated.elements || [],
                    prompt: updated.prompt,
                    timestamp: new Date(updated.updatedAt).getTime(),
                  }
                : design
            )
          );

          progressTracker.completeGeneration(sessionId);
          toast.success("Design updated!", "Your changes have been applied");
          setTimeout(() => fitView(fitViewOptions), 100);
        } catch (error) {
          console.error("Follow-up failed:", error);

          progressTracker.cancelGeneration(sessionId);

          // Revert to original design on error
          setDesigns((prev) =>
            prev.map((design) =>
              design.id === followUp.design.id ? originalDesign : design
            )
          );

          toast.error(
            "Update failed",
            error instanceof Error ? error.message : "Unknown error"
          );
        } finally {
          setIsGenerating(false);
        }
      }, 100);

      // Close the follow-up modal immediately
      setFollowUp(null);
    } catch (error) {
      console.error("Follow-up setup failed:", error);
      // Revert to original design
      setDesigns((prev) =>
        prev.map((design) =>
          design.id === followUp.design.id ? originalDesign : design
        )
      );
      setIsGenerating(false);
      toast.error(
        "Failed to start update",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };
  const deleteDesign = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/designs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete design");
    } catch (e) {
      console.log("??????? deleteDesign called for ID:", id);
      console.error("Delete failed (DB), proceeding to update UI", e);
    }

    setDesigns((prev) => {
      const updated = prev.filter((design) => design.id !== id);
      const repositioned = updated.map((design, index) => ({
        ...design,
        position: calculateGridPosition(index),
      }));
      return repositioned;
    });
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    setTimeout(() => fitView(fitViewOptions), 300);
  }, []);

  const toggleNodeExpanded = useCallback((id: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
    setTimeout(() => fitView(fitViewOptions), 300);
  }, []);

  // Sync handler refs after they are defined
  useEffect(() => {
    deleteDesignRef.current = deleteDesign;
  }, [deleteDesign]);
  useEffect(() => {
    toggleNodeExpandedRef.current = toggleNodeExpanded;
  }, [toggleNodeExpanded]);
  useEffect(() => {
    onMeasuredHeightRef.current = (id: string, h: number) =>
      setMeasuredHeights((prev) =>
        prev[id] === h ? prev : { ...prev, [id]: h }
      );
  }, []);

  async function openPreviewInNewTab(d: GeneratedDesign) {
    try {
      // Try to use the public share URL first
      const response = await fetch(`/api/designs/${d.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        window.open(data.shareUrl, "_blank");
        return;
      }
    } catch (error) {
      console.warn(
        "Failed to generate share URL, falling back to direct preview"
      );
    }

    // Fallback: Open a direct preview page
    const previewUrl = `/preview/${d.id}`;
    window.open(previewUrl, "_blank");
  }

  function openSourceInNewTab(d: GeneratedDesign) {
    const encoded = URL.createObjectURL(
      new Blob([d.html], { type: "text/plain" })
    );
    window.open(encoded, "_blank");
    setTimeout(() => URL.revokeObjectURL(encoded), 10000);
  }

  async function openHistory(designId: string) {
    try {
      const res = await fetch(`/api/designs/${designId}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      const d = designs.find((dd) => dd.id === designId);
      if (d)
        setHistoryView({ design: d, history: data.design.promptHistory || [] });
    } catch (e) {
      console.error(e);
    }
  }

  function toReactTailwind(html: string) {
    // naive HTML -> JSX transform good enough for copy
    const jsx = html
      .replace(/ class=/g, " className=")
      .replace(/ for=/g, " htmlFor=")
      .replace(/(checked|disabled|readonly|autofocus|selected)=""/g, "$1")
      .replace(/<br>/g, "<br />")
      .replace(/<hr>/g, "<hr />")
      .replace(/<img([^>]*?)(?<!\/)>/g, "<img$1 />")
      .replace(/<input([^>]*?)(?<!\/)>/g, "<input$1 />")
      .replace(/<source([^>]*?)(?<!\/)>/g, "<source$1 />");
    return `export default function Design() {\n  return (\n    <>\n${jsx}\n    </>\n  )\n}`;
  }

  function openSourceSidebar(d: GeneratedDesign) {
    setCodeSidebar({ design: d, format: "react" });
  }

  function closeSourceSidebar() {
    setCodeSidebar({ design: null, format: "react" });
  }

  async function saveDesignNow(d: GeneratedDesign) {
    try {
      const res = await fetch(`/api/designs/${d.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: d.html,
          css: d.css,
          elements: d.elements,
          prompt: d.prompt,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      // no-op UI update
    } catch (e) {
      console.error(e);
      toast.error("Save failed", "Please try again");
    }
  }

  function downloadHtmlFile(d: GeneratedDesign) {
    const blob = new Blob([d.html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${d.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyCode(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() =>
        toast.success("Code copied!", "Code has been copied to clipboard")
      )
      .catch(() =>
        toast.error("Copy failed", "Unable to copy code to clipboard")
      );
  }

  async function shareLink(d: GeneratedDesign) {
    try {
      // Generate a proper shareable URL via API
      const response = await fetch(`/api/designs/${d.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const data = await response.json();
        await navigator.clipboard.writeText(data.shareUrl);
        toast.success(
          "Share link copied!",
          "Anyone with this link can view your design"
        );
      } else {
        // Fallback to current page URL with design parameter
        const url = new URL(window.location.href);
        if (activeGroupId) url.searchParams.set("group", activeGroupId);
        url.searchParams.set("design", d.id);
        await navigator.clipboard.writeText(url.toString());
        toast.success("Share link copied!", "Link copied to clipboard");
      }
    } catch (error) {
      console.error("Share link error:", error);
      toast.error(
        "Failed to copy link",
        "Please try again or copy the URL manually"
      );
    }
  }

  const clearAll = async () => {
    if (!confirm("Are you sure you want to clear all designs?")) return;

    // naive: fetch all and delete one by one (simple for now)
    try {
      const res = await fetch(
        `/api/designs${activeGroupId ? `?group=${activeGroupId}` : ""}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        const toDelete: string[] = (
          (data.designs as DbDesign[] | undefined) || []
        ).map((d: DbDesign) => d.id);
        await Promise.allSettled(
          toDelete.map((id) =>
            fetch(`/api/designs/${id}`, { method: "DELETE" })
          )
        );
      }
    } catch (e) {
      console.error("Bulk delete error", e);
    }

    setDesigns([]);
    setGenerationCount(0);
    setNodes([]);
    setEdges([]);
    setExpandedNodes(new Set());
  };

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  // Auto-layout to prevent overlap (masonry columns)
  useEffect(() => {
    if (!autoLayout) return;
    if (designs.length === 0) return;
    const cols = 3;
    const spacingX = 950;
    const spacingY = 100;
    const colHeights = Array(cols).fill(120);
    const updated = designs.map((d) => {
      const width = expandedNodes.has(d.id) ? 820 : d.size.width;
      const baseH =
        measuredHeights[d.id] && measuredHeights[d.id] > 0
          ? measuredHeights[d.id]
          : 1000;
      const scale = Math.min(1, width / 820);
      const h = Math.round(baseH * scale) + 80;
      // pick shortest column
      const col = colHeights.indexOf(Math.min(...colHeights));
      const position = { x: 120 + col * spacingX, y: colHeights[col] };
      colHeights[col] += h + spacingY;
      return { ...d, position };
    });
    setDesigns(updated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designs.length, measuredHeights, expandedNodes, autoLayout]);

  // Disable auto layout on manual drag
  useEffect(() => {
    const handler = (_e: DragEvent) => {
      setAutoLayout(false);
    };
    window.addEventListener("dragstart", handler);
    return () => window.removeEventListener("dragstart", handler);
  }, []);

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 relative text-black">
      <PageProgressBar
        isVisible={progressTracker.hasActiveGenerations}
        progress={progressTracker.totalProgress}
        message={progressTracker.currentMessage}
      />
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />

      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onGenerate={generateDesign}
        isGenerating={isGenerating}
        generationCount={generationCount}
      />

      <div
        className={`fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 flex items-center justify-between px-6 z-30 shadow-sm transition-all duration-300 ${
          progressTracker.hasActiveGenerations ? "mt-16" : ""
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/60 rounded-md lg:hidden transition-all"
          >
            <Menu size={20} />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 rounded-md flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">UX</span>
            </div>
            <span className="text-xl font-bold text-gray-900">same dev</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 mr-4">
            <Select
              value={activeGroupId ?? ""}
              onValueChange={(value) => {
                const id = value || null;
                setActiveGroupId(id);
                const url = new URL(window.location.href);
                if (id) url.searchParams.set("group", id);
                else url.searchParams.delete("group");
                window.history.replaceState(null, "", url.toString());
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Files" />
              </SelectTrigger>
              <SelectContent>
             
                <SelectItem value="__all__">All Files</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={async () => {
                const name = prompt("New file name")?.trim();
                if (!name) return;
                const res = await fetch("/api/groups", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ name }),
                });
                if (res.ok) {
                  const data = await res.json();
                  setGroups((prev) => [...prev, data.group]);
                  setActiveGroupId(data.group.id);
                  const url = new URL(window.location.href);
                  url.searchParams.set("group", data.group.id);
                  window.history.replaceState(null, "", url.toString());
                }
              }}
            >
              + New File
            </Button>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fitView(fitViewOptions)}
                >
                  <Maximize2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Fit to View</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearAll}
                  disabled={designs.length === 0}
                >
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Clear All</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div
        ref={canvasRef}
        className={`w-full min-h-screen transition-all duration-300 ${
          sidebarOpen ? "lg:pl-80" : ""
        } ${progressTracker.hasActiveGenerations ? "pt-32" : "pt-20"} pb-8`}
      >
        <div className="h-screen">
          <ReactFlow
            nodes={nodes}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            fitView
            fitViewOptions={{
              padding: 0.3,
              maxZoom: 1,
              minZoom: 0.1,
            }}
            snapToGrid
            snapGrid={[20, 20]}
            panOnScroll
            zoomOnPinch
            panOnDrag={[1, 2]}
            attributionPosition="bottom-left"
            className="bg-transparent"
            proOptions={{ hideAttribution: true }}
            minZoom={0.1}
            maxZoom={1.5}
          >
            <Background 
              gap={20} 
              size={1}
              color="#e5e7eb"
            />
            <Controls 
              className="bg-white/90 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg"
              showInteractive={false}
            />
          </ReactFlow>
        </div>
      </div>

      {designs.length === 0 && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none z-10">
          <div className="relative">
            <div className="text-8xl mb-8 relative">
              <span className="relative z-10">✨</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl scale-150"></div>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-6">
              Welcome to same dev
            </h2>
            <p className="text-gray-600 mb-10 max-w-lg text-lg leading-relaxed">
              Transform your ideas into stunning UI designs with AI.
              <br />
              Create wireframes and pixel-perfect mockups in seconds.
            </p>
            <Button
              onClick={() => setSidebarOpen(true)}
              size="lg"
              className="pointer-events-auto px-10 py-6 text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all"
            >
              <Sparkles size={20} />
              Start Creating Magic
            </Button>
          </div>
        </div>
      )}

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
          <div
            className="absolute z-50"
            style={{
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              transform: "translateX(-50%) translateY(-100%)",
            }}
          >
            <div className="bg-background border rounded-lg shadow-lg">
              <div className="flex items-center divide-x divide-border">
                {/* Update Design */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center justify-center px-3 py-2 hover:bg-accent transition-colors rounded-l-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const d = designs.find(
                            (dd) => dd.id === contextMenu.designId
                          );
                          if (d) {
                            setFollowUp({ design: d, prompt: "" });
                          }
                          closeContextMenu();
                        }}
                      >
                        <Sparkles size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Update Design</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center justify-center px-3 py-2 hover:bg-accent transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const d = designs.find(
                            (dd) => dd.id === contextMenu.designId
                          );
                          if (d) {
                            downloadHtmlFile(d);
                          }
                          closeContextMenu();
                        }}
                      >
                        <Download size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Export HTML</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* View Code */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center justify-center px-3 py-2 hover:bg-accent transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const d = designs.find(
                            (dd) => dd.id === contextMenu.designId
                          );
                          if (d) {
                            openSourceSidebar(d);
                          }
                          closeContextMenu();
                        }}
                      >
                        <Code2 size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>View Code</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Preview */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center justify-center px-3 py-2 hover:bg-accent transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const d = designs.find(
                            (dd) => dd.id === contextMenu.designId
                          );
                          if (d) {
                            openPreviewInNewTab(d);
                          }
                          closeContextMenu();
                        }}
                      >
                        <Eye size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Preview</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* History */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center justify-center px-3 py-2 hover:bg-accent transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openHistory(contextMenu.designId);
                          closeContextMenu();
                        }}
                      >
                        <History size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>History</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Share Link */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center justify-center px-3 py-2 hover:bg-accent transition-colors"
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const d = designs.find(
                            (dd) => dd.id === contextMenu.designId
                          );
                          if (d) {
                            await shareLink(d);
                          }
                          closeContextMenu();
                        }}
                      >
                        <Share2 size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Share Link</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {/* Delete */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        className="flex items-center justify-center px-3 py-2 hover:bg-destructive hover:text-destructive-foreground transition-colors rounded-r-lg"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (
                            confirm("Are you sure you want to delete this design?")
                          ) {
                            deleteDesign(contextMenu.designId);
                          }
                          closeContextMenu();
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Delete Design</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </>
      )}

      {codeSidebar.design && (
        <div className="fixed inset-y-0 right-0 w-[500px] bg-background border-l shadow-2xl z-50 flex flex-col">
          <div className="p-5 border-b flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="font-bold flex items-center gap-2">
                <Code2 size={18} className="text-primary" />
                Source Code
              </h3>
              <div className="flex items-center gap-1 bg-muted rounded-md p-1">
                <Button
                  variant={codeSidebar.format === "react" ? "default" : "ghost"}
                  size="sm"
                  onClick={() =>
                    setCodeSidebar((v) => ({ ...v, format: "react" }))
                  }
                  className="h-7 px-3"
                >
                  React
                </Button>
                <Button
                  variant={codeSidebar.format === "html" ? "default" : "ghost"}
                  size="sm"
                  onClick={() =>
                    setCodeSidebar((v) => ({ ...v, format: "html" }))
                  }
                  className="h-7 px-3"
                >
                  HTML
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() =>
                  copyCode(
                    codeSidebar.format === "react"
                      ? toReactTailwind(codeSidebar.design!.html)
                      : codeSidebar.design!.html
                  )
                }
              >
                <Copy size={14} />
                Copy Code
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSourceSidebar}
              >
                <X size={14} />
              </Button>
            </div>
          </div>
          <div className="p-5 overflow-auto text-sm flex-1">
            <pre className="whitespace-pre-wrap break-words font-mono bg-muted p-5 rounded-md border">
              {codeSidebar.format === "react"
                ? toReactTailwind(codeSidebar.design!.html)
                : codeSidebar.design!.html}
            </pre>
          </div>
        </div>
      )}

      <Dialog open={!!followUp} onOpenChange={() => setFollowUp(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              Update Design
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Describe what changes you&apos;d like to make to your design
            </p>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={followUp?.prompt || ""}
              onChange={(e) =>
                followUp && setFollowUp({ ...followUp, prompt: e.target.value })
              }
              rows={5}
              placeholder="E.g., make the buttons bigger, change the color scheme to dark mode, add more spacing..."
              disabled={isGenerating}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFollowUp(null)}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFollowUp}
              disabled={isGenerating || !followUp?.prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Update Design
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyView} onOpenChange={() => setHistoryView(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="text-primary" size={20} />
              Design History
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {(!historyView?.history || historyView.history.length === 0) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <History size={24} className="text-muted-foreground" />
                </div>
                <p className="font-medium">No history available</p>
                <p className="text-sm text-muted-foreground">
                  This design hasn&apos;t been updated yet.
                </p>
              </div>
            )}
            {historyView?.history?.map((h, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  {new Date(h.at).toLocaleString()}
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {h.prompt}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryView(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const UXPilotFlow: React.FC = () => {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <UXPilotFlowContent />
    </Suspense>
  );
};
