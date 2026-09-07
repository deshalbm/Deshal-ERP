export interface PageSeoConfig {
  title: string;
  description: string;
  keywords: string;
  canonicalUrl: string;
  ogImage?: string;
  structuredData?: Record<string, any>;
}

export const PAGE_SEO_CONFIGS: Record<string, PageSeoConfig> = {
  home: {
    title: 'الدليل الشامل لاستشارات إدارة المشاريع | صحار، سلطنة عُمان',
    description: 'شركة استشارات رائدة في ولاية صحار وسلطنة عُمان. نقدم استشارات إدارة المشاريع الاحترافية (PMP)، دراسات الجدوى الاقتصادية، وتأسيس وتراخيص الشركات، وحاضنات ومكاتب أعمال متكاملة.',
    keywords: 'الدليل الشامل, استشارات إدارة مشاريع, صحار, دراسات جدوى عمان, استثمر بسهولة, المنطقة الحرة صحار, مكاتب أعمال صحار, تأسيس شركات عمان',
    canonicalUrl: 'https://deshalbm.com/',
    ogImage: 'https://deshalbm.com/assets/images/deshal_logo.png',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': ['ProfessionalService', 'LocalBusiness'],
      'name': 'شركة الدليل الشامل لاستشارات إدارة المشاريع',
      'url': 'https://deshalbm.com/',
      'telephone': '+96822730630',
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': 'الطابق الثاني ٢٠٠٩-٢٠١٢ | مبنى عمانا بلازا | فلج القبائل',
        'addressLocality': 'صحار',
        'addressRegion': 'محافظة شمال الباطنة',
        'postalCode': '311',
        'addressCountry': 'OM'
      }
    }
  },
  about: {
    title: 'عن الشركة والدور الاستراتيجي | الدليل الشامل صحار',
    description: 'تعرف على شركة الدليل الشامل لاستشارات إدارة المشاريع ورؤيتها المواكبة لرؤية عُمان 2040 والقيادة العمانية في ولاية صحار.',
    keywords: 'عن الدليل الشامل, رؤية عمان 2040, استشارات صحار, قيادة المشاريع شمال الباطنة',
    canonicalUrl: 'https://deshalbm.com/about'
  },
  services: {
    title: 'منظومة الخدمات الاستشارية ودراسات الجدوى | صحار',
    description: 'استكشف خدماتنا الاستشارية في صحار: دراسات الجدوى الاقتصادية، حوكمة المشاريع PMP، التراخيص التجارية والصناعية، واستشارات التوسع والاستثمار.',
    keywords: 'خدمات استشارية صحار, دراسات جدوى بنك التنمية, حوكمة PMP عُمان, تراخيص استثمر بسهولة',
    canonicalUrl: 'https://deshalbm.com/services'
  },
  'business-center': {
    title: 'مركز الأعمال والمكاتب التنفيذية وقاعات الاجتماعات بصحار',
    description: 'مكاتب خاصة ومساحات عمل مشتركة مجهزة بالكامل ومكاتب افتراضية في صحار مع عناوين تجارية معتمدة وخدمات دعم وإسناد لرواد الأعمال والشركات.',
    keywords: 'مكاتب للايجار صحار, قاعات اجتماعات صحار, مساحات عمل مشتركة صحار, عنوان تجاري صحار',
    canonicalUrl: 'https://deshalbm.com/business-center'
  },
  studio: {
    title: 'استوديو البودكاست والإنتاج المرئي الاحترافي بصحار',
    description: 'استوديو صوتي ومرئي متكامل في صحار مجهز بأحدث كاميرات وميكروفونات الإنتاج وصناعة المحتوى المرئي والبودكاست والتغطيات المؤسسية.',
    keywords: 'استوديو بودكاست صحار, تصوير مرئي صحار, إنتاج محتوى عمان, ميكروفونات Shure صحار',
    canonicalUrl: 'https://deshalbm.com/studio'
  },
  training: {
    title: 'أكاديمية التدريب المهني وبرامج إدارة المشاريع PMP بصحار',
    description: 'التحق بأفضل البرامج التدريبية المهنية في صحار: إدارة المشاريع الاحترافية PMP، الجدوى المالية، ورش العمل الاستراتيجية المعتمدة لفرق العمل.',
    keywords: 'دورات PMP صحار, تدريب ادارة مشاريع عمان, ورش عمل صحار, تطوير كوادر عمانية',
    canonicalUrl: 'https://deshalbm.com/training'
  },
  knowledge: {
    title: 'مركز المعرفة والمدونة الاستثمارية وأدلة الأعمال | عُمان',
    description: 'مقالات وأدلة إجرائية متخصصة في تأسيس الشركات في سلطنة عُمان عبر منصة استثمر بسهولة، دراسات الجدوى الاقتصادية، وفرص الاستثمار في صحار.',
    keywords: 'مدونة استثمارية صحار, دليل استثمر بسهولة, خطوات تاسيس شركة عمان',
    canonicalUrl: 'https://deshalbm.com/blog'
  },
  blog: {
    title: 'المدونة الاستثمارية ومركز المعرفة | الدليل الشامل صحار',
    description: 'مقالات وأدلة إجرائية متخصصة في تأسيس الشركات في سلطنة عُمان عبر منصة استثمر بسهولة، دراسات الجدوى الاقتصادية، وفرص الاستثمار في صحار.',
    keywords: 'مدونة استثمارية صحار, دليل استثمر بسهولة, خطوات تاسيس شركة عمان, مدونة الدليل الشامل',
    canonicalUrl: 'https://deshalbm.com/blog'
  },
  blogs: {
    title: 'المدونة الاستثمارية ومركز المعرفة | الدليل الشامل صحار',
    description: 'مقالات وأدلة إجرائية متخصصة في تأسيس الشركات في سلطنة عُمان عبر منصة استثمر بسهولة، دراسات الجدوى الاقتصادية، وفرص الاستثمار في صحار.',
    keywords: 'مدونة استثمارية صحار, دليل استثمر بسهولة, خطوات تاسيس شركة عمان, مدونة الدليل الشامل',
    canonicalUrl: 'https://deshalbm.com/blogs'
  },
  contact: {
    title: 'حجز جلسة استشارية واتصل بنا | الدليل الشامل صحار',
    description: 'احجز استشارتك التشخيصية (30 دقيقة) مع خبرائنا في صحار حضورياً أو عن بعد عبر Google Meet، وتعرف على موقعنا ووسائل التواصل المباشرة.',
    keywords: 'حجز موعد استشارة صحار, تواصل الدليل الشامل, هاتف صحار استشارات',
    canonicalUrl: 'https://deshalbm.com/contact'
  }
};

export class SeoManager {
  /**
   * Dynamically applies SEO titles, meta tags, and JSON-LD schema to document head
   */
  static applySeo(pageKey: string) {
    const config = PAGE_SEO_CONFIGS[pageKey] || PAGE_SEO_CONFIGS.home;
    
    // Update Title
    document.title = config.title;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', config.description);

    // Update Meta Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', config.keywords);

    // Update Canonical URL
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement('link');
      linkCanonical.setAttribute('rel', 'canonical');
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute('href', config.canonicalUrl);

    // Update Open Graph Title & Description
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', config.title);

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', config.description);

    // Inject JSON-LD if provided
    if (config.structuredData) {
      let scriptJsonLd = document.querySelector('script[id="json-ld-seo"]');
      if (!scriptJsonLd) {
        scriptJsonLd = document.createElement('script');
        scriptJsonLd.setAttribute('type', 'application/ld+json');
        scriptJsonLd.setAttribute('id', 'json-ld-seo');
        document.head.appendChild(scriptJsonLd);
      }
      scriptJsonLd.textContent = JSON.stringify(config.structuredData);
    }
  }
}
