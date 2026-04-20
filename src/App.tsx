/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Component, type ErrorInfo, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Target, 
  Zap, 
  Brain, 
  ChevronRight, 
  CheckCircle2, 
  Trophy, 
  Flame, 
  Users, 
  ArrowRight,
  Sparkles,
  BarChart3,
  Clock,
  MessageSquare,
  RefreshCw,
  Biohazard as Virus,
  LogOut,
  AlertTriangle,
  ExternalLink,
  Youtube
} from 'lucide-react';
import { generateLearningPath, adaptContent, generateSchedule, generateStudyNotes, type LearningProfile, type LearningPath, type LearningStep, type DailySchedule, type StudyNotes } from './services/gemini';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';
import confetti from 'canvas-confetti';
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  handleFirestoreError, 
  OperationType,
  type User
} from './firebase';

// --- Types ---
type AppState = 'landing' | 'onboarding' | 'dashboard' | 'learning' | 'completed';

interface CompletedPathway {
  id: string;
  name: string;
  date: string;
  year: string;
  topics: string[];
}

interface UserStats {
  xp: number;
  rank: number;
  streak: number;
  completedSteps: string[];
  mutations: string[];
  dailyQuests: { label: string; xp: number; done: boolean }[];
  completedPathways?: CompletedPathway[];
  schedule?: DailySchedule;
}

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred.";
      try {
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error) errorMessage = parsed.error;
      } catch (e) {
        errorMessage = this.state.error?.message || errorMessage;
      }

      return (
        <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center p-8 text-center">
          <div className="p-8 bg-white border-8 border-black shadow-[24px_24px_0px_0px_rgba(239,68,68,1)] max-w-2xl">
            <AlertTriangle size={80} className="text-red-500 mx-auto mb-6" />
            <h1 className="text-5xl font-black uppercase italic mb-4">Neural Breach Detected</h1>
            <p className="text-xl font-bold mb-8 opacity-60">{errorMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-12 py-5 bg-black text-white font-black uppercase italic hover:bg-orange-500 transition-all"
            >
              Re-Initialize System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Components ---

const Landing = ({ onStart, isLoggedIn }: { onStart: () => void, isLoggedIn: boolean }) => (
  <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 overflow-hidden relative">
    {/* Floating Particles */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-orange-500/20"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            scale: Math.random() * 2 + 0.5,
            rotate: Math.random() * 360
          }}
          animate={{ 
            y: [null, "-20px", "20px", "0px"],
            rotate: [null, 10, -10, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{ 
            duration: 5 + Math.random() * 5, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <Virus size={40 + Math.random() * 80} />
        </motion.div>
      ))}
    </div>

    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative z-10 text-center max-w-4xl"
    >
      <div className="flex justify-center mb-12">
        <motion.div 
          animate={{ rotate: [12, -12, 12], scale: [1, 1.1, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="p-6 bg-orange-500 rounded-[2rem] shadow-[0_0_50px_rgba(249,115,22,0.4)]"
        >
          <Virus size={80} className="text-black" />
        </motion.div>
      </div>
      
      <h1 className="text-[10vw] md:text-[14rem] font-black tracking-tighter leading-[0.8] uppercase mb-6 select-none">
        <span className="block">Plauge</span>
      </h1>
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-16">
        <p className="text-xl md:text-3xl font-mono text-orange-500 uppercase tracking-[0.4em] font-bold">
          Knowledge that spreads.
        </p>
        <div className="h-px w-12 bg-white/20 hidden md:block" />
        <p className="text-white/40 font-mono text-sm uppercase tracking-widest">
          AI-Driven Neural Infection
        </p>
      </div>

      <motion.button 
        onClick={onStart}
        whileHover={{ scale: 1.05, backgroundColor: "#FF6321" }}
        whileTap={{ scale: 0.95 }}
        className="group relative px-16 py-8 bg-white text-black font-black text-2xl uppercase tracking-[0.2em] italic shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all duration-300"
      >
        {isLoggedIn ? "Infect your mind" : "Login to Infect"}
        <ArrowRight className="inline-block ml-4 group-hover:translate-x-3 transition-transform" size={32} />
      </motion.button>
    </motion.div>

    {/* Atmospheric Glows */}
    <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-orange-600 rounded-full blur-[180px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[180px]" />
    </div>

    <div className="absolute bottom-8 left-8 flex items-center gap-4 opacity-30 font-mono text-[10px] uppercase tracking-widest">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span>System Online</span>
      </div>
      <span>v2.4.0-STABLE</span>
    </div>
  </div>
);

const Onboarding = ({ onComplete }: { onComplete: (profile: LearningProfile) => void }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<LearningProfile>({
    name: '',
    learningStyle: 'visual',
    goals: '',
    level: 'beginner',
    subject: ''
  });

  const steps = [
    {
      title: "Identify Subject",
      field: "name",
      placeholder: "Enter your name...",
      type: "text",
      label: "Subject Name"
    },
    {
      title: "Target Domain",
      field: "subject",
      placeholder: "e.g., Quantum Physics, Python, History...",
      type: "text",
      label: "Knowledge Domain"
    },
    {
      title: "Neural Preference",
      field: "learningStyle",
      options: [
        { id: 'visual', label: 'Visual', desc: 'Neural mapping via imagery & spatial data', icon: <Sparkles /> },
        { id: 'auditory', label: 'Auditory', desc: 'Frequency-based learning & sonic patterns', icon: <MessageSquare /> },
        { id: 'reading', label: 'Reading', desc: 'Symbolic decoding & textual synthesis', icon: <BookOpen /> },
        { id: 'kinesthetic', label: 'Kinesthetic', desc: 'Tactile execution & physical feedback', icon: <Zap /> },
      ]
    },
    {
      title: "Infection Level",
      field: "level",
      options: [
        { id: 'beginner', label: 'Dormant', desc: 'Initial exposure, no prior data' },
        { id: 'intermediate', label: 'Active', desc: 'Significant neural integration' },
        { id: 'advanced', label: 'Critical', desc: 'High-level mastery & synthesis' },
      ]
    },
    {
      title: "Final Objective",
      field: "goals",
      placeholder: "What is the ultimate outcome of this infection?",
      type: "textarea",
      label: "Strategic Goal"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(profile);
    }
  };

  const current = steps[step];

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#0A0A0A] p-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Scan Line Effect */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="scan-line" />
      </div>

      <div className="w-full max-w-3xl relative z-10">
        <div className="mb-16 flex justify-between items-end">
          <div className="font-mono text-[10px] uppercase font-black tracking-[0.2em] bg-black text-white px-2 py-1">
            Diagnostic Phase 0{step + 1}
          </div>
          <div className="flex-1 mx-8 h-1 bg-black/5 relative overflow-hidden">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-orange-500" 
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
              transition={{ type: "spring", stiffness: 50 }}
            />
          </div>
          <div className="font-mono text-[10px] uppercase font-black opacity-30">
            {Math.round(((step + 1) / steps.length) * 100)}%
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-12"
          >
            <div className="space-y-2">
              <span className="font-mono text-xs uppercase text-orange-500 font-bold tracking-widest">
                {current.label || "System Query"}
              </span>
              <h2 className="text-7xl md:text-8xl font-black tracking-tighter uppercase italic leading-[0.85] text-black">
                {current.title}
              </h2>
            </div>

            {current.type === 'text' && (
              <div className="relative">
                <input 
                  type="text"
                  value={(profile as any)[current.field]}
                  onChange={(e) => setProfile({ ...profile, [current.field]: e.target.value })}
                  placeholder={current.placeholder}
                  className="w-full bg-transparent border-b-8 border-black p-6 text-4xl md:text-6xl font-black uppercase italic focus:outline-none focus:border-orange-500 transition-colors placeholder:opacity-10"
                  autoFocus
                />
                <div className="absolute bottom-0 left-0 w-full h-2 bg-orange-500/20 -z-10" />
              </div>
            )}

            {current.type === 'textarea' && (
              <div className="relative">
                <textarea 
                  value={(profile as any)[current.field]}
                  onChange={(e) => setProfile({ ...profile, [current.field]: e.target.value })}
                  placeholder={current.placeholder}
                  className="w-full bg-white border-4 border-black p-8 text-2xl font-bold focus:outline-none focus:border-orange-500 transition-colors h-64 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
                  autoFocus
                />
              </div>
            )}

            {current.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {current.options.map((opt) => (
                  <motion.button
                    key={opt.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setProfile({ ...profile, [current.field]: opt.id });
                      setTimeout(handleNext, 400);
                    }}
                    className={cn(
                      "p-8 border-4 border-black text-left transition-all relative group overflow-hidden",
                      (profile as any)[current.field] === opt.id 
                        ? "bg-black text-white shadow-none translate-x-1 translate-y-1" 
                        : "bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-3xl font-black uppercase italic leading-none">{opt.label}</span>
                      <div className={cn(
                        "transition-transform group-hover:rotate-12",
                        (profile as any)[current.field] === opt.id ? "text-orange-500" : "text-black/20"
                      )}>
                        {(opt as any).icon || <ChevronRight />}
                      </div>
                    </div>
                    <p className="text-sm font-bold opacity-60 leading-tight">{opt.desc}</p>
                    
                    {/* Active Indicator */}
                    {(profile as any)[current.field] === opt.id && (
                      <motion.div 
                        layoutId="active-opt"
                        className="absolute top-0 right-0 w-12 h-12 bg-orange-500 flex items-center justify-center"
                      >
                        <CheckCircle2 size={24} className="text-black" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            )}

            {current.type && (
              <div className="flex justify-end">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNext}
                  disabled={!(profile as any)[current.field]}
                  className="px-16 py-6 bg-black text-white font-black uppercase italic text-xl tracking-widest hover:bg-orange-500 transition-colors disabled:opacity-20 shadow-[8px_8px_0px_0px_rgba(249,115,22,1)]"
                >
                  Confirm Data
                </motion.button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

const Dashboard = ({ 
  profile, 
  path, 
  stats,
  onStartLearning,
  onNewInfection,
  onGenerateSchedule,
  onViewArchived,
  onLogout
}: { 
  profile: LearningProfile, 
  path: LearningPath | null, 
  stats: UserStats,
  onStartLearning: () => void,
  onNewInfection: () => void,
  onGenerateSchedule: () => void,
  onViewArchived: (pathway: CompletedPathway) => void,
  onLogout: () => void
}) => {
  const integrationProgress = path ? Math.round((stats.completedSteps.length / path.steps.length) * 100) : 0;
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#0A0A0A] selection:bg-orange-500 selection:text-white pb-24">
      {/* Header */}
      <header className="border-b-4 border-black p-6 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="p-2 bg-orange-500 border-2 border-black"
          >
            <Virus size={24} className="text-black" />
          </motion.div>
          <span className="text-3xl font-black uppercase tracking-tighter italic leading-none">Plauge</span>
        </div>
        
        <div className="hidden md:flex items-center gap-12 font-mono text-[10px] uppercase font-black tracking-widest">
          <div className="flex flex-col items-end">
            <span className="opacity-30">Neural Sync</span>
            <span className="text-orange-500">Active</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="opacity-30">Infection Rate</span>
            <span>0.85/hr</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onNewInfection}
            className="hidden md:flex items-center gap-3 px-6 py-3 bg-black text-white border-2 border-black font-black uppercase italic text-xs hover:bg-orange-500 hover:text-black transition-all"
          >
            <Sparkles size={16} /> New Infection
          </button>
          <div className="flex items-center gap-4 px-4 py-2 bg-black text-white border-2 border-black">
            <Flame size={18} className="text-orange-500" />
            <span className="font-black italic">{stats.streak} DAYS</span>
          </div>
          <button 
            onClick={onLogout}
            className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
          <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center text-2xl font-black italic hover:bg-orange-500 transition-colors cursor-pointer">
            {profile.name[0]}
          </div>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile & Stats (4 cols) */}
        <div className="lg:col-span-4 space-y-8">
          <section className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 -rotate-12 translate-x-8 -translate-y-8 group-hover:bg-orange-500/10 transition-colors" />
            
            <div className="flex items-center gap-6 mb-8 relative">
              <div className="w-24 h-24 bg-orange-500 border-4 border-black flex items-center justify-center text-6xl font-black italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {profile.name[0]}
              </div>
              <div>
                <h2 className="text-4xl font-black uppercase italic leading-none mb-2">{profile.name}</h2>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase tracking-widest">{profile.level}</span>
                  <span className="text-xs font-bold opacity-40 italic">
                    {path ? `Infecting ${profile.subject}` : "Neural State: Dormant"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="opacity-40">Neural Integration</span>
                  <span className="text-orange-500">{integrationProgress}%</span>
                </div>
                <div className="h-6 border-4 border-black p-1 bg-white">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${integrationProgress}%` }}
                    className="h-full bg-orange-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-black text-white border-2 border-black">
                  <div className="text-[10px] uppercase opacity-40 mb-1">Total XP</div>
                  <div className="text-2xl font-black italic">{stats.xp.toLocaleString()}</div>
                </div>
                <div className="p-4 bg-white border-2 border-black">
                  <div className="text-[10px] uppercase opacity-40 mb-1">Rank</div>
                  <div className="text-2xl font-black italic">#{stats.rank}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-black text-white p-8 shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase italic text-orange-500">Daily Mutations</h3>
              <Zap size={20} className="text-orange-500 animate-pulse" />
            </div>
            <div className="space-y-6">
              {stats.dailyQuests.map((q, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-6 h-6 border-2 flex items-center justify-center transition-colors",
                      q.done ? "bg-orange-500 border-orange-500" : "border-white/20 group-hover:border-orange-500"
                    )}>
                      {q.done && <CheckCircle2 size={14} className="text-black" />}
                    </div>
                    <span className={cn("text-lg font-black uppercase italic transition-all", q.done ? "line-through opacity-30" : "group-hover:text-orange-500")}>
                      {q.label}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-orange-500 font-bold">+{q.xp}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Neural Scheduler */}
          <section className="bg-white border-4 border-black p-8 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase italic">Neural Scheduler</h3>
              <Clock size={20} className="text-orange-500" />
            </div>
            
            {stats.schedule ? (
              <div className="space-y-4">
                <p className="text-xs font-bold opacity-40 uppercase tracking-widest mb-4">Optimized for {stats.schedule.day}</p>
                <div className="space-y-3">
                  {stats.schedule.items.map((item, i) => (
                    <div key={i} className="flex gap-4 items-start border-l-2 border-black pl-4 py-1">
                      <span className="font-mono text-[10px] font-black w-16">{item.time}</span>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase italic leading-tight">{item.activity}</p>
                        <span className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5",
                          item.type === 'learning' ? "bg-orange-500 text-black" : 
                          item.type === 'focus' ? "bg-black text-white" : "bg-gray-200 text-gray-600"
                        )}>
                          {item.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={async () => {
                    setIsGeneratingSchedule(true);
                    await onGenerateSchedule();
                    setIsGeneratingSchedule(false);
                  }}
                  disabled={isGeneratingSchedule}
                  className="w-full mt-6 py-3 border-2 border-black font-black uppercase italic text-xs hover:bg-black hover:text-white transition-all disabled:opacity-20"
                >
                  {isGeneratingSchedule ? 'Optimizing...' : 'Re-Optimize Day'}
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm font-bold opacity-40 mb-6 leading-tight italic">No optimized schedule detected. Let the AI agent structure your day for maximum neural integration.</p>
                <button 
                  onClick={async () => {
                    setIsGeneratingSchedule(true);
                    await onGenerateSchedule();
                    setIsGeneratingSchedule(false);
                  }}
                  disabled={isGeneratingSchedule}
                  className="w-full py-4 bg-black text-white font-black uppercase italic tracking-widest hover:bg-orange-500 hover:text-black transition-all disabled:opacity-20"
                >
                  {isGeneratingSchedule ? 'Optimizing...' : 'Generate Neural Schedule'}
                </button>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Learning Path & Bento (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {path ? (
            <section className="bg-white border-4 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-orange-500" />
              
              <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                <div className="space-y-2">
                  <span className="font-mono text-xs uppercase text-orange-500 font-black tracking-widest">
                    Active Neural Pathway
                  </span>
                  <h2 className="text-7xl font-black uppercase italic tracking-tighter leading-none">
                    {profile.subject}
                  </h2>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05, x: 4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onStartLearning}
                  className="px-12 py-6 bg-orange-500 text-black font-black uppercase italic text-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
                >
                  Resume Infection
                </motion.button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {path.steps.map((step, i) => {
                  const isCompleted = stats.completedSteps.includes(step.title);
                  return (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={cn(
                        "group flex items-center gap-8 p-8 border-4 border-black transition-all cursor-pointer relative overflow-hidden",
                        isCompleted ? "bg-green-50 border-green-500" : (i === stats.completedSteps.length ? "bg-orange-50 border-orange-500" : "bg-white hover:bg-black hover:text-white")
                      )}
                    >
                      <div className="text-6xl font-black italic opacity-10 group-hover:opacity-100 transition-opacity">0{i + 1}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h4 className="text-2xl font-black uppercase italic leading-none">{step.title}</h4>
                          {isCompleted && <CheckCircle2 size={20} className="text-green-600" />}
                        </div>
                        <div className="flex flex-wrap gap-6 font-mono text-[10px] uppercase font-black tracking-widest opacity-40 group-hover:opacity-100">
                          <span className="flex items-center gap-2"><Clock size={12} /> {step.estimatedTime}</span>
                          <span className="flex items-center gap-2"><BarChart3 size={12} /> {step.difficulty}</span>
                          <span className="flex items-center gap-2"><Brain size={12} /> {step.method}</span>
                        </div>
                      </div>
                      <ChevronRight className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2" size={32} />
                      
                      {i === stats.completedSteps.length && !isCompleted && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-orange-500 text-black text-[10px] font-black uppercase italic">
                          Next Up
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          ) : (
            <section className="bg-black text-white p-12 border-4 border-black shadow-[12px_12px_0px_0px_rgba(249,115,22,1)] flex flex-col items-center text-center space-y-8">
              <div className="w-24 h-24 bg-orange-500 border-4 border-black flex items-center justify-center text-black">
                <Sparkles size={48} />
              </div>
              <div className="space-y-4">
                <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none">Neural Evolution Stalled</h2>
                <p className="text-xl font-bold opacity-60 max-w-xl mx-auto italic">Previous infection successfully integrated. Your neural network is primed for the next mutation.</p>
              </div>
              <button 
                onClick={onNewInfection}
                className="px-16 py-8 bg-orange-500 text-black font-black uppercase italic text-3xl border-4 border-black shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] hover:shadow-none transition-all"
              >
                Initialize New Infection
              </button>
            </section>
          )}

          {/* Completed Pathways */}
          {stats.completedPathways && stats.completedPathways.length > 0 && (
            <section className="bg-white border-4 border-black p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-4 mb-10">
                <CheckCircle2 size={40} className="text-green-500" />
                <h2 className="text-5xl font-black uppercase italic tracking-tighter leading-none">Neural Archive</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {stats.completedPathways.map((cp, i) => (
                  <motion.div 
                    key={cp.id}
                    whileHover={{ scale: 1.02 }}
                    className="p-6 border-4 border-black bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{cp.date}, {cp.year}</span>
                        <Trophy size={16} className="text-orange-500" />
                      </div>
                      <h3 className="text-2xl font-black uppercase italic leading-none mb-4">{cp.name}</h3>
                      <div className="flex flex-wrap gap-2 mb-6">
                        {cp.topics.slice(0, 3).map((t, j) => (
                          <span key={j} className="text-[8px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5">
                            {t}
                          </span>
                        ))}
                        {cp.topics.length > 3 && <span className="text-[8px] font-black uppercase tracking-widest opacity-40">+{cp.topics.length - 3} more</span>}
                      </div>
                    </div>
                    <button 
                      onClick={() => onViewArchived(cp)}
                      className="w-full py-3 border-2 border-black font-black uppercase italic text-xs hover:bg-black hover:text-white transition-all"
                    >
                      Review Data
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Bento Grid Bottom */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 bg-blue-500 text-black p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] group cursor-pointer">
              <div className="flex items-center justify-between mb-6">
                <Users size={48} className="group-hover:scale-110 transition-transform" />
                <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase italic">3 Active Peers</span>
              </div>
              <h3 className="text-4xl font-black uppercase italic leading-none mb-4">Peer Infection</h3>
              <p className="text-lg font-bold leading-tight mb-8 opacity-80">Sync your neural pathways with others studying {profile.subject} to accelerate integration.</p>
              <button className="w-full py-4 bg-black text-white font-black uppercase italic tracking-widest hover:bg-white hover:text-black transition-colors">Initialize Sync</button>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4 mb-6">
                  <Trophy size={32} className="text-yellow-500" />
                  <h3 className="text-2xl font-black uppercase italic">Rankings</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { name: 'Rahul S.', xp: '4,200', rank: 1 },
                    { name: 'Priya K.', xp: '3,850', rank: 2 },
                    { name: 'You', xp: stats.xp.toLocaleString(), rank: stats.rank },
                  ].map((r, i) => (
                    <div key={i} className={cn("flex items-center justify-between p-3 border-2", r.name === 'You' ? "border-orange-500 bg-orange-50" : "border-black")}>
                      <div className="flex items-center gap-3">
                        <span className="font-black italic">#{r.rank}</span>
                        <span className="text-sm font-bold uppercase">{r.name}</span>
                      </div>
                      <span className="font-mono text-xs font-black">{r.xp}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(168,85,247,1)]">
                <div className="flex items-center gap-4 mb-6">
                  <Sparkles size={32} className="text-purple-500" />
                  <h3 className="text-2xl font-black uppercase italic">Mutations</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stats.mutations.map((m, i) => (
                    <div key={i} className={cn("px-3 py-1 text-[8px] font-black uppercase italic border-2 border-black bg-orange-500")}>
                      {m}
                    </div>
                  ))}
                  <div className="px-3 py-1 text-[8px] font-black uppercase italic border-2 border-dashed border-black/20 opacity-30">
                    Locked
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const StudyNotesView = ({ notes, onBack }: { notes: StudyNotes, onBack: () => void }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="fixed inset-0 bg-[#F5F5F0] z-[150] overflow-y-auto p-6 md:p-12"
  >
    <div className="max-w-4xl mx-auto space-y-12 pb-24">
      <header className="flex justify-between items-center border-b-4 border-black pb-8">
        <div>
          <span className="font-mono text-xs uppercase text-orange-500 font-black tracking-widest">Neural Study Data</span>
          <h2 className="text-5xl md:text-7xl font-black uppercase italic leading-none">{notes.title}</h2>
        </div>
        <button 
          onClick={onBack}
          className="px-8 py-4 bg-black text-white font-black uppercase italic hover:bg-orange-500 hover:text-black transition-all border-4 border-black shadow-[8px_8px_0px_0px_rgba(249,115,22,1)]"
        >
          Close Notes
        </button>
      </header>

      <section className="space-y-6">
        <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">Introduction</h3>
        <p className="text-xl font-medium leading-relaxed opacity-80">{notes.introduction}</p>
      </section>

      <section className="space-y-8">
        <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">Key Concepts</h3>
        <div className="grid grid-cols-1 gap-6">
          {notes.keyConcepts.map((kc, i) => (
            <div key={i} className="p-8 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] space-y-4">
              <h4 className="text-2xl font-black uppercase italic text-orange-500">{kc.concept}</h4>
              <p className="text-lg font-bold opacity-70">{kc.explanation}</p>
              <div className="p-4 bg-orange-50 border-2 border-dashed border-orange-500">
                <span className="font-mono text-[10px] font-black uppercase text-orange-600 block mb-2">Practical Example</span>
                <p className="text-sm font-bold italic">{kc.example}</p>
              </div>
              {kc.exampleCode && (
                <div className="mt-4 p-4 bg-black text-white font-mono text-sm overflow-x-auto border-l-4 border-orange-500">
                  <span className="text-[10px] uppercase opacity-40 mb-2 block">Example Code</span>
                  <ReactMarkdown>{`\`\`\`\n${kc.exampleCode}\n\`\`\``}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">Detailed Breakdown</h3>
        <div className="prose prose-xl max-w-none font-medium leading-relaxed">
          <ReactMarkdown>{notes.detailedBreakdown}</ReactMarkdown>
        </div>
      </section>

      {notes.mainExampleCode && (
        <section className="space-y-6">
          <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">Comprehensive Code Example</h3>
          <div className="p-6 bg-black text-white font-mono text-sm overflow-x-auto border-4 border-black shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]">
            <ReactMarkdown>{`\`\`\`\n${notes.mainExampleCode}\n\`\`\``}</ReactMarkdown>
          </div>
        </section>
      )}

      <section className="p-8 bg-black text-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(249,115,22,1)]">
        <h3 className="text-3xl font-black uppercase italic text-orange-500 mb-4">Summary</h3>
        <p className="text-lg font-bold opacity-80">{notes.summary}</p>
      </section>

      <section className="space-y-6">
        <h3 className="text-3xl font-black uppercase italic border-l-8 border-orange-500 pl-4">Suggested Sources</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {notes.suggestedSources.map((source, i) => (
            <a 
              key={i}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-6 bg-white border-4 border-black hover:bg-orange-500 hover:text-black transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 group-hover:bg-white group-hover:text-black">{source.type}</span>
                <ExternalLink size={16} />
              </div>
              <h4 className="text-lg font-black uppercase italic leading-tight">{source.name}</h4>
            </a>
          ))}
        </div>
      </section>
    </div>
  </motion.div>
);

const LearningView = ({ 
  path, 
  stats,
  onBack,
  onCompleteStep,
  onFinish
}: { 
  path: LearningPath, 
  stats: UserStats,
  onBack: () => void,
  onCompleteStep: (step: LearningStep) => void,
  onFinish: () => void
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isAdapting, setIsAdapting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showAdaptModal, setShowAdaptModal] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [studyNotesMap, setStudyNotesMap] = useState<Record<number, StudyNotes>>({});
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [showFullNotes, setShowFullNotes] = useState(false);

  const currentStep = path.steps[currentStepIdx];
  const currentNotes = studyNotesMap[currentStepIdx];
  const isCompleted = stats.completedSteps.includes(currentStep.title);

  useEffect(() => {
    if (!currentNotes && !isGeneratingNotes) {
      handleGenerateNotes();
    }
  }, [currentStepIdx]);

  const handleAdapt = async () => {
    setIsAdapting(true);
    try {
      const adapted = await adaptContent(currentStep, feedback);
      path.steps[currentStepIdx] = adapted;
      setShowAdaptModal(false);
      setFeedback('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdapting(false);
    }
  };

  const handleGenerateNotes = async () => {
    setIsGeneratingNotes(true);
    try {
      const notes = await generateStudyNotes(currentStep.title, stats.rank > 50 ? 'beginner' : 'advanced');
      setStudyNotesMap(prev => ({ ...prev, [currentStepIdx]: notes }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-500 flex flex-col",
      focusMode ? "bg-black text-white/90" : "bg-white text-black"
    )}>
      <header className={cn(
        "border-b-4 border-black p-6 flex justify-between items-center sticky top-0 z-50 transition-colors",
        focusMode ? "bg-black border-white/10" : "bg-white"
      )}>
        <button 
          onClick={onBack} 
          className="flex items-center gap-3 font-black uppercase italic hover:text-orange-500 transition-colors group"
        >
          <ChevronRight className="rotate-180 group-hover:-translate-x-1 transition-transform" /> 
          <span className="hidden md:inline">Abort Session</span>
        </button>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-4">
            <div className="font-mono text-[10px] uppercase font-black opacity-40">
              Neural Integration Progress
            </div>
            <div className="w-64 h-3 bg-black/5 border-2 border-black relative overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${(stats.completedSteps.length / path.steps.length) * 100}%` }}
              />
            </div>
            <div className="font-mono text-[10px] uppercase font-black text-orange-500">
              {stats.completedSteps.length} / {path.steps.length}
            </div>
          </div>

          <button 
            onClick={() => setFocusMode(!focusMode)}
            className={cn(
              "px-4 py-2 border-2 border-black font-black uppercase italic text-[10px] tracking-widest transition-all",
              focusMode ? "bg-white text-black" : "bg-black text-white"
            )}
          >
            {focusMode ? 'Exit Focus' : 'Focus Mode'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-8 md:p-16 max-w-5xl mx-auto w-full relative">
        {/* Scan Line in Focus Mode */}
        {focusMode && (
          <div className="absolute inset-0 pointer-events-none opacity-5">
            <div className="scan-line" />
          </div>
        )}

        <motion.div
          key={currentStepIdx}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="space-y-12"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <span className="px-4 py-1 bg-orange-500 text-black font-black uppercase italic text-xs border-2 border-black">
                {currentStep.difficulty}
              </span>
              <span className={cn(
                "px-4 py-1 border-2 font-black uppercase italic text-xs",
                focusMode ? "border-white/20" : "border-black"
              )}>
                {currentStep.method}
              </span>
              <span className="font-mono text-[10px] uppercase opacity-40 font-black tracking-widest">
                Est. Time: {currentStep.estimatedTime}
              </span>
              {isCompleted && (
                <span className="px-4 py-1 bg-green-500 text-black font-black uppercase italic text-xs border-2 border-black">
                  Completed
                </span>
              )}
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85]">
              {currentStep.title}
            </h1>
          </div>

          <div className={cn(
            "prose prose-2xl max-w-none font-medium leading-relaxed transition-colors",
            focusMode ? "prose-invert text-white/80" : "text-black/80"
          )}>
            <ReactMarkdown>{currentStep.content}</ReactMarkdown>
          </div>

          {isGeneratingNotes && !currentNotes && (
            <div className="py-12 flex flex-col items-center justify-center border-t-4 border-black/10">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-orange-500 mb-4"
              >
                <RefreshCw size={48} />
              </motion.div>
              <p className="font-mono text-xs uppercase font-black opacity-30 tracking-widest">Synthesizing Neural Study Data...</p>
            </div>
          )}

          {currentNotes && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12 pt-12 border-t-4 border-black/10"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black uppercase italic">Neural Study Notes</h2>
                <button 
                  onClick={() => setShowFullNotes(true)}
                  className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase italic hover:bg-orange-500 transition-colors"
                >
                  Full Screen View
                </button>
              </div>

              <section className="space-y-6">
                <h3 className="text-2xl font-black uppercase italic text-orange-500">Introduction</h3>
                <p className="text-lg font-medium opacity-80">{currentNotes.introduction}</p>
              </section>

              <div className="grid grid-cols-1 gap-8">
                {currentNotes.keyConcepts.map((kc, i) => (
                  <div key={i} className="p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
                    <h4 className="text-xl font-black uppercase italic text-orange-500">{kc.concept}</h4>
                    <p className="text-base font-bold opacity-70">{kc.explanation}</p>
                    {kc.exampleCode && (
                      <div className="mt-4 p-4 bg-black text-white font-mono text-xs overflow-x-auto border-l-4 border-orange-500">
                        <ReactMarkdown>{`\`\`\`\n${kc.exampleCode}\n\`\`\``}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {currentNotes.mainExampleCode && (
                <section className="space-y-6">
                  <h3 className="text-2xl font-black uppercase italic text-orange-500">Main Implementation</h3>
                  <div className="p-6 bg-black text-white font-mono text-xs overflow-x-auto border-4 border-black">
                    <ReactMarkdown>{`\`\`\`\n${currentNotes.mainExampleCode}\n\`\`\``}</ReactMarkdown>
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {currentStep.resourceLink && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col md:flex-row items-center justify-between gap-6",
                focusMode ? "bg-white/5 border-white/20" : "bg-orange-50"
              )}
            >
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 flex items-center justify-center border-4 border-black",
                  currentStep.resourceType === 'youtube' ? "bg-red-500" : "bg-blue-500"
                )}>
                  {currentStep.resourceType === 'youtube' ? <Youtube className="text-white" size={32} /> : <ExternalLink className="text-white" size={32} />}
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase italic leading-none mb-2">Deep Dive Resource</h4>
                  <p className="text-sm font-bold opacity-60">Complete this {currentStep.resourceType} module to master this phase.</p>
                </div>
              </div>
              <a 
                href={currentStep.resourceLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full md:w-auto px-8 py-4 bg-black text-white font-black uppercase italic text-sm tracking-widest hover:bg-orange-500 transition-colors flex items-center justify-center gap-3"
              >
                Access Resource <ExternalLink size={16} />
              </a>
            </motion.div>
          )}

          <div className={cn(
            "pt-16 border-t-4 flex flex-col md:flex-row justify-between items-center gap-8",
            focusMode ? "border-white/10" : "border-black"
          )}>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setShowAdaptModal(true)}
                className="flex items-center gap-3 text-sm font-black uppercase italic hover:text-orange-500 transition-colors group"
              >
                <RefreshCw size={20} className="group-hover:rotate-180 transition-transform duration-500" /> 
                Reshape this content (AI Adaptation)
              </button>
            </div>
            
            <div className="flex gap-6 w-full md:w-auto">
              {currentStepIdx > 0 && (
                <button 
                  onClick={() => setCurrentStepIdx(currentStepIdx - 1)}
                  className={cn(
                    "flex-1 md:flex-none px-12 py-5 border-4 border-black font-black uppercase italic hover:bg-black hover:text-white transition-all",
                    focusMode && "border-white/20 hover:bg-white hover:text-black"
                  )}
                >
                  Back
                </button>
              )}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!isCompleted) {
                    onCompleteStep(currentStep);
                  }
                  if (currentStepIdx < path.steps.length - 1) {
                    setCurrentStepIdx(currentStepIdx + 1);
                  } else {
                    confetti({
                      particleCount: 150,
                      spread: 70,
                      origin: { y: 0.6 },
                      colors: ['#F97316', '#000000', '#FFFFFF']
                    });
                    setTimeout(onFinish, 2000);
                  }
                }}
                className="flex-1 md:flex-none px-16 py-5 bg-orange-500 text-black font-black uppercase italic text-xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none transition-all"
              >
                {currentStepIdx === path.steps.length - 1 ? 'Complete Pathway' : 'Next Phase'}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Adaptation Modal */}
      <AnimatePresence>
        {showAdaptModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#F5F5F0] border-8 border-black p-12 max-w-2xl w-full shadow-[24px_24px_0px_0px_rgba(249,115,22,1)]"
            >
              <div className="flex items-center gap-4 mb-6">
                <RefreshCw size={40} className="text-orange-500" />
                <h2 className="text-5xl font-black uppercase italic leading-none">Reshape Neural Data</h2>
              </div>
              
              <p className="text-xl font-bold mb-8 leading-tight">Identify the friction point. Our AI will re-synthesize this phase to match your current neural capacity.</p>
              
              <textarea 
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="e.g., 'Simplify the terminology', 'Provide a real-world analogy', 'I need a step-by-step breakdown'..."
                className="w-full h-48 p-6 border-4 border-black bg-white font-bold text-lg focus:outline-none focus:border-orange-500 mb-8 placeholder:opacity-20"
              />
              
              <div className="flex gap-6">
                <button 
                  onClick={() => setShowAdaptModal(false)}
                  className="flex-1 py-5 border-4 border-black font-black uppercase italic hover:bg-white transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAdapt}
                  disabled={isAdapting || !feedback}
                  className="flex-1 py-5 bg-black text-white font-black uppercase italic hover:bg-orange-500 hover:text-black transition-all disabled:opacity-20"
                >
                  {isAdapting ? 'Re-Synthesizing...' : 'Execute Adaptation'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Study Notes View */}
      <AnimatePresence>
        {showFullNotes && currentNotes && (
          <StudyNotesView notes={currentNotes} onBack={() => setShowFullNotes(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Completion Modal ---

const CompletionModal = ({ pathway, onBack }: { pathway: LearningPath | CompletedPathway, onBack: () => void }) => {
  const isArchived = 'topics' in pathway;
  const dateStr = isArchived ? pathway.date : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const yearStr = isArchived ? pathway.year : new Date().getFullYear().toString();
  const topics = isArchived ? pathway.topics : pathway.steps.map(s => s.title);
  const name = isArchived ? pathway.name : pathway.subject;

  return (
    <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center p-6 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, rotate: -5 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        className="bg-[#F5F5F0] border-8 border-black p-12 max-w-4xl w-full shadow-[32px_32px_0px_0px_rgba(249,115,22,1)] relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-black via-transparent to-transparent" />
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start mb-12">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <Trophy size={48} className="text-orange-500" />
                <h2 className="text-6xl font-black uppercase italic leading-none">
                  {isArchived ? "Neural Archive Entry" : "Neural Synthesis Complete"}
                </h2>
              </div>
              <p className="text-2xl font-bold opacity-60">Pathway: {name}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black italic">{dateStr}</p>
              <p className="text-2xl font-bold opacity-40">{yearStr}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="border-4 border-black p-8 bg-white">
              <h3 className="text-2xl font-black uppercase italic mb-6 flex items-center gap-3">
                <Brain size={24} className="text-orange-500" />
                Infected Nodes (Topics)
              </h3>
              <div className="flex flex-wrap gap-3">
                {topics.map((topic, i) => (
                  <span key={i} className="px-4 py-2 bg-black text-white text-sm font-black uppercase italic tracking-widest">
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-4 border-black p-8 bg-orange-500 text-black">
              <h3 className="text-2xl font-black uppercase italic mb-6 flex items-center gap-3">
                <Sparkles size={24} />
                Neural Evolution
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                  <span className="font-bold uppercase italic">XP Gained</span>
                  <span className="text-3xl font-black">+1,500</span>
                </div>
                <div className="flex justify-between items-center border-b-2 border-black pb-2">
                  <span className="font-bold uppercase italic">Rank Evolution</span>
                  <span className="text-3xl font-black">Ascending</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold uppercase italic">Mutation Status</span>
                  <span className="text-3xl font-black">Stable</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <button 
              onClick={() => {
                // Logic to download certificate
                const certContent = `
                  NEURAL SYNTHESIS CERTIFICATE
                  ---------------------------
                  Subject: ${name}
                  Date: ${dateStr}, ${yearStr}
                  Topics Mastered:
                  ${topics.map(t => `- ${t}`).join('\n')}
                  
                  Status: NEURAL INTEGRATION STABLE
                `;
                const blob = new Blob([certContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `neural-cert-${name.toLowerCase().replace(/\s+/g, '-')}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex-1 py-6 border-4 border-black font-black uppercase italic text-xl hover:bg-white transition-all flex items-center justify-center gap-4"
            >
              Download Certificate <CheckCircle2 />
            </button>
            <button 
              onClick={onBack}
              className="flex-1 py-6 bg-black text-white font-black uppercase italic text-xl hover:bg-orange-500 hover:text-black transition-all"
            >
              Return to Nexus
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<AppState>('landing');
  const [profile, setProfile] = useState<LearningProfile | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [selectedArchivedPathway, setSelectedArchivedPathway] = useState<CompletedPathway | null>(null);
  const [stats, setStats] = useState<UserStats>({
    xp: 0,
    rank: 99,
    streak: 1,
    completedSteps: [],
    mutations: ['Patient Zero'],
    dailyQuests: [
      { label: 'Complete 1 Step', xp: 100, done: false },
      { label: 'Share Knowledge', xp: 250, done: false },
      { label: '30m Focus Session', xp: 500, done: false },
    ]
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const path = `users/${user.uid}`;
    const unsubscribe = onSnapshot(doc(db, path), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setProfile({
          name: data.name,
          learningStyle: data.learningStyle,
          goals: data.goals,
          level: data.level,
          subject: data.subject
        });
        setStats({
          xp: data.xp,
          rank: data.rank,
          streak: data.streak || 1,
          completedSteps: data.completedSteps || [],
          mutations: data.mutations || ['Patient Zero'],
          dailyQuests: data.dailyQuests || [],
          completedPathways: data.completedPathways || [],
          schedule: data.schedule || null
        });
        if (data.currentPath) {
          setPath(data.currentPath);
        }
        if (state === 'landing') setState('dashboard');
      } else {
        if (state === 'dashboard' || state === 'learning') setState('onboarding');
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setState('landing');
      setProfile(null);
      setPath(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnboardingComplete = async (newProfile: LearningProfile) => {
    if (!user) return;
    
    setProfile(newProfile);
    setState('dashboard');
    
    const resetStats = { ...stats, completedSteps: [] };
    setStats(resetStats);
    
    try {
      const newPath = await generateLearningPath(newProfile);
      setPath(newPath);
      
      const docPath = `users/${user.uid}`;
      await setDoc(doc(db, docPath), {
        ...newProfile,
        ...resetStats,
        currentPath: newPath,
        role: 'user'
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleCompleteStep = async (step: LearningStep) => {
    if (!user || !profile) return;

    const newStats = { ...stats };
    if (newStats.completedSteps.includes(step.title)) return;

    newStats.completedSteps = [...newStats.completedSteps, step.title];
    newStats.xp += 150;

    // Check daily quests
    if (newStats.completedSteps.length === 1) {
      const questIdx = newStats.dailyQuests.findIndex(q => q.label === 'Complete 1 Step');
      if (questIdx !== -1 && !newStats.dailyQuests[questIdx].done) {
        newStats.dailyQuests[questIdx].done = true;
        newStats.xp += newStats.dailyQuests[questIdx].xp;
      }
    }

    // Unlock mutations
    if (newStats.completedSteps.length === 3 && !newStats.mutations.includes('Fast Learner')) {
      newStats.mutations = [...newStats.mutations, 'Fast Learner'];
      newStats.xp += 500;
    }

    newStats.rank = Math.max(1, 99 - Math.floor(newStats.xp / 500));

    setStats(newStats);

    try {
      const docPath = `users/${user.uid}`;
      await updateDoc(doc(db, docPath), {
        xp: newStats.xp,
        rank: newStats.rank,
        completedSteps: newStats.completedSteps,
        mutations: newStats.mutations,
        dailyQuests: newStats.dailyQuests
      });

      // Check if pathway is complete
      if (path && newStats.completedSteps.length >= path.steps.length) {
        const completedPathway: CompletedPathway = {
          id: Math.random().toString(36).substr(2, 9),
          name: path.subject,
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          year: new Date().getFullYear().toString(),
          topics: path.steps.map(s => s.title)
        };

        const updatedCompletedPathways = [...(stats.completedPathways || []), completedPathway];
        
        await updateDoc(doc(db, docPath), {
          completedPathways: updatedCompletedPathways,
          currentPath: null, // Clear current path after completion
          subject: "" // Clear subject after completion
        });

        setStats(prev => ({ ...prev, completedPathways: updatedCompletedPathways }));
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const handleGenerateSchedule = async () => {
    if (!user || !profile) return;
    try {
      const schedule = await generateSchedule(profile, profile.goals);
      setStats(prev => ({ ...prev, schedule }));
      
      const docPath = `users/${user.uid}`;
      await updateDoc(doc(db, docPath), {
        schedule
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-orange-500"
        >
          <Virus size={80} />
        </motion.div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="font-sans">
        <AnimatePresence mode="wait">
          {state === 'landing' && (
            <motion.div key="landing" exit={{ opacity: 0 }}>
              <Landing 
                onStart={user ? () => setState('onboarding') : handleLogin} 
                isLoggedIn={!!user}
              />
            </motion.div>
          )}

          {state === 'onboarding' && (
            <motion.div key="onboarding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Onboarding onComplete={handleOnboardingComplete} />
            </motion.div>
          )}

          {state === 'dashboard' && profile && (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Dashboard 
                profile={profile} 
                path={path} 
                stats={stats}
                onStartLearning={() => path && setState('learning')} 
                onNewInfection={() => setState('onboarding')}
                onGenerateSchedule={handleGenerateSchedule}
                onViewArchived={(cp) => setSelectedArchivedPathway(cp)}
                onLogout={handleLogout}
              />
            </motion.div>
          )}

          {selectedArchivedPathway && (
            <motion.div key="archived" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CompletionModal 
                pathway={selectedArchivedPathway} 
                onBack={() => setSelectedArchivedPathway(null)} 
              />
            </motion.div>
          )}

          {state === 'learning' && path && stats && (
            <motion.div key="learning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <LearningView 
                path={path} 
                stats={stats}
                onBack={() => setState('dashboard')} 
                onCompleteStep={handleCompleteStep}
                onFinish={() => setState('completed')}
              />
            </motion.div>
          )}

          {state === 'completed' && path && (
            <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <CompletionModal 
                pathway={path} 
                onBack={() => {
                  setPath(null);
                  setState('dashboard');
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
