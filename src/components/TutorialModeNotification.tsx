import React, { useState } from 'react';

interface TutorialModeNotificationProps {
  onDisable: () => void;
  isVisible: boolean;
}

/**
 * Yellow notification banner displayed at the top when tutorial mode is active
 * Shows user that they're in tutorial mode and can disable it
 */
export const TutorialModeNotification: React.FC<TutorialModeNotificationProps> = ({
  onDisable,
  isVisible,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (!isVisible || dismissed) return null;

  return (
    <div style={styles.notificationBar}>
      <div style={styles.content}>
        <span style={styles.icon}>ℹ️</span>
        <div style={styles.textContainer}>
          <strong style={styles.title}>Tutorial Mode Enabled</strong>
          <p style={styles.description}>
            This is a guided learning experience. Facility and booking changes are not saved to the database.
          </p>
        </div>
      </div>
      <div style={styles.actions}>
        <button
          style={styles.dismissButton}
          onClick={() => setDismissed(true)}
          title="Dismiss this notification"
        >
          ✕
        </button>
        <button style={styles.exitButton} onClick={onDisable}>
          Exit Tutorial Mode
        </button>
      </div>
    </div>
  );
};

const styles = {
  notificationBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    borderBottom: '2px solid #FFA000',
    padding: '12px 20px',
    gap: '16px',
  },
  content: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    flex: 1,
  },
  icon: {
    fontSize: '18px',
    marginTop: '2px',
    flexShrink: 0,
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  title: {
    fontSize: '14px',
    color: '#333',
    margin: 0,
    fontWeight: 600,
  },
  description: {
    fontSize: '13px',
    color: '#555',
    margin: 0,
    lineHeight: 1.3,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexShrink: 0,
  },
  dismissButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '0 4px',
    color: '#333',
    transition: 'opacity 0.2s',
  },
  exitButton: {
    backgroundColor: '#D32F2F',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};
