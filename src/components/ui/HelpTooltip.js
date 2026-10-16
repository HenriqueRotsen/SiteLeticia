"use client";

import * as Tooltip from "@radix-ui/react-tooltip";

export default function HelpTooltip({ content, children }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 max-w-xs rounded-xl bg-graphite px-3 py-2 text-xs leading-5 text-white shadow-soft"
            sideOffset={6}
          >
            {content}
            <Tooltip.Arrow className="fill-graphite" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
