import type { FamilyMember } from "@/types/app";

export type FamilyTreeNode = {
  member: FamilyMember;
  spouse: FamilyMember | null;
  children: FamilyTreeNode[];
  /** 0 for the eldest ancestors, +1 per generation. */
  depth: number;
};

const byBirthThenOrder = (a: FamilyMember, b: FamilyMember) => {
  const aBirth = a.birth_date ?? "9999-12-31";
  const bBirth = b.birth_date ?? "9999-12-31";
  if (aBirth !== bBirth) return aBirth < bBirth ? -1 : 1;
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.full_name.localeCompare(b.full_name);
};

/**
 * Build the blood-line tree from a flat member list.
 * Members whose parent is missing from the list are treated as roots, and a
 * parent cycle degrades to a root instead of looping forever.
 */
export const buildFamilyTree = (members: FamilyMember[]): FamilyTreeNode[] => {
  const byId = new Map(members.map((member) => [member.id, member]));

  const childrenOf = new Map<string, FamilyMember[]>();
  const roots: FamilyMember[] = [];

  members.forEach((member) => {
    const parent = member.parent_id ? byId.get(member.parent_id) : null;
    if (!parent || parent.id === member.id) {
      roots.push(member);
      return;
    }
    const siblings = childrenOf.get(parent.id) ?? [];
    siblings.push(member);
    childrenOf.set(parent.id, siblings);
  });

  const build = (
    member: FamilyMember,
    depth: number,
    ancestors: Set<string>,
  ): FamilyTreeNode => {
    const nextAncestors = new Set(ancestors).add(member.id);
    const spouse = member.spouse_id ? byId.get(member.spouse_id) ?? null : null;

    return {
      member,
      spouse: spouse && spouse.id !== member.id ? spouse : null,
      depth,
      children: (childrenOf.get(member.id) ?? [])
        .filter((child) => !nextAncestors.has(child.id))
        .sort(byBirthThenOrder)
        .map((child) => build(child, depth + 1, nextAncestors)),
    };
  };

  return roots
    .sort(byBirthThenOrder)
    .map((root) => build(root, 0, new Set()));
};

/** Map every member id to its generation index (0 = eldest ancestor). */
export const computeGenerations = (members: FamilyMember[]) => {
  const byId = new Map(members.map((member) => [member.id, member]));
  const depths = new Map<string, number>();
  const visiting = new Set<string>();

  const resolve = (member: FamilyMember): number => {
    const cached = depths.get(member.id);
    if (cached !== undefined) return cached;
    if (visiting.has(member.id)) return 0;

    visiting.add(member.id);
    const parent = member.parent_id ? byId.get(member.parent_id) : null;
    const depth =
      parent && parent.id !== member.id ? resolve(parent) + 1 : 0;
    visiting.delete(member.id);

    depths.set(member.id, depth);
    return depth;
  };

  members.forEach(resolve);
  return depths;
};

/** Flatten a tree back into nodes in depth-first order. */
export const flattenTree = (nodes: FamilyTreeNode[]): FamilyTreeNode[] =>
  nodes.flatMap((node) => [node, ...flattenTree(node.children)]);
