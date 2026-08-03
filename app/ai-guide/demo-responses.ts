import type { Language } from "../i18n/translations";

export type DemoTopic = "emergency" | "hotel" | "attraction" | "transport" | "budget" | "namibia" | "planning" | "greeting" | "general";

const topicPatterns: Array<[DemoTopic, RegExp]> = [
  ["emergency", /emergency|danger|police|ambulance|hospital|urgent|lost|help me|urgence|danger|police|ambulance|h[oô]pital|urgente|peligro|emerg[eê]ncia|socorro|紧急|危险|警察|救护车|医院/i],
  ["hotel", /hotel|hostel|lodge|stay|accommodation|room|h[oô]tel|auberge|h[eé]bergement|alojamiento|hospedagem|acomoda[cç][aã]o|酒店|住宿|旅馆/i],
  ["attraction", /attraction|sight|visit|activity|things to do|attraction|visiter|activit[eé]|atracci[oó]n|actividad|atra[cç][aã]o|atividade|景点|游览|活动/i],
  ["transport", /transport|bus|taxi|drive|car|train|flight|getting around|transporte|autob[uú]s|ônibus|t[aá]xi|交通|公交|出租车|火车|航班/i],
  ["budget", /budget|cheap|cost|price|money|afford|budget|prix|co[uû]t|presupuesto|barato|precio|or[cç]amento|custo|预[算算]|便宜|费用|价格/i],
  ["namibia", /namibia|namibie|namíbia|namíbia|windhoek|swakopmund|etosha|sossusvlei|纳米比亚|温得和克/i],
  ["planning", /plan|itinerary|trip|days|week|route|voyage|itin[eé]raire|planifier|viaje|itinerario|planear|viagem|roteiro|planejar|行程|旅行|计划/i],
  ["greeting", /^(hi|hello|hey|good (morning|afternoon|evening)|bonjour|salut|hola|buenas|ol[aá]|bom dia|boa tarde|你好|您好|嗨)[!,.\s]*$/i],
];

export function detectDemoTopic(message: string): DemoTopic {
  return topicPatterns.find(([, pattern]) => pattern.test(message))?.[0] ?? "general";
}

export const demoResponses: Record<DemoTopic, Record<Language, string>> = {
  emergency: {
    en: "If you may be in immediate danger, move to a safe place if you can and contact local emergency authorities now. Ask a nearby hotel, guide, police officer, or trusted local person for direct help. Demo mode cannot verify your location or send assistance.",
    fr: "Si vous êtes peut-être en danger immédiat, mettez-vous en sécurité si possible et contactez maintenant les services d’urgence locaux. Demandez directement de l’aide à un hôtel, un guide, un policier ou une personne locale de confiance. Le mode démo ne peut ni vérifier votre position ni envoyer de secours.",
    es: "Si puedes estar en peligro inmediato, ve a un lugar seguro si es posible y contacta ahora con las autoridades locales de emergencia. Pide ayuda directa a un hotel, guía, policía o persona local de confianza. El modo de demostración no puede verificar tu ubicación ni enviar ayuda.",
    pt: "Se você estiver em perigo imediato, vá para um local seguro se puder e contate agora as autoridades locais de emergência. Peça ajuda direta a um hotel, guia, policial ou pessoa local de confiança. O modo de demonstração não pode verificar sua localização nem enviar ajuda.",
    zh: "如果您可能正面临紧急危险，请尽量前往安全地点，并立即联系当地紧急救援部门。向附近的酒店、导游、警察或可信赖的当地人直接求助。演示模式无法确认您的位置或派出救援。",
  },
  hotel: {
    en: "For accommodation, start with your destination, nightly budget, dates, and preferred style. In Namibia, Windhoek has city hotels and guesthouses, Swakopmund has coastal stays, and safari routes often use lodges or camps. Compare recent reviews and confirm availability directly before paying.",
    fr: "Pour l’hébergement, indiquez votre destination, budget par nuit, dates et style préféré. En Namibie, Windhoek propose hôtels et maisons d’hôtes, Swakopmund des séjours côtiers, et les circuits safari utilisent souvent lodges ou camps. Comparez les avis récents et confirmez la disponibilité avant de payer.",
    es: "Para el alojamiento, empieza por el destino, presupuesto por noche, fechas y estilo preferido. En Namibia, Windhoek ofrece hoteles y casas de huéspedes, Swakopmund estancias costeras y las rutas de safari suelen usar lodges o campamentos. Compara reseñas recientes y confirma la disponibilidad antes de pagar.",
    pt: "Para hospedagem, comece pelo destino, orçamento por noite, datas e estilo preferido. Na Namíbia, Windhoek tem hotéis e pousadas, Swakopmund tem estadias costeiras e rotas de safári costumam usar lodges ou acampamentos. Compare avaliações recentes e confirme a disponibilidade antes de pagar.",
    zh: "寻找住宿时，请先说明目的地、每晚预算、日期和偏好类型。在纳米比亚，温得和克有城市酒店和旅馆，斯瓦科普蒙德有海滨住宿，狩猎路线则常见山林小屋或营地。付款前请比较近期评价并直接确认房态。",
  },
  attraction: {
    en: "A strong Namibia shortlist includes Sossusvlei’s dunes, Etosha National Park, Swakopmund’s coast, Fish River Canyon, and Windhoek’s cultural stops. Tell me your destination, pace, and interests and I can turn that into a balanced day plan.",
    fr: "Une excellente sélection en Namibie comprend les dunes de Sossusvlei, le parc national d’Etosha, la côte de Swakopmund, Fish River Canyon et les sites culturels de Windhoek. Donnez-moi votre destination, rythme et centres d’intérêt pour créer une journée équilibrée.",
    es: "Una excelente selección en Namibia incluye las dunas de Sossusvlei, el Parque Nacional Etosha, la costa de Swakopmund, Fish River Canyon y las visitas culturales de Windhoek. Dime tu destino, ritmo e intereses y prepararé un día equilibrado.",
    pt: "Uma ótima seleção na Namíbia inclui as dunas de Sossusvlei, o Parque Nacional Etosha, a costa de Swakopmund, Fish River Canyon e atrações culturais de Windhoek. Diga seu destino, ritmo e interesses para eu montar um dia equilibrado.",
    zh: "纳米比亚值得优先考虑的景点包括苏丝斯黎沙丘、埃托沙国家公园、斯瓦科普蒙德海岸、鱼河大峡谷和温得和克的文化景点。告诉我目的地、节奏和兴趣，我可以安排均衡的一日计划。",
  },
  transport: {
    en: "Transport depends heavily on the route. Cities may have taxis or transfers, while Namibia’s long-distance highlights are often easiest by rental car, scheduled shuttle, or guided tour. Check road conditions, fuel stops, insurance, and daylight driving times before setting out.",
    fr: "Le transport dépend beaucoup de l’itinéraire. Les villes proposent taxis ou transferts, tandis que les grands sites namibiens sont souvent plus accessibles en voiture de location, navette ou circuit guidé. Vérifiez routes, carburant, assurance et temps de conduite de jour avant de partir.",
    es: "El transporte depende mucho de la ruta. Las ciudades pueden tener taxis o traslados, mientras que los grandes atractivos de Namibia suelen ser más accesibles en coche de alquiler, transporte programado o tour guiado. Revisa carreteras, combustible, seguro y horas de luz antes de salir.",
    pt: "O transporte depende muito da rota. As cidades podem ter táxis ou traslados, enquanto os grandes destaques da Namíbia costumam ser mais acessíveis de carro alugado, traslado programado ou passeio guiado. Verifique estradas, combustível, seguro e tempo de condução diurna.",
    zh: "交通方式很大程度取决于路线。城市里可能有出租车或接送服务，而前往纳米比亚的长途景点通常更适合租车、定时班车或跟团游。出发前请确认路况、加油点、保险和白天驾驶时间。",
  },
  budget: {
    en: "Build your budget in five parts: accommodation, transport, food, activities, and a 10–15% buffer. Save by travelling outside peak dates, comparing guesthouses with lodges, and grouping nearby sights. Share your trip length and currency for a simple demo breakdown.",
    fr: "Répartissez votre budget en cinq postes : hébergement, transport, repas, activités et une marge de 10 à 15 %. Économisez hors saison, comparez maisons d’hôtes et lodges, et regroupez les sites proches. Indiquez durée et devise pour une estimation simple.",
    es: "Divide tu presupuesto en cinco partes: alojamiento, transporte, comida, actividades y un margen del 10–15 %. Ahorra viajando fuera de temporada alta, comparando casas de huéspedes con lodges y agrupando lugares cercanos. Indica duración y moneda para un cálculo sencillo.",
    pt: "Divida seu orçamento em cinco partes: hospedagem, transporte, alimentação, atividades e uma reserva de 10–15%. Economize fora da alta temporada, comparando pousadas e lodges e agrupando atrações próximas. Informe duração e moeda para uma estimativa simples.",
    zh: "可将预算分为五部分：住宿、交通、餐饮、活动，以及 10–15% 的备用金。错峰出行、比较旅馆与山林小屋、集中游览附近景点都能节省费用。告诉我行程天数和币种，我可提供简单的演示预算。",
  },
  namibia: {
    en: "Namibia rewards a slower route: Windhoek, Sossusvlei, Swakopmund, Damaraland, and Etosha make a classic circuit. Distances are large, so allow rest time and avoid overloading each day. What dates, trip length, and travel style do you have in mind?",
    fr: "La Namibie se découvre mieux sans se presser : Windhoek, Sossusvlei, Swakopmund, Damaraland et Etosha forment un circuit classique. Les distances sont grandes ; prévoyez du repos et ne surchargez pas les journées. Quelles dates, durée et style envisagez-vous ?",
    es: "Namibia se disfruta mejor con calma: Windhoek, Sossusvlei, Swakopmund, Damaraland y Etosha forman una ruta clásica. Las distancias son grandes; incluye descansos y no sobrecargues cada día. ¿Qué fechas, duración y estilo tienes en mente?",
    pt: "A Namíbia é melhor aproveitada sem pressa: Windhoek, Sossusvlei, Swakopmund, Damaraland e Etosha formam um circuito clássico. As distâncias são grandes; reserve descanso e não sobrecarregue os dias. Quais datas, duração e estilo você imagina?",
    zh: "纳米比亚适合放慢节奏：温得和克、苏丝斯黎、斯瓦科普蒙德、达马拉兰和埃托沙组成经典环线。各地距离较远，请安排休息，不要让每天过于紧凑。您计划何时出发、旅行几天、偏好什么风格？",
  },
  planning: {
    en: "I can sketch a useful demo itinerary. Send your destination, number of days, approximate budget, group size, and top interests. I’ll balance travel time with one or two main experiences per day.",
    fr: "Je peux esquisser un itinéraire de démonstration utile. Indiquez destination, nombre de jours, budget approximatif, taille du groupe et principaux intérêts. J’équilibrerai les déplacements avec une ou deux expériences majeures par jour.",
    es: "Puedo crear un itinerario de demostración útil. Indica destino, número de días, presupuesto aproximado, tamaño del grupo e intereses principales. Equilibraré los traslados con una o dos experiencias importantes por día.",
    pt: "Posso criar um roteiro de demonstração útil. Informe destino, número de dias, orçamento aproximado, tamanho do grupo e principais interesses. Vou equilibrar os deslocamentos com uma ou duas experiências principais por dia.",
    zh: "我可以为您拟定实用的演示行程。请提供目的地、天数、大致预算、同行人数和主要兴趣。我会平衡交通时间，每天安排一到两个重点体验。",
  },
  greeting: {
    en: "Hello! I’m TourMate AI in demo mode. I can help you sketch a trip, compare travel styles, and explore ideas for stays, attractions, transport, budgets, and Namibia. What are you dreaming about?",
    fr: "Bonjour ! Je suis TourMate AI en mode démo. Je peux vous aider à préparer un voyage et explorer hébergements, attractions, transports, budgets et la Namibie. De quoi rêvez-vous ?",
    es: "¡Hola! Soy TourMate AI en modo de demostración. Puedo ayudarte a preparar un viaje y explorar alojamientos, atracciones, transporte, presupuestos y Namibia. ¿Con qué sueñas?",
    pt: "Olá! Sou o TourMate AI em modo de demonstração. Posso ajudar a esboçar uma viagem e explorar hospedagem, atrações, transporte, orçamentos e a Namíbia. Com o que você está sonhando?",
    zh: "您好！我是演示模式下的 TourMate AI。我可以帮助您规划旅行，并探索住宿、景点、交通、预算和纳米比亚相关灵感。您梦想着怎样的旅程？",
  },
  general: {
    en: "I can help with that in demo mode. Add a destination and a little context—such as dates, budget, group size, or what matters most—and I’ll offer a more useful travel suggestion.",
    fr: "Je peux vous aider en mode démo. Ajoutez une destination et quelques précisions — dates, budget, taille du groupe ou priorités — et je proposerai une suggestion plus utile.",
    es: "Puedo ayudarte con eso en modo de demostración. Añade un destino y algo de contexto —fechas, presupuesto, tamaño del grupo o prioridades— y ofreceré una sugerencia más útil.",
    pt: "Posso ajudar com isso no modo de demonstração. Adicione um destino e algum contexto — datas, orçamento, tamanho do grupo ou prioridades — e oferecerei uma sugestão mais útil.",
    zh: "我可以在演示模式下提供帮助。请补充目的地和一些背景信息，例如日期、预算、同行人数或最看重的内容，我会给出更有用的旅行建议。",
  },
};
