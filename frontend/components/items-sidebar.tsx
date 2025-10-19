import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Header from "@/components/header";
import { SelectedItemsList } from "@/components/selected-items-list";
import { SidebarFooterContent } from "@/components/sidebar-footer-content";

export function ItemsSidebar() {
  return (
    <Sidebar side="right">
      <SidebarHeader className="flex flex-row items-center justify-center">
        <Header showSidebarTrigger={false} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SelectedItemsList />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterContent />
      </SidebarFooter>
    </Sidebar>
  );
}
