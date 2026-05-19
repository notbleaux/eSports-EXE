import type { FC, ReactNode, ComponentType } from 'react';

interface Category {
  id: string;
  name: string;
  icon: ComponentType;
  items: number;
  color: string;
}

interface DirectoryListProps {
  children?: ReactNode;
  categories: Category[];
  activeCategory: Category | null;
  onCategorySelect: (category: Category | null) => void;
  hubColor?: string;
  hubGlow?: string;
}

declare const DirectoryList: FC<DirectoryListProps>;
export default DirectoryList;
