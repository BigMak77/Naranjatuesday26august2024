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
    <div className="w-[700px] h-[500px] bg-white border-4 border-teal-700 rounded-xl shadow-lg flex flex-col items-center justify-center mx-auto p-10 relative print:bg-white">
      <div className="absolute top-8 left-8">
        <Image src="/logo2.png" alt="Logo" width={100} height={100} />
      </div>
      <h1 className="text-3xl font-bold text-teal-800 mb-4 tracking-wide">
        Certificate of Completion
      </h1>
      <p className="text-lg mb-2">This is to certify that</p>
      <div className="text-2xl font-semibold text-gray-800 mb-2">
        {userName}
      </div>
      <p className="text-lg mb-2">has successfully completed the training</p>
      <div className="text-xl font-semibold text-teal-700 mb-4">
        {trainingName}
      </div>
      <p className="text-md mb-6">
        on <span className="font-semibold">{completionDate}</span>
      </p>
      {issuer && (
        <div className="absolute bottom-10 right-10 text-right">
          <div className="text-sm text-gray-500">Issued by</div>
          <div className="font-semibold text-gray-700">{issuer}</div>
        </div>
      )}
    </div>
  );
}
