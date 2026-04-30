import { QRCodeSVG } from 'qrcode.react';

function QRCodeDisplay({ trackingNumber }) {
  const url = `http://localhost:5173/track/${trackingNumber}`;
  
  return (
    <div className="text-center">
      <QRCodeSVG value={url} size={150} />
      <p className="text-sm text-gray-600 mt-2">ট্র্যাকিং QR কোড</p>
    </div>
  );
}

export default QRCodeDisplay;