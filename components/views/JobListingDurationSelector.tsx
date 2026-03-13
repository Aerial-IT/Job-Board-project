
import React, { useState } from 'react';
import { ControllerRenderProps } from "react-hook-form";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { jobListingDurationSelector } from "@/utils/jobListingDurationPricing";
import { Label } from "../ui/label";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { Calendar, Check, Crown, Sparkles, Timer } from 'lucide-react';

interface iAppProps {
  field: ControllerRenderProps;
}

const popularDuration = 30;

export function JobListingDurationSelector({ field }: iAppProps) {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  const getBadgeContent = (days: number) => {
    if (days === popularDuration) return { text: 'Most Popular', icon: Crown };
    if (days > 30) return { text: 'Best Value', icon: Sparkles };
    return null;
  };

  // Animation variants for smoother transitions
  const expandAnimation: Variants = {
    initial: { 
      opacity: 0,
      height: 0,
      marginTop: 0
    },
    animate: { 
      opacity: 1,
      height: "auto",
      marginTop: 16,
      transition: {
        height: {
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        },
        opacity: {
          duration: 0.2,
          delay: 0.1
        }
      }
    },
    exit: { 
      opacity: 0,
      height: 0,
      marginTop: 0,
      transition: {
        height: {
          duration: 0.2,
          ease: [0.4, 0, 0.2, 1]
        },
        opacity: {
          duration: 0.1
        }
      }
    }
  };

  return (
    <RadioGroup
      value={field.value?.toString()}
      onValueChange={(value) => {
        field.onChange(parseInt(value));
      }}
    >
      <div className="grid grid-cols-1 gap-6 min-h-[600px] transition-all ease-linear">
        {jobListingDurationSelector.map((duration, index) => {
          const isSelected = field.value === duration.days;
          const isHovered = hoveredCard === duration.days;
          const badge = getBadgeContent(duration.days);
          
          return (
            <motion.div
              key={duration.days}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4,
                delay: index * 0.1,
                ease: [0.4, 0, 0.2, 1]
              }}
              onHoverStart={() => setHoveredCard(duration.days)}
              onHoverEnd={() => setHoveredCard(null)}
            >
              <RadioGroupItem
                value={duration.days.toString()}
                id={duration.days.toString()}
                className="sr-only"
              />

              <Label
                htmlFor={duration.days.toString()}
                className="cursor-pointer block"
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card
                    className={cn(
                      "relative overflow-hidden transition-all duration-300",
                      isSelected
                        ? "border-2 border-primary ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent"
                        : "hover:border-primary/50 hover:bg-secondary/10"
                    )}
                  >
                    {badge && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                          <badge.icon size={12} />
                          {badge.text}
                        </div>
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <motion.div 
                            className="flex items-center gap-2 mb-3"
                            animate={{ color: isSelected ? 'var(--primary)' : 'inherit' }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className={cn(
                              "p-2 rounded-full transition-colors duration-200",
                              isSelected || isHovered
                                ? "bg-primary text-white"
                                : "bg-secondary"
                            )}>
                              <Timer size={20} className="animate-pulse" />
                            </div>
                            <span className="text-xl font-bold">{duration.days} Days</span>
                          </motion.div>

                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {duration.description}
                          </p>

                          <motion.div 
                            className="mt-4 flex gap-3"
                            initial={false}
                            animate={{ opacity: isSelected ? 1 : 0.7 }}
                            transition={{ duration: 0.2 }}
                          >
                            {[
                              'Unlimited applications',
                              'Featured listing',
                              'Priority support'
                            ].map((feature, i) => (
                              <div key={i} className="flex items-center gap-1 text-xs">
                                <Check size={14} className="text-primary" />
                                {feature}
                              </div>
                            ))}
                          </motion.div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-baseline justify-end gap-1 mb-1">
                            <span className="text-sm text-muted-foreground">$</span>
                            <motion.p
                              className="text-3xl font-bold"
                              animate={{
                                color: isSelected ? 'var(--primary)' : 'inherit',
                                scale: isSelected ? 1.1 : 1
                              }}
                              transition={{ duration: 0.2 }}
                            >
                              {duration.price}
                            </motion.p>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <p className="text-sm text-muted-foreground">
                              ${(duration.price / duration.days).toFixed(2)}/day
                            </p>
                            <AnimatePresence>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center"
                                >
                                  <Check size={14} className="text-primary" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isSelected && (
                          <motion.div
                            variants={expandAnimation}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="border-t border-primary/20"
                          >
                            <div className="flex items-center gap-2 text-sm text-primary">
                              <Calendar size={16} />
                              <span>Listing will be active until {new Date(Date.now() + duration.days * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="absolute inset-0 pointer-events-none">
                      <div className={cn(
                        "absolute inset-0 transition-opacity duration-300",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}>
                        <div className="absolute top-0 left-0 w-20 h-20 bg-primary/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-primary/5 rounded-full translate-x-1/2 translate-y-1/2" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Label>
            </motion.div>
          );
        })}
      </div>
    </RadioGroup>
  );
}

export default JobListingDurationSelector;