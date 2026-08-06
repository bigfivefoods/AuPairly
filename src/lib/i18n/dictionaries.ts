import type { Locale } from "./config";

/** Flat dictionary for core UI chrome + reviews + common CTAs */
export type Dictionary = {
  brand_tagline: string;
  nav_discover: string;
  nav_sitters: string;
  nav_hosts: string;
  nav_pricing: string;
  nav_login: string;
  nav_get_started: string;
  nav_dashboard: string;
  nav_sign_out: string;
  nav_messages: string;
  nav_interests: string;
  nav_admin: string;
  nav_language: string;
  footer_marketplace: string;
  footer_trust: string;
  footer_company: string;
  footer_childcare: string;
  footer_caregiving: string;
  footer_house: string;
  footer_pets: string;
  footer_all_sitters: string;
  footer_how: string;
  footer_safety: string;
  footer_privacy: string;
  footer_verify: string;
  footer_pricing: string;
  footer_guides: string;
  footer_support: string;
  footer_join: string;
  footer_blurb: string;
  home_hero_badge: string;
  home_hero_title: string;
  home_hero_title_accent: string;
  home_hero_body: string;
  home_cta_need: string;
  home_cta_offer: string;
  home_cta_plans: string;
  home_stat_sitters: string;
  home_stat_hosts: string;
  home_stat_verified: string;
  home_four_title: string;
  home_four_sub: string;
  home_how_title: string;
  home_how_sub: string;
  common_loading: string;
  common_save: string;
  common_cancel: string;
  common_continue: string;
  common_back: string;
  common_error: string;
  common_success: string;
  reviews_title: string;
  reviews_write: string;
  reviews_update: string;
  reviews_how: string;
  reviews_comment_ph: string;
  reviews_submit: string;
  reviews_thanks: string;
  reviews_empty: string;
  reviews_overall: string;
  reviews_communication: string;
  reviews_reliability: string;
  reviews_respect: string;
  reviews_recommend: string;
  reviews_private_note: string;
  reviews_private_hint: string;
  reviews_public_response: string;
  reviews_respond: string;
  reviews_hidden_mutual: string;
  reviews_pending_title: string;
  reviews_pending_body: string;
  reviews_leave: string;
  reviews_only_messaged: string;
  reviews_star: string;
  reviews_would_recommend: string;
  reviews_from: string;
  reviews_about_you: string;
  reviews_you_left: string;
  reviews_awaiting_them: string;
  reviews_both_public: string;
  reviews_inbox: string;
  language_saved: string;
};

const en: Dictionary = {
  brand_tagline: "Trusted care for your family, loved ones, home & pets",
  nav_discover: "Discover",
  nav_sitters: "Sitters",
  nav_hosts: "Hosts",
  nav_pricing: "Pricing",
  nav_login: "Log in",
  nav_get_started: "Get started",
  nav_dashboard: "Dashboard",
  nav_sign_out: "Sign out",
  nav_messages: "Messages",
  nav_interests: "Interests",
  nav_admin: "Admin",
  nav_language: "Language",
  footer_marketplace: "Marketplace",
  footer_trust: "Trust & safety",
  footer_company: "Company",
  footer_childcare: "Childcare",
  footer_caregiving: "Caregiving",
  footer_house: "House sitting",
  footer_pets: "Pet sitting",
  footer_all_sitters: "All sitters",
  footer_how: "How it works",
  footer_safety: "Safety tips",
  footer_privacy: "Privacy (POPIA)",
  footer_verify: "Get verified",
  footer_pricing: "Pricing",
  footer_guides: "Guides",
  footer_support: "Support",
  footer_join: "Join free",
  footer_blurb:
    "Trusted care for your family, loved ones, home & pets — childcare, caregiving, house sitting & pet sitting on one marketplace.",
  home_hero_badge: "AuPairly · family · home · pets",
  home_hero_title: "Trusted care for your",
  home_hero_title_accent: "family, loved ones, home & pets.",
  home_hero_body:
    "Childcare, caregiving, house sitting, and pet sitting under one trusted brand. Verified people. Match, message, and place with confidence.",
  home_cta_need: "I need help",
  home_cta_offer: "I offer services",
  home_cta_plans: "See plans",
  home_stat_sitters: "Sitters",
  home_stat_hosts: "Hosts",
  home_stat_verified: "Verified",
  home_four_title: "Four kinds of care. One AuPairly.",
  home_four_sub:
    "Book or offer childcare, caregiving, house sitting, and pet sitting — on the same trusted marketplace.",
  home_how_title: "How AuPairly works",
  home_how_sub: "From registration to your first booking conversation — designed for trust.",
  common_loading: "Loading…",
  common_save: "Save",
  common_cancel: "Cancel",
  common_continue: "Continue",
  common_back: "Back",
  common_error: "Something went wrong",
  common_success: "Saved",
  reviews_title: "Reviews",
  reviews_write: "Write a review",
  reviews_update: "Update review",
  reviews_how: "How was your experience with {name}?",
  reviews_comment_ph: "Share what stood out (public after both review)",
  reviews_submit: "Submit review",
  reviews_thanks: "Thanks — your review is saved.",
  reviews_empty: "No public reviews yet.",
  reviews_overall: "Overall",
  reviews_communication: "Communication",
  reviews_reliability: "Reliability",
  reviews_respect: "Respect & care",
  reviews_recommend: "Would recommend",
  reviews_private_note: "Private note to AuPairly (optional)",
  reviews_private_hint: "Never shown to the other party",
  reviews_public_response: "Public response",
  reviews_respond: "Respond publicly",
  reviews_hidden_mutual:
    "Reviews stay private until both of you leave one — or after 14 days (like Airbnb).",
  reviews_pending_title: "Reviews waiting for you",
  reviews_pending_body: "Rate people you've connected with. Both sides review; both see when ready.",
  reviews_leave: "Leave review",
  reviews_only_messaged: "You can review after messaging on AuPairly.",
  reviews_star: "stars",
  reviews_would_recommend: "Yes, I recommend them",
  reviews_from: "From",
  reviews_about_you: "Reviews about you",
  reviews_you_left: "Reviews you left",
  reviews_awaiting_them: "Waiting for their review to publish yours",
  reviews_both_public: "Both reviews are public",
  reviews_inbox: "My reviews",
  language_saved: "Language updated",
};

const zh: Dictionary = {
  ...en,
  brand_tagline: "为家人、挚爱、房屋与宠物提供可信赖的照护",
  nav_discover: "发现",
  nav_sitters: "照护者",
  nav_hosts: "雇主/家庭",
  nav_pricing: "价格",
  nav_login: "登录",
  nav_get_started: "开始使用",
  nav_dashboard: "控制台",
  nav_sign_out: "退出",
  nav_messages: "消息",
  nav_interests: "兴趣",
  nav_admin: "管理",
  nav_language: "语言",
  footer_marketplace: "市场",
  footer_trust: "信任与安全",
  footer_company: "公司",
  footer_childcare: "儿童照护",
  footer_caregiving: "成人照护",
  footer_house: "看家",
  footer_pets: "宠物照护",
  footer_all_sitters: "全部照护者",
  footer_how: "如何运作",
  footer_safety: "安全提示",
  footer_privacy: "隐私",
  footer_verify: "完成认证",
  footer_pricing: "价格",
  footer_guides: "指南",
  footer_support: "支持",
  footer_join: "免费加入",
  footer_blurb: "在一个可信平台上连接儿童照护、成人照护、看家与宠物照护。",
  home_hero_badge: "AuPairly · 家庭 · 房屋 · 宠物",
  home_hero_title: "为您提供可信赖的照护",
  home_hero_title_accent: "家人、挚爱、房屋与宠物。",
  home_hero_body: "儿童照护、成人照护、看家与宠物照护汇聚同一品牌。实名认证，安心匹配与沟通。",
  home_cta_need: "我需要帮助",
  home_cta_offer: "我提供服务",
  home_cta_plans: "查看套餐",
  home_stat_sitters: "照护者",
  home_stat_hosts: "家庭/雇主",
  home_stat_verified: "已认证",
  home_four_title: "四种照护，一个 AuPairly",
  home_four_sub: "在同一可信市场预订或提供儿童、成人、看家与宠物照护。",
  home_how_title: "AuPairly 如何运作",
  home_how_sub: "从注册到第一次沟通——以信任为核心。",
  common_loading: "加载中…",
  common_save: "保存",
  common_cancel: "取消",
  common_continue: "继续",
  common_back: "返回",
  common_error: "出了点问题",
  common_success: "已保存",
  reviews_title: "评价",
  reviews_write: "写评价",
  reviews_update: "更新评价",
  reviews_how: "与 {name} 的体验如何？",
  reviews_comment_ph: "分享亮点（双方评价后公开）",
  reviews_submit: "提交评价",
  reviews_thanks: "谢谢——评价已保存。",
  reviews_empty: "暂无公开评价。",
  reviews_overall: "总体",
  reviews_communication: "沟通",
  reviews_reliability: "可靠",
  reviews_respect: "尊重与关怀",
  reviews_recommend: "是否推荐",
  reviews_private_note: "给平台的私密备注（可选）",
  reviews_private_hint: "对方不可见",
  reviews_public_response: "公开回复",
  reviews_respond: "公开回复",
  reviews_hidden_mutual: "双方都评价后（或 14 天后）才公开，类似 Airbnb。",
  reviews_pending_title: "待您评价",
  reviews_pending_body: "为已联系的对象评分。双方互评后可见。",
  reviews_leave: "去评价",
  reviews_only_messaged: "在平台互发消息后才能评价。",
  reviews_star: "星",
  reviews_would_recommend: "是的，我推荐",
  reviews_from: "来自",
  reviews_about_you: "关于您的评价",
  reviews_you_left: "您写下的评价",
  reviews_awaiting_them: "等待对方评价后公开",
  reviews_both_public: "双方评价均已公开",
  reviews_inbox: "我的评价",
  language_saved: "语言已更新",
};

const hi: Dictionary = {
  ...en,
  brand_tagline: "आपके परिवार, प्रियजनों, घर और पालतू जानवरों के लिए भरोसेमंद देखभाल",
  nav_discover: "खोजें",
  nav_sitters: "देखभालकर्ता",
  nav_hosts: "मेज़बान",
  nav_pricing: "मूल्य",
  nav_login: "लॉग इन",
  nav_get_started: "शुरू करें",
  nav_dashboard: "डैशबोर्ड",
  nav_sign_out: "साइन आउट",
  nav_messages: "संदेश",
  nav_interests: "रुचि",
  nav_admin: "एडमिन",
  nav_language: "भाषा",
  footer_marketplace: "बाज़ार",
  footer_trust: "विश्वास और सुरक्षा",
  footer_company: "कंपनी",
  footer_childcare: "बच्चों की देखभाल",
  footer_caregiving: "देखभाल सेवा",
  footer_house: "घर की देखभाल",
  footer_pets: "पालतू देखभाल",
  footer_all_sitters: "सभी देखभालकर्ता",
  footer_how: "कैसे काम करता है",
  footer_safety: "सुरक्षा सुझाव",
  footer_privacy: "गोपनीयता",
  footer_verify: "सत्यापित करें",
  footer_pricing: "मूल्य",
  footer_guides: "गाइड",
  footer_support: "सहायता",
  footer_join: "मुफ़्त जुड़ें",
  footer_blurb:
    "एक भरोसेमंद बाज़ार पर बच्चों, वयस्कों, घर और पालतू जानवरों की देखभाल।",
  home_hero_badge: "AuPairly · परिवार · घर · पालतू",
  home_hero_title: "भरोसेमंद देखभाल आपके",
  home_hero_title_accent: "परिवार, प्रियजनों, घर और पालतू जानवरों के लिए।",
  home_hero_body:
    "बच्चों की देखभाल, केयरगिविंग, हाउस सिटिंग और पेट सिटिंग एक ही ब्रांड पर। सत्यापित लोग, सुरक्षित मेल-मिलाप।",
  home_cta_need: "मुझे मदद चाहिए",
  home_cta_offer: "मैं सेवा देता/देती हूँ",
  home_cta_plans: "योजनाएँ देखें",
  home_stat_sitters: "देखभालकर्ता",
  home_stat_hosts: "मेज़बान",
  home_stat_verified: "सत्यापित",
  home_four_title: "चार प्रकार की देखभाल। एक AuPairly।",
  home_four_sub: "एक ही भरोसेमंद प्लेटफ़ॉर्म पर बुक करें या सेवा दें।",
  home_how_title: "AuPairly कैसे काम करता है",
  home_how_sub: "पंजीकरण से पहली बातचीत तक — विश्वास के साथ।",
  common_loading: "लोड हो रहा है…",
  common_save: "सहेजें",
  common_cancel: "रद्द करें",
  common_continue: "आगे",
  common_back: "वापस",
  common_error: "कुछ गलत हुआ",
  common_success: "सहेजा गया",
  reviews_title: "समीक्षाएँ",
  reviews_write: "समीक्षा लिखें",
  reviews_update: "समीक्षा अपडेट करें",
  reviews_how: "{name} के साथ आपका अनुभव कैसा रहा?",
  reviews_comment_ph: "मुख्य बातें साझा करें (दोनों समीक्षा के बाद सार्वजनिक)",
  reviews_submit: "समीक्षा जमा करें",
  reviews_thanks: "धन्यवाद — आपकी समीक्षा सहेज ली गई।",
  reviews_empty: "अभी कोई सार्वजनिक समीक्षा नहीं।",
  reviews_overall: "समग्र",
  reviews_communication: "संवाद",
  reviews_reliability: "विश्वसनीयता",
  reviews_respect: "सम्मान और देखभाल",
  reviews_recommend: "सिफ़ारिश करेंगे",
  reviews_private_note: "AuPairly के लिए निजी नोट (वैकल्पिक)",
  reviews_private_hint: "दूसरे पक्ष को नहीं दिखेगा",
  reviews_public_response: "सार्वजनिक जवाब",
  reviews_respond: "सार्वजनिक जवाब दें",
  reviews_hidden_mutual:
    "दोनों समीक्षा लिखने तक (या 14 दिन बाद) निजी रहती हैं — Airbnb जैसा।",
  reviews_pending_title: "आपकी समीक्षा बाकी है",
  reviews_pending_body: "जिनसे जुड़ चुके हैं उन्हें रेट करें। दोनों पक्ष समीक्षा करते हैं।",
  reviews_leave: "समीक्षा दें",
  reviews_only_messaged: "AuPairly पर संदेश के बाद ही समीक्षा कर सकते हैं।",
  reviews_star: "स्टार",
  reviews_would_recommend: "हाँ, मैं सिफ़ारिश करता/करती हूँ",
  reviews_from: "से",
  reviews_about_you: "आपके बारे में समीक्षाएँ",
  reviews_you_left: "आपकी दी गई समीक्षाएँ",
  reviews_awaiting_them: "उनकी समीक्षा का इंतज़ार",
  reviews_both_public: "दोनों समीक्षाएँ सार्वजनिक हैं",
  reviews_inbox: "मेरी समीक्षाएँ",
  language_saved: "भाषा अपडेट हुई",
};

const es: Dictionary = {
  ...en,
  brand_tagline: "Cuidado de confianza para tu familia, seres queridos, hogar y mascotas",
  nav_discover: "Descubrir",
  nav_sitters: "Cuidadores",
  nav_hosts: "Anfitriones",
  nav_pricing: "Precios",
  nav_login: "Iniciar sesión",
  nav_get_started: "Empezar",
  nav_dashboard: "Panel",
  nav_sign_out: "Cerrar sesión",
  nav_messages: "Mensajes",
  nav_interests: "Intereses",
  nav_admin: "Admin",
  nav_language: "Idioma",
  footer_marketplace: "Mercado",
  footer_trust: "Confianza y seguridad",
  footer_company: "Empresa",
  footer_childcare: "Cuidado infantil",
  footer_caregiving: "Cuidado de adultos",
  footer_house: "Cuidado de casa",
  footer_pets: "Cuidado de mascotas",
  footer_all_sitters: "Todos los cuidadores",
  footer_how: "Cómo funciona",
  footer_safety: "Consejos de seguridad",
  footer_privacy: "Privacidad",
  footer_verify: "Verificarse",
  footer_pricing: "Precios",
  footer_guides: "Guías",
  footer_support: "Soporte",
  footer_join: "Únete gratis",
  footer_blurb:
    "Cuidado infantil, de adultos, de casa y de mascotas en un solo marketplace de confianza.",
  home_hero_badge: "AuPairly · familia · hogar · mascotas",
  home_hero_title: "Cuidado de confianza para tu",
  home_hero_title_accent: "familia, seres queridos, hogar y mascotas.",
  home_hero_body:
    "Cuidado infantil, de adultos, de casa y mascotas bajo una marca confiable. Personas verificadas. Conecta y coordina con seguridad.",
  home_cta_need: "Necesito ayuda",
  home_cta_offer: "Ofrezco servicios",
  home_cta_plans: "Ver planes",
  home_stat_sitters: "Cuidadores",
  home_stat_hosts: "Anfitriones",
  home_stat_verified: "Verificados",
  home_four_title: "Cuatro tipos de cuidado. Un AuPairly.",
  home_four_sub: "Reserva u ofrece los cuatro servicios en el mismo marketplace.",
  home_how_title: "Cómo funciona AuPairly",
  home_how_sub: "Del registro a la primera conversación — diseñado para la confianza.",
  common_loading: "Cargando…",
  common_save: "Guardar",
  common_cancel: "Cancelar",
  common_continue: "Continuar",
  common_back: "Atrás",
  common_error: "Algo salió mal",
  common_success: "Guardado",
  reviews_title: "Reseñas",
  reviews_write: "Escribir reseña",
  reviews_update: "Actualizar reseña",
  reviews_how: "¿Cómo fue tu experiencia con {name}?",
  reviews_comment_ph: "Comparte lo destacado (público cuando ambos reseñen)",
  reviews_submit: "Enviar reseña",
  reviews_thanks: "Gracias — tu reseña se guardó.",
  reviews_empty: "Aún no hay reseñas públicas.",
  reviews_overall: "General",
  reviews_communication: "Comunicación",
  reviews_reliability: "Fiabilidad",
  reviews_respect: "Respeto y cuidado",
  reviews_recommend: "Recomendaría",
  reviews_private_note: "Nota privada a AuPairly (opcional)",
  reviews_private_hint: "Nunca visible para la otra parte",
  reviews_public_response: "Respuesta pública",
  reviews_respond: "Responder públicamente",
  reviews_hidden_mutual:
    "Las reseñas se ocultan hasta que ambos dejen una — o tras 14 días (como Airbnb).",
  reviews_pending_title: "Reseñas pendientes",
  reviews_pending_body: "Valora a quienes te conectaste. Ambos reseñan; ambos ven cuando toca.",
  reviews_leave: "Dejar reseña",
  reviews_only_messaged: "Solo puedes reseñar tras mensajear en AuPairly.",
  reviews_star: "estrellas",
  reviews_would_recommend: "Sí, los recomiendo",
  reviews_from: "De",
  reviews_about_you: "Reseñas sobre ti",
  reviews_you_left: "Reseñas que dejaste",
  reviews_awaiting_them: "Esperando su reseña para publicar la tuya",
  reviews_both_public: "Ambas reseñas son públicas",
  reviews_inbox: "Mis reseñas",
  language_saved: "Idioma actualizado",
};

