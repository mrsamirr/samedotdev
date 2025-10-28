"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Code2,
  Download,
  ExternalLink,
  Share2,
  Eye,
  History,
  User,
  Calendar,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Link from "next/link";

interface SharedDesign {
  id: string;
  name: string;
  html: string;
  css: string;
  prompt: string;
  createdAt: string;
  updatedAt: string;
  useCase: string;
  screenType: string;
  user: {
    name: string;
    email: string;
  };
}

export default function SharePage() {
  const params = useParams();
  const id = params?.id as string;
  const [design, setDesign] = useState<SharedDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCode, setShowCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    if (!id) return;

    const fetchSharedDesign = async () => {
      try {
        const response = await fetch(`/api/share/${id}`);
        if (response.ok) {
          const data = await response.json();
          setDesign(data.design);
        } else if (response.status === 404) {
          setError("Design not found or not shared");
        } else {
          setError("Failed to load shared design");
        }
      } catch (err) {
        setError("Network error");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedDesign();
  }, [id]);

  const downloadHtml = () => {
    if (!design) return;

    const fullHtml =
      design.html.startsWith("<!DOCTYPE") || /<\s*html[\s>]/i.test(design.html)
        ? design.html
        : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${design.name || "Shared Design"}</title>
  <style>${design.css || ""}</style>
</head>
<body>
${design.html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${design.name || design.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openPreview = () => {
    if (!design) return;

    const fullHtml =
      design.html.startsWith("<!DOCTYPE") || /<\s*html[\s>]/i.test(design.html)
        ? design.html
        : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${design.name || "Shared Design"}</title>
  <style>${design.css || ""}</style>
</head>
<body>
${design.html}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading shared design...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/20 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Design Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "This design may have been removed or is not publicly shared."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <ArrowLeft size={16} />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-white ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {!isFullscreen && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">UX</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">
                    same dev
                  </span>
                </Link>

                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <span>{design.name || "Untitled Design"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFullscreen && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <div className="bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
            {zoomLevel}%
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-3 bg-black/20 backdrop-blur-sm text-white rounded-lg hover:bg-black/30 transition-all"
          >
            <Minimize2 size={20} />
          </button>
        </div>
      )}

      <div className={`${isFullscreen ? "h-full" : "max-w-7xl mx-auto"}`}>
        <div className={`${isFullscreen ? "h-full" : "flex gap-6 p-6"}`}>
          {/* Main Preview Area */}
          <div className={`${isFullscreen ? "h-full" : "flex-1"} bg-white`}>
            {!isFullscreen && (
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {design.name?.charAt(0)?.toUpperCase() || "D"}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900">
                      {design.name || "Untitled Design"}
                    </h2>
                    <p className="text-sm text-gray-500">{design.prompt}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <button
                    onClick={() => setIsFullscreen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Full Screen <Maximize2 size={16} />
                  </button>
                </div>
              </div>
            )}

            <div
              className={`${
                isFullscreen
                  ? "h-full"
                  : "border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
              }`}
            >
              <div
                className={`${
                  isFullscreen ? "h-full w-full" : "min-h-[600px] p-8"
                } flex items-center justify-center`}
                style={{
                  transform: isFullscreen
                    ? "none"
                    : `scale(${zoomLevel / 100})`,
                  transformOrigin: "center center",
                }}
              >
                <div
                  className={`${
                    isFullscreen ? "w-full h-full" : "max-w-4xl w-full"
                  } bg-white shadow-lg ${
                    isFullscreen ? "" : "rounded-lg overflow-hidden"
                  }`}
                >
                  <iframe
                    srcDoc={
                      design.html.startsWith("<!DOCTYPE") ||
                      /<\s*html[\s>]/i.test(design.html)
                        ? design.html
                        : `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    body { 
      margin: 0; 
      padding: 20px; 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
    }
    ${design.css || ""}
  </style>
</head>
<body>
${design.html}
</body>
</html>`
                    }
                    className="w-full h-full border-0"
                    style={{ minHeight: isFullscreen ? "100vh" : "600px" }}
                    title="Design Preview"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
