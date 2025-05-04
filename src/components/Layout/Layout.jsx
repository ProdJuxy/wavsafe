import styles from './Layout.module.css';
import Header from './Header';
import FolderSidebar from '../Sidebar/FolderSidebar';

export default function Layout({ children, session, currentView, setCurrentView }) {
  return (
    <>
      <Header session={session} />
      <div className={styles.layoutWrapper}>
        <FolderSidebar currentView={currentView} onSelect={setCurrentView} />
        <main className={styles.main}>
          <div className={styles.content}>{children}</div>
        </main>
      </div>
    </>
  );
}
