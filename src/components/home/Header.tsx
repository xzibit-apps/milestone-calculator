// components/home/Header.tsx
import { CalendarCheck, Calendar, TrendingUp, Shield, Zap } from 'lucide-react';

export default function Header() {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="relative">
        {/* Background Card with subtle effects */}
        <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-[#203049]/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-[#60a5fa]/50 to-transparent"></div>

          <div className="relative">
            {/* Top Section: Icon + Title */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-8 sm:mb-10">
              {/* Icon */}
              <div className="shrink-0">
                <div className="bg-linear-to-br from-[#60a5fa] to-[#3b82f6] rounded-2xl p-4 sm:p-5 shadow-lg">
                  <CalendarCheck className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                </div>
              </div>

              {/* Title Section */}
              <div className="flex-1 text-center sm:text-left mt-5">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                  Production Milestone Calculator
                </h1>
                <p className="text-[#94a3b8] text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl">
                  Generate accurate project timelines based on complexity
                  scoring, working days, and risk indicators
                </p>
              </div>
            </div>

            {/* Feature Tags - Horizontal Layout */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="inline-flex items-center gap-2.5 bg-[#0b2545]/50 border border-[#203049]/60 rounded-full px-4 py-2.5 hover:bg-[#0b2545] hover:border-[#60a5fa]/50 transition-all duration-300 group">
                <div className="w-8 h-8 rounded-lg bg-[#60a5fa]/10 flex items-center justify-center group-hover:bg-[#60a5fa]/20 transition-colors">
                  <Calendar className="h-4 w-4 text-[#60a5fa]" />
                </div>
                <span className="text-sm font-medium text-[#e2e8f0] group-hover:text-[#60a5fa] transition-colors">
                  Working Days
                </span>
              </div>

              <div className="inline-flex items-center gap-2.5 bg-[#0b2545]/50 border border-[#203049]/60 rounded-full px-4 py-2.5 hover:bg-[#0b2545] hover:border-[#60a5fa]/50 transition-all duration-300 group">
                <div className="w-8 h-8 rounded-lg bg-[#60a5fa]/10 flex items-center justify-center group-hover:bg-[#60a5fa]/20 transition-colors">
                  <TrendingUp className="h-4 w-4 text-[#60a5fa]" />
                </div>
                <span className="text-sm font-medium text-[#e2e8f0] group-hover:text-[#60a5fa] transition-colors">
                  Complexity Scoring
                </span>
              </div>

              <div className="inline-flex items-center gap-2.5 bg-[#0b2545]/50 border border-[#203049]/60 rounded-full px-4 py-2.5 hover:bg-[#0b2545] hover:border-[#60a5fa]/50 transition-all duration-300 group">
                <div className="w-8 h-8 rounded-lg bg-[#60a5fa]/10 flex items-center justify-center group-hover:bg-[#60a5fa]/20 transition-colors">
                  <Shield className="h-4 w-4 text-[#60a5fa]" />
                </div>
                <span className="text-sm font-medium text-[#e2e8f0] group-hover:text-[#60a5fa] transition-colors">
                  Risk Indicators
                </span>
              </div>

              <div className="inline-flex items-center gap-2.5 bg-[#0b2545]/50 border border-[#203049]/60 rounded-full px-4 py-2.5 hover:bg-[#0b2545] hover:border-[#60a5fa]/50 transition-all duration-300 group">
                <div className="w-8 h-8 rounded-lg bg-[#60a5fa]/10 flex items-center justify-center group-hover:bg-[#60a5fa]/20 transition-colors">
                  <Zap className="h-4 w-4 text-[#60a5fa]" />
                </div>
                <span className="text-sm font-medium text-[#e2e8f0] group-hover:text-[#60a5fa] transition-colors">
                  Information Gates
                </span>
              </div>
            </div>
          </div>
        </div>
        x
      </div>
    </div>
  );
}
