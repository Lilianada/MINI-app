import { Minimize } from "lucide-react";
import { IssueDialog } from "./issue-dialog";
import { ModeToggle } from "./mode-toggle";

export function Footer() {
  return (
    <footer className="border-t py-3 mt-2">
      <div className="  mx-auto px-4 flex justify-between items-center">
        {/* <div className="flex items-center gap-4">
        </div> */}
          <ModeToggle />
        <span className=" block text-sm">Built for simplicity.</span>
        {/* <div className="hidden md:block">
          <IssueDialog />
        </div> */}
      </div>
    </footer>
  );
}
