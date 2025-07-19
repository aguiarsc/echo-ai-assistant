"use client";
import { Button } from "@/components/ui/button";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Particles } from "@/components/magicui/particles";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { MorphingText } from "@/components/magicui/morphing-text";
import NeuroCanvas from "@/components/effects/NeuroCanvas";
import SparkleButton from "@/components/effects/SparkleButton";
import {
  RocketIcon,
  ArrowRightIcon
} from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGetStarted = () => {
    router.push("/");
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#151912' }}>
      {/* Neural Canvas Background */}
      <NeuroCanvas />
      
      {/* Particles Background */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={100}
        ease={80}
        color="#FFF6F7"
        size={0.3}
      />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Main Title */}
          <div className="space-y-8"> {/* changed from 12 to 8 */}
            <div className="text-7xl md:text-9xl font-bold">
              <span className="text-[#2E4BC6]">alt</span>
              <span className="text-[#FFF6F7]">IA</span>
            </div>
          </div>

          {/* Morphing Text Showcase */}
          <div className="py-12 md:py-16"> {/* changed from 20/24 to 12/16 */}
            <MorphingText
              texts={[
                "Context-Aware AI Assistant",
                "Intelligent File Management",
                "Smart Content Generation",
                "Advanced Chat Features",
                "Thinking Mode Transparency"
              ]}
              className="text-3xl md:text-5xl font-bold text-[#FFF6F7]"
            />
          </div>
          {/* CTA Buttons */}
          <div className="pt-36 md:pt-48">
            <div className="relative inline-block">
              <SparkleButton
                onClick={handleGetStarted}
                className="relative z-20 pointer-events-auto"
              >
                Launch now
              </SparkleButton>
            </div>
          </div>

          {/* Subtle Footer */}
          <div className="pt-16">
            <TextAnimate
              animation="fadeIn"
              delay={0.8}
              className="text-sm text-[#FFF6F7] opacity-60"
            >
              No installation required • Works in any modern browser • Your data stays private
            </TextAnimate>
          </div>
        </div>
      </section>
    </div>
  );
}