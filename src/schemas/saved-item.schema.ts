import { z, ZodObject } from "zod";
import { Request, Response, NextFunction } from "express";

export const createItemSchema = z.object({
  body: z.object({
    url: z.string().url("Must be a valid URL"),
  }),
});

export const queryItemsSchema = z.object({
  query: z.object({
    tag: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const itemIdSchema = z.object({
  params: z.object({
    id: z.string().uuid("Must be a valid item ID"),
  }),
});

export type CreateItemRequest = z.infer<typeof createItemSchema>;
export type QueryItemsRequest = z.infer<typeof queryItemsSchema>;

export const validate = (schema: ZodObject<any>) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        });
        return;
      }

      res
        .status(500)
        .json({ error: "Internal server error during validation" });
    }
  };
};
