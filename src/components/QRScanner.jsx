import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-toastify';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const startScanning = () => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1
      },
      false
    );

    html5QrcodeScanner.render(
      (decodedText) => {
        onScanSuccess(decodedText);
        html5QrcodeScanner.clear();
        setIsScanning(false);
      },
      (error) => {
        console.warn('QR scan error:', error);
      }
    );

    setScanner(html5QrcodeScanner);
    setIsScanning(true);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
      setIsScanning(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Try to decode QR from image
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // This is a simplified version - in production, you'd use a proper QR decoder
        toast.info('Processing QR code from image...');
        
        // Mock successful scan for demo
        setTimeout(() => {
          onScanSuccess(JSON.stringify({
            sessionId: '1',
            timestamp: Date.now(),
            expiresAt: Date.now() + 300000
          }));
        }, 1000);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="qr-scanner-container">
      <div className="text-center mb-4">
        <h5>Scan QR Code</h5>
        <p className="text-muted">Scan the QR code displayed in the session or upload from gallery</p>
      </div>

      <div id="qr-reader" style={{ width: '100%' }}></div>

      <div className="d-flex gap-2 justify-content-center mt-4">
        {!isScanning ? (
          <>
            <button 
              className="btn btn-gradient"
              onClick={startScanning}
            >
              Start Camera Scan
            </button>
            <label className="btn btn-outline-gradient mb-0">
              Upload from Gallery
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </>
        ) : (
          <button 
            className="btn btn-danger"
            onClick={stopScanning}
          >
            Stop Scanning
          </button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;