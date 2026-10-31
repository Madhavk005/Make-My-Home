import { categoryHref } from "./categories";
import type { CategoryNode } from "./types";

export type NavNode = {
  id: string;
  name: string;
  href: string;
  productCount: number;
  children: NavNode[];
};

export function toNavNodes(nodes: CategoryNode[]): NavNode[] {
  return nodes.map((node) => ({
    id: node._id,
    name: node.name,
    href: categoryHref(node.path),
    productCount: node.productCount,
    children: toNavNodes(node.children),
  }));
}
