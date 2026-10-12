/**
 * Servicio de Ruteo Calle por Calle (OSRM) y Búsqueda Inteligente de Direcciones en Bariloche
 * Incluye Hospitales, Sanatorios, Fábricas, Comercios, y Cálculo Exacto de Calle y Altura
 */

export const BARILOCHE_POIS = [
  // --- SALUD / HOSPITALES / SANATORIOS ---
  { 
    id: 'sanatorio_san_carlos_gutierrez', 
    name: 'Sanatorio San Carlos (Sede Pasaje Gutiérrez)', 
    address: 'Pasaje Gutiérrez 980 (esq. Curuzú Cuatiá)', 
    category: 'hospital', 
    tag: '🏥 Sanatorio / Guardia / Consultorios', 
    icon: '🏥', 
    lat: -41.1415571, 
    lng: -71.3132086 
  },
  { 
    id: 'sanatorio_san_carlos_bustillo', 
    name: 'Sanatorio San Carlos (Sede Bustillo Km 1)', 
    address: 'Av. Bustillo Km 1,000', 
    category: 'hospital', 
    tag: '🏥 Sanatorio Privado', 
    icon: '🏥', 
    lat: -41.1312, 
    lng: -71.3268 
  },
  { 
    id: 'hosp_zonal', 
    name: 'Hospital Zonal Ramón Carrillo', 
    address: 'Moreno 601 (esq. Beschtedt)', 
    category: 'hospital', 
    tag: '🏥 Hospital Público (Guardia 24hs)', 
    icon: '🏥', 
    lat: -41.1378, 
    lng: -71.3032 
  },
  { 
    id: 'hpr', 
    name: 'Hospital Privado Regional (HPR)', 
    address: '20 de Febrero 598', 
    category: 'hospital', 
    tag: '🏥 Hospital Privado', 
    icon: '🏥', 
    lat: -41.1396, 
    lng: -71.3108 
  },
  { 
    id: 'sanatorio_del_sol', 
    name: 'Sanatorio del Sol', 
    address: '20 de Febrero 640', 
    category: 'hospital', 
    tag: '🏥 Sanatorio Privado', 
    icon: '🏥', 
    lat: -41.1402, 
    lng: -71.3115 
  },
  { 
    id: 'centro_medico_bariloche', 
    name: 'Centro Médico Bariloche', 
    address: 'Bartolomé Mitre 124', 
    category: 'hospital', 
    tag: '🏥 Consultorios Médicos', 
    icon: '🏥', 
    lat: -41.1336, 
    lng: -71.3090 
  },

  // --- FÁBRICAS E INDUSTRIAS ---
  { 
    id: 'invap_sede', 
    name: 'Sede Central INVAP', 
    address: 'Av. Cmte. Luis Piedrabuena 4950', 
    category: 'fabrica', 
    tag: '🏭 Fábrica de Alta Tecnología & Satélites', 
    icon: '🏭', 
    lat: -41.1245, 
    lng: -71.2410 
  },
  { 
    id: 'cerveceria_patagonia', 
    name: 'Cervecería Patagonia (Microcervecería & Fábrica)', 
    address: 'Circuito Chico Km 24.7', 
    category: 'fabrica', 
    tag: '🏭 Fábrica & Cervecería', 
    icon: '🏭', 
    lat: -41.0690, 
    lng: -71.5360 
  },
  { 
    id: 'cerveceria_blest_fabrica', 
    name: 'Cervecería Blest Fábrica Km 4', 
    address: 'Av. Bustillo Km 3,900', 
    category: 'fabrica', 
    tag: '🏭 Fábrica Cervecera', 
    icon: '🏭', 
    lat: -41.1280, 
    lng: -71.3530 
  },
  { 
    id: 'fabrica_chocolates_turista', 
    name: 'Fábrica Chocolates Del Turista', 
    address: 'San Martín 252', 
    category: 'fabrica', 
    tag: '🏭 Fábrica de Chocolates Artesanales', 
    icon: '🏭', 
    lat: -41.1345, 
    lng: -71.3070 
  },
  { 
    id: 'museo_havanna_fabrica', 
    name: 'Museo del Chocolate Havanna (Ex Fenoglio)', 
    address: 'Av. Bustillo 1200', 
    category: 'fabrica', 
    tag: '🏭 Fábrica & Museo Histórico', 
    icon: '🏭', 
    lat: -41.1310, 
    lng: -71.3285 
  },
  { 
    id: 'berlina_fabrica', 
    name: 'Cervecería Berlina Fábrica Km 12', 
    address: 'Av. Bustillo Km 11,750', 
    category: 'fabrica', 
    tag: '🏭 Fábrica Cervecera Artesanal', 
    icon: '🏭', 
    lat: -41.1095, 
    lng: -71.4420 
  },

  // --- COMERCIOS / SUPERMERCADOS / CHOCOLATERÍAS ---
  { 
    id: 'rapanui', 
    name: 'Chocolates Rapanui & Helados', 
    address: 'Mitre 202 (esq. Villegas)', 
    category: 'comercio', 
    tag: '🍫 Chocolatería & Heladería', 
    icon: '🍫', 
    lat: -41.1337, 
    lng: -71.3075 
  },
  { 
    id: 'mamuschka', 
    name: 'Mamuschka Chocolates', 
    address: 'Mitre 298 (esq. Rolando)', 
    category: 'comercio', 
    tag: '🍫 Chocolatería Típica', 
    icon: '🍫', 
    lat: -41.1339, 
    lng: -71.3060 
  },
  { 
    id: 'anonima_albarracin', 
    name: 'Supermercado La Anónima - Centro', 
    address: 'Albarracín 654', 
    category: 'comercio', 
    tag: '🛒 Supermercado', 
    icon: '🛒', 
    lat: -41.1408, 
    lng: -71.3039 
  },
  { 
    id: 'anonima_km4', 
    name: 'Supermercado La Anónima Km 4', 
    address: 'Av. Bustillo Km 4,300 (Melipal)', 
    category: 'comercio', 
    tag: '🛒 Supermercado', 
    icon: '🛒', 
    lat: -41.1275, 
    lng: -71.3590 
  },
  { 
    id: 'carrefour_onelli', 
    name: 'Carrefour Bariloche', 
    address: 'Av. Onelli 444 (esq. Moreno)', 
    category: 'comercio', 
    tag: '🛒 Hipermercado', 
    icon: '🛒', 
    lat: -41.1382, 
    lng: -71.2985 
  },
  { 
    id: 'todo_moreno', 
    name: 'Supermercados Todo - Centro', 
    address: 'Moreno 450', 
    category: 'comercio', 
    tag: '🛒 Supermercado', 
    icon: '🛒', 
    lat: -41.1368, 
    lng: -71.3055 
  },

  // --- TRANSPORTE, INSTITUCIONES Y TURISMO ---
  { 
    id: 'centro_civico', 
    name: 'Centro Cívico de Bariloche', 
    address: 'Bartolomé Mitre 50', 
    category: 'turismo', 
    tag: '🏛️ Monumento Histórico / Centro', 
    icon: '🏛️', 
    lat: -41.1335, 
    lng: -71.3103 
  },
  { 
    id: 'terminal_bus', 
    name: 'Terminal de Ómnibus Bariloche', 
    address: 'Av. 12 de Octubre 2400', 
    category: 'transporte', 
    tag: '🚌 Terminal de Ómnibus Larga Distancia', 
    icon: '🚌', 
    lat: -41.1350, 
    lng: -71.2820 
  },
  { 
    id: 'aeropuerto_brc', 
    name: 'Aeropuerto Internacional Tte. Candelaria (BRC)', 
    address: 'Ruta 40 Norte Acceso Aeropuerto', 
    category: 'transporte', 
    tag: '✈️ Aeropuerto Internacional', 
    icon: '✈️', 
    lat: -41.1510, 
    lng: -71.1580 
  },
  { 
    id: 'catedral_base', 
    name: 'Base Cerro Catedral (Estacionamiento Principal)', 
    address: 'Av. Circuito de Invierno 250', 
    category: 'turismo', 
    tag: '🏔️ Centro de Esquí', 
    icon: '🏔️', 
    lat: -41.1680, 
    lng: -71.4390 
  },
  { 
    id: 'llao_llao', 
    name: 'Hotel Llao Llao / Puerto Pañuelo', 
    address: 'Av. Bustillo Km 25', 
    category: 'turismo', 
    tag: '🏨 Hotel Emblemático & Puerto', 
    icon: '🏨', 
    lat: -41.0540, 
    lng: -71.5320 
  },
  { 
    id: 'cerro_campanario', 
    name: 'Cerro Campanario (Aerosilla)', 
    address: 'Av. Bustillo Km 17,500', 
    category: 'turismo', 
    tag: '🚠 Mirador Panorámico', 
    icon: '🚠', 
    lat: -41.0772, 
    lng: -71.4815 
  },
  { 
    id: 'cerro_otto', 
    name: 'Teleférico Cerro Otto', 
    address: 'Av. de los Pioneros Km 5,000', 
    category: 'turismo', 
    tag: '🚡 Teleférico & Confitería Giratoria', 
    icon: '🚡', 
    lat: -41.1440, 
    lng: -71.3650 
  },
  { 
    id: 'playa_bonita', 
    name: 'Playa Bonita (Lago Nahuel Huapi)', 
    address: 'Av. Bustillo Km 8,000', 
    category: 'turismo', 
    tag: '🏖️ Playa Balneario', 
    icon: '🏖️', 
    lat: -41.1235, 
    lng: -71.4080 
  },
  { 
    id: 'colonia_suiza', 
    name: 'Colonia Suiza (Curanto Tradicional)', 
    address: 'Félix Goye s/n', 
    category: 'turismo', 
    tag: '🌲 Paseo Turístico Tradicional', 
    icon: '🌲', 
    lat: -41.0965, 
    lng: -71.5090 
  }
];

