"use client";

import React, { useState } from "react";
import { Sparkles, Play, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface MockupImage {
  src: string;
  alt: string;
  title: string;
  description: string;
  style: React.CSSProperties;
}

const mockupImages: MockupImage[] = [
  {
    src: "/assets/mock-up-5.png",
    alt: "Analytics Preview",
    title: "Real-time Analytics",
    description: "Live data processing insights",
    style: {
      top: "12%",
      right: "2%",
      width: "250px",
      zIndex: 8,
      position: "absolute",
    },
  },
  {
    src: "/assets/mock-up-2.png",
    alt: "ML Pipeline Builder",
    title: "ML Pipeline Builder",
    description: "Drag-and-drop machine learning workflows",
    style: {
      bottom: "1%",
      right: "30%",
      width: "400px",
      zIndex: 0,
      position: "absolute",
    },
  },
  {
    src: "/assets/mock-up-4.png",
    alt: "Data Visualization",
    title: "Smart Visualizations",
    description: "Interactive charts and graphs",
    style: {
      bottom: "43%",
      left: "2%",
      width: "300px",
      zIndex: 9,
      position: "absolute",
    },
  },
  {
    src: "/assets/mock-up-6.png",
    alt: "API Integration",
    title: "API Connections",
    description: "Seamless data source integration",
    style: {
      bottom: "2%",
      left: "2%",
      width: "500px",
      zIndex: 11,
      position: "absolute",
    },
  },
  {
    src: "/assets/mock-up-3.png",
    alt: "Export Dashboard",
    title: "Export & Deploy",
    description: "Multiple export formats and deployment options",
    style: {
      bottom: "2%",
      right: "2%",
      width: "340px",
      zIndex: 10,
      position: "absolute",
    },
  },
  {
    src: "/assets/mock-up-1.png",
    alt: "Mobile Preview",
    title: "Mobile Optimized",
    description: "Responsive design for all devices",
    style: {
      top: "12%",
      left: "24.5%",
      width: "380px",
      zIndex: 7,
      position: "absolute",
    },
  },
];

const Home: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 3000);
  };

  return (
    <div
      className="relative min-h-[120vh] overflow-hidden"
      style={{
        background: `linear-gradient(135deg,rgb(6, 0, 117) 10%, #0000d9 35%,rgb(0, 213, 255) 90%)`,
        maxWidth: "1440px",
        margin: "0 auto",
        marginBottom: "60px",
      }}
    >
      <motion.h1
        className="text-5xl font-extrabold text-white text-center pt-6"
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        AI Data Preprocessing Hub
      </motion.h1>

      <div className="ml-[53%] mt-[3%]">
        <div className="max-w-[360px] bg-gradient-to-br from-white to-slate-100 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] transform hover:scale-[1.02] transition duration-300 border border-gray-300">
          <div className="p-6 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-indigo-600 text-xl">📊</span>
              <h2 className="text-xl font-bold text-black">Data Preprocessing Made Simple</h2>
            </div>

            <div className="flex items-start text-gray-700 text-sm">
              <span className="text-green-500 mr-2 mt-1">✅</span>
              <span className="font-bold">
                Automate repetitive tasks with a no-code solution designed to be intuitive and efficient.
              </span>
            </div>

            <div className="flex items-start text-gray-700 text-sm">
              <span className="text-green-500 mr-2 mt-1">✅</span>
              <span className="font-bold">Empower non-technical users to transform raw data into structured insights.</span>
            </div>

            <button className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition duration-200">
              🚀 Get Started
            </button>
          </div>
        </div>
      </div>

      {mockupImages.map((m, i) => (
        <motion.div
          key={i}
          className="rounded-2xl overflow-hidden cursor-pointer"
          style={m.style}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 + i * 0.1, type: "spring", stiffness: 60 }}
          whileHover={{
            scale: 1.05,
            boxShadow: "0 0 40px rgba(0, 212, 255, 0.5)",
          }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        >
          <img
            src={m.src}
            alt={m.alt}
            className="w-full h-auto rounded-2xl shadow-lg shadow-blue-500/40"
            loading="lazy"
            width={Math.round(parseFloat(String(m.style.width).replace("px", "")) || 300)}
            height={200}
          />
          {hovered === i && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 rounded-2xl">
              <h3 className="text-lg font-bold mb-2 text-center">{m.title}</h3>
              <p className="text-sm text-center opacity-90">{m.description}</p>
              <button className="mt-3 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-full text-sm font-medium flex items-center gap-2">
                <Play className="w-4 h-4" /> Preview
              </button>
            </div>
          )}
        </motion.div>
      ))}

      <div className="absolute inset-0 flex items-center justify-center z-20">
        <motion.button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="relative inline-flex items-center gap-3 px-10 py-4 text-2xl font-bold text-white rounded-full shadow-[0_8px_30px_rgba(0,0,0,0.3)] active:scale-95 transition duration-300 ease-in-out border-4 border-[#aff]"
          style={{ overflow: "hidden", perspective: "1000px" }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          whileHover={{ scale: 1.05, rotateX: -2 }}
        >
          <div
            className="absolute inset-0 rounded-full border border-white pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(20, 7, 255, 0.2) 0%, rgba(0,0,217,0.8) 35%, rgba(0,212,255,0.8) 100%)",
              boxShadow: "0 0 25px rgba(0,212,255,0.5)",
            }}
          />
          <div className="relative flex items-center gap-3 z-10">
            <Sparkles className={`w-8 h-8 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "Start Processing"}
            {!isGenerating && <ArrowRight className="w-6 h-6 transition-transform duration-200 group-hover:translate-x-1" />}
          </div>
        </motion.button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </div>
  );
};

export default Home;