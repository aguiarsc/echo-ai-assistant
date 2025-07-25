"use client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TextAnimate } from "@/components/magicui/text-animate";
import { Particles } from "@/components/magicui/particles";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { MorphingText } from "@/components/magicui/morphing-text";
import NeuroCanvas from "@/components/effects/NeuroCanvas";
import SparkleButton from "@/components/effects/SparkleButton";
import {
  RocketIcon,
  ArrowRightIcon,
  ChatBubbleIcon,
  FileTextIcon,
  CalendarIcon,
  GearIcon,
  MagicWandIcon,
  LightningBoltIcon,
  EyeOpenIcon,
  DownloadIcon,
  MagnifyingGlassIcon
} from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";

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

  const features = [
    {
      title: "AI-Powered Chat",
      description: "Advanced conversational AI with thinking mode transparency and context awareness",
      icon: <ChatBubbleIcon className="h-6 w-6" />,
      image: "/images/thinking.png",
      highlights: ["Gemini 2.5 Flash", "Thinking Mode", "Streaming Responses"]
    },
    {
      title: "Intelligent File Management",
      description: "Create, edit, and manage files with AI assistance and real-time diff viewing",
      icon: <FileTextIcon className="h-6 w-6" />,
      image: "/images/ai-file-creation-edition.png",
      highlights: ["AI File Creation", "Live Editing", "Diff Viewer"]
    },
    {
      title: "Smart Calendar Integration",
      description: "Natural language event creation and intelligent calendar management",
      icon: <CalendarIcon className="h-6 w-6" />,
      image: "/images/ai-calendar-creation.png",
      highlights: ["Natural Language", "Event Extraction", "Smart Scheduling"]
    },
    {
      title: "Advanced Tools & Search",
      description: "Professional tools dropdown with web search and enhanced capabilities",
      icon: <MagnifyingGlassIcon className="h-6 w-6" />,
      image: "/images/google-search.png",
      highlights: ["Web Search", "Tools Dropdown", "Enhanced Features"]
    },
    {
      title: "Customization & Themes",
      description: "Personalize your experience with themes, personas, and generation parameters",
      icon: <GearIcon className="h-6 w-6" />,
      image: "/images/themes.png",
      highlights: ["Dark/Light Themes", "Custom Personas", "Parameter Control"]
    },
    {
      title: "Export & Sharing",
      description: "Export conversations, files, and data with multiple format options",
      icon: <DownloadIcon className="h-6 w-6" />,
      image: "/images/export.png",
      highlights: ["Multiple Formats", "Easy Sharing", "Data Export"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Neural Canvas Background */}
      <div className="fixed inset-0 opacity-30">
        <NeuroCanvas />
      </div>
      
      {/* Particles Background */}
      <Particles
        className="fixed inset-0 -z-10"
        quantity={50}
        ease={80}
        color="#64748b"
        size={0.4}
      />

      {/* Navigation */}
      <nav className="relative z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl font-bold">
              <span className="text-blue-500">alt</span>
              <span className="text-white">IA</span>
            </div>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              Business Assistant
            </Badge>
          </div>
          <Button 
            onClick={handleGetStarted}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Get Started
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="space-y-8">
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5">
              <LightningBoltIcon className="mr-2 h-3 w-3" />
              Powered by Google Gemini AI
            </Badge>
            
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                <span className="text-white">The Future of</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Business Intelligence
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Experience the next generation of AI-powered business assistance with advanced file management, 
                intelligent calendar integration, and context-aware conversations.
              </p>
            </div>

            <div className="pt-8">
              <SparkleButton
                onClick={handleGetStarted}
                className="relative z-20 pointer-events-auto text-lg px-8 py-4"
              >
                <RocketIcon className="mr-2 h-5 w-5" />
                Launch altIA Now
              </SparkleButton>
            </div>

            <div className="pt-8">
              <TextAnimate
                animation="fadeIn"
                delay={0.8}
                className="text-sm text-slate-400"
              >
                No installation required • Works in any modern browser • Your data stays private
              </TextAnimate>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Powerful Features for
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Modern Business</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Discover the comprehensive suite of AI-powered tools designed to enhance your productivity and streamline your workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm hover:bg-slate-800/70 transition-all duration-300 group">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  </div>
                  
                  <div className="mb-4 rounded-lg overflow-hidden border border-slate-700/50">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={400}
                      height={250}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <p className="text-slate-300 mb-4 leading-relaxed">{feature.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {feature.highlights.map((highlight, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-slate-700/50 text-slate-300 border-slate-600/50">
                        {highlight}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features Showcase */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Diff Viewer Feature */}
            <div className="space-y-6">
              <Badge variant="outline" className="border-green-500/30 text-green-400 bg-green-500/5">
                <EyeOpenIcon className="mr-2 h-3 w-3" />
                Advanced Editing
              </Badge>
              <h3 className="text-3xl md:text-4xl font-bold text-white">
                Real-time Diff Viewing
              </h3>
              <p className="text-lg text-slate-300 leading-relaxed">
                See exactly what changes the AI makes to your files with our advanced diff viewer. 
                Track modifications, review edits, and maintain complete control over your content.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                  Live Updates
                </Badge>
                <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                  Change Tracking
                </Badge>
                <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                  Version Control
                </Badge>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-700/50">
              <Image
                src="/images/diff-editions.png"
                alt="Diff Viewer"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mt-20">
            <div className="order-2 lg:order-1 rounded-xl overflow-hidden border border-slate-700/50">
              <Image
                src="/images/customization-parameters.png"
                alt="Customization Parameters"
                width={600}
                height={400}
                className="w-full h-auto"
              />
            </div>
            <div className="order-1 lg:order-2 space-y-6">
              <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/5">
                <MagicWandIcon className="mr-2 h-3 w-3" />
                Customization
              </Badge>
              <h3 className="text-3xl md:text-4xl font-bold text-white">
                Fine-tune AI Behavior
              </h3>
              <p className="text-lg text-slate-300 leading-relaxed">
                Customize generation parameters, create personas, and adjust AI behavior to match your specific needs. 
                Control temperature, token limits, and response styles for optimal results.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                  Custom Personas
                </Badge>
                <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                  Parameter Control
                </Badge>
                <Badge variant="secondary" className="bg-slate-700/50 text-slate-300">
                  Response Tuning
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Workflow?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join the future of business intelligence with altIA. Experience the power of AI-driven productivity today.
            </p>
            <SparkleButton
              onClick={handleGetStarted}
              className="relative z-20 pointer-events-auto text-lg px-8 py-4"
            >
              <RocketIcon className="mr-2 h-5 w-5" />
              Get Started Now
            </SparkleButton>
            <div className="mt-6">
              <TextAnimate
                animation="fadeIn"
                delay={0.5}
                className="text-sm text-slate-400"
              >
                Free to use • No credit card required • Start in seconds
              </TextAnimate>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="text-2xl font-bold">
              <span className="text-blue-500">alt</span>
              <span className="text-white">IA</span>
            </div>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
              Business Assistant
            </Badge>
          </div>
          <p className="text-slate-400">
            Built with Next.js 15, React 19, TypeScript, and powered by Google Gemini AI
          </p>
        </div>
      </footer>
    </div>
  );
}