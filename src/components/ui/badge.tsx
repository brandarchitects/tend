import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-accent-subtle text-accent",
        swisscom: "bg-ctx-swisscom/15 text-ctx-swisscom",
        brandarchitects: "bg-ctx-brandarchitects/15 text-ctx-brandarchitects",
        visari: "bg-ctx-visari/15 text-ctx-visari",
        privat: "bg-ctx-privat/15 text-ctx-privat",
        status_green: "bg-status-green/15 text-status-green",
        status_yellow: "bg-status-yellow/15 text-status-yellow",
        status_red: "bg-status-red/15 text-status-red",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
