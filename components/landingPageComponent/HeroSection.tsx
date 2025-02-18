import React from 'react';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center py-20 overflow-hidden">
      
      <div className="absolute inset-0  ">
        <div className="absolute inset-0 "></div>
    
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full mix-blend-overlay filter blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-blue-400/10 rounded-full mix-blend-overlay filter blur-xl animate-pulse animation-delay-2000"></div>
      </div>


      <div className="relative z-10 container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center space-y-8">
       
          <div className="space-y-4">
            <h2 className="text-2xl font-medium text-blue-200 mb-2 opacity-90">
              Your Journey Starts Here
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-5xl md:text-6xl font-bold text-white">
              <span className="drop-shadow-lg">Discover Your</span>
              <div className="bg-white/95 rounded-2xl p-4 transform hover:scale-105 transition-transform duration-300 shadow-2xl">
                <h1 className="animate-typing overflow-hidden whitespace-nowrap border-r-4 border-r-black/70 pr-5 text-4xl md:text-5xl text-primary font-bold">
                  Dream Career
                </h1>
              </div>
            </div>
          </div>

        
          <p className="text-xl text-blue-50 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Connect with top employers and unlock exciting opportunities tailored
            just for you. Your next big career move is just a click away.
          </p>

      
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-8">
            {[
              { number: "1000+", label: "Jobs Posted" },
              { number: "500+", label: "Companies" },
              { number: "10k+", label: "Success Stories" },
            ].map((stat, index) => (
              <div key={index} className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-blue-200 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/main">
              <Button
                size="lg"
                className="bg-white text-primary hover:bg-blue-50 transition-all duration-300 text-lg px-8 py-6 rounded-full shadow-xl group"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Button>
            </Link>
            
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-white text-black hover:bg-white/10 transition-all duration-300 text-lg px-8 py-6 rounded-full shadow-xl"
            >
              Learn More
              <Sparkles className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

     
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent opacity-20"></div>
    </section>
  );
}