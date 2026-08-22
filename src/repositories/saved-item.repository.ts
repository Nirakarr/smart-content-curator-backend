import { prisma } from "../lib/prisma";

export const DEMO_USER_EMAIL = "demo@example.com";

export const itemInclude = {
  metadata: true,
  itemTags: { include: { tag: true } },
} as const;

export type ItemFilters = {
  tag?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export class ItemRepository {
  getDemoUser() {
    return prisma.user.upsert({
      where: { email: DEMO_USER_EMAIL },
      update: {},
      create: { email: DEMO_USER_EMAIL, name: "Demo User" },
    });
  }

  findByUserAndUrl(userId: string, url: string) {
    return prisma.savedItem.findUnique({
      where: { userId_url: { userId, url } },
      include: itemInclude,
    });
  }

  createPending(userId: string, url: string) {
    return prisma.savedItem.create({
      data: { userId, url, title: "", status: "processing" },
    });
  }

  complete(
    itemId: string,
    metadata: {
      title: string;
      description: string | null;
      author: string | null;
      source: string | null;
      imageUrl: string | null;
      publishedAt: Date | null;
      summary: string;
    },
    tagNames: string[],
  ) {
    return prisma.savedItem.update({
      where: { id: itemId },
      data: {
        title: metadata.title,
        source: metadata.source,
        imageUrl: metadata.imageUrl,
        summary: metadata.summary,
        status: "completed",
        metadata: {
          create: {
            title: metadata.title,
            description: metadata.description,
            author: metadata.author,
            siteName: metadata.source,
            imageUrl: metadata.imageUrl,
            publishedAt: metadata.publishedAt,
          },
        },
        itemTags: {
          create: tagNames.map((name) => ({
            tag: {
              connectOrCreate: {
                where: { slug: name },
                create: { name, slug: name },
              },
            },
          })),
        },
      },
      include: itemInclude,
    });
  }

  markFailed(itemId: string, errorMessage: string) {
    return prisma.savedItem.update({
      where: { id: itemId },
      data: { status: "failed", errorMessage },
    });
  }

  findMany(userId: string, filters: ItemFilters) {
    const { tag, search, page = 1, pageSize = 10 } = filters;

    const baseWhere = { userId };
    const filteredWhere = {
      ...baseWhere,
      ...(tag ? { itemTags: { some: { tag: { slug: tag } } } } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { summary: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    return prisma
      .$transaction([
        prisma.savedItem.findMany({
          where: filteredWhere,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * pageSize,
          take: pageSize,
          include: itemInclude,
        }),
        prisma.savedItem.count(),
        prisma.savedItem.count({ where: filteredWhere }),
      ])
      .then(([items, totalCount, filteredCount]) => ({
        items,
        totalCount,
        filteredCount,
        totalPages: Math.ceil(filteredCount / pageSize),
      }));
  }

  findById(userId: string, itemId: string) {
    return prisma.savedItem.findFirst({
      where: { id: itemId, userId },
      include: itemInclude,
    });
  }

  delete(itemId: string) {
    return prisma.savedItem.delete({ where: { id: itemId } });
  }
}

export const itemRepository = new ItemRepository();
