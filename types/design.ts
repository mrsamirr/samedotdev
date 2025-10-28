export interface GenerationRequest {
  context: string
  useCase: "wireframes" | "hifi"
  screenType: "desktop" | "mobile" | "tablet"
  deepDesign: boolean
  autoflow: boolean
}
export interface GeneratedDesign {
  id: string
  html: string
  css: string
  elements: unknown[]
  timestamp: number
  prompt: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  useCase: "wireframes" | "hifi"
  screenType: "desktop" | "mobile" | "tablet"
  deepDesign: boolean
  autoflow: boolean
}

export type DbDesign = {
  id: string
  html: string
  css: string
  elements: unknown[]
  prompt: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  useCase: "wireframes" | "hifi"
  screenType: "desktop" | "mobile" | "tablet"
  deepDesign: boolean
  autoflow: boolean
  createdAt: string | Date
}

export type DbGroup = { id: string; name: string }

