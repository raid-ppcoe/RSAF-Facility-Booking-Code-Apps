import React from 'react';

interface InteractiveCheckpointProps {
  isCompleted: boolean;
  title: string;
  stepNumber?: number;
  description?: string;
}

/**
 * Component showing a single checkpoint with completion status
 * Displays green checkmark when completed
 */
export const InteractiveCheckpoint: React.FC<InteractiveCheckpointProps> = ({
  isCompleted,
  title,
  stepNumber,
  description,
}) => {
  return (
    <div style={{ ...styles.checkpoint, ...(!isCompleted && styles.checkpointIncomplete) }}>
      <div style={styles.checkmark}>
        {isCompleted && <span style={styles.checkmarkIcon}>✓</span>}
        {!isCompleted && <span style={styles.waitingIcon}>◯</span>}
      </div>
      <div style={styles.content}>
        {stepNumber && <span style={styles.stepNumber}>Step {stepNumber}</span>}
        <p style={styles.title}>{title}</p>
        {description && <p style={styles.description}>{description}</p>}
      </div>
    </div>
  );
};

interface CheckpointContainerProps {
  title: string;
  checkpoints: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    description?: string;
  }>;
  completionPercentage?: number;
}

/**
 * Component grouping multiple checkpoints with overall progress tracking
 */
export const CheckpointContainer: React.FC<CheckpointContainerProps> = ({
  title,
  checkpoints,
  completionPercentage,
}) => {
  const completed = checkpoints.filter((cp) => cp.isCompleted).length;
  const total = checkpoints.length;
  const percentage = completionPercentage ?? Math.round((completed / total) * 100);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.headerTitle}>{title}</h3>
        <span style={styles.progress}>
          {completed}/{total} ({percentage}%)
        </span>
      </div>

      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${percentage}%` }} />
      </div>

      <div style={styles.checkpointsList}>
        {checkpoints.map((checkpoint, index) => (
          <InteractiveCheckpoint
            key={checkpoint.id}
            isCompleted={checkpoint.isCompleted}
            title={checkpoint.title}
            stepNumber={index + 1}
            description={checkpoint.description}
          />
        ))}
      </div>
    </div>
  );
};

const styles = {
  checkpoint: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#E8F5E9',
    borderLeft: '4px solid #4CAF50',
    borderRadius: '4px',
    marginBottom: '8px',
    alignItems: 'flex-start',
  },
  checkpointIncomplete: {
    backgroundColor: '#F5F5F5',
    borderLeftColor: '#BDBDBD',
  },
  checkmark: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    flexShrink: 0,
  },
  checkmarkIcon: {
    fontSize: '16px',
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  waitingIcon: {
    fontSize: '16px',
    color: '#999',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  stepNumber: {
    fontSize: '11px',
    color: '#999',
    fontWeight: 500,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  title: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  description: {
    margin: 0,
    fontSize: '12px',
    color: '#666',
    lineHeight: 1.4,
  },

  // Container styles
  container: {
    backgroundColor: '#fff',
    border: '1px solid #ECEFF1',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  headerTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: 600,
    color: '#333',
  },
  progress: {
    fontSize: '12px',
    color: '#666',
    fontWeight: 500,
  },
  progressBar: {
    height: '6px',
    backgroundColor: '#EEEEEE',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    transition: 'width 0.3s ease',
  },
  checkpointsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0px',
  },
};
