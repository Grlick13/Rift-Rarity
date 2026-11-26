import React, { useEffect, useState } from 'react';
import { Shield } from 'lucide-react';

interface RiftImageProps {
  src?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  imgClassName?: string;
}

export const RiftImage: React.FC<RiftImageProps> = ({
  src,
  fallbackSrc,
  alt,
  className = '',
  imgClassName = 'w-full h-full object-cover',
}) => {
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setCurrentSrc(src);
    setLoaded(false);
    setFailed(!src);
  }, [src]);

  const handleError = () => {
    if (currentSrc && fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setLoaded(false);
    } else {
      setFailed(true);
    }
  };

  return (
    <div className={`relative overflow-hidden bg-[#0e1525] ${className}`}>
      {!loaded && !failed && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#141d31] via-[#0f172a] to-[#0a0f1c] animate-pulse"
          aria-hidden="true"
        />
      )}

      {!failed && currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          className={`${imgClassName} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#151e32] to-[#0b101d] text-[#c8aa6e]/70 p-3 text-center">
          <Shield className="w-7 h-7 mb-1.5 opacity-75" strokeWidth={1.6} />
          <span className="text-[11px] font-medium tracking-wide text-[#a09b8c] line-clamp-2">{alt}</span>
        </div>
      )}
    </div>
  );
};