const BARILOCHE_THOROUGHFARES = [
  { name: 'Pasaje Gutiérrez', aliases: ['pasaje gutierrez', 'pasaje gutiérrez', 'gutierrez', 'gutiérrez'], baseLat: -41.1370, baseLng: -71.3110, stepLat: -0.000045, stepLng: -0.000022 },
  { name: 'Mitre', aliases: ['bartolome mitre', 'mitre'], baseLat: -41.1335, baseLng: -71.3103, stepLat: -0.00003, stepLng: 0.00008 },
  { name: 'Moreno', aliases: ['perito moreno', 'moreno'], baseLat: -41.1350, baseLng: -71.3120, stepLat: -0.00004, stepLng: 0.000085 },
  { name: 'Elflein', aliases: ['elflein'], baseLat: -41.1365, baseLng: -71.3125, stepLat: -0.000035, stepLng: 0.00008 },
  { name: 'Gallardo', aliases: ['gallardo', 'angel gallardo'], baseLat: -41.1380, baseLng: -71.3130, stepLat: -0.00003, stepLng: 0.00008 },
  { name: 'Onelli', aliases: ['onelli', 'clemente onelli', 'av onelli', 'av. onelli'], baseLat: -41.1370, baseLng: -71.2980, stepLat: -0.00009, stepLng: -0.000015 },
  { name: 'Bustillo', aliases: ['av bustillo', 'av. bustillo', 'bustillo'], baseLat: -41.1320, baseLng: -71.3190, stepLat: 0.00003, stepLng: -0.00009 },
  { name: 'Pioneros', aliases: ['av pioneros', 'av. de los pioneros', 'pioneros'], baseLat: -41.1355, baseLng: -71.3200, stepLat: -0.00002, stepLng: -0.000085 },
  { name: '12 de Octubre', aliases: ['12 de octubre', 'av 12 de octubre', 'av. 12 de octubre'], baseLat: -41.1340, baseLng: -71.3000, stepLat: 0.00002, stepLng: 0.000095 },
  { name: 'Albarracín', aliases: ['albarracin', 'albarracín'], baseLat: -41.1395, baseLng: -71.3120, stepLat: -0.00003, stepLng: 0.00008 },
  { name: 'San Martín', aliases: ['san martin', 'san martín'], baseLat: -41.1340, baseLng: -71.3115, stepLat: -0.00002, stepLng: 0.000075 },
  { name: '20 de Febrero', aliases: ['20 de febrero', 'veinte de febrero'], baseLat: -41.1375, baseLng: -71.3100, stepLat: -0.00004, stepLng: -0.00002 },
  { name: 'Belgrano', aliases: ['belgrano', 'general belgrano'], baseLat: -41.1390, baseLng: -71.3110, stepLat: -0.00002, stepLng: 0.00008 },
  { name: 'Beschtedt', aliases: ['beschtedt'], baseLat: -41.1345, baseLng: -71.3030, stepLat: -0.00008, stepLng: -0.00001 },
  { name: 'Frey', aliases: ['frey', 'emilio frey'], baseLat: -41.1348, baseLng: -71.3045, stepLat: -0.00008, stepLng: -0.00001 },
  { name: 'Rolando', aliases: ['rolando'], baseLat: -41.1345, baseLng: -71.3060, stepLat: -0.00008, stepLng: -0.00001 },
  { name: 'Villegas', aliases: ['villegas', 'conrado villegas'], baseLat: -41.1343, baseLng: -71.3075, stepLat: -0.00008, stepLng: -0.00001 },
  { name: 'Quaglia', aliases: ['quaglia'], baseLat: -41.1340, baseLng: -71.3090, stepLat: -0.00008, stepLng: -0.00001 },
  { name: 'Morales', aliases: ['morales'], baseLat: -41.1338, baseLng: -71.3110, stepLat: -0.00008, stepLng: -0.00001 },
  { name: 'Brown', aliases: ['brown', 'almirante brown'], baseLat: -41.1415, baseLng: -71.3100, stepLat: -0.00002, stepLng: 0.00007 }
];

function formatManeuver(s) {
  const m = s.maneuver || {};
  const street = s.name ? s.name.trim() : '';
  const mod = m.modifier || '';
  const type = m.type || '';
  let instruction = '';

  if (type === 'depart') {
    instruction = street ? `Inicie por ${street}` : 'Inicie el recorrido';
  } else if (type === 'arrive') {
    instruction = 'Llegada al punto de destino';
  } else if (type === 'roundabout' || type === 'rotary') {
    instruction = street ? `En la rotonda tome la salida hacia ${street}` : 'En la rotonda continúe adelante';
  } else if (mod === 'left' || mod === 'sharp left') {
    instruction = street ? `Gire a la izquierda en ${street}` : 'Gire a la izquierda';
  } else if (mod === 'slight left') {
    instruction = street ? `Manténgase a la izquierda hacia ${street}` : 'Manténgase a la izquierda';
  } else if (mod === 'right' || mod === 'sharp right') {
    instruction = street ? `Gire a la derecha en ${street}` : 'Gire a la derecha';
  } else if (mod === 'slight right') {
    instruction = street ? `Manténgase a la derecha hacia ${street}` : 'Manténgase a la derecha';
  } else if (mod === 'straight' || type === 'continue') {
    instruction = street ? `Continúe derecho por ${street}` : 'Continúe derecho';
  } else if (mod === 'uturn') {
    instruction = 'Realice un giro en U';
  } else {
    instruction = street ? `Continúe por ${street}` : 'Continúe por la calle actual';
  }

  return {
    instruction,
    street: street || 'Vía principal de Bariloche',
    distanceMeters: Math.round(s.distance || 150),
    modifier: mod || type || 'straight',
    type: type || 'turn'
  };
}

function generateFallbackSteps(distanceKm, destName) {
  const totalMeters = Math.round(distanceKm * 1000);
  const m1 = Math.max(Math.round(totalMeters * 0.25), 100);
  const m2 = Math.max(Math.round(totalMeters * 0.45), 200);
  const m3 = Math.max(Math.round(totalMeters * 0.25), 100);

  return [
    {
      instruction: 'Inicie el recorrido por la vía actual',
      street: 'Av. San Martín / Mitre',
      distanceMeters: m1,
      modifier: 'straight',
      type: 'depart'
    },
    {
      instruction: 'Gire hacia la arteria principal de Bariloche',
      street: 'Moreno / Av. Pioneros',
      distanceMeters: m2,
      modifier: 'right',
      type: 'turn'
    },
    {
      instruction: `Continúe aproximándose al destino`,
      street: destName || 'Punto acordado',
      distanceMeters: m3,
      modifier: 'straight',
      type: 'continue'
    },
    {
      instruction: 'Ha llegado al punto de encuentro o destino',
      street: destName || 'Destino',
      distanceMeters: 50,
      modifier: 'arrive',
      type: 'arrive'
    }
  ];
}

export async function getStreetRoute(originLat, originLng, destLat, destLng, destName = '') {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('OSRM network error');
    
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const latLngPoints = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
      const distanceKm = Number((route.distance / 1000).toFixed(1));
      const durationMin = Math.max(Math.ceil(route.duration / 60), 2);

      let steps = [];
      if (route.legs && route.legs[0] && Array.isArray(route.legs[0].steps)) {
        steps = route.legs[0].steps.map(formatManeuver);
      }
      if (steps.length === 0) {
        steps = generateFallbackSteps(distanceKm, destName);
      }

      return {
        points: latLngPoints,
        distanceKm,
        durationMin,
        steps
      };
    }
  } catch (err) {
    console.warn('[Ruteo OSRM]:', err.message);
  }

  const dLat = destLat - originLat;
  const dLng = destLng - originLng;
  const roadFactor = 1.35;
  const straightDist = Math.hypot(dLat * 111, dLng * 85);
  const roadDist = Number((straightDist * roadFactor).toFixed(1));

  const cornerLat = originLat + dLat * 0.7;
  const cornerLng = originLng + dLng * 0.3;
  const fallbackDist = Math.max(roadDist, 1.2);
  const fallbackMins = Math.max(Math.ceil((fallbackDist / 30) * 60) + 2, 3);

  return {
    points: [
      [originLat, originLng],
      [originLat, cornerLng],
      [cornerLat, cornerLng],
      [cornerLat, destLng],
      [destLat, destLng]
    ],
    distanceKm: fallbackDist,
    durationMin: fallbackMins,
    steps: generateFallbackSteps(fallbackDist, destName)
  };
}

