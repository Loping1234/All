import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  Brain,
  Layers,
  ScanFace,
  Timer,
  RotateCcw,
} from "lucide-react";

const STEPS = [
  { number: 1, label: "Upload your material", shortLabel: "Upload", icon: Upload },
  { number: 2, label: "AI generates practice", shortLabel: "Generate", icon: Brain },
  { number: 3, label: "Live focus monitoring", shortLabel: "Monitor", icon: ScanFace },
];

const AUTO_ADVANCE_MS = 5000;

export function ProductPreview() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setActiveStep((step) => (step + 1) % STEPS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [isPaused]);

  return (
    <div
      className="glass-panel-strong rounded-3xl p-6 md:p-8 border border-white/10 shadow-2xl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Step tabs */}
      <div className="flex items-center justify-center gap-2 md:gap-3 mb-8 flex-wrap">
        {STEPS.map((step, index) => (
          <button
            key={step.number}
            onClick={() => setActiveStep(index)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-300 ${
              activeStep === index
                ? "bg-gradient-to-r from-purple-600/40 to-blue-600/40 border-purple-400/40 text-white shadow-lg shadow-purple-500/20"
                : "glass-panel border-white/10 text-white/50 hover:text-white/80"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                activeStep === index
                  ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white"
                  : "bg-white/10 text-white/60"
              }`}
            >
              {step.number}
            </span>
            <span className="text-sm hidden sm:inline">{step.label}</span>
            <span className="text-sm sm:hidden">{step.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeStep === 0 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="max-w-xl mx-auto"
            >
              <div className="border-2 border-dashed border-purple-400/30 rounded-2xl p-10 text-center bg-white/[0.02] mb-4">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-white/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-purple-300" />
                </div>
                <p className="text-white/80 mb-1">Drop your PDF, slides, or notes here</p>
                <p className="text-sm text-white/40">LearnAI reads it and builds your study kit</p>
              </div>
              <div className="space-y-2">
                {["biology-chapter-4.pdf", "lecture-notes.docx"].map((file, index) => (
                  <motion.div
                    key={file}
                    className="glass-panel rounded-xl px-4 py-3 flex items-center gap-3"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.15 }}
                  >
                    <FileText className="w-4 h-4 text-blue-300 flex-shrink-0" />
                    <span className="text-sm text-white/70 flex-1 truncate text-left">{file}</span>
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Analyzed
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeStep === 1 && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto"
            >
              {/* Mock quiz card */}
              <div className="glass-panel rounded-2xl p-5 text-left">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white/60">Auto-generated quiz</span>
                </div>
                <p className="text-white/90 text-sm mb-3">
                  Which organelle is responsible for cellular respiration?
                </p>
                <div className="space-y-2">
                  {["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"].map((option, index) => (
                    <div
                      key={option}
                      className={`px-3 py-2 rounded-lg text-sm border ${
                        index === 1
                          ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                          : "bg-white/[0.03] border-white/10 text-white/60"
                      }`}
                    >
                      {option}
                      {index === 1 && <CheckCircle2 className="w-3.5 h-3.5 inline ml-2 -mt-0.5" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mock flashcards */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                    <Layers className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm text-white/60">Smart flashcards</span>
                </div>
                {[
                  { front: "What is ATP?", hint: "The cell's energy currency" },
                  { front: "Define osmosis", hint: "Water moving across a membrane" },
                ].map((card, index) => (
                  <motion.div
                    key={card.front}
                    className="glass-panel rounded-2xl p-5 flex-1 flex flex-col justify-between text-left"
                    initial={{ opacity: 0, rotateY: -12 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ delay: 0.25 + index * 0.15 }}
                  >
                    <p className="text-white/90">{card.front}</p>
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs text-white/40">{card.hint}</p>
                      <span className="flex items-center gap-1 text-xs text-purple-300">
                        <RotateCcw className="w-3 h-3" />
                        flip
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeStep === 2 && (
            <motion.div
              key="monitor"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
              className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto items-center"
            >
              {/* Mock webcam frame */}
              <div className="relative rounded-2xl bg-black/40 border border-white/10 aspect-video flex items-center justify-center overflow-hidden">
                <motion.div
                  className="absolute inset-0 border-2 border-emerald-400/60 rounded-2xl pointer-events-none"
                  animate={{ opacity: [0.4, 0.9, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                />
                <ScanFace className="w-16 h-16 text-white/25" />
                <span className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Focused
                </span>
                <span className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 border border-white/10 text-white/70 text-xs">
                  <Timer className="w-3 h-3" />
                  24:31
                </span>
              </div>

              {/* Focus metrics */}
              <div className="text-left space-y-5">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-white/60">Focus score</span>
                    <span className="text-emerald-400">92%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                      initial={{ width: 0 }}
                      animate={{ width: "92%" }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Distractions", value: "2" },
                    { label: "Drowsy alerts", value: "0" },
                    { label: "Current streak", value: "18 min" },
                    { label: "Yawns", value: "1" },
                  ].map((metric) => (
                    <div key={metric.label} className="glass-panel rounded-xl p-3">
                      <p className="text-lg text-white">{metric.value}</p>
                      <p className="text-xs text-white/50">{metric.label}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-white/50">
                  Your webcam watches your attention in real time — drowsiness and distraction
                  trigger gentle nudges before they cost you the session.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress indicator */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {STEPS.map((step, index) => (
          <button
            key={step.number}
            onClick={() => setActiveStep(index)}
            aria-label={`Go to step ${step.number}`}
            className={`h-1 rounded-full transition-all duration-300 ${
              activeStep === index ? "w-8 bg-purple-500/70" : "w-2 bg-white/25 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
