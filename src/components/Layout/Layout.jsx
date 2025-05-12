// src/components/Layout/Layout.jsx
import styles from './Layout.module.css';
import Header from './Header';
import FolderSidebar from '../Sidebar/FolderSidebar';

export default function Layout({
  children,
  session,
  currentView,
  setCurrentView,
  folders,
  folderProps,
}) {
  return (
    <div className={styles.appRoot}>
      <Header session={session} />
      <div className={styles.layoutWrapper}>
        <FolderSidebar
          currentView={currentView}
          onSelect={setCurrentView}
          folders={folders}
          {...folderProps}
        />
        <main className={styles.main}>
          <div className={styles.content}>{children}</div>
        </main>
      </div>
    </div>
  );
}
