"use client";

import { CheckCircleIcon, CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  type ComponentPropsWithoutRef,
  createContext,
  type ReactNode,
  useContext,
} from "react";
import { cn } from "@/lib/utils";

export type ReceiptPrinterStage = "processing" | "printing" | "complete";
export type ReceiptFeedMotion = "smooth" | "stepped";

export type ReceiptPrinterRootProps = Omit<
  ComponentPropsWithoutRef<"section">,
  "children"
> & {
  animate?: boolean;
  children: ReactNode;
  feedMotion?: ReceiptFeedMotion;
  stage: ReceiptPrinterStage;
};

export type ReceiptPrinterStatusProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "children"
> & {
  children?: ReactNode;
};

type ReceiptPrinterContextValue = {
  animate: boolean;
  feedMotion: ReceiptFeedMotion;
  shouldMove: boolean;
  stage: ReceiptPrinterStage;
};

const ReceiptPrinterContext = createContext<ReceiptPrinterContextValue | null>(null);

const easeOut = [0.23, 1, 0.32, 1] as const;
const easeInOut = [0.77, 0, 0.175, 1] as const;

// Gigi-gigi di tepi bawah struk (clip-path)
const teethCount = 12;
const teethDepth = 5;
const teethPoints = Array.from({ length: teethCount * 2 }, (_, index) => {
  const x = ((index + 1) * 100) / (teethCount * 2);
  const y = index % 2 === 0 ? "100%" : `calc(100% - ${teethDepth}px)`;
  return `${x}% ${y}`;
}).join(", ");
const receiptClipPath = `polygon(0 0, 100% 0, 100% calc(100% - ${teethDepth}px), ${teethPoints})`;

const printingTransformKeyframes = [
  "translateY(calc(-100% + 2px))",
  "translateY(-91%)",
  "translateY(-91%)",
  "translateY(-81%)",
  "translateY(-81%)",
  "translateY(-70%)",
  "translateY(-70%)",
  "translateY(-58%)",
  "translateY(-58%)",
  "translateY(-45%)",
  "translateY(-45%)",
  "translateY(-32%)",
  "translateY(-32%)",
  "translateY(-20%)",
  "translateY(-20%)",
  "translateY(-10%)",
  "translateY(-10%)",
  "translateY(-3%)",
  "translateY(-3%)",
  "translateY(0%)",
];

const printingKeyframeTimes = [
  0, 0.075, 0.105, 0.18, 0.21, 0.285, 0.315, 0.39, 0.42, 0.495, 0.525, 0.6,
  0.63, 0.705, 0.735, 0.81, 0.84, 0.915, 0.945, 1,
];

const statusLabels: Record<ReceiptPrinterStage, ReactNode> = {
  processing: "Memproses pembayaran...",
  printing: "Mencetak struk...",
  complete: "Pembayaran berhasil!",
};

function useReceiptPrinter(component: string) {
  const context = useContext(ReceiptPrinterContext);
  if (!context) throw new Error(`${component} must be used inside ReceiptPrinter.Root.`);
  return context;
}

export function ReceiptPrinterRoot({
  "aria-label": ariaLabel = "Receipt printer",
  animate = true,
  children,
  className,
  feedMotion = "stepped",
  stage,
  ...props
}: ReceiptPrinterRootProps) {
  const shouldReduceMotion = useReducedMotion();
  const context = {
    animate,
    feedMotion,
    shouldMove: animate && !shouldReduceMotion,
    stage,
  };

  return (
    <ReceiptPrinterContext.Provider value={context}>
      <section
        aria-label={ariaLabel}
        className={cn("relative isolate flex w-full max-w-sm flex-col items-center", className)}
        data-stage={stage}
        {...props}
      >
        {children}
      </section>
    </ReceiptPrinterContext.Provider>
  );
}

export function ReceiptPrinterMachine({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "relative isolate w-full overflow-hidden rounded-2xl border border-border bg-background p-3 pb-10 shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 bottom-3 z-40 h-2 rounded bg-muted shadow-inner"
      />
    </div>
  );
}

export function ReceiptPrinterHeader({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("relative z-10 flex h-11 items-start justify-between", className)} {...props}>
      {children}
    </div>
  );
}

