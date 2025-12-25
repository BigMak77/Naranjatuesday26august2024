"use client";

import React from "react";

export interface CertificateData {
  recipientName: string;
  moduleName: string;
  completedDate: string;
  employeeNumber?: string;
  trainerName?: string;
  organizationName?: string;
}

interface TrainingCertificateProps {
  data: CertificateData;
  autoprint?: boolean;
}

export function generateCertificateHTML(data: CertificateData, autoprint: boolean = true): string {
  const completedDate = new Date(data.completedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Training Certificate - ${data.moduleName}</title>
        <meta charset="utf-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Georgia', serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #f5f5f5;
            padding: 20px;
          }
          .certificate {
            background: white;
            width: 900px;
            max-width: 100%;
            padding: 60px;
            border: 20px solid #053639;
            border-image: linear-gradient(45deg, #053639, #40e0d0) 1;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            position: relative;
          }
          .certificate::before {
            content: '';
            position: absolute;
            top: 10px;
            left: 10px;
            right: 10px;
            bottom: 10px;
            border: 2px solid #fa7a20;
            pointer-events: none;
          }
          .certificate-header {
            margin-bottom: 30px;
          }
          .certificate-title {
            font-size: 52px;
            color: #053639;
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 4px;
          }
          .certificate-subtitle {
            font-size: 22px;
            color: #666;
            font-style: italic;
          }
          .certificate-body {
            margin: 50px 0;
            line-height: 2;
          }
          .recipient-name {
            font-size: 40px;
            color: #053639;
            font-weight: bold;
            margin: 25px 0;
            border-bottom: 3px solid #fa7a20;
            display: inline-block;
            padding: 0 30px 8px 30px;
          }
          .module-name {
            font-size: 32px;
            color: #fa7a20;
            font-weight: bold;
            margin: 25px 0;
            font-style: italic;
          }
          .certificate-text {
            font-size: 20px;
            color: #333;
            margin: 15px 0;
          }
          .completion-date {
            font-size: 18px;
            color: #666;
            margin-top: 30px;
            font-weight: bold;
          }
          .employee-number {
            font-size: 14px;
            color: #999;
            margin-top: 10px;
          }
          .certificate-footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 2px solid #ddd;
            display: flex;
            justify-content: space-around;
            align-items: flex-end;
          }
          .signature-line {
            text-align: center;
            min-width: 200px;
          }
          .signature {
            border-top: 2px solid #333;
            padding-top: 10px;
            margin-top: 50px;
            font-size: 14px;
            color: #666;
            font-family: Arial, sans-serif;
          }
          .signature-title {
            font-size: 12px;
            color: #999;
            margin-top: 5px;
          }
          .seal {
            position: absolute;
            bottom: 80px;
            right: 80px;
            width: 100px;
            height: 100px;
            border: 3px solid #40e0d0;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            background: white;
            opacity: 0.8;
          }
          .seal-text {
            font-size: 10px;
            font-weight: bold;
            color: #053639;
            text-align: center;
            line-height: 1.2;
            font-family: Arial, sans-serif;
          }
          .organization-name {
            font-size: 16px;
            color: #053639;
            font-weight: bold;
            margin-bottom: 20px;
            font-family: Arial, sans-serif;
          }
          .logo-header {
            background: #fa7a20;
            margin: -60px -60px 30px -60px;
            padding: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .logo-header img {
            max-height: 200px;
            width: auto;
          }
          @media print {
            body {
              background: white;
            }
            .certificate {
              box-shadow: none;
            }
            @page {
              size: landscape;
              margin: 1cm;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="logo-header">
            <img src="/logo-dec-2025.png" alt="Logo" />
          </div>

          ${data.organizationName ? `<div class="organization-name">${data.organizationName}</div>` : ''}

          <div class="certificate-header">
            <div class="certificate-title">Certificate</div>
            <div class="certificate-subtitle">of Training Completion</div>
          </div>

          <div class="certificate-body">
            <p class="certificate-text">This is to certify that</p>
            <div class="recipient-name">${data.recipientName}</div>
            ${data.employeeNumber ? `<div class="employee-number">Employee #${data.employeeNumber}</div>` : ''}
            <p class="certificate-text">has successfully completed the training module</p>
            <div class="module-name">"${data.moduleName}"</div>
            <p class="completion-date">Completed on ${completedDate}</p>
          </div>

          <div class="certificate-footer">
            <div class="signature-line">
              <div class="signature">${data.trainerName || 'Training Coordinator'}</div>
              <div class="signature-title">Authorized Signature</div>
            </div>
            <div class="signature-line">
              <div class="signature">${new Date().toLocaleDateString()}</div>
              <div class="signature-title">Date Issued</div>
            </div>
          </div>

          <div class="seal">
            <div class="seal-text">
              TRAINING<br/>COMPLETED<br/>${new Date().getFullYear()}
            </div>
          </div>
        </div>
        ${autoprint ? `
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 250);
          };
        </script>
        ` : ''}
      </body>
    </html>
  `;
}

export function openCertificateWindow(data: CertificateData, autoprint: boolean = true): void {
  const certWindow = window.open('', '_blank');
  if (!certWindow) {
    alert('Please allow pop-ups to download certificate');
    return;
  }

  const htmlContent = generateCertificateHTML(data, autoprint);

  certWindow.document.open();
  certWindow.document.write(htmlContent);
  certWindow.document.close();
}

// React Component for inline certificate preview
export default function TrainingCertificate({ data, autoprint = false }: TrainingCertificateProps) {
  const completedDate = new Date(data.completedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div style={{
      fontFamily: 'Georgia, serif',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      background: '#f5f5f5'
    }}>
      <div style={{
        background: 'white',
        width: '900px',
        maxWidth: '100%',
        padding: '60px',
        border: '20px solid #053639',
        borderImage: 'linear-gradient(45deg, #053639, #40e0d0) 1',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Inner border */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          right: '10px',
          bottom: '10px',
          border: '2px solid #fa7a20',
          pointerEvents: 'none'
        }} />

        {/* Logo Header */}
        <div style={{
          background: '#fa7a20',
          margin: '-60px -60px 30px -60px',
          padding: '10px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <img src="/logo-dec-2025.png" alt="Logo" style={{ maxHeight: '200px', width: 'auto' }} />
        </div>

        {data.organizationName && (
          <div style={{
            fontSize: '16px',
            color: '#053639',
            fontWeight: 'bold',
            marginBottom: '20px',
            fontFamily: 'Arial, sans-serif'
          }}>
            {data.organizationName}
          </div>
        )}

        <div style={{ marginBottom: '30px' }}>
          <div style={{
            fontSize: '52px',
            color: '#053639',
            fontWeight: 'bold',
            marginBottom: '10px',
            textTransform: 'uppercase',
            letterSpacing: '4px'
          }}>
            Certificate
          </div>
          <div style={{
            fontSize: '22px',
            color: '#666',
            fontStyle: 'italic'
          }}>
            of Training Completion
          </div>
        </div>

        <div style={{ margin: '50px 0', lineHeight: '2' }}>
          <p style={{ fontSize: '20px', color: '#333', margin: '15px 0' }}>
            This is to certify that
          </p>
          <div style={{
            fontSize: '40px',
            color: '#053639',
            fontWeight: 'bold',
            margin: '25px 0',
            borderBottom: '3px solid #fa7a20',
            display: 'inline-block',
            padding: '0 30px 8px 30px'
          }}>
            {data.recipientName}
          </div>
          {data.employeeNumber && (
            <div style={{
              fontSize: '14px',
              color: '#999',
              marginTop: '10px'
            }}>
              Employee #{data.employeeNumber}
            </div>
          )}
          <p style={{ fontSize: '20px', color: '#333', margin: '15px 0' }}>
            has successfully completed the training module
          </p>
          <div style={{
            fontSize: '32px',
            color: '#fa7a20',
            fontWeight: 'bold',
            margin: '25px 0',
            fontStyle: 'italic'
          }}>
            "{data.moduleName}"
          </div>
          <p style={{
            fontSize: '18px',
            color: '#666',
            marginTop: '30px',
            fontWeight: 'bold'
          }}>
            Completed on {completedDate}
          </p>
        </div>

        <div style={{
          marginTop: '60px',
          paddingTop: '20px',
          borderTop: '2px solid #ddd',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'flex-end'
        }}>
          <div style={{ textAlign: 'center', minWidth: '200px' }}>
            <div style={{
              borderTop: '2px solid #333',
              paddingTop: '10px',
              marginTop: '50px',
              fontSize: '14px',
              color: '#666',
              fontFamily: 'Arial, sans-serif'
            }}>
              {data.trainerName || 'Training Coordinator'}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#999',
              marginTop: '5px'
            }}>
              Authorized Signature
            </div>
          </div>
          <div style={{ textAlign: 'center', minWidth: '200px' }}>
            <div style={{
              borderTop: '2px solid #333',
              paddingTop: '10px',
              marginTop: '50px',
              fontSize: '14px',
              color: '#666',
              fontFamily: 'Arial, sans-serif'
            }}>
              {new Date().toLocaleDateString()}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#999',
              marginTop: '5px'
            }}>
              Date Issued
            </div>
          </div>
        </div>

        {/* Seal */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          right: '80px',
          width: '100px',
          height: '100px',
          border: '3px solid #40e0d0',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          background: 'white',
          opacity: 0.8
        }}>
          <div style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#053639',
            textAlign: 'center',
            lineHeight: '1.2',
            fontFamily: 'Arial, sans-serif'
          }}>
            TRAINING<br/>COMPLETED<br/>{new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
}
