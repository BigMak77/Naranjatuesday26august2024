import React from "react";
import Image from "next/image";

interface CertificateTemplateProps {
  userName: string;
  trainingName: string;
  completionDate: string;
  issuer?: string;
}

export default function CertificateTemplate({
  userName,
  trainingName,
  completionDate,
  issuer,
}: CertificateTemplateProps) {
  return (
    <div className="neon-panel" style={{ 
      width: '700px', 
      height: '500px', 
      backgroundColor: 'white', 
      border: '4px solid var(--neon)', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      margin: '0 auto', 
      padding: '2.5rem', 
      position: 'relative',
      color: '#000'
    }}>
      <div style={{ 
        position: 'absolute', 
        top: '2rem', 
        left: '2rem' 
      }}>
        <Image src="/logo2.png" alt="Logo" width={100} height={100} />
      </div>
      <h1 style={{ 
        fontSize: '1.875rem', 
        fontWeight: '700', 
        color: '#0f766e', 
        marginBottom: '1rem', 
        letterSpacing: '0.025em' 
      }}>
        Certificate of Completion
      </h1>
      <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#000' }}>This is to certify that</p>
      <div style={{ 
        fontSize: '1.5rem', 
        fontWeight: '600', 
        color: '#1f2937', 
        marginBottom: '0.5rem' 
      }}>
        {userName}
      </div>
      <p style={{ fontSize: '1.125rem', marginBottom: '0.5rem', color: '#000' }}>has successfully completed the training</p>
      <div style={{ 
        fontSize: '1.25rem', 
        fontWeight: '600', 
        color: '#0f766e', 
        marginBottom: '1rem' 
      }}>
        {trainingName}
      </div>
      <p style={{ fontSize: '1rem', marginBottom: '1.5rem', color: '#000' }}>
        on <span style={{ fontWeight: '600' }}>{completionDate}</span>
      </p>
      {issuer && (
        <div style={{ 
          position: 'absolute', 
          bottom: '2.5rem', 
          right: '2.5rem', 
          textAlign: 'right' 
        }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Issued by</div>
          <div style={{ fontWeight: '600', color: '#374151' }}>{issuer}</div>
        </div>
      )}
    </div>
  );
}
