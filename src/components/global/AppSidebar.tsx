import { Car, Brain,CalendarClock,FolderPlus ,IdCard,FolderMinus, OctagonX ,UserCheck, Home, ChevronDown, RefreshCw, UserPlus, UserMinus, Share2, Trash2 } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"
import { useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

const items = [
  { 
    title: "Dashboard", 
    url: "/", 
    icon: Home 
  },
  { 
    title: "Acessos", 
    url: "/users", 
    icon: IdCard  
  },
  { 
    title: "Motoristas", 
    url: "/drivers", 
    icon: UserCheck 
  },
    { 
    title: "Rotinas", 
    url: "/routines", 
    icon: CalendarClock 
  },
     { 
    title: "Remoção", 
    url: "/deinstallation", 
    icon: OctagonX  
  },
]

const vehicleSubItems = [
  {
    title: "Atualizar carros",
    url: "/vehicles/update",
    icon: RefreshCw
  },
  {
    title: "Adicionar ao grupo",
    url: "/vehicles/register",
    icon: FolderPlus
  },
  {
    title: "Remover do grupo",
    url: "/vehicles/remove",
    icon: FolderMinus 
  },
  {
    title: "Share de veículos",
    url: "/vehicles/share",
    icon: Share2
  },
  {
    title: "Deletar veículos",
    url: "/vehicles/delete",
    icon: Trash2
  },
]

export function AppSidebar() {
  const { open } = useSidebar()
  const location = useLocation()
  const currentPath = location.pathname
  const [vehicleSubmenuOpen, setVehicleSubmenuOpen] = useState(false)

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/"
    }
    return currentPath.startsWith(path)
  }

  const isVehicleRouteActive = currentPath.startsWith("/veiculos")

  return (
    <Sidebar 
      className="border-r border-sidebar-border bg-sidebar transition-all duration-300"
      collapsible="icon"
    >
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
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
              
              {/* Submenu de Veículos */}
              <SidebarMenuItem>
                <Collapsible 
                  open={vehicleSubmenuOpen || isVehicleRouteActive} 
                  onOpenChange={setVehicleSubmenuOpen}
                >
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className={`
                        w-full transition-all duration-200 rounded-lg
                        ${isVehicleRouteActive 
                          ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm" 
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        }
                      `}
                    >
                      <Car className="w-4 h-4" />
                      <span>Veículos</span>
                      <ChevronDown className={`ml-auto h-4 w-4 transition-transform duration-200 ${
                        vehicleSubmenuOpen || isVehicleRouteActive ? "rotate-180" : ""
                      }`} />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {vehicleSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            asChild
                            className={`
                              transition-all duration-200 rounded-lg
                              ${isActive(subItem.url) 
                                ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm" 
                                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                              }
                            `}
                          >
                            <NavLink to={subItem.url}>
                              <subItem.icon className="w-4 h-4" />
                              <span>{subItem.title}</span>
                            </NavLink>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}