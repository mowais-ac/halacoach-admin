import type {LegalDocId, LegalDocument} from './types';

type SeedDoc = Omit<LegalDocument, 'updatedAt'>;

const now = '2026-08-01T00:00:00.000Z';

const docs: SeedDoc[] = [
  {
    id: 'terms',
    lang: 'en',
    title: 'Terms & Conditions',
    intro:
      'These terms explain how HalaCoach works and what you agree to when using the app. Last updated August 2026.',
    sections: [
      {
        heading: '1. What HalaCoach does',
        body: 'HalaCoach is a matching platform. We collect your goals and preferences and introduce you to independent coaches and trainers. We do not deliver coaching sessions ourselves.',
      },
      {
        heading: '2. Independent professionals',
        body: 'Coaches on HalaCoach are independent providers, not our employees. Any agreement about sessions, pricing, scheduling, cancellations or refunds is made directly between you and the professional.',
      },
      {
        heading: '3. Your account and information',
        body: 'You agree to give accurate information in the matching questionnaire and to keep your contact details up to date. Matches are only as good as the answers you provide.',
      },
      {
        heading: '4. Being contacted',
        body: 'When you request matches, we share the details you approved with the professionals we match you to, so they can contact you by phone, WhatsApp or email.',
      },
      {
        heading: '5. Health and safety',
        body: 'HalaCoach does not provide medical advice. Speak to a qualified healthcare provider before starting a new training or nutrition programme, especially if you have an injury or medical condition.',
      },
      {
        heading: '6. Acceptable use',
        body: 'Do not misuse the platform: no false identities, no harassment of professionals or clients, and no scraping or reselling of information shared through HalaCoach.',
      },
      {
        heading: '7. Changes',
        body: 'We may update these terms as the product evolves. Continued use of HalaCoach after an update means you accept the revised terms.',
      },
    ],
  },
  {
    id: 'terms',
    lang: 'ar',
    title: 'الشروط والأحكام',
    intro: 'توضح هذه الشروط طريقة عمل هالة كوتش وما توافق عليه عند استخدام التطبيق. آخر تحديث: أغسطس 2026.',
    sections: [
      {
        heading: '١. ما تقدمه المنصة',
        body: 'هالة كوتش منصة للمطابقة. نجمع أهدافك وتفضيلاتك ونعرّفك على مدربين مستقلين، ولا نقدّم جلسات التدريب بأنفسنا.',
      },
      {
        heading: '٢. مدربون مستقلون',
        body: 'المدربون على المنصة مزوّدو خدمة مستقلون وليسوا موظفين لدينا. أي اتفاق حول الجلسات أو الأسعار أو المواعيد أو الاسترداد يتم مباشرة بينك وبين المدرب.',
      },
      {
        heading: '٣. معلوماتك',
        body: 'توافق على تقديم معلومات صحيحة في استبيان المطابقة وتحديث بيانات التواصل الخاصة بك.',
      },
      {
        heading: '٤. التواصل معك',
        body: 'عند طلب المطابقات، نشارك البيانات التي وافقت عليها مع المدربين المطابقين ليتواصلوا معك عبر الهاتف أو واتساب أو البريد الإلكتروني.',
      },
      {
        heading: '٥. الصحة والسلامة',
        body: 'لا تقدّم المنصة استشارات طبية. استشر مختصًا صحيًا قبل بدء أي برنامج تدريبي أو غذائي جديد.',
      },
      {
        heading: '٦. الاستخدام المقبول',
        body: 'يُمنع انتحال الهوية أو مضايقة المدربين أو العملاء أو إعادة بيع المعلومات المتاحة عبر المنصة.',
      },
      {
        heading: '٧. التغييرات',
        body: 'قد نحدّث هذه الشروط مع تطور المنتج. استمرار استخدام هالة كوتش بعد التحديث يعني قبولك للشروط المعدّلة.',
      },
    ],
  },
  {
    id: 'privacy',
    lang: 'en',
    title: 'Privacy Policy',
    intro:
      'This policy explains what we collect, why we collect it, and the choices you have. Last updated August 2026.',
    sections: [
      {
        heading: '1. What we collect',
        body: 'Your questionnaire answers (goals, availability, budget, location area, preferences), your name, phone number and email, and basic usage information such as which coaches you view or save.',
      },
      {
        heading: '2. Why we use it',
        body: 'To generate your coach matches, to let matched professionals contact you, to verify your phone number, and to improve the quality of our matching.',
      },
      {
        heading: '3. What we share',
        body: 'We share your goal, preferences, area and contact details with the professionals you are matched with, once you consent. We do not sell your personal data.',
      },
      {
        heading: '4. Location',
        body: 'Location is used only to find professionals near you. You can type your area manually instead of sharing device location.',
      },
      {
        heading: '5. Keeping your data',
        body: 'We keep your matching profile while your account is active so you can update your answers. You can ask us to delete your account and personal data at any time.',
      },
      {
        heading: '6. Your choices',
        body: 'You can update your answers, change who may contact you, or withdraw consent from your profile settings. To request a copy or deletion of your data, contact support.',
      },
    ],
  },
  {
    id: 'privacy',
    lang: 'ar',
    title: 'سياسة الخصوصية',
    intro: 'توضح هذه السياسة ما نجمعه ولماذا، والخيارات المتاحة لك. آخر تحديث: أغسطس 2026.',
    sections: [
      {
        heading: '١. ما نجمعه',
        body: 'إجاباتك في الاستبيان (الهدف، الأوقات، الميزانية، المنطقة، التفضيلات)، واسمك ورقم هاتفك وبريدك الإلكتروني، ومعلومات استخدام أساسية.',
      },
      {
        heading: '٢. لماذا نستخدمها',
        body: 'لإنشاء مطابقاتك، وتمكين المدربين المطابقين من التواصل معك، والتحقق من رقم هاتفك، وتحسين جودة المطابقة.',
      },
      {
        heading: '٣. ما نشاركه',
        body: 'نشارك هدفك وتفضيلاتك ومنطقتك وبيانات التواصل مع المدربين المطابقين بعد موافقتك. لا نبيع بياناتك الشخصية.',
      },
      {
        heading: '٤. الموقع',
        body: 'يُستخدم الموقع فقط لإيجاد مدربين قريبين منك، ويمكنك كتابة منطقتك يدويًا بدلاً من مشاركة موقع الجهاز.',
      },
      {
        heading: '٥. الاحتفاظ بالبيانات',
        body: 'نحتفظ بملف المطابقة طالما كان حسابك نشطًا، ويمكنك طلب حذف حسابك وبياناتك في أي وقت.',
      },
      {
        heading: '٦. خياراتك',
        body: 'يمكنك تحديث إجاباتك أو تغيير من يمكنه التواصل معك أو سحب موافقتك من إعدادات الملف الشخصي.',
      },
    ],
  },
  {
    id: 'professional',
    lang: 'en',
    title: 'Professional Agreement',
    intro:
      'This agreement applies to coaches and trainers using HalaCoach to receive client leads. Last updated August 2026.',
    sections: [
      {
        heading: '1. Independent status',
        body: 'You operate as an independent professional. HalaCoach introduces potential clients and does not employ you, set your prices, or manage how you deliver your services.',
      },
      {
        heading: '2. Credentials',
        body: 'You confirm that the certifications, and where applicable the insurance, you upload are valid, current and belong to you. We may ask for further evidence or pause your profile during verification.',
      },
      {
        heading: '3. Credits and leads',
        body: 'Credits are used to unlock client contact details. Credits are non-transferable and are not refundable once a lead is unlocked. Unlocking a lead is not a guarantee that the client will book.',
      },
      {
        heading: '4. Client data',
        body: 'Use client details only to respond to that specific enquiry. Do not add clients to marketing lists, resell their details, or share them with third parties.',
      },
      {
        heading: '5. Conduct',
        body: 'Respond to leads promptly and professionally, be transparent about pricing, and respect client preferences on gender, language and communication channel.',
      },
      {
        heading: '6. Suspension',
        body: 'We may suspend or remove profiles for false credentials, repeated complaints, or misuse of client data.',
      },
    ],
  },
  {
    id: 'professional',
    lang: 'ar',
    title: 'اتفاقية المدرب',
    intro: 'تنطبق هذه الاتفاقية على المدربين الذين يستخدمون المنصة لاستقبال طلبات العملاء. آخر تحديث: أغسطس 2026.',
    sections: [
      {
        heading: '١. الصفة المستقلة',
        body: 'تعمل كمزوّد خدمة مستقل. تقوم المنصة بتعريفك على عملاء محتملين فقط ولا توظفك ولا تحدد أسعارك.',
      },
      {
        heading: '٢. المؤهلات',
        body: 'تؤكد أن الشهادات، والتأمين إن وُجد، صحيحة وسارية وتخصك. قد نطلب مستندات إضافية أثناء التحقق.',
      },
      {
        heading: '٣. الرصيد والطلبات',
        body: 'يُستخدم الرصيد لفتح بيانات تواصل العملاء، وهو غير قابل للتحويل أو الاسترداد بعد فتح الطلب، ولا يضمن حجز العميل.',
      },
      {
        heading: '٤. بيانات العملاء',
        body: 'استخدم بيانات العميل للرد على طلبه فقط، ولا تضفه إلى قوائم تسويقية أو تشاركه مع أطراف أخرى.',
      },
      {
        heading: '٥. السلوك المهني',
        body: 'رد على الطلبات بسرعة ووضوح في الأسعار، واحترم تفضيلات العميل في اللغة والجنس وطريقة التواصل.',
      },
      {
        heading: '٦. الإيقاف',
        body: 'قد نوقف أو نحذف الملفات في حال المستندات غير الصحيحة أو الشكاوى المتكررة أو إساءة استخدام بيانات العملاء.',
      },
    ],
  },
];

export const seedLegalDocuments: LegalDocument[] = docs.map(doc => ({
  ...doc,
  updatedAt: now,
}));

export const legalDocLabels: Record<LegalDocId, string> = {
  terms: 'Terms & Conditions',
  privacy: 'Privacy Policy',
  professional: 'Professional Agreement',
};
