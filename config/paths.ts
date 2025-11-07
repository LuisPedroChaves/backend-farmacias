import path from 'path';

// Base path for uploads - uses absolute path to avoid issues with working directory
export const UPLOADS_PATH = path.join(process.cwd(), 'uploads');

// Helper function to get upload path for a specific type
export const getUploadPath = (type: string, filename?: string): string => {
    if (filename) {
        return path.join(UPLOADS_PATH, type, filename);
    }
    return path.join(UPLOADS_PATH, type);
};