const fr: Dictionary = {
  ...en,
  brand_tagline: "Des soins de confiance pour votre famille, vos proches, votre maison et vos animaux",
  nav_discover: "Découvrir",
  nav_sitters: "Gardiens",
  nav_hosts: "Hôtes",
  nav_pricing: "Tarifs",
  nav_login: "Connexion",
  nav_get_started: "Commencer",
  nav_dashboard: "Tableau de bord",
  nav_sign_out: "Déconnexion",
  nav_messages: "Messages",
  nav_interests: "Intérêts",
  nav_admin: "Admin",
  nav_language: "Langue",
  footer_marketplace: "Place de marché",
  footer_trust: "Confiance et sécurité",
  footer_company: "Entreprise",
  footer_childcare: "Garde d'enfants",
  footer_caregiving: "Aide à domicile",
  footer_house: "Garde de maison",
  footer_pets: "Garde d'animaux",
  footer_all_sitters: "Tous les gardiens",
  footer_how: "Comment ça marche",
  footer_safety: "Conseils de sécurité",
  footer_privacy: "Confidentialité",
  footer_verify: "Se faire vérifier",
  footer_pricing: "Tarifs",
  footer_guides: "Guides",
  footer_support: "Assistance",
  footer_join: "Rejoindre gratuitement",
  footer_blurb:
    "Garde d'enfants, aide à domicile, maison et animaux — une place de marché de confiance.",
  home_hero_badge: "AuPairly · famille · maison · animaux",
  home_hero_title: "Des soins de confiance pour votre",
  home_hero_title_accent: "famille, vos proches, votre maison et vos animaux.",
  home_hero_body:
    "Garde d'enfants, aide aux proches, maison et animaux sous une même marque. Personnes vérifiées. Échangez en toute confiance.",
  home_cta_need: "J'ai besoin d'aide",
  home_cta_offer: "Je propose des services",
  home_cta_plans: "Voir les forfaits",
  home_stat_sitters: "Gardiens",
  home_stat_hosts: "Hôtes",
  home_stat_verified: "Vérifiés",
  home_four_title: "Quatre types de soins. Un AuPairly.",
  home_four_sub: "Réservez ou proposez les quatre services sur la même plateforme.",
  home_how_title: "Comment fonctionne AuPairly",
  home_how_sub: "De l'inscription à la première conversation — conçu pour la confiance.",
  common_loading: "Chargement…",
  common_save: "Enregistrer",
  common_cancel: "Annuler",
  common_continue: "Continuer",
  common_back: "Retour",
  common_error: "Une erreur s'est produite",
  common_success: "Enregistré",
  reviews_title: "Avis",
  reviews_write: "Écrire un avis",
  reviews_update: "Modifier l'avis",
  reviews_how: "Comment s'est passée votre expérience avec {name} ?",
  reviews_comment_ph: "Partagez les points forts (public après les deux avis)",
  reviews_submit: "Envoyer l'avis",
  reviews_thanks: "Merci — votre avis est enregistré.",
  reviews_empty: "Pas encore d'avis publics.",
  reviews_overall: "Global",
  reviews_communication: "Communication",
  reviews_reliability: "Fiabilité",
  reviews_respect: "Respect et bienveillance",
  reviews_recommend: "Recommanderait",
  reviews_private_note: "Note privée à AuPairly (optionnel)",
  reviews_private_hint: "Jamais visible par l'autre partie",
  reviews_public_response: "Réponse publique",
  reviews_respond: "Répondre publiquement",
  reviews_hidden_mutual:
    "Les avis restent privés jusqu'à ce que vous ayez tous les deux noté — ou après 14 jours (comme Airbnb).",
  reviews_pending_title: "Avis en attente",
  reviews_pending_body: "Notez les personnes contactées. Les deux parties notent ; les deux voient le résultat.",
  reviews_leave: "Laisser un avis",
  reviews_only_messaged: "Vous ne pouvez noter qu'après avoir échangé sur AuPairly.",
  reviews_star: "étoiles",
  reviews_would_recommend: "Oui, je les recommande",
  reviews_from: "De",
  reviews_about_you: "Avis à votre sujet",
  reviews_you_left: "Avis que vous avez laissés",
  reviews_awaiting_them: "En attente de leur avis pour publier le vôtre",
  reviews_both_public: "Les deux avis sont publics",
  reviews_inbox: "Mes avis",
  language_saved: "Langue mise à jour",
};

export const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  zh,
  hi,
  es,
  fr,
};

export function getDictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale] || DICTIONARIES.en;
}

export function t(
  dict: Dictionary,
  key: keyof Dictionary,
  vars?: Record<string, string>
): string {
  let s = dict[key] || DICTIONARIES.en[key] || String(key);
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
  }
  return s;
}
