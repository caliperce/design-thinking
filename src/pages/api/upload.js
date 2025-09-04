import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import formidable from 'formidable';
import fs from 'fs';

const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
});

// Disable Next.js body parsing for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    try {
      // Parse the multipart form data
      const form = formidable({
        maxFileSize: 10 * 1024 * 1024, // 10MB limit
      });
      
      const [fields, files] = await form.parse(req);
      const file = files.file?.[0];
      
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
      if (!bucketName) {
        throw new Error("R2_BUCKET_NAME is not set in environment variables.");
      }

      // Read the file
      const fileBuffer = fs.readFileSync(file.filepath);
      
      // Sanitize the filename
      const originalName = file.originalFilename || 'unknown';
      const fileExtension = originalName.split('.').pop();
      const fileNameWithoutExtension = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
      const sanitizedFilenameBase = fileNameWithoutExtension.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-');
      const finalFilename = `${sanitizedFilenameBase}.${fileExtension}`;
      
      // Create a unique key for the file in the bucket
      const key = `uploads/${Date.now()}-${finalFilename}`;

      // Upload directly to R2
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      // Clean up temp file
      fs.unlinkSync(file.filepath);

      // The public URL of the uploaded file
      const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;

      res.status(200).json({ 
        success: true, 
        publicUrl,
        key,
        size: file.size,
        type: file.mimetype
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ message: 'Error uploading file' });
    }
}
