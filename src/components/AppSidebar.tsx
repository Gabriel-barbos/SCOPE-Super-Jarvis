import { Car, Users, UserCheck, Home } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

const items = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: Home 
  },
  { 
    title: "Veículos", 
    url: "/veiculos", 
    icon: Car 
  },
  { 
    title: "Usuários", 
    url: "/usuarios", 
    icon: Users 
  },
  { 
    title: "Motoristas", 
    url: "/motoristas", 
    icon: UserCheck 
  },
]

export function AppSidebar() {
  const { open } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/"
    }
    return currentPath.startsWith(path)
  }

  return (
    <Sidebar 
      className="border-r border-sidebar-border bg-sidebar transition-all duration-300"
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Car className="w-4 h-4 text-white" />
            </div>
            {open && (
              <div className="text-sidebar-foreground font-semibold">
                Jarvis API - Scope
              </div>
            )}
          </div>
        </div>

        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs font-medium uppercase tracking-wider mb-2">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`
                      w-full transition-all duration-200 rounded-lg
                      ${isActive(item.url) 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }
                    `}
                  >
                    <NavLink to={item.url} end={item.url === "/"}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}