"use client";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";
import { RACE_FILTERS } from "@/data/candidates";
import type { FilterKey } from "@/data/candidates";

interface RaceFilterProps {
  readonly filter: FilterKey;
  readonly onFilterChange: (key: FilterKey) => void;
}

export function RaceFilter({ filter, onFilterChange }: RaceFilterProps) {
  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList className="gap-0.5">
        {RACE_FILTERS.map((f) => {
          const isActive = filter === f.key;
          return (
            <NavigationMenuItem key={f.key}>
              <NavigationMenuLink
                className={`
                  inline-flex h-9 items-center justify-center rounded-base px-3.5 py-1.5
                  text-xs font-heading cursor-pointer select-none transition-all duration-150
                  ${isActive
                    ? "bg-secondary-background text-foreground border-2 border-border shadow-shadow"
                    : "bg-transparent text-main-foreground/80 border-2 border-transparent hover:bg-secondary-background/20 hover:text-main-foreground"
                  }
                `}
                onClick={() => onFilterChange(f.key)}
              >
                {f.label}
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
