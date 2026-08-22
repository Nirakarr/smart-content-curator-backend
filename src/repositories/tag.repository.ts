import { prisma } from "../lib/prisma";

export class TagRepository {
  findAll() {
    return prisma.tag.findMany({ orderBy: { name: "asc" } });
  }
}

export const tagRepository = new TagRepository();
