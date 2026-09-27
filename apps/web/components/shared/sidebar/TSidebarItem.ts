export interface TSidebarItem {
  name: string;
  icon: React.ReactElement;
  path: string;
  count?: number | string;
  right?: React.ReactNode;
}

