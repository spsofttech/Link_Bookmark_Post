import type { Metadata } from "next";
import ComprehensiveAdminSuite from "@/components/admin/ComprehensiveAdminSuite";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Admin Control Suite | Save Content`,
  };
}

export default function AdminSuitePage() {
  return (
    <div className="flex flex-col gap-6 p-2">
      <ComprehensiveAdminSuite />
    </div>
  );
}
