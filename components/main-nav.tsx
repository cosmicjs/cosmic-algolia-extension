/* eslint-disable @next/next/no-img-element */
import { NavItem } from "@/types/nav"

interface MainNavProps {
  items?: NavItem[]
}

export function MainNav({ items }: MainNavProps) {
  return (
    <div className="flex gap-6 md:gap-10">
      <img
        alt="Algolia logo"
        src="https://imgix.cosmicjs.com/cec9cdd0-265d-11ee-a19d-717742939f83-Algolia-logo-blue.png?w=300&auto=compression,format"
        className="h-[30px]"
      />
    </div>
  )
}
