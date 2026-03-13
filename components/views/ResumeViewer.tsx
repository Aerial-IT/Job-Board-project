
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface ResumeViewerProps {
  resumeUrl: string;
}

export default function ResumeViewer({ resumeUrl }: ResumeViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setIsOpen(true)}>
        <FileText/> View Resume
      </Button>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-80">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-lg max-w-3xl w-full">
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Close
              </Button>
            </div>
            <div className="mt-4">
              <object
                data={resumeUrl}
                type="application/pdf"
                className="w-full h-[800px] border dark:border-gray-700"
              >
                <p>
                  Your browser does not support inline PDFs.
                  <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                    Click here to download the PDF.
                  </a>
                </p>
              </object>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
