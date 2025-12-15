import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

const WriteOnlyDisclaimerModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
        >
          <div className="flex items-center space-x-3 text-amber-600 mb-4">
            <FiAlertTriangle className="text-3xl" />
            <h2 className="text-xl font-bold">Write-Only Access</h2>
          </div>
          
          <div className="space-y-4 text-gray-600">
            <p>
              You have <strong>Write-Only</strong> permissions for this section.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>You can add new entries.</li>
              <li>You cannot view existing entries.</li>
              <li>
                Newly added entries will be visible <strong>temporarily</strong> until you refresh the page or navigate away.
              </li>
            </ul>
            <p className="text-sm bg-amber-50 p-3 rounded-lg border border-amber-100">
              This behavior is intentional for security and privacy.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              I Understand
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WriteOnlyDisclaimerModal;
