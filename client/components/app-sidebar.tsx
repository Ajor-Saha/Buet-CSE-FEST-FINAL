"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AudioWaveform,
  BookOpen,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  GraduationCap,
  Plus,
  MessagesSquare,
} from "lucide-react"


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { TeamSwitcher } from "./team-switcher"
import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavUser } from "./nav-user"
import { useAuth } from "@/components/auth/auth-provider"
import { ChatSheet } from "@/components/chatbot/chat-sheet"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Courses",
      url: "/dashboard",
      icon: GraduationCap,
      isActive: true,
      items: [
        {
          title: "Create Course",
          url: "/dashboard#create",
          icon: Plus,
        },
        {
          title: "Introduction to Computer Science",
          url: "/dashboard/course/1",
        },
        {
          title: "Data Structures and Algorithms",
          url: "/dashboard/course/2",
        },
        {
          title: "Web Development Fundamentals",
          url: "/dashboard/course/3",
        },
        {
          title: "Machine Learning Basics",
          url: "/dashboard/course/4",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const { user, signout } = useAuth()

  const sidebarUser = user
    ? {
        name: user.full_name,
        email: user.email,
        avatar: user.avatar_url || "/avatars/shadcn.jpg",
      }
    : data.user

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarGroup>
          <SidebarGroupLabel>Assistant</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <ChatSheet
                variant="dashboard"
                title="ContextVault RAG Chat"
                description="Static preview. RAG integration coming next."
                contentClassName="sm:max-w-xl"
                trigger={
                  <SidebarMenuButton tooltip="Open chatbot">
                    <MessagesSquare />
                    <span>Open Chatbot</span>
                  </SidebarMenuButton>
                }
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={sidebarUser}
          onLogout={async () => {
            await signout()
            router.push("/auth/signin")
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
