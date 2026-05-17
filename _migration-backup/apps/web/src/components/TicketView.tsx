import React, { useRef } from 'react';
import QRCode from 'react-qr-code';
import QRCodeGenerator from 'qrcode';

interface TicketViewProps {
    name: string;
    ticketToken: string;
}

export const TicketView: React.FC<TicketViewProps> = ({ name, ticketToken }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleDownload = async () => {
        try {
            console.log('=== TICKET DOWNLOAD DEBUG ===');
            console.log('Ticket Token:', ticketToken);
            console.log('Guest Name:', name);

            // Create a temporary canvas
            const canvas = document.createElement('canvas');

            // Generate QR code on canvas with ticket info
            await QRCodeGenerator.toCanvas(canvas, ticketToken, {
                width: 400,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            // Create a larger canvas for the complete ticket
            const ticketCanvas = document.createElement('canvas');
            const ctx = ticketCanvas.getContext('2d');
            if (!ctx) return;

            // Set ticket dimensions
            ticketCanvas.width = 500;
            ticketCanvas.height = 600;

            // Draw white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, ticketCanvas.width, ticketCanvas.height);

            // Draw title
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 32px serif';
            ctx.textAlign = 'center';
            ctx.fillText('Ticket Entry', ticketCanvas.width / 2, 60);

            // Draw name
            ctx.font = '20px sans-serif';
            ctx.fillStyle = '#666666';
            ctx.fillText(name, ticketCanvas.width / 2, 100);

            // Draw QR code
            const qrSize = 400;
            const qrX = (ticketCanvas.width - qrSize) / 2;
            const qrY = 130;
            ctx.drawImage(canvas, qrX, qrY, qrSize, qrSize);

            // Draw instruction text
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#999999';
            ctx.fillText('Show this QR code at the entrance', ticketCanvas.width / 2, 560);

            // Download
            const link = document.createElement('a');
            link.download = `ticket-${name.replace(/\s+/g, '-')}.png`;
            link.href = ticketCanvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Failed to download ticket:', error);
            alert('Failed to download ticket. Please take a screenshot instead.');
        }
    };

    return (
        <div className="space-y-4">
            <div
                className="bg-white text-night p-6 rounded-lg shadow-2xl max-w-sm w-full mx-auto text-center transform transition-all duration-500 scale-100"
            >
                <h3 className="text-xl font-serif font-bold mb-2">Ticket Entry</h3>
                <p className="text-sm text-gray-600 mb-4">{name}</p>

                <div className="bg-white p-2 inline-block rounded border-2 border-gold-400">
                    <QRCode
                        value={ticketToken}
                        size={200}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                    />
                </div>

                <p className="text-xs text-gray-400 mt-4">Show this QR code at the entrance</p>
            </div>

            <button
                onClick={handleDownload}
                className="w-full max-w-sm mx-auto block bg-gradient-to-r from-yellow-600 to-yellow-400 hover:from-yellow-500 hover:to-yellow-300 text-black font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transform hover:scale-[1.02] transition-all shadow-lg"
            >
                📥 Download Ticket
            </button>

            {/* Hidden canvas for QR generation */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};
