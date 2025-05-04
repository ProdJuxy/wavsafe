import styles from './Header.module.css';
import lockBack from '../../assets/wavsafe-back.png';
import lockMelt from '../../assets/wavsafe-melt.png';
import { supabase } from '../../supabaseClient';

export default function Header({ session }) {
  const avatarUrl = session?.user?.user_metadata?.avatar_url;

  return (
    <div className={styles.header}>
      <div className={styles.brandGroup}>
        <div className={styles.logoWrapper}>
          <div
            className={styles.logoBack}
            style={{
              WebkitMaskImage: `url(${lockBack})`,
              maskImage: `url(${lockBack})`,
            }}
          />
          <div
            className={styles.logoFront}
            style={{
              WebkitMaskImage: `url(${lockMelt})`,
              maskImage: `url(${lockMelt})`,
            }}
            onMouseEnter={(e) => e.currentTarget.style.animation = 'liquidWave 2s linear infinite'}
            onMouseLeave={(e) => e.currentTarget.style.animation = 'liquidWave 6s linear infinite'}
          />
        </div>
        <h1 className={styles.title}>WAVSAFE</h1>
      </div>

      <div className={styles.userSection}>
        {avatarUrl && <img src={avatarUrl} alt="Profile" className={styles.avatar} />}
        <span className={styles.email}>{session?.user?.email}</span>
        <button className={styles.logoutButton} onClick={() => supabase.auth.signOut()}>
          Log Out
        </button>
      </div>
    </div>
  );
}
