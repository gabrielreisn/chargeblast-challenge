"use client";
import { Toaster as Sonner } from "sonner";
import { CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react";

export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      visibleToasts={3}
      gap={8}
      containerAriaLabel="Notifications"
      icons={{
        error: <CircleAlert size={14} className="text-[#ff8b8b]" />,
        success: <CircleCheck size={14} className="text-[#5fdba7]" />,
        warning: <TriangleAlert size={14} />,
        info: <Info size={14} />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-89 max-w-[calc(100vw-32px)] items-start gap-2 rounded-md bg-toast px-3 py-2.5 text-12 leading-4.25 text-white shadow-toast",
          icon: "mt-px flex shrink-0",
          content: "min-w-0 flex-1",
          title: "font-semibold",
          description: "mt-0.5 text-[#c9cfd9]",
          actionButton:
            "shrink-0 self-center rounded bg-white/12 px-1.75 py-0.75 text-11 font-semibold text-white hover:bg-white/20",
        },
      }}
    />
  );
}
