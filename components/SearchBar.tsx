"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "./ui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchIcon, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type JOBPOSTS = {
  id: string;
  jobTitle: string;
  location: string;
}[];

export default function SearchBar({ jobPosts }: { jobPosts: JOBPOSTS }) {
  const [showSearchSuggestions, setShowSearchSuggestions] =
    useState<boolean>(false);
  const [value, setValue] = useState<string>("");
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
 

  const filteredData: JOBPOSTS = useMemo(
    () =>
      jobPosts.filter((item) =>
        item.jobTitle.split(" ").some((word) =>
          value
            .trim()
            .split(" ")
            .some((vec) => vec.toLowerCase() === word.toLowerCase())
        )
      ),
    [value, jobPosts]
  );

  function handleSearchValueOnEnter(value: string) {
  const urlparams=new URLSearchParams(searchParams.toString())

  if(value.length>0){
    urlparams.set("search",value)
    router.push("/main/?"+urlparams.toString())
  }




  }
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
        setIsSearching(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  // Simulate search delay
  useEffect(() => {
    if (value.length > 0) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <motion.div
        ref={ref}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn("relative group", "transition-all duration-200")}
      >
        <div
          className={cn(
            "flex items-center gap-2 bg-white dark:bg-gray-800",
            "rounded-xl shadow-lg",
            "border transition-all duration-200",
            isInputFocused
              ? "border-primary ring-2 ring-primary/20"
              : "border-gray-200 dark:border-gray-700 hover:border-primary/50"
          )}
        >
          <div className="flex items-center flex-1 p-3">
            <motion.div
              animate={{
                rotate: isSearching ? 360 : 0,
              }}
              transition={{ duration: 1, repeat: isSearching ? Infinity : 0 }}
              className={cn(
                "p-2 rounded-lg",
                isInputFocused ? "bg-primary/10" : "bg-gray-100 dark:bg-gray-700"
              )}
            >
              {isSearching ? (
                <Loader2 className="text-primary w-5 h-5" />
              ) : (
                <SearchIcon className="text-gray-500 dark:text-gray-400 w-5 h-5" />
              )}
            </motion.div>

            <Input
             onKeyUp={(e)=>{
              if(e.key==="Enter"){
                handleSearchValueOnEnter(value)
              }
             }}
              value={value}
              style={{
                outline: "none",
                boxShadow: "none",
                border: "none",
              }}
              onFocus={() => {
                setIsInputFocused(true);
                if (value.length > 0) setShowSearchSuggestions(true);
              }}
              onBlur={() => setIsInputFocused(false)}
              onChange={(e) => {
                setValue(e.target.value);
                if (e.target.value.length > 0) setShowSearchSuggestions(true);
                else setShowSearchSuggestions(false);
              }}
              className="flex-1 text-lg font-medium placeholder:text-gray-400 bg-transparent"
              placeholder="Search for job titles..."
            />
          </div>
        </div>

        <AnimatePresence>
          {showSearchSuggestions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute w-full mt-2 py-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-20"
            >
              {isSearching ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  <p>Searching...</p>
                </div>
              ) : filteredData.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredData.slice(0, 5).map((job, idx) => {
                    const words = job.jobTitle.split(" ").map((word, id) => {
                      const isMatched = value
                        .trim()
                        .split(" ")
                        .some(
                          (vec) => vec.toLowerCase() === word.toLowerCase()
                        );

                      return (
                        <span
                          key={id}
                          className={cn(
                            "transition-colors",
                            isMatched && "text-primary font-semibold"
                          )}
                        >
                          {word}{" "}
                        </span>
                      );
                    });

                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={idx}
                        onClick={() => router.push(`/job/${job.id}`)}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-primary/5 rounded-lg">
                            <SearchIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-base">{words}</div>
                            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                              <MapPin className="w-3 h-3" />
                              {job.location}
                            </div>
                          </div>
                        </div>
                        <motion.div
                          initial={{ x: 0, opacity: 0 }}
                          whileHover={{ x: 5, opacity: 1 }}
                          className="text-primary"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </motion.div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No matching jobs found
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
