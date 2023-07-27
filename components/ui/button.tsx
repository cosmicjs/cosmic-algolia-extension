import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-light-background dark:ring-offset-dark-background",
  {
    variants: {
      variant: {
        default:
          "bg-black dark:bg-white text-gray-900 dark:text-dark-gray-900 hover:bg-black/90 dark:hover:bg-white/90",
        destructive:
          "bg-red-500 dark:bg-dark-red-500 text-red-50 dark:text-dark-red-50 hover:bg-red-500/90 dark:hover:bg-dark-red-500/90",
        outline:
          "border border-gray-100 dark:border-dark-gray-100 hover:bg-gray-50 dark:hover:bg-dark-gray-50 hover:text-gray-700 dark:hover:text-dark-gray-700",
        secondary:
          "bg-gray-50 dark:bg-dark-gray-100 text-gray-700 dark:text-dark-gray-700 hover:bg-gray-100 dark:hover:bg-dark-gray-200",
        ghost:
          "hover:bg-gray-50 dark:hover:bg-dark-gray-50 hover:text-gray-700 dark:hover:text-dark-gray-700",
        link: "underline-offset-4 hover:underline text-white dark:text-black",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
