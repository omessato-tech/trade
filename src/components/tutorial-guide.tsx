
"use client";

import { useState, useEffect, useCallback, type RefObject } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export interface TutorialStep {
  ref: RefObject<HTMLElement>;
  title: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
}

interface TutorialGuideProps {
  steps: TutorialStep[];
  onComplete: () => void;
  isOpen: boolean;
}

export function TutorialGuide({ steps, onComplete, isOpen }: TutorialGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightStyle, setSpotlightStyle] = useState({});
  const [popoverStyle, setPopoverStyle] = useState({});

  const currentStep = steps[currentStepIndex];

  const updatePosition = useCallback(() => {
    if (!isOpen || !currentStep?.ref?.current) {
        setSpotlightStyle({ opacity: 0 });
        setPopoverStyle({ opacity: 0, pointerEvents: 'none' });
        return;
    };

    const targetElement = currentStep.ref.current;
    
    targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
    });
    
    setTimeout(() => {
        const targetRect = targetElement.getBoundingClientRect();
        const padding = currentStep.spotlightPadding ?? 8;

        setSpotlightStyle({
            width: targetRect.width + padding * 2,
            height: targetRect.height + padding * 2,
            top: targetRect.top - padding,
            left: targetRect.left - padding,
            opacity: 1,
        });

        const popoverRect = document.getElementById('tutorial-popover')?.getBoundingClientRect();
        const popoverHeight = popoverRect?.height || 300;
        const popoverWidth = popoverRect?.width || 320;
        
        let top = 0, left = 0;
        const offset = 16;
        
        switch (currentStep.placement) {
            case 'top':
                top = targetRect.top - popoverHeight - offset;
                left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
                break;
            case 'left':
                top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
                left = targetRect.left - popoverWidth - offset;
                break;
            case 'right':
                top = targetRect.top + (targetRect.height / 2) - (popoverHeight / 2);
                left = targetRect.right + offset;
                break;
            case 'bottom':
            default:
                top = targetRect.bottom + offset;
                left = targetRect.left + (targetRect.width / 2) - (popoverWidth / 2);
                break;
        }

        const margin = 16;
        if (top < margin) top = margin;
        if (left < margin) left = margin;
        if (left + popoverWidth > window.innerWidth - margin) {
          left = window.innerWidth - popoverWidth - margin;
        }
        if (top + popoverHeight > window.innerHeight - margin) {
          top = window.innerHeight - popoverHeight - margin;
        }
        
        setPopoverStyle({ top, left, opacity: 1, pointerEvents: 'auto' });

    }, 300);
  }, [currentStep, isOpen]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };
  
  if (!isOpen || !currentStep) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-[1000]" />
      <div 
        className="fixed rounded-lg border-2 border-dashed border-primary z-[1001] transition-all duration-300 ease-in-out pointer-events-none" 
        style={spotlightStyle} 
      />
      <div
        id="tutorial-popover"
        className="fixed z-[1002] w-80 transition-opacity duration-300 animate-fade-in"
        style={popoverStyle}
      >
        <Card className="shadow-2xl border-primary/50 bg-background/90 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">{currentStep?.title}</CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {currentStep?.content}
          </CardContent>
          <CardFooter className="flex justify-between">
            <span className="text-xs text-muted-foreground">
              Passo {currentStepIndex + 1} de {steps.length}
            </span>
            <div className="flex gap-2">
                <Button variant="ghost" onClick={handleSkip}>Pular</Button>
                <Button onClick={handleNext}>
                  {currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Próximo'}
                </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
