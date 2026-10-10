import React, { useState } from 'react';

/**
 * SafeImage Component
 * Renders an image with graceful error fallback to a specified fallbackSrc or a stylized initials placeholder.
 * Prevents infinite error loops and guarantees accessibility and consistent aspect ratio.
 */
export default function SafeImage({
  src,
  alt = 'Image asset',
  fallbackSrc,
  fallbackInitials,
  fallbackBg = 'var(--bg-surface-subtle)',
  fallbackColor = 'var(--accent-gold)',
  style = {},
  className = '',
  loading = 'lazy',
  objectFit = 'cover',
  aspectRatio,
  onClick,
  ...props
}) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
    }
  };

  // If no source is provided or image failed to load and no fallback image is supplied
  if (!src || (hasError && !fallbackSrc)) {
    if (fallbackInitials) {
      return (
        <div
          className={className}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: fallbackBg,
            color: fallbackColor,
            fontWeight: 800,
            fontSize: '1.25rem',
            fontFamily: 'var(--font-family-display)',
            borderRadius: style.borderRadius || 'var(--radius-md)',
            aspectRatio: aspectRatio,
            width: style.width || '100%',
            height: style.height || '100%',
            ...style,
          }}
          onClick={onClick}
          aria-label={alt}
        >
          {fallbackInitials}
        </div>
      );
    }

    if (fallbackSrc) {
      return (
        <img
          src={fallbackSrc}
          alt={alt}
          loading={loading}
          className={className}
          style={{
            objectFit,
            aspectRatio,
            ...style,
          }}
          onClick={onClick}
          {...props}
        />
      );
    }

    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: fallbackBg,
          color: fallbackColor,
          fontSize: '0.8125rem',
          fontFamily: 'var(--font-family-mono)',
          borderRadius: style.borderRadius || 'var(--radius-md)',
          aspectRatio: aspectRatio,
          width: style.width || '100%',
          height: style.height || '100%',
          ...style,
        }}
        onClick={onClick}
        aria-label={alt}
      >
        <span>{alt || 'Kivora Asset'}</span>
      </div>
    );
  }

  const effectiveSrc = hasError && fallbackSrc ? fallbackSrc : src;

  return (
    <img
      src={effectiveSrc}
      alt={alt}
      loading={loading}
      onError={handleError}
      className={className}
      style={{
        objectFit,
        aspectRatio,
        ...style,
      }}
      onClick={onClick}
      {...props}
    />
  );
}
