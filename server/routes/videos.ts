/**
 * Videos API Routes
 *
 * CRUD operations for user's saved videos.
 * Videos are stored in MongoDB with user association.
 */

import { Router, Request, Response } from "express";
import { ObjectId, Collection } from "mongodb";
import { getDb } from "../db/mongodb";

const router = Router();

// ============================================
// TYPE DEFINITIONS
// ============================================

interface VideoDocument {
  _id?: ObjectId;
  userId: string;
  quoteText: string;
  authorText: string;
  templateId: string;
  templateName: string;
  thumbnail?: string;
  videoUrl?: string;
  // Style parameters for consistent regeneration
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  boxOpacity?: number;
  canvasWidth?: number;
  canvasHeight?: number;
  // Download tracking
  downloadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getVideosCollection = async (): Promise<Collection<VideoDocument>> => {
  const db = await getDb();
  return db.collection<VideoDocument>("videos");
};

// ============================================
// ROUTES
// ============================================

/**
 * GET /api/videos
 * Get all videos for the authenticated user
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const collection = await getVideosCollection();
    const videos = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    res.json({
      success: true,
      data: videos.map((v) => ({
        id: v._id?.toString(),
        quoteText: v.quoteText,
        authorText: v.authorText,
        templateId: v.templateId,
        templateName: v.templateName,
        thumbnail: v.thumbnail,
        videoUrl: v.videoUrl,
        createdAt: v.createdAt.getTime(),
        updatedAt: v.updatedAt.getTime(),
      })),
    });
  } catch (error) {
    console.error("[Videos] GET error:", error);
    res.status(500).json({ error: "Failed to fetch videos" });
  }
});

/**
 * GET /api/videos/stats/summary
 * Get video statistics - MUST be before /:id routes
 */
router.get("/stats/summary", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const collection = await getVideosCollection();

    const totalCount = await collection.countDocuments({ userId });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await collection.countDocuments({
      userId,
      createdAt: { $gte: today },
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCount = await collection.countDocuments({
      userId,
      createdAt: { $gte: weekAgo },
    });

    const downloadAgg = await collection
      .aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ["$downloadCount", 0] } },
          },
        },
      ])
      .toArray();
    const downloadCount = downloadAgg[0]?.total || 0;

    const templateAgg = await collection
      .aggregate([
        { $match: { userId } },
        {
          $project: {
            template: {
              $ifNull: [
                "$templateName",
                { $ifNull: ["$templateId", "Không rõ"] },
              ],
            },
          },
        },
        { $match: { template: { $nin: [null, ""] } } },
        { $group: { _id: "$template", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ])
      .toArray();
    const favoriteTemplate = templateAgg[0]?._id || null;

    res.json({
      success: true,
      data: {
        total: totalCount,
        today: todayCount,
        thisWeek: weekCount,
        downloadCount,
        favoriteTemplate,
      },
    });
  } catch (error) {
    console.error("[Videos] Stats error:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

/**
 * POST /api/videos/download/:id
 * Increment download count - MUST be before /:id routes
 */
router.post("/download/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const videoId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!ObjectId.isValid(videoId)) {
      return res.status(400).json({ error: "Invalid video ID" });
    }

    const collection = await getVideosCollection();
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(videoId), userId },
      { $inc: { downloadCount: 1 }, $set: { updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({
      success: true,
      downloadCount: result.downloadCount || 1,
    });
  } catch (error) {
    console.error("[Videos] Download count error:", error);
    res.status(500).json({ error: "Failed to update download count" });
  }
});

/**
 * GET /api/videos/:id
 * Get a single video by ID
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const videoId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!ObjectId.isValid(videoId)) {
      return res.status(400).json({ error: "Invalid video ID" });
    }

    const collection = await getVideosCollection();
    const video = await collection.findOne({
      _id: new ObjectId(videoId),
      userId,
    });

    if (!video) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({
      success: true,
      data: {
        id: video._id?.toString(),
        quoteText: video.quoteText,
        authorText: video.authorText,
        templateId: video.templateId,
        templateName: video.templateName,
        thumbnail: video.thumbnail,
        videoUrl: video.videoUrl,
        createdAt: video.createdAt.getTime(),
        updatedAt: video.updatedAt.getTime(),
      },
    });
  } catch (error) {
    console.error("[Videos] GET by ID error:", error);
    res.status(500).json({ error: "Failed to fetch video" });
  }
});

/**
 * POST /api/videos
 * Create a new video record
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      quoteText,
      authorText,
      templateId,
      templateName,
      thumbnail,
      videoUrl,
      fontSize,
      fontFamily,
      textColor,
      boxOpacity,
      canvasWidth,
      canvasHeight,
    } = req.body;

    if (!quoteText) {
      return res.status(400).json({ error: "quoteText is required" });
    }

    const now = new Date();
    const videoDoc: VideoDocument = {
      userId,
      quoteText,
      authorText: authorText || "",
      templateId: templateId || "default",
      templateName: templateName || "Default",
      thumbnail: thumbnail || "",
      videoUrl: videoUrl || "",
      fontSize: fontSize || 48,
      fontFamily: fontFamily || "Inter",
      textColor: textColor || "#FFFFFF",
      boxOpacity: boxOpacity ?? 0.3,
      canvasWidth: canvasWidth || 1080,
      canvasHeight: canvasHeight || 1920,
      createdAt: now,
      updatedAt: now,
    };

    const collection = await getVideosCollection();
    const result = await collection.insertOne(videoDoc);

    res.status(201).json({
      success: true,
      data: {
        id: result.insertedId.toString(),
        ...videoDoc,
        createdAt: now.getTime(),
        updatedAt: now.getTime(),
      },
    });
  } catch (error) {
    console.error("[Videos] POST error:", error);
    res.status(500).json({ error: "Failed to create video" });
  }
});

/**
 * PUT /api/videos/:id
 * Update a video record
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const videoId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!ObjectId.isValid(videoId)) {
      return res.status(400).json({ error: "Invalid video ID" });
    }

    const {
      quoteText,
      authorText,
      templateId,
      templateName,
      thumbnail,
      videoUrl,
    } = req.body;

    const updateFields: Partial<VideoDocument> = {
      updatedAt: new Date(),
    };

    if (quoteText !== undefined) updateFields.quoteText = quoteText;
    if (authorText !== undefined) updateFields.authorText = authorText;
    if (templateId !== undefined) updateFields.templateId = templateId;
    if (templateName !== undefined) updateFields.templateName = templateName;
    if (thumbnail !== undefined) updateFields.thumbnail = thumbnail;
    if (videoUrl !== undefined) updateFields.videoUrl = videoUrl;

    const collection = await getVideosCollection();
    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(videoId), userId },
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({
      success: true,
      data: {
        id: result._id?.toString(),
        quoteText: result.quoteText,
        authorText: result.authorText,
        templateId: result.templateId,
        templateName: result.templateName,
        thumbnail: result.thumbnail,
        videoUrl: result.videoUrl,
        createdAt: result.createdAt.getTime(),
        updatedAt: result.updatedAt.getTime(),
      },
    });
  } catch (error) {
    console.error("[Videos] PUT error:", error);
    res.status(500).json({ error: "Failed to update video" });
  }
});

/**
 * DELETE /api/videos/:id
 * Delete a video record
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const videoId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!ObjectId.isValid(videoId)) {
      return res.status(400).json({ error: "Invalid video ID" });
    }

    const collection = await getVideosCollection();
    const result = await collection.deleteOne({
      _id: new ObjectId(videoId),
      userId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("[Videos] DELETE error:", error);
    res.status(500).json({ error: "Failed to delete video" });
  }
});

export default router;
