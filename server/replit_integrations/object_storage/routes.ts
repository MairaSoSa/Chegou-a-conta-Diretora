import type { Express, Request, Response, NextFunction } from "express";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

export function registerObjectStorageRoutes(app: Express, adminAuth?: (req: Request, res: Response, next: NextFunction) => void): void {
  const objectStorageService = new ObjectStorageService();

  const uploadMiddleware = adminAuth ? [adminAuth] : [];

  app.post("/api/uploads/request-url", ...uploadMiddleware, async (req: Request, res: Response) => {
    try {
      const { name, size, contentType } = req.body;

      if (!name) {
        return res.status(400).json({
          error: "Missing required field: name",
        });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        metadata: { name, size, contentType },
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get(/^\/objects\/(.+)$/, async (req: Request, res: Response) => {
    try {
      const capturedPath = (req.params as Record<string, string>)[0];
      const objectPath = `/objects/${capturedPath}`;
      const objectFile = await objectStorageService.getObjectEntityFile(objectPath);
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });
}
