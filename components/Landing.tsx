import { Appbar } from "../components/Appbar";
import Hero from "./Hero";
import { PricingSection } from "./pricing-section";
import { UXPilotCredits } from "./UXPilotCredits";

export async function Landing() {
  return (
    <div className="flex flex-col ">
      <Appbar />
      <Hero />
    </div>
  );
}
