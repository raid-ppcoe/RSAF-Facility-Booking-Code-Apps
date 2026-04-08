import React, { useState } from 'react';
import { TutorialProgress } from '../types/tutorialTypes';

interface TutorialProgressBarProps {
  progress: TutorialProgress;
  currentRole: 'user' | 'admin' | 'super_admin';
  onSelectTutorial: (tutorialName: keyof TutorialProgress) => void;
}

/**
 * Component showing overall tutorial progress across all tutorial types
 * Allows role-based selection and displays completion status
 */
export const TutorialProgressBar: React.FC<TutorialProgressBarProps> = ({
  progress,
  currentRole,
  onSelectTutorial,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTutorialsForRole = (role: string) => {
    if (role === 'user') {
      return [{ id: 'userBookingDemo', label: 'User Booking Demo' }];
    }
    if (role === 'admin') {
      return [
        { id: 'adminFacilityBeginner', label: 'Admin: Facility Basics' },
        { id: 'adminFacilityAdvanced', label: 'Admin: Advanced Settings' },
        { id: 'adminFacilityEditing', label: 'Admin: Editing Facilities' },
      ];
    }
    if (role === 'super_admin') {
      return [{ id: 'superAdminFacility', label: 'Super Admin: System Management' }];
    }
    return [];
  };

  const tutorials = getTutorialsForRole(currentRole);

  const completedCount = tutorials.filter((t) => progress[t.id as keyof TutorialProgress]).length;
  const overallProgress = Math.round((completedCount / tutorials.length) * 100);

  return (
    <div style={styles.container}>
      <div style={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div style={styles.headerContent}>
          <h3 style={styles.title}>📚 Tutorial Progress</h3>
          <span style={styles.summary}>
            {completedCount}/{tutorials.length} completed
          </span>
        </div>
        <span style={{ ...styles.expandIcon, transform: isExpanded ? 'rotate(180deg)' : '' }}>
          ▼
        </span>
      </div>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${overallProgress}%` }} />
      </div>

      {isExpanded && (
        <div style={styles.detailsList}>
          {tutorials.map((tutorial) => {
            const isCompleted = progress[tutorial.id as keyof TutorialProgress];
            return (
              <div
                key={tutorial.id}
                style={{
                  ...styles.tutorialItem,
                  ...(!isCompleted && styles.tutorialItemIncomplete),
                }}
              >
                <div style={styles.checkboxArea}>
                  {isCompleted && <span style={styles.completedIcon}>✓</span>}
                  {!isCompleted && <span style={styles.incompleteIcon}>◯</span>}
                </div>
                <span
                  style={{
                    ...styles.tutorialLabel,
                    ...(isCompleted && styles.tutorialLabelCompleted),
                  }}
                >
                  {tutorial.label}
                </span>
                {!isCompleted && (
                  <button
                    style={styles.startButton}
                    onClick={() => onSelectTutorial(tutorial.id as keyof TutorialProgress)}
                  >
                    Start
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#fff',
    border: '1px solid #E0E0E0',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  headerContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  title: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: '#333',
  },
  summary: {
    fontSize: '12px',
    color: '#666',
  },
  expandIcon: {
    fontSize: '12px',
    color: '#999',
    transition: 'transform 0.2s ease',
  },
  progressBar: {
    height: '6px',
    backgroundColor: '#EEEEEE',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '12px',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s ease',
  },
  detailsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #EEEEEE',
  },
  tutorialItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 8px',
    backgroundColor: '#E8F5E9',
    borderRadius: '4px',
  },
  tutorialItemIncomplete: {
    backgroundColor: '#F5F5F5',
  },
  checkboxArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    flexShrink: 0,
  },
  completedIcon: {
    fontSize: '14px',
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  incompleteIcon: {
    fontSize: '14px',
    color: '#BDBDBD',
  },
  tutorialLabel: {
    flex: 1,
    fontSize: '13px',
    color: '#333',
    fontWeight: 500,
  },
  tutorialLabelCompleted: {
    textDecoration: 'line-through',
    color: '#999',
  },
  startButton: {
    backgroundColor: '#2196F3',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};
