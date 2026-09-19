import React, { useState } from 'react';

interface QRCodeModalProps {
  qrData: string;
  title: string;
  onClose: () => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  qrData,
  title,
  onClose,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(qrData);
    setCopied(true);
    onNotify('ZK token copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose}>
      <div className="modal-content glass-card animate-scale-up" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📱 {title}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-body align-center">
          <div className="qr-container">
            {/* Visual Stylized QR Matrix */}
            <div className="qr-matrix-box">
              <svg viewBox="0 0 200 200" className="qr-svg">
                <rect width="200" height="200" fill="#ffffff" rx="12" />
                {/* Corner Positioning Squares */}
                <rect x="20" y="20" width="40" height="40" fill="#0f172a" />
                <rect x="26" y="26" width="28" height="28" fill="#ffffff" />
                <rect x="32" y="32" width="16" height="16" fill="#0f172a" />

                <rect x="140" y="20" width="40" height="40" fill="#0f172a" />
                <rect x="146" y="26" width="28" height="28" fill="#ffffff" />
                <rect x="152" y="32" width="16" height="16" fill="#0f172a" />

                <rect x="20" y="140" width="40" height="40" fill="#0f172a" />
                <rect x="26" y="146" width="28" height="28" fill="#ffffff" />
                <rect x="32" y="152" width="16" height="16" fill="#0f172a" />

                {/* Decorative Data Blocks representing ZK Proof token */}
                <rect x="75" y="25" width="12" height="12" fill="#0284c7" />
                <rect x="95" y="25" width="12" height="12" fill="#0f172a" />
                <rect x="115" y="25" width="12" height="12" fill="#0284c7" />

                <rect x="75" y="45" width="12" height="12" fill="#0f172a" />
                <rect x="95" y="45" width="12" height="12" fill="#6366f1" />
                <rect x="115" y="45" width="12" height="12" fill="#0f172a" />

                <rect x="25" y="75" width="12" height="12" fill="#0284c7" />
                <rect x="45" y="75" width="12" height="12" fill="#0f172a" />
                <rect x="65" y="75" width="12" height="12" fill="#10b981" />
                <rect x="85" y="75" width="12" height="12" fill="#0f172a" />
                <rect x="105" y="75" width="12" height="12" fill="#6366f1" />
                <rect x="125" y="75" width="12" height="12" fill="#0f172a" />
                <rect x="145" y="75" width="12" height="12" fill="#0284c7" />
                <rect x="165" y="75" width="12" height="12" fill="#0f172a" />

                <rect x="25" y="95" width="12" height="12" fill="#0f172a" />
                <rect x="45" y="95" width="12" height="12" fill="#6366f1" />
                <rect x="65" y="95" width="12" height="12" fill="#0f172a" />
                <rect x="85" y="95" width="12" height="12" fill="#10b981" />
                <rect x="105" y="95" width="12" height="12" fill="#0f172a" />
                <rect x="125" y="95" width="12" height="12" fill="#6366f1" />
                <rect x="145" y="95" width="12" height="12" fill="#0f172a" />
                <rect x="165" y="95" width="12" height="12" fill="#0284c7" />

                <rect x="25" y="115" width="12" height="12" fill="#0284c7" />
                <rect x="45" y="115" width="12" height="12" fill="#0f172a" />
                <rect x="65" y="115" width="12" height="12" fill="#10b981" />
                <rect x="85" y="115" width="12" height="12" fill="#0f172a" />
                <rect x="105" y="115" width="12" height="12" fill="#0f172a" />
                <rect x="125" y="115" width="12" height="12" fill="#6366f1" />
                <rect x="145" y="115" width="12" height="12" fill="#0f172a" />
                <rect x="165" y="115" width="12" height="12" fill="#10b981" />

                <rect x="75" y="145" width="12" height="12" fill="#0f172a" />
                <rect x="95" y="145" width="12" height="12" fill="#0284c7" />
                <rect x="115" y="145" width="12" height="12" fill="#0f172a" />
                <rect x="135" y="145" width="12" height="12" fill="#10b981" />

                <rect x="75" y="165" width="12" height="12" fill="#10b981" />
                <rect x="95" y="165" width="12" height="12" fill="#0f172a" />
                <rect x="115" y="165" width="12" height="12" fill="#6366f1" />
                <rect x="135" y="165" width="12" height="12" fill="#0284c7" />
                <rect x="155" y="165" width="12" height="12" fill="#0f172a" />
              </svg>
            </div>
            <span className="text-xs text-muted mt-8">Scan with Pharmacy Portal Camera / Token Reader</span>
          </div>

          <div className="token-preview-box font-mono text-xs">
            <textarea
              readOnly
              value={qrData}
              rows={3}
              className="form-input text-xs font-mono"
            />
          </div>

          <div className="modal-actions">
            <button onClick={handleCopy} className="btn btn-primary flex-1">
              {copied ? '✓ Token Copied!' : '📋 Copy ZK Payload Token'}
            </button>
            <button onClick={onClose} className="btn btn-secondary">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
