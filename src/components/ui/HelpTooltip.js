"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

export default function HelpTooltip({
  content,
  children,
  side = "top",
  contentClassName = "z-50 max-w-xs rounded-xl bg-graphite px-3 py-2 text-xs leading-5 text-white shadow-soft",
  delayDuration = 200
}) {
  return (
    <Tooltip.Provider delayDuration={delayDuration}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content className={contentClassName} side={side} sideOffset={8}>
            {content}
            <Tooltip.Arrow className="fill-graphite" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