export function ReceiptPrinterScreen({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "relative z-10 isolate overflow-hidden rounded-xl border border-border bg-background p-4 text-foreground",
        className,
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function StatusIndicator({
  animate,
  move,
  stage,
}: {
  animate: boolean;
  move: boolean;
  stage: ReceiptPrinterStage;
}) {
  const isComplete = stage === "complete";
  return (
    <span aria-hidden="true" className="relative grid size-5 shrink-0 place-items-center">
      <AnimatePresence initial={false} mode="sync">
        {isComplete ? (
          <motion.span
            key="complete"
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: animate ? 0 : 1, transform: move ? "scale(0.96)" : "scale(1)" }}
            initial={{ opacity: animate ? 0 : 1, transform: move ? "scale(0.94)" : "scale(1)" }}
            transition={{ duration: animate ? 0.16 : 0, ease: easeOut }}
            className="col-start-1 row-start-1 grid place-items-center text-green-600"
          >
            <CheckCircleIcon size={18} weight="fill" />
          </motion.span>
        ) : (
          <motion.span
            key="working"
            animate={{ opacity: 1, transform: "scale(1)" }}
            exit={{ opacity: animate ? 0 : 1, transform: move ? "scale(0.96)" : "scale(1)" }}
            initial={{ opacity: animate ? 0 : 1, transform: move ? "scale(0.94)" : "scale(1)" }}
            transition={{ duration: animate ? 0.16 : 0, ease: easeOut }}
            className="col-start-1 row-start-1 grid place-items-center text-muted-foreground"
          >
            <CircleNotchIcon className={cn(animate && "animate-spin motion-reduce:animate-none")} size={18} weight="bold" />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function ReceiptPrinterStatus({
  children,
  className,
  ...props
}: ReceiptPrinterStatusProps) {
  const { animate, shouldMove, stage } = useReceiptPrinter("ReceiptPrinter.Status");
  return (
    <div className={cn("flex min-w-0 items-center gap-2", className)} {...props}>
      <StatusIndicator animate={animate} move={shouldMove} stage={stage} />
      <div aria-live="polite" className="grid min-w-0 flex-1 items-center" role="status">
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            key={stage}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            exit={{ opacity: animate ? 0 : 1, transform: shouldMove ? "translateY(-4px)" : "translateY(0px)" }}
            initial={{ opacity: animate ? 0 : 1, transform: shouldMove ? "translateY(4px)" : "translateY(0px)" }}
            transition={{ duration: animate ? 0.18 : 0, ease: easeOut }}
            className="col-start-1 row-start-1 truncate text-xs font-medium leading-none text-muted-foreground"
          >
            {children ?? statusLabels[stage]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ReceiptPrinterPaper({
  children,
  className,
  style,
  ...props
}: ComponentPropsWithoutRef<"article">) {
  return (
    <article
      className={cn(
        "relative z-10 min-h-80 bg-white px-6 pb-10 pt-7 font-mono text-neutral-900",
        className,
      )}
      style={{ clipPath: receiptClipPath, ...style }}
      {...props}
    >
      {children}
    </article>
  );
}

export function ReceiptPrinterOutput({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  const { animate, stage } = useReceiptPrinter("ReceiptPrinter.Output");
  const isReceiptVisible = stage !== "processing";
  const isComplete = stage === "complete";

  // Animasi "seperti printer": container membuka perlahan (max-height 0 → penuh),
  // struk muncul dari celah mesin ke bawah tanpa terpotong.
  return (
    <div
      className={cn(
        "relative z-20 w-4/5 max-w-full overflow-hidden bg-transparent",
        className,
      )}
      {...props}
    >
      <motion.div
        animate={{
          maxHeight: isReceiptVisible ? 2000 : 0,
          opacity: isComplete ? 1 : isReceiptVisible ? 1 : 0,
        }}
        initial={false}
        transition={{
          maxHeight: { duration: animate ? 2.6 : 0, ease: "easeInOut" },
          opacity: { duration: animate ? 0.4 : 0 },
        }}
        className="overflow-hidden"
      >
        {children}
      </motion.div>
    </div>
  );
}

export const ReceiptPrinter = {
  Header: ReceiptPrinterHeader,
  Machine: ReceiptPrinterMachine,
  Output: ReceiptPrinterOutput,
  Paper: ReceiptPrinterPaper,
  Root: ReceiptPrinterRoot,
  Screen: ReceiptPrinterScreen,
  Status: ReceiptPrinterStatus,
};
