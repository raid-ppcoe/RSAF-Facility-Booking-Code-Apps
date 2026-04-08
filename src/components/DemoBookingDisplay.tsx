import React from 'react';
import { DemoBooking } from '../types/tutorialTypes';

interface DemoBookingDisplayProps {
  booking: DemoBooking | null;
  isVisible: boolean;
  onViewDashboard: () => void;
  onCreateAnother: () => void;
  onNextStep: () => void;
}

/**
 * Component to display the result of a demo booking creation
 * Shows confirmation details without persisting to Dataverse
 */
export const DemoBookingDisplay: React.FC<DemoBookingDisplayProps> = ({
  booking,
  isVisible,
  onViewDashboard,
  onCreateAnother,
  onNextStep,
}) => {
  if (!isVisible || !booking) return null;

  return (
    <div className="demo-booking-display">
      <div className="demo-booking-modal" style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>✓ Demo Booking Created Successfully</h2>
          <p style={styles.subtitle}>Tutorial Mode - Not saved to Dataverse</p>
        </div>

        <div style={styles.content}>
          <div style={styles.detailsGrid}>
            <div style={styles.detailItem}>
              <label style={styles.label}>Facility</label>
              <p style={styles.value}>{booking.facilityName}</p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.label}>Date</label>
              <p style={styles.value}>{booking.date}</p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.label}>Time</label>
              <p style={styles.value}>
                {booking.startTime} - {booking.endTime}
              </p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.label}>Purpose</label>
              <p style={styles.value}>{booking.purpose}</p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.label}>Status</label>
              <p style={{ ...styles.value, color: '#4CAF50' }}>{booking.status}</p>
            </div>

            <div style={styles.detailItem}>
              <label style={styles.label}>Demo Booking ID</label>
              <p style={styles.idValue}>{booking.id}</p>
            </div>
          </div>

          <div style={styles.warningBox}>
            <strong>⚠️ Remember:</strong> This booking is for demonstration purposes only. It will not appear
            in the Dataverse database or affect real facility bookings.
          </div>
        </div>

        <div style={styles.actions}>
          <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={onViewDashboard}>
            View Dashboard
          </button>
          <button style={{ ...styles.button, ...styles.buttonSecondary }} onClick={onCreateAnother}>
            Create Another
          </button>
          <button style={{ ...styles.button, ...styles.buttonPrimary }} onClick={onNextStep}>
            Next Tutorial Step
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  modal: {
    position: 'fixed' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#fff',
    border: '2px solid #4CAF50',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '500px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
  },
  header: {
    marginBottom: '20px',
    borderBottom: '1px solid #eee',
    paddingBottom: '16px',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '18px',
    fontWeight: 600,
    color: '#333',
  },
  subtitle: {
    margin: 0,
    fontSize: '12px',
    color: '#FF9800',
    fontWeight: 500,
  },
  content: {
    marginBottom: '20px',
  },
  detailsGrid: {
    display: 'grid' as const,
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  label: {
    fontSize: '12px',
    color: '#666',
    fontWeight: 500,
    marginBottom: '4px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  value: {
    margin: 0,
    fontSize: '14px',
    color: '#333',
    fontWeight: 500,
  },
  idValue: {
    margin: 0,
    fontSize: '12px',
    color: '#666',
    fontFamily: 'monospace',
    wordBreak: 'break-all' as const,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    border: '1px solid #FFE082',
    borderRadius: '4px',
    padding: '12px',
    fontSize: '13px',
    color: '#856404',
    lineHeight: 1.5,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    flexDirection: 'column' as const,
  },
  button: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  buttonPrimary: {
    backgroundColor: '#4CAF50',
    color: '#fff',
  },
  buttonSecondary: {
    backgroundColor: '#f5f5f5',
    color: '#333',
    border: '1px solid #ddd',
  },
};
