"use client";

import { motion } from "framer-motion";
import {
  RefreshCw,
  Cpu,
  Shield,
  Database,
  BarChart,
  ArrowRight,
  Zap,
  Lock,
} from "lucide-react";
import SectionI from "./Section-I.tsx";

const featuresData = [
  {
    icon: <RefreshCw className="w-8 h-8" />,
    title: "Real-Time Processing",
    description:
      "Process and transform data streams in real-time with sub-millisecond latency and enterprise-grade reliability.",
    highlight: "Enterprise Ready",
    stats: "99.9% Uptime",
  },
  {
    icon: <Cpu className="w-8 h-8" />,
    title: "AI-Powered Automation",
    description:
      "Intelligent preprocessing with machine learning algorithms that adapt and optimize based on your data patterns.",
    highlight: "Smart Technology",
    stats: "10x Faster",
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: "Enterprise Security",
    description:
      "Bank-grade encryption, SOC 2 compliance, and zero-trust architecture to protect your most sensitive data.",
    highlight: "SOC 2 Certified",
    stats: "Zero Breaches",
  },
  {
    icon: <Database className="w-8 h-8" />,
    title: "Infinite Scale",
    description:
      "Handle petabytes of data with our distributed cloud infrastructure that scales automatically with demand.",
    highlight: "Auto-Scaling",
    stats: "Petabyte Ready",
  },
  // Removed Advanced Analytics (Live Monitoring)
  {
    icon: <Zap className="w-8 h-8" />,
    title: "Lightning Fast",
    description:
      "Optimized performance with edge computing and intelligent caching for instant data transformation.",
    highlight: "Edge Computing",
    stats: "<100ms Response",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as any },
  },
};

export default function Features() {
  return (
    <section className="relative min-h-screen font-inter bg-black text-white isolate overflow-hidden">
      {/* Background orbs / grid (tiny CSS handles complex gradients & masks) */}
      <div className="features-bg pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto px-6 md:px-10 lg:px-16 py-12 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as any }}
          className="text-center mb-14"
        >
          <h2 className="font-extrabold tracking-tight leading-tight text-[clamp(2.5rem,6vw,4.5rem)]">
            Built for the{" "}
            <span className="bg-clip-text gradient-primary text-green-600">
              Modern Enterprise
            </span>
          </h2>

          <p className="text-gray-300 max-w-3xl mx-auto mt-4 text-[clamp(1rem,2.2vw,1.125rem)]">
            Transform your data infrastructure with enterprise-grade tools
            designed for scale, security, and performance. Join industry leaders
            who trust our platform.
          </p>

          <div className="flex items-center justify-center gap-8 mt-8 flex-wrap">
            <div className="text-center">
              <div className="text-[clamp(1.875rem,4vw,2.5rem)] font-extrabold gradient-primary bg-clip-text">
                10M+
              </div>
              <div className="text-xs uppercase tracking-wide text-gray-400 mt-1">
                Records Processed
              </div>
            </div>

            <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

            <div className="text-center">
              <div className="text-[clamp(1.875rem,4vw,2.5rem)] font-extrabold gradient-primary bg-clip-text">
                99.9%
              </div>
              <div className="text-xs uppercase tracking-wide text-gray-400 mt-1">
                Uptime SLA
              </div>
            </div>

            <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

            <div className="text-center">
              <div className="text-[clamp(1.875rem,4vw,2.5rem)] font-extrabold gradient-primary bg-clip-text">
                150+
              </div>
              <div className="text-xs uppercase tracking-wide text-gray-400 mt-1">
                Integrations
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature cards grid */}
        <section className="mb-20">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          >
            {featuresData.map((feature, idx) => (
              <motion.article
                key={idx}
                variants={cardVariants}
                whileHover={{
                  y: -8,
                  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as any },
                }}
                className="relative rounded-2xl border border-white/30 bg-black p-6 backdrop-blur-md overflow-hidden flex flex-col shadow-[0_0_20px_rgba(0,212,255,0.30)] hover:shadow-[0_0_40px_rgba(0,212,255,0.5)] transition-shadow duration-300"
              >
                {/* Card header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="relative flex items-center justify-center w-16 h-16 rounded-xl border-2 border-white/12">
                    <div className="relative z-10 text-white">
                      {feature.icon}
                    </div>
                  </div>

                  <div className="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide text-white/90 bg-green-900 border border-white/10">
                    {feature.highlight}
                  </div>
                </div>

                {/* Content */}
                <div className="mb-6 flex-1">
                  <h3 className="text-lg font-bold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed mb-4">
                    {feature.description}
                  </p>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/6">
                    <Lock className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-semibold">
                      {feature.stats}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-auto">
                  <button
                    className="inline-flex items-center gap-3 text-sm font-semibold text-white hover:text-indigo-200 transition-all"
                    aria-label={`Learn more about ${feature.title}`}
                  >
                    <span>Learn More</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Glow overlay */}
                <div className="feature-card-glow pointer-events-none absolute inset-0 -z-10" />
              </motion.article>
            ))}
          </motion.div>
        </section>

        {/* Extra section component */}
        <div className="mt-6">
          <SectionI />
        </div>
      </div>
    </section>
  );
}
