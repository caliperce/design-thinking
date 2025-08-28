import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';


const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.NEXT_PUBLIC_R2_ENDPOINT, // R2 API endpoint
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.NEXT_PUBLIC_R2_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true, // Important for R2 compatibility
});

export default async function handler(
    req,
    res
  ) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  
    try {
      const { filename, contentType } = req.body;
  
      if (!filename || !contentType) {
        return res.status(400).json({ message: 'Filename and content type are required' });
      }
  
      const bucketName = process.env.NEXT_PUBLIC_R2_BUCKET_NAME;
      if (!bucketName) {
        throw new Error("R2_BUCKET_NAME is not set in environment variables.");
      }
  
      // Sanitize the filename to create a safe key
      const fileExtension = filename.split('.').pop();
      const fileNameWithoutExtension = filename.substring(0, filename.lastIndexOf('.')) || filename;
      const sanitizedFilenameBase = fileNameWithoutExtension.replace(/[^a-zA-Z0-9-]/g, '-').replace(/-+/g, '-');
      const finalFilename = `${sanitizedFilenameBase}.${fileExtension}`;
  
      // Create a unique key for the file in the bucket
      const key = `timetables/${Date.now()}-${finalFilename}`;
  
      const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
      });
      
      // Generate the pre-signed URL which is valid for 10 minutes
      const uploadUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 600,
        // Remove checksum requirements that might cause CORS issues
        unhoistableHeaders: new Set(['x-amz-checksum-crc32'])
      });
  
      // The public URL of the file after upload
      const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
  
      res.status(200).json({ uploadUrl, publicUrl });
    } catch (error) {
      console.error('Error creating pre-signed URL:', error);
      res.status(500).json({ message: 'Error creating pre-signed URL' });
    }
  }
