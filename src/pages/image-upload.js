import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ImageUploadDemo } from '../components/image-upload';
import Prism from '../components/Prism/Prism';


const ImageUploadPage = () => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({});

  useEffect(() => {
    // Get the URL parameters when the page loads
    const { userId, userEmail, userName } = router.query;
    
    if (userId && userEmail && userName) {
      setUserInfo({
        userId,
        userEmail: decodeURIComponent(userEmail), // Decode the email
        userName
      });
    }
  }, [router.query]);

  return (
    <div style={{ width: '100%', height: '600px', position: 'relative' }}>
        <div className="absolute inset-0 flex justify-center items-center z-10 bg-black/50">
            <ImageUploadDemo />
        </div>


          {/* Your image upload component */}
    <Prism
    animationType="rotate"
    timeScale={0.5}
    height={3.5}
    baseWidth={5.5}
    scale={3.6}
    hueShift={0}
    colorFrequency={1}
    noise={0}
    glow={1}
  />
        </div>
  );
};

export default ImageUploadPage;
