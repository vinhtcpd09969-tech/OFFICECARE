import { Helmet } from 'react-helmet-async';
import { FileText } from 'lucide-react';
import { TERMS_OF_SERVICE, TERMS_EFFECTIVE_DATE } from '../../legal/termsContent';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 pt-28 font-jakarta">
      <Helmet>
        <title>Điều khoản dịch vụ | OfficeCare</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10 text-center">
          <span className="bg-[#14B8A6]/10 text-[#0D9488] border border-[#14B8A6]/20 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1.5 mb-3 shadow-sm">
            <FileText size={11} /> Văn bản pháp lý
          </span>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-slate-900 tracking-tight leading-tight mb-2">
            Điều khoản dịch vụ
          </h1>
          <p className="text-xs text-slate-450 font-semibold">Có hiệu lực từ ngày {TERMS_EFFECTIVE_DATE}</p>
        </div>

        <div className="bg-white border border-slate-150 rounded-3xl shadow-sm p-6 md:p-10 space-y-8">
          {TERMS_OF_SERVICE.map((section) => (
            <div key={section.heading}>
              <h2 className="font-heading font-black text-sm md:text-base text-slate-900 mb-3">{section.heading}</h2>
              <div className="space-y-3">
                {section.paragraphs.map((p, idx) => (
                  <p key={idx} className="text-xs md:text-sm text-slate-600 leading-relaxed">{p}</p>
                ))}
                {section.bullets && (
                  <ul className="space-y-1.5 pl-1">
                    {section.bullets.map((b, idx) => (
                      <li key={idx} className="text-xs md:text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                        <span className="mt-1.5 size-1 rounded-full bg-[#0D9488] shrink-0" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