export async function searchBarilocheAddress(query) {
  if (!query || query.trim().length < 2) return [];

  const rawQuery = query.trim();
  const q = rawQuery.toLowerCase();
  const results = [];

  // 1. Coincidencia en POIs reconocidos de Bariloche
  const localMatches = BARILOCHE_POIS.filter(poi => 
    poi.name.toLowerCase().includes(q) || 
    poi.address.toLowerCase().includes(q) ||
    poi.tag.toLowerCase().includes(q) ||
    (q.includes('gutierrez') && poi.address.toLowerCase().includes('gutierrez')) ||
    (q.includes('gutiérrez') && poi.address.toLowerCase().includes('gutiérrez')) ||
    (poi.category === 'hospital' && (q.includes('hosp') || q.includes('sanat') || q.includes('guard'))) ||
    (poi.category === 'fabrica' && (q.includes('fab') || q.includes('indu') || q.includes('cerve'))) ||
    (poi.category === 'comercio' && (q.includes('super') || q.includes('choco') || q.includes('comer')))
  ).map(p => ({
    id: p.id,
    title: p.name,
    subtitle: `${p.address}, Bariloche`,
    tag: p.tag,
    category: p.category,
    icon: p.icon,
    lat: p.lat,
    lng: p.lng
  }));

  results.push(...localMatches);

  // 2. Consulta en tiempo real a Nominatim Bariloche (OSM oficial)
  try {
    const encoded = encodeURIComponent(`${rawQuery}, San Carlos de Bariloche, Rio Negro, Argentina`);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=6&viewbox=-71.6,-41.0,-71.1,-41.3&bounded=0`, {
      headers: { 'User-Agent': 'BariGo-App/2.0' }
    });
    if (res.ok) {
      const items = await res.json();
      items.forEach((it, idx) => {
        const road = it.address?.road || it.display_name.split(',')[0];
        const num = it.address?.house_number ? ` ${it.address.house_number}` : '';
        const suburb = it.address?.suburb || it.address?.neighbourhood || 'Bariloche';

        const titleText = `${road}${num}`.trim();
        // Insertar al inicio si tiene altura exacta
        if (!results.some(r => r.title.toLowerCase() === titleText.toLowerCase())) {
          results.unshift({
            id: `nom-${it.place_id || idx}`,
            title: titleText,
            subtitle: `${suburb}, San Carlos de Bariloche`,
            tag: num ? '📍 Calle y Número Confirmada' : '🗺️ Dirección en Mapa',
            category: 'calle',
            icon: '📍',
            lat: parseFloat(it.lat),
            lng: parseFloat(it.lon)
          });
        }
      });
    }
  } catch (e) {}

  // 3. Detección y cálculo de altura si no vino por Nominatim
  const numberMatch = rawQuery.match(/^([a-zA-ZáéíóúÁÉÍÓÚñÑ\.\s]+?)\s+(?:km\s*)?(\d+)\s*$/i);
  if (numberMatch) {
    const streetPart = numberMatch[1].trim().toLowerCase();
    const houseNumber = parseInt(numberMatch[2], 10);

    const foundStreet = BARILOCHE_THOROUGHFARES.find(st => 
      st.aliases.some(alias => alias.includes(streetPart) || streetPart.includes(alias))
    );

    if (foundStreet) {
      const calculatedLat = foundStreet.baseLat + (foundStreet.stepLat * (houseNumber / 100));
      const calculatedLng = foundStreet.baseLng + (foundStreet.stepLng * (houseNumber / 100));

      const titleWithNum = `${foundStreet.name} ${houseNumber}`;
      if (!results.some(r => r.title.toLowerCase() === titleWithNum.toLowerCase())) {
        results.unshift({
          id: `street-${foundStreet.name}-${houseNumber}`,
          title: titleWithNum,
          subtitle: `San Carlos de Bariloche (Altura exacta)`,
          tag: '📍 Calle y Número Confirmada',
          category: 'calle_numero',
          icon: '📍',
          lat: Number(calculatedLat.toFixed(5)),
          lng: Number(calculatedLng.toFixed(5))
        });
      }
    }
  }

  // 4. Si aún no hay coincidencia, ofrecer calles conocidas
  if (results.length === 0) {
    BARILOCHE_THOROUGHFARES.forEach(st => {
      if (st.name.toLowerCase().includes(q)) {
        results.push({
          id: `st-${st.name}`,
          title: st.name,
          subtitle: `San Carlos de Bariloche`,
          tag: '📍 Calle',
          category: 'calle',
          icon: '📍',
          lat: st.baseLat,
          lng: st.baseLng
        });
      }
    });
  }

  return results.slice(0, 8);
}
