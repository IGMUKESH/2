import React, { useRef, useEffect, useState } from 'react';
import { BrandingConfig } from '../types';
import { User } from 'lucide-react';
import { motion } from 'framer-motion';

interface BrandingOverlayProps {
  branding?: BrandingConfig;
  userData: { displayName?: string, phoneNumber?: string, photoURL?: string } | null;
  isMobile?: boolean;
  isVideo?: boolean;
  onUpdate?: (updates: Partial<BrandingConfig>) => void;
  width?: number;
  height?: number;
}

export const BrandingOverlay: React.FC<BrandingOverlayProps> = ({ branding, userData, isMobile = false, isVideo = false, onUpdate, width, height }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (width) {
        setScale(width / 400);
      } else if (containerRef.current && containerRef.current.parentElement) {
        const parentWidth = containerRef.current.parentElement.offsetWidth;
        // Match the canvas scaling logic: scale = canvas.width / 400
        setScale(parentWidth / 400);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [width]);

  if (!branding) return null;

  const scaledImageSize = branding.imageSize * scale;
  const scaledTextSize = branding.textSize * scale;
  const scaledPadding = 12 * scale; // 0.75rem * scale
  const scaledGap = 12 * scale; // 0.75rem * scale
  const scaledBorderRadius = 24 * scale; // 1.5rem * scale

  const getPositionStyle = (type: 'image' | 'text' | 'container') => {
    if (branding.position === 'custom') {
      if (type === 'image') return { left: `${branding.imageX}%`, top: `${branding.imageY}%` };
      if (type === 'text') return { left: `${branding.textX}%`, top: `${branding.textY}%` };
    }
    
    if (type === 'container') {
      const margin = 28 * scale; // Match canvas margin
      switch (branding.position) {
        case 'top-left': return { top: margin, left: margin };
        case 'top-right': return { top: margin, right: margin };
        case 'bottom-left': return { bottom: margin, left: margin };
        case 'bottom-right': return { bottom: margin, right: margin };
        case 'top-center': return { top: margin, left: '50%', transform: 'translateX(-50%)' };
        case 'bottom-center': return { bottom: margin, left: '50%', transform: 'translateX(-50%)' };
        default: return { bottom: margin, left: '50%', transform: 'translateX(-50%)' };
      }
    }
    return {};
  };

  const handleDragEnd = (type: 'image' | 'text', event: any, info: any) => {
    if (!onUpdate || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const elementRef = type === 'image' ? imageRef : textRef;
    
    if (!elementRef.current) return;
    
    const elementRect = elementRef.current.getBoundingClientRect();
    
    const centerX = elementRect.left + elementRect.width / 2;
    const centerY = elementRect.top + elementRect.height / 2;
    
    // Calculate the new position as a percentage of the container
    const x = Number((((centerX - containerRect.left) / containerRect.width) * 100).toFixed(2));
    const y = Number((((centerY - containerRect.top) / containerRect.height) * 100).toFixed(2));
    
    // Constrain to 0-100
    const constrainedX = Math.max(0, Math.min(100, x));
    const constrainedY = Math.max(0, Math.min(100, y));
    
    if (type === 'image') {
      onUpdate({ imageX: constrainedX, imageY: constrainedY });
    } else {
      onUpdate({ textX: constrainedX, textY: constrainedY });
    }
  };

  const getImageStyleClasses = () => {
    switch (branding.imageStyle) {
      case 'circle': return 'rounded-full';
      case 'square': return 'rounded-none';
      case 'rounded': return 'rounded-2xl';
      case 'hexagon': return 'clip-hexagon';
      case 'star': return 'clip-star';
      case 'diamond': return 'clip-diamond';
      case 'shield': return 'clip-shield';
      default: return 'rounded-full';
    }
  };

  const getAnimationClass = () => {
    if (!isVideo) return '';
    switch (branding.animationType) {
      case 'slide-left': return 'animate-slide-left';
      case 'slide-right': return 'animate-slide-right';
      case 'slide-top': return 'animate-slide-top';
      case 'slide-bottom': return 'animate-slide-bottom';
      default: return '';
    }
  };

  if (branding.position === 'custom') {
    return (
      <div ref={containerRef} className="absolute inset-0 z-20 pointer-events-none">
        {/* Image Component */}
        <motion.div 
          key={`image-${branding.imageX}-${branding.imageY}`}
          ref={imageRef}
          drag={!!onUpdate}
          dragMomentum={false}
          dragElastic={0}
          dragConstraints={containerRef}
          onDragEnd={(e, info) => handleDragEnd('image', e, info)}
          className={`absolute ${getImageStyleClasses()} ${getAnimationClass()} overflow-hidden shadow-2xl flex items-center justify-center cursor-move transition-shadow`}
          style={{ 
            left: `${branding.imageX}%`,
            top: `${branding.imageY}%`,
            width: `${scaledImageSize}px`,
            height: `${scaledImageSize}px`,
            backgroundColor: branding.showBackground ? branding.backgroundColor : 'transparent',
            opacity: branding.opacity,
            pointerEvents: 'auto',
            animationDuration: branding.animationDuration ? `${branding.animationDuration}s` : '2s',
            x: "-50%",
            y: "-50%"
          }}
        >
          {userData?.photoURL ? (
            <img src={userData.photoURL} alt="User" className="w-full h-full object-cover pointer-events-none" referrerPolicy="no-referrer" />
          ) : (
            <User size={scaledImageSize * 0.5} style={{ color: branding.textColor }} />
          )}
        </motion.div>

        {/* Text Component */}
        {(branding.showName || branding.showPhone) && (
          <motion.div 
            key={`text-${branding.textX}-${branding.textY}`}
            ref={textRef}
            drag={!!onUpdate}
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={containerRef}
            onDragEnd={(e, info) => handleDragEnd('text', e, info)}
            className={`absolute flex flex-col items-center text-center justify-center cursor-move`}
            style={{ 
              left: `${branding.textX}%`,
              top: `${branding.textY}%`,
              backgroundColor: 'transparent',
              color: branding.textColor,
              opacity: branding.opacity,
              pointerEvents: 'auto',
              WebkitTextStroke: branding.textOutlineColor ? `${2 * scale}px ${branding.textOutlineColor}` : undefined,
              x: "-50%",
              y: "-50%"
            }}
          >
            {branding.showName && (
              <span 
                className="font-black uppercase tracking-tighter truncate pointer-events-none"
                style={{ fontSize: `${scaledTextSize}px`, maxWidth: `${300 * scale}px` }}
              >
                {userData?.displayName || 'User'}
              </span>
            )}
            {branding.showPhone && userData?.phoneNumber && (
              <span 
                className="font-bold opacity-80 tracking-widest pointer-events-none"
                style={{ fontSize: `${scaledTextSize * 0.6}px` }}
              >
                {userData.phoneNumber}
              </span>
            )}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 z-20 pointer-events-none`}
    >
      <div
        className={`absolute flex ${branding.layout === 'vertical' ? 'flex-col' : 'flex-row'} items-center shadow-2xl transition-all duration-300 pointer-events-auto`}
        style={{ 
          ...getPositionStyle('container'),
          gap: `${scaledGap}px`,
          padding: `${scaledPadding}px`,
          borderRadius: `${scaledBorderRadius}px`,
          backgroundColor: branding.showBackground ? branding.backgroundColor : 'transparent',
          color: branding.textColor,
          opacity: branding.opacity
        }}
      >
        <div 
          className={`${getImageStyleClasses()} overflow-hidden shrink-0 shadow-inner flex items-center justify-center`}
          style={{ width: `${scaledImageSize}px`, height: `${scaledImageSize}px` }}
        >
          {userData?.photoURL ? (
            <img src={userData.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User size={scaledImageSize * 0.5} />
          )}
        </div>
        
        {(branding.showName || branding.showPhone) && (
          <div className={`flex flex-col ${branding.layout === 'vertical' ? 'items-center text-center' : 'items-start text-left'} justify-center overflow-hidden`}>
            {branding.showName && (
              <span 
                className="font-black uppercase tracking-tighter truncate"
                style={{ 
                  fontSize: `${scaledTextSize}px`, 
                  maxWidth: `${200 * scale}px`,
                  WebkitTextStroke: branding.textOutlineColor ? `${2 * scale}px ${branding.textOutlineColor}` : undefined
                }}
              >
                {userData?.displayName || 'User'}
              </span>
            )}
            {branding.showPhone && userData?.phoneNumber && (
              <span 
                className="font-bold opacity-80 tracking-widest"
                style={{ 
                  fontSize: `${scaledTextSize * 0.6}px`,
                  WebkitTextStroke: branding.textOutlineColor ? `${2 * scale}px ${branding.textOutlineColor}` : undefined
                }}
              >
                {userData.phoneNumber}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
