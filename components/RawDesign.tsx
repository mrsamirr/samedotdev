import type React from "react";
import { useRef, useCallback, memo } from "react";
import { GeneratedDesign } from "@/types/design";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NodeResizer } from "@xyflow/react";

const RawDesignNode: React.FC<{
  data: {
    design: GeneratedDesign;
    onDelete: (id: string) => void;
    isExpanded: boolean;
    onToggleExpanded: (id: string) => void;
    onPreview: (design: GeneratedDesign) => void;
    onOpenMenu: (id: string, x: number, y: number) => void;
    measuredHeight?: number;
    onMeasuredHeight?: (id: string, height: number) => void;
    onOpenSource?: (design: GeneratedDesign) => void;
    onFollowUp?: (design: GeneratedDesign) => void;
    onShowHistory?: (id: string) => void;
  };
}> = ({ data }) => {
  const { design, isExpanded, onOpenMenu, measuredHeight, onMeasuredHeight } =
    data;

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const openTopCenteredMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const topY = rect.top;
    onOpenMenu(design.id, centerX, topY);
  };

  const handleDesignClick = (e: React.MouseEvent) => {
    // Only open menu if clicking on the design content, not on buttons
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    openTopCenteredMenu(e);
  };



  const cardWidth = isExpanded ? 820 : design.size.width;
  const baseHeight =
    measuredHeight && measuredHeight > 0 ? measuredHeight : 1000;
  const scale = Math.min(1, cardWidth / 820);
  const cardHeight = Math.round(baseHeight * scale) + 80; // + header

  const handleMeasure = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      const h =
        Math.max(
          doc.documentElement?.scrollHeight || 0,
          doc.body?.scrollHeight || 0
        ) || 0;
      if (h && onMeasuredHeight) onMeasuredHeight(design.id, h);
    } catch {}
  }, [onMeasuredHeight, design.id]);

  return (
    <>
      <NodeResizer
        color="#3b82f6"
        isVisible={true}
        minWidth={300}
        minHeight={200}
        maxWidth={1200}
        maxHeight={1000}
      />
      <Card
        ref={containerRef}
        onClick={handleDesignClick}
        className="design-card group hover:shadow-xl border-2 border-transparent hover:border-blue-200 selected:border-blue-400 selected:shadow-2xl bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 relative overflow-hidden"
        style={{
          width: cardWidth,
          height: cardHeight,
        }}
      >
        <CardHeader className="p-3 pb-2 node-drag-handle cursor-move bg-muted/30 hover:bg-muted/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate leading-tight">
                {design.prompt}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
          </div>
        </CardHeader>

        <CardContent
          className="p-0 relative bg-background"
          style={{ height: `calc(100% - 100px)` }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={`<!doctype html><html><head><style>
            html,body{margin:0;padding:0;overflow:hidden;background:white;font-family:system-ui,-apple-system,sans-serif}
            *{scrollbar-width:none}::-webkit-scrollbar{display:none}
          </style></head><body>${design.html}</body></html>`}
            className="w-full h-full rounded-b-lg"
            style={{
              transform: `scale(${scale}) translateZ(0)`,
              transformOrigin: "top left",
              width: "820px",
              height: `${baseHeight}px`,
              backfaceVisibility: "hidden",
              willChange: "transform",
              pointerEvents: "none",
              border: "none",
            }}
            sandbox="allow-scripts allow-same-origin"
            onLoad={handleMeasure}
          />

          {/* Enhanced overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent pointer-events-none rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Hover indicator */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
            <Badge
              variant="secondary"
              className="bg-background/90 backdrop-blur-sm"
            >
              Click to interact
            </Badge>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export const DesignNode = memo(RawDesignNode, (prev, next) => {
  return (
    prev.data.design.id === next.data.design.id &&
    prev.data.isExpanded === next.data.isExpanded &&
    prev.data.design.html === next.data.design.html &&
    prev.data.design.css === next.data.design.css &&
    prev.data.measuredHeight === next.data.measuredHeight
  );
});
