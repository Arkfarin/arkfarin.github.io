import { useI18n } from '@/hooks/useI18n';
import { Hero } from '@/components/home/Hero/Hero';
import { About } from '@/components/home/About/About';
import { Projects } from '@/components/home/Projects/Projects';
import { Contact } from '@/components/home/Contact/Contact';
import { OtherLinks } from '@/components/home/OtherLinks/OtherLinks';
import { usePageMetadata } from '@/hooks/usePageMetadata';
import styles from '@/app/App.module.css';
export function Home() {
  const { t } = useI18n();
  usePageMetadata(t('homeMetaTitle'), t('homeMetaDescription'), '/');
  return (
    <main id="main" className={styles.main} tabIndex={-1}>
      <Hero />
      <About />
      <Projects />
      <OtherLinks />
      <Contact />
    </main>
  );
}
