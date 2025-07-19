"use client";
import { Button } from "@/components/ui/button";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Particles } from "@/components/magicui/particles";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { MorphingText } from "@/components/magicui/morphing-text";
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
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Particles Background */}
      <Particles
        className="absolute inset-0 -z-10"
        quantity={150}
        ease={80}
        color={theme === "dark" ? "#ffffff" : "#000000"}
        size={0.4}
      />

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
        <Particles className="absolute inset-0" quantity={50} ease={80} color="#8B5CF6" size={0.4} />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Main Title */}
          <div className="space-y-8"> {/* changed from 12 to 8 */}
            <SparklesText
              className="text-7xl md:text-9xl font-bold"
              colors={{ first: "#3B82F6", second: "#8B5CF6" }}
            >
              altIA
            </SparklesText>
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
              className="text-3xl md:text-5xl font-bold text-primary"
            />
          </div>

          {/* Animated Sentence (More space above) */}
          <div className="pt-10 md:pt-14"> {/* added container with more top padding */}
            <TextAnimate
              animation="blurInUp"
              by="word"
              className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
            >
              The AI-powered productivity assistant that streamlines content creation, documentation, and communication workflows for modern enterprises
            </TextAnimate>
          </div>
          {/* CTA Buttons */}
          <div className="pt-16 md:pt-20">
            <div className="relative inline-block">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="text-lg px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl"
              >
                <RocketIcon className="mr-2 h-5 w-5" />
                Launch now
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Subtle Footer */}
          <div className="pt-16">
            <TextAnimate
              animation="fadeIn"
              delay={0.8}
              className="text-sm text-muted-foreground/60"
            >
              No installation required • Works in any modern browser • Your data stays private
            </TextAnimate>
          </div>
        </div>
      </section>
    </div>
  );
}