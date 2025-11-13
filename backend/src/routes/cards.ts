import { Hono } from "hono";
import { services } from "../services.js";

const app = new Hono();

app.get("/", async (context) => {
  try {
    const limitParam = context.req.query("limit");
    const offsetParam = context.req.query("offset");
    const minValueParam = context.req.query("minValue");
    const maxValueParam = context.req.query("maxValue");

    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    const offset = offsetParam ? parseInt(offsetParam, 10) : 0;

    if (isNaN(limit) || limit <= 0 || limit > 1000) {
      return context.json({ success: false, error: "Invalid limit parameter. Must be between 1 and 1000" }, 400);
    }

    if (isNaN(offset) || offset < 0) {
      return context.json({ success: false, error: "Invalid offset parameter. Must be >= 0" }, 400);
    }

    let cards;
    let hasFilters = false;

    if (minValueParam || maxValueParam) {
      const minValue = minValueParam ? parseFloat(minValueParam) : null;
      const maxValue = maxValueParam ? parseFloat(maxValueParam) : null;

      if ((minValue !== null && isNaN(minValue)) || (maxValue !== null && isNaN(maxValue))) {
        return context.json({ success: false, error: "Invalid value parameters. Must be valid numbers" }, 400);
      }

      if (minValue !== null && maxValue !== null && minValue > maxValue) {
        return context.json({ success: false, error: "minValue cannot be greater than maxValue" }, 400);
      }

      cards = await services.cardsService.getAllWithFilters(minValue, maxValue, limit, offset);
      hasFilters = true;
    } else {
      cards = await services.cardsService.getAllByLimit(limit, offset);
    }

    const totalCount = await services.cardsService.getCount();

    return context.json({
      success: true,
      data: cards,
      pagination: {
        limit,
        offset,
        total: totalCount,
        hasMore: offset + limit < totalCount,
      },
      filters: hasFilters
        ? {
            minValue: minValueParam ? parseFloat(minValueParam) : null,
            maxValue: maxValueParam ? parseFloat(maxValueParam) : null,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching cards:", error);
    return context.json({ success: false, error: "Failed to fetch cards", details: error instanceof Error ? error.message : String(error) }, 500);
  }
});

export default app;
