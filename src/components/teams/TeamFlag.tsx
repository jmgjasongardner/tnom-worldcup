import { useState } from 'react';
import { getFlagUrl } from '../../data/countryFlags';

interface TeamFlagProps {
  teamId: string;
  flagEmoji: string;
  country: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_PX: Record<string, number> = { sm: 20, md: 28, lg: 40 };
const CDN_WIDTH: Record<string, 20 | 40 | 80> = { sm: 20, md: 40, lg: 80 };

export function TeamFlag({ teamId, flagEmoji, country, size = 'md' }: TeamFlagProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const px = SIZE_PX[size];
  const url = getFlagUrl(teamId, CDN_WIDTH[size]);

  if (!url || imgFailed) {
    return (
      <span
        role="img"
        aria-label={`${country} flag`}
        style={{ fontSize: size === 'lg' ? '2rem' : size === 'md' ? '1.5rem' : '1.1rem', lineHeight: 1 }}
      >
        {flagEmoji}
      </span>
    );
  }

  return (
    <img
      src={url}
      alt={`${country} flag`}
      width={px}
      height={Math.round(px * 0.67)}
      style={{
        display: 'inline-block',
        borderRadius: '2px',
        objectFit: 'cover',
        verticalAlign: 'middle',
        flexShrink: 0,
      }}
      onError={() => setImgFailed(true)}
    />
  );
}
