import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Hero } from "@/sections/Hero";
import { Surprise } from "@/sections/Surprise";
import { FollowMoney } from "@/sections/FollowMoney";
import { DoesItWork } from "@/sections/DoesItWork";
import { SeeTheAds } from "@/sections/SeeTheAds";
import { PriceOfAttention } from "@/sections/PriceOfAttention";
import { Targeting } from "@/sections/Targeting";
import { Rhythm } from "@/sections/Rhythm";
import { NordicGap } from "@/sections/NordicGap";
import { GlobalLens } from "@/sections/GlobalLens";
import { Findings } from "@/sections/Findings";

export function App() {
  return (
    <div className="min-h-screen">
      <Nav />
      <Hero />
      <main className="mx-auto max-w-[1280px] px-6">
        <Surprise />
        <hr className="border-gray-200" />
        <NordicGap />
        <hr className="border-gray-200" />
        <GlobalLens />
        <hr className="border-gray-200" />
        <FollowMoney />
        <hr className="border-gray-200" />
        <SeeTheAds />
        <hr className="border-gray-200" />
        <PriceOfAttention />
        <hr className="border-gray-200" />
        <Targeting />
        <hr className="border-gray-200" />
        <Rhythm />
        <hr className="border-gray-200" />
        <DoesItWork />
        <hr className="border-gray-200" />
        <Findings />
      </main>
      <Footer />
    </div>
  );
}
