import React, { useState } from 'react';
import { getBrandLogo, handleBrandLogoError, DEFAULT_FALLBACK_BRAND_LOGO } from '../utils/visualAssetHelpers';

/**
 * BrandLogo - Kivora Unified Brand Logo Component
 *
 * Ensures deterministic brand logo resolution, strictly adheres to `object-fit: contain`
 * to protect typographic and emblem aspect ratios, provides clean neutral fallbacks,
 * and maintains seamless visual harmony across Kivora's light-mode aesthetic.
 */
export default function BrandLogo({
  brand,
  brandName,
  logoUrl,
  size,
  width,
  height,
  className = '',
  style = {},
  shape = 'rounded', // 'rounded' | 'circle' | 'square' | 'badge'
  border = true,
  background = '#FFFFFF',
  padding,
  alt,
  title,
}) {
  const [hasError, setHasError] = useState(false);

  // Determine brand name for accessible alt & title
  const resolvedName =
    brand?.company_name ||
    brand?.name ||
    brandName ||
    'Verified Brand';

  // Determine logo source
  const resolvedSrc = hasError
    ? DEFAULT_FALLBACK_BRAND_LOGO
    : logoUrl || getBrandLogo(brand || brandName);

  // Dimension resolution:
  // If width and height are explicitly provided, use them.
  // Otherwise derive from size with ~2.8 ratio for 640x180 vector banners when shape is rounded/badge.
  const resolvedHeight = height || size || 24;
  const resolvedWidth =
    width ||
    (shape === 'circle' || shape === 'square'
      ? resolvedHeight
      : Math.round(resolvedHeight * 2.8));

  const widthPx = typeof resolvedWidth === 'number' ? `${resolvedWidth}px` : resolvedWidth;
  const heightPx = typeof resolvedHeight === 'number' ? `${resolvedHeight}px` : resolvedHeight;

  const borderRadius =
    shape === 'circle'
      ? '50%'
      : shape === 'square'
      ? '0px'
      : typeof resolvedHeight === 'number' && resolvedHeight >= 48
      ? '10px'
      : '6px';

  const resolvedPadding =
    padding !== undefined
      ? padding
      : shape === 'circle'
      ? '2px'
      : '2px 4px';

  const containerStyle = {
    width: widthPx,
    height: heightPx,
    minWidth: widthPx,
    maxWidth: widthPx,
    minHeight: heightPx,
    maxHeight: heightPx,
    borderRadius,
    background,
    border: border ? '1px solid rgba(19, 19, 22, 0.12)' : 'none',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    padding: resolvedPadding,
    flexShrink: 0,
    boxSizing: 'border-box',
    ...style,
  };

  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    display: 'block',
  };

  return (
    <div
      className={`kivora-brand-logo-wrap ${className}`}
      style={containerStyle}
      title={title || resolvedName}
    >
      <img
        src={resolvedSrc}
        alt={alt || `${resolvedName} logo`}
        style={imgStyle}
        loading="lazy"
        onError={(e) => {
          if (!hasError) {
            setHasError(true);
            handleBrandLogoError(e, DEFAULT_FALLBACK_BRAND_LOGO);
          }
        }}
      />
    </div>
  );
}
