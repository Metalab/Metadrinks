"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

function ProgressSteps() {
  const [currentStep, setCurrentStep] = React.useState(1);
  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const steps = ["User selection", "Item selection", "Review", "Payment"];

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div
      className="flex justify-center self-start pt-6 w-full"
      style={{
        all: "revert",
        display: "flex",
        justifyContent: "center",
        alignSelf: "flex-start",
        paddingTop: "1.5rem",
        width: "100%",
        fontSize: "14px",
        lineHeight: "1.5",
        letterSpacing: "normal",
      }}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-muted-foreground">
              {steps[currentStep - 1]}
            </span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            size="sm"
            onClick={nextStep}
            disabled={currentStep === totalSteps}
          >
            {currentStep === totalSteps ? "Complete" : "Next"}
            {currentStep !== totalSteps && (
              <ChevronRight className="ml-1 h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full p-4 shadow-md">
      <ProgressSteps />
    </footer>
  );
}
