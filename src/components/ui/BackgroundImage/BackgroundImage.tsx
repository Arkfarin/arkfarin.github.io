import { useState } from 'react';
import styles from './BackgroundImage.module.css';

export function BackgroundImage({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <picture className={styles.background}>
      <img
        className={styles.image}
        src={src}
        alt=""
        aria-hidden="true"
        draggable={false}
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </picture>
  );
}
