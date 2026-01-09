import React, { useEffect } from 'react';

/**
 * Reusable Popover component for confirmation dialogs and notifications
 */
const Popover = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'warning', 'error', 'confirm'
  onConfirm = null,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  size = 'md', // 'sm', 'md', 'lg', 'xl'
  hideFooter = false
}) => {
  // Close popover when pressing Escape
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  // Don't render if not open
  if (!isOpen) return null;

  // Style based on type
  const getColor = () => {
    switch (type) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      case 'confirm': return '#2196F3';
      default: return '#2196F3'; // info default
    }
  };

  // Get width based on size
  const getWidth = () => {
    switch (size) {
      case 'sm': return '300px';
      case 'md': return '400px';
      case 'lg': return '600px';
      case 'xl': return '800px';
      default: return '400px';
    }
  };

  // Style for the popover
  const popoverStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      padding: '20px',
      width: getWidth(),
      maxWidth: '90%',
      maxHeight: '90vh',
      overflow: 'auto',
      position: 'relative',
    },
    header: {
      borderBottom: `2px solid ${getColor()}`,
      paddingBottom: '10px',
      marginBottom: '15px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    title: {
      margin: 0,
      fontSize: '18px',
      fontWeight: 'bold',
      color: getColor(),
    },
    closeButton: {
      background: 'none',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#666',
    },
    body: {
      margin: '15px 0',
    },
    message: {
      margin: 0,
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      maxHeight: '400px',
      overflowY: 'auto',
    },
    footer: {
      marginTop: '20px',
      display: 'flex',
      justifyContent: type === 'confirm' ? 'space-between' : 'flex-end',
    },
    button: {
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold',
      minWidth: '80px',
    },
    confirmButton: {
      backgroundColor: getColor(),
      color: 'white',
      marginLeft: '10px',
    },
    cancelButton: {
      backgroundColor: '#e0e0e0',
      color: '#333',
    }
  };

  return (
    <div style={popoverStyles.overlay} onClick={onClose}>
      <div style={popoverStyles.container} onClick={e => e.stopPropagation()}>
        <div style={popoverStyles.header}>
          <h3 style={popoverStyles.title}>{title}</h3>
          <button style={popoverStyles.closeButton} onClick={onClose}>×</button>
        </div>
        <div style={popoverStyles.body}>
          <p style={popoverStyles.message}>{message}</p>
        </div>
        {!hideFooter && (
        <div style={popoverStyles.footer}>
          {type === 'confirm' && (
            <button 
              style={{...popoverStyles.button, ...popoverStyles.cancelButton}} 
              onClick={onClose}
            >
              {cancelText}
            </button>
          )}
          <button 
            style={{...popoverStyles.button, ...popoverStyles.confirmButton}} 
            onClick={type === 'confirm' ? onConfirm : onClose}
          >
            {type === 'confirm' ? confirmText : 'OK'}
          </button>
        </div>
        )}
      </div>
    </div>
  );
};

export default Popover;
