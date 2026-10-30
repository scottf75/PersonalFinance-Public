import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserMenu } from "./UserMenu";

const AppHeader = () => {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center">
        <SidebarTrigger className="mr-2" />
        <h1 className="text-lg font-semibold md:text-xl">MoneyPenny</h1>
      </div>
      <div className="flex items-center gap-4">
        <UserMenu />
      </div>
    </header>
  );
};

export default AppHeader;
