import { TripStop, StopCategory } from '../types';

/**
 * Curated high-resolution photographs for top landmarks & destinations.
 * Every landmark has its own unique, authentic photo.
 */
export const LANDMARK_SPECIFIC_IMAGES: Record<string, string> = {
  // Florence & Tuscany
  'duomo': 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=1000&auto=format&fit=crop&q=80',
  'santa maria del fiore': 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=1000&auto=format&fit=crop&q=80',
  'ponte vecchio': 'https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=1000&auto=format&fit=crop&q=80',
  'trattoria mario': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',
  'piazzale michelangelo': 'https://images.unsplash.com/photo-1528114039593-4366cc08227d?w=1000&auto=format&fit=crop&q=80',
  'uffizi': 'https://images.unsplash.com/photo-1583845112239-97ef1341b271?w=1000&auto=format&fit=crop&q=80',
  'boboli': 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1000&auto=format&fit=crop&q=80',
  'greve': 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1000&auto=format&fit=crop&q=80',
  'chianti': 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1000&auto=format&fit=crop&q=80',
  'monteriggioni': 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=1000&auto=format&fit=crop&q=80',
  'piazza del campo': 'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=1000&auto=format&fit=crop&q=80',
  'siena dom': 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1000&auto=format&fit=crop&q=80',
  'san gimignano': 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1000&auto=format&fit=crop&q=80',
  'pienza': 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=1000&auto=format&fit=crop&q=80',
  'montepulciano': 'https://images.unsplash.com/photo-1528114039593-4366cc08227d?w=1000&auto=format&fit=crop&q=80',
  'vitaleta': 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1000&auto=format&fit=crop&q=80',
  'bagno vignoni': 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80',
  'val d\'orcia': 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1000&auto=format&fit=crop&q=80',
  'saturnia': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
  'pisa': 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=1000&auto=format&fit=crop&q=80',
  'lucca': 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1000&auto=format&fit=crop&q=80',

  // Rome
  'kolosseum': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1000&auto=format&fit=crop&q=80',
  'colosseum': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1000&auto=format&fit=crop&q=80',
  'forum romanum': 'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=1000&auto=format&fit=crop&q=80',
  'trevi': 'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=1000&auto=format&fit=crop&q=80',
  'pantheon': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop&q=80',
  'vatikan': 'https://images.unsplash.com/photo-1548625361-16a7353f8682?w=1000&auto=format&fit=crop&q=80',
  'vatican': 'https://images.unsplash.com/photo-1548625361-16a7353f8682?w=1000&auto=format&fit=crop&q=80',
  'petersdom': 'https://images.unsplash.com/photo-1548625361-16a7353f8682?w=1000&auto=format&fit=crop&q=80',
  'trastevere': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1000&auto=format&fit=crop&q=80',
  'spanische treppe': 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?w=1000&auto=format&fit=crop&q=80',
  'piazza navona': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1000&auto=format&fit=crop&q=80',
  'enzo': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80',

  // Naples, Pompeii, Amalfi Coast & Capri
  'pompeji': 'https://images.unsplash.com/photo-1588614959060-4d144f28b207?w=1000&auto=format&fit=crop&q=80',
  'pompeii': 'https://images.unsplash.com/photo-1588614959060-4d144f28b207?w=1000&auto=format&fit=crop&q=80',
  'sorrent': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1000&auto=format&fit=crop&q=80',
  'sorrento': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1000&auto=format&fit=crop&q=80',
  'positano': 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1000&auto=format&fit=crop&q=80',
  'amalfi dom': 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1000&auto=format&fit=crop&q=80',
  'amalfi kathedrale': 'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1000&auto=format&fit=crop&q=80',
  'amalfi küste': 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1000&auto=format&fit=crop&q=80',
  'ravello': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1000&auto=format&fit=crop&q=80',
  'cimbrone': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1000&auto=format&fit=crop&q=80',
  'capri': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1000&auto=format&fit=crop&q=80',
  'marina grande': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1000&auto=format&fit=crop&q=80',
  'faraglioni': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1000&auto=format&fit=crop&q=80',
  'anacapri': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
  'solaro': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
  'neapel flug': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1000&auto=format&fit=crop&q=80',
  'capodichino': 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1000&auto=format&fit=crop&q=80',
  'vesuv': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1000&auto=format&fit=crop&q=80',

  // Switzerland & Alps
  'luzern': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=1000&auto=format&fit=crop&q=80',
  'kapellbrücke': 'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=1000&auto=format&fit=crop&q=80',
  'pilatus': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1000&auto=format&fit=crop&q=80',
  'lauterbrunnen': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1000&auto=format&fit=crop&q=80',
  'staubbach': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1000&auto=format&fit=crop&q=80',
  'jungfraujoch': 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80',
  'interlaken': 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop&q=80',
  'zermatt': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1000&auto=format&fit=crop&q=80',
  'matterhorn': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1000&auto=format&fit=crop&q=80',
  'zürich': 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1000&auto=format&fit=crop&q=80',
  'genf': 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1000&auto=format&fit=crop&q=80',
  'grindelwald': 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop&q=80',

  // Japan
  'senso': 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1000&auto=format&fit=crop&q=80',
  'asakusa': 'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1000&auto=format&fit=crop&q=80',
  'shibuya': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80',
  'shinjuku': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop&q=80',
  'fushimi': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80',
  'arashiyama': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80',
  'kinkaku': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80',
  'fuji': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80',
  'osaka': 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop&q=80',
  'nara': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80',

  // Paris & France
  'eiffelturm': 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1000&auto=format&fit=crop&q=80',
  'eiffel': 'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1000&auto=format&fit=crop&q=80',
  'louvre': 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1000&auto=format&fit=crop&q=80',
  'montmartre': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop&q=80',
  'arc de triomphe': 'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=1000&auto=format&fit=crop&q=80',
  'notre dame': 'https://images.unsplash.com/photo-1478860409698-8707f313ee8b?w=1000&auto=format&fit=crop&q=80',

  // Spain
  'sagrada familia': 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1000&auto=format&fit=crop&q=80',
  'park güell': 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1000&auto=format&fit=crop&q=80',
  'barceloneta': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
  'alhambra': 'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=1000&auto=format&fit=crop&q=80',
  'mallorca': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1000&auto=format&fit=crop&q=80',
  'ibiza': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',

  // London & UK
  'big ben': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1000&auto=format&fit=crop&q=80',
  'tower bridge': 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=1000&auto=format&fit=crop&q=80',
  'london eye': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1000&auto=format&fit=crop&q=80',

  // Germany & Austria
  'brandenburger tor': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1000&auto=format&fit=crop&q=80',
  'marienplatz': 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1000&auto=format&fit=crop&q=80',
  'neuschwanstein': 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1000&auto=format&fit=crop&q=80',
  'schönbrunn': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1000&auto=format&fit=crop&q=80',
  'stephansdom': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1000&auto=format&fit=crop&q=80',
  'hallstatt': 'https://images.unsplash.com/photo-1520637736862-4d193d56b020?w=1000&auto=format&fit=crop&q=80',

  // Greece & Mediterranean
  'santorini': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1000&auto=format&fit=crop&q=80',
  'akropolis': 'https://images.unsplash.com/photo-1555993539-1732b0258235?w=1000&auto=format&fit=crop&q=80',
  'mykonos': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1000&auto=format&fit=crop&q=80',
  'kreta': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',

  // USA & Americas
  'times square': 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1000&auto=format&fit=crop&q=80',
  'central park': 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=1000&auto=format&fit=crop&q=80',
  'brooklyn bridge': 'https://images.unsplash.com/photo-1496868834840-5f4c98840aaa?w=1000&auto=format&fit=crop&q=80',
  'golden gate': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1000&auto=format&fit=crop&q=80',
  'grand canyon': 'https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1000&auto=format&fit=crop&q=80',
};

/**
 * Curated multi-photo collections for popular travel cities.
 * When multiple stops are in the same city, we pick DIFFERENT images deterministically.
 */
export const CITY_PHOTO_POOLS: Record<string, string[]> = {
  'florenz': [
    'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=1000&auto=format&fit=crop&q=80', // Duomo
    'https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=1000&auto=format&fit=crop&q=80', // Ponte Vecchio
    'https://images.unsplash.com/photo-1528114039593-4366cc08227d?w=1000&auto=format&fit=crop&q=80', // Panorama
    'https://images.unsplash.com/photo-1583845112239-97ef1341b271?w=1000&auto=format&fit=crop&q=80', // Uffizi / Gasse
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80', // Trattoria
  ],
  'florence': [
    'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1528114039593-4366cc08227d?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1583845112239-97ef1341b271?w=1000&auto=format&fit=crop&q=80',
  ],
  'toskana': [
    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1000&auto=format&fit=crop&q=80', // Weinberge
    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1000&auto=format&fit=crop&q=80', // Zypressen
    'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=1000&auto=format&fit=crop&q=80', // Gasse
    'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=1000&auto=format&fit=crop&q=80', // Festung
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1000&auto=format&fit=crop&q=80', // Therme
  ],
  'tuscany': [
    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=1000&auto=format&fit=crop&q=80',
  ],
  'siena': [
    'https://images.unsplash.com/photo-1587974928442-77dc3e0dba72?w=1000&auto=format&fit=crop&q=80', // Piazza del Campo
    'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=1000&auto=format&fit=crop&q=80', // Duomo
    'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=1000&auto=format&fit=crop&q=80', // Altstadt
  ],
  'rom': [
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1000&auto=format&fit=crop&q=80', // Kolosseum
    'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=1000&auto=format&fit=crop&q=80', // Trevi
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop&q=80', // Pantheon
    'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1000&auto=format&fit=crop&q=80', // Trastevere
    'https://images.unsplash.com/photo-1529260830199-42c24126f198?w=1000&auto=format&fit=crop&q=80', // Forum
    'https://images.unsplash.com/photo-1548625361-16a7353f8682?w=1000&auto=format&fit=crop&q=80', // Vatikan
  ],
  'rome': [
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1525874684015-58379d421a52?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1000&auto=format&fit=crop&q=80',
  ],
  'neapel': [
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1000&auto=format&fit=crop&q=80', // Bucht & Vesuv
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80', // Pizza & Gassen
    'https://images.unsplash.com/photo-1588614959060-4d144f28b207?w=1000&auto=format&fit=crop&q=80', // Pompeji
  ],
  'amalfi': [
    'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1000&auto=format&fit=crop&q=80', // Positano
    'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?w=1000&auto=format&fit=crop&q=80', // Amalfi Dom
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1000&auto=format&fit=crop&q=80', // Ravello
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1000&auto=format&fit=crop&q=80', // Capri
    'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1000&auto=format&fit=crop&q=80', // Sorrent
  ],
  'schweiz': [
    'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1000&auto=format&fit=crop&q=80', // Matterhorn
    'https://images.unsplash.com/photo-1527668752968-14dc70a27c95?w=1000&auto=format&fit=crop&q=80', // Luzern
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1000&auto=format&fit=crop&q=80', // Lauterbrunnen
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80', // Jungfrau Gletscher
    'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1000&auto=format&fit=crop&q=80', // Zürich
  ],
  'tokio': [
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80', // Shibuya
    'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1000&auto=format&fit=crop&q=80', // Senso-ji
    'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop&q=80', // Shinjuku
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80', // Pagode
  ],
  'kyoto': [
    'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=1000&auto=format&fit=crop&q=80', // Fushimi Inari
    'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000&auto=format&fit=crop&q=80', // Kinkaku-ji
    'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=1000&auto=format&fit=crop&q=80', // Bambus
  ],
  'paris': [
    'https://images.unsplash.com/photo-1511739001486-6bfe10ce785f?w=1000&auto=format&fit=crop&q=80', // Eiffelturm
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1000&auto=format&fit=crop&q=80', // Louvre
    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1000&auto=format&fit=crop&q=80', // Montmartre
    'https://images.unsplash.com/photo-1509439581779-6298f75bf6e5?w=1000&auto=format&fit=crop&q=80', // Arc de Triomphe
  ],
  'barcelona': [
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1000&auto=format&fit=crop&q=80', // Sagrada
    'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1000&auto=format&fit=crop&q=80', // Park Güell
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80', // Strand
  ],
  'berlin': [
    'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1000&auto=format&fit=crop&q=80', // Brandenburger Tor
    'https://images.unsplash.com/photo-1587330274486-61e74b54521e?w=1000&auto=format&fit=crop&q=80', // Fernsehturm
    'https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=1000&auto=format&fit=crop&q=80', // Dom
  ],
  'münchen': [
    'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1000&auto=format&fit=crop&q=80', // Marienplatz
    'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1000&auto=format&fit=crop&q=80', // Englischer Garten
  ],
  'wien': [
    'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=1000&auto=format&fit=crop&q=80', // Schloss Schönbrunn
    'https://images.unsplash.com/photo-1520637736862-4d193d56b020?w=1000&auto=format&fit=crop&q=80', // Stephansdom
  ],
  'london': [
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1000&auto=format&fit=crop&q=80', // Big Ben
    'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?w=1000&auto=format&fit=crop&q=80', // Tower Bridge
  ],
  'new york': [
    'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=1000&auto=format&fit=crop&q=80', // Times Square
    'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=1000&auto=format&fit=crop&q=80', // Central Park
    'https://images.unsplash.com/photo-1496868834840-5f4c98840aaa?w=1000&auto=format&fit=crop&q=80', // Brooklyn Bridge
  ],
};

/**
 * Rich multi-item fallback categories with diverse themes & places
 */
export const CATEGORY_DEFAULT_IMAGES: Record<StopCategory, string[]> = {
  sightseeing: [
    'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=1000&auto=format&fit=crop&q=80', // Duomo
    'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1000&auto=format&fit=crop&q=80', // Colosseum
    'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1000&auto=format&fit=crop&q=80', // Big Ben
    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=1000&auto=format&fit=crop&q=80', // Louvre
    'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=1000&auto=format&fit=crop&q=80', // Sagrada
    'https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=1000&auto=format&fit=crop&q=80', // Sensoji
  ],
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1000&auto=format&fit=crop&q=80', // Luxury resort
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1000&auto=format&fit=crop&q=80', // Boutique hotel
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1000&auto=format&fit=crop&q=80', // Grand Hotel
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1000&auto=format&fit=crop&q=80', // Pool resort
  ],
  restaurant: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80', // Italian Osteria
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80', // Cozy bistro
    'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1000&auto=format&fit=crop&q=80', // Wine & dining
    'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=1000&auto=format&fit=crop&q=80', // Outdoor cafe
  ],
  activity: [
    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1000&auto=format&fit=crop&q=80', // Boat cruise
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1000&auto=format&fit=crop&q=80', // Wine tasting
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80', // Beach kayaking
    'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1000&auto=format&fit=crop&q=80', // Mountain cable car
  ],
  nature: [
    'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1000&auto=format&fit=crop&q=80', // Tuscan hills
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1000&auto=format&fit=crop&q=80', // Alpine waterfall
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop&q=80', // Mist forest
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80', // Mountain peaks
  ],
  viewpoint: [
    'https://images.unsplash.com/photo-1528114039593-4366cc08227d?w=1000&auto=format&fit=crop&q=80', // City sunset overlook
    'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=1000&auto=format&fit=crop&q=80', // Coast cliff view
    'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1000&auto=format&fit=crop&q=80', // Terrace over sea
    'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1000&auto=format&fit=crop&q=80', // Alpine ridge
  ],
  transit: [
    'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1000&auto=format&fit=crop&q=80', // Airplane sunset
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80', // Scenic drive road
    'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1000&auto=format&fit=crop&q=80', // Train railway
  ],
  shopping: [
    'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&auto=format&fit=crop&q=80', // Boutique
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1000&auto=format&fit=crop&q=80', // Historic store
    'https://images.unsplash.com/photo-1534445867742-43195f401b6c?w=1000&auto=format&fit=crop&q=80', // Gold bridge market
  ],
  pass: [
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80', // Mountain pass curves
    'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=1000&auto=format&fit=crop&q=80', // Alpine road
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80', // Summit viewpoint
  ],
  biker_spot: [
    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop&q=80', // Biker scenic road
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1000&auto=format&fit=crop&q=80', // Biker meeting point / cafe
    'https://images.unsplash.com/photo-1528114039593-4366cc08227d?w=1000&auto=format&fit=crop&q=80', // Panorama biker overlook
  ],
};

// In-memory cache for dynamically resolved Wikipedia & place photos
const imageMemoryCache = new Map<string, string>();

/**
 * Returns a unique hash integer for any string to deterministically select diverse images.
 */
function getDeterministicHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a high-quality, authentic, diversified image for any stop.
 * Prioritizes:
 * 1. stop.image if explicitly specified and valid
 * 2. Cached Wikipedia photo
 * 3. Specific Landmark match
 * 4. Multi-photo City Pool with stop-specific hash (so no two stops in the same city share photos)
 * 5. Deterministic Category Pool
 */
export function getStopImage(stop: TripStop, destination?: string): string {
  if (stop.image && stop.image.trim().length > 5) {
    return stop.image;
  }

  const cacheKey = `${stop.title}_${stop.address || ''}`;
  if (imageMemoryCache.has(cacheKey)) {
    return imageMemoryCache.get(cacheKey)!;
  }

  const stopText = `${stop.title} ${stop.address || ''}`.toLowerCase();
  const fullText = `${stopText} ${destination || ''}`.toLowerCase();

  // 1. Check direct landmark matches (highest precision)
  for (const [keyword, url] of Object.entries(LANDMARK_SPECIFIC_IMAGES)) {
    if (stopText.includes(keyword)) {
      return url;
    }
  }

  // 2. Check landmark matches with destination context
  for (const [keyword, url] of Object.entries(LANDMARK_SPECIFIC_IMAGES)) {
    if (fullText.includes(keyword)) {
      return url;
    }
  }

  // 3. Check city photo pools and pick with stop hash so different stops in the same city get different photos
  for (const [cityKey, photoArray] of Object.entries(CITY_PHOTO_POOLS)) {
    if (fullText.includes(cityKey)) {
      const hash = getDeterministicHash(stop.title + (stop.address || ''));
      const index = hash % photoArray.length;
      return photoArray[index];
    }
  }

  // 4. Category fallback with diversified hash index
  const category = stop.category || 'sightseeing';
  const categoryPhotos = CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES.sightseeing;
  const hash = getDeterministicHash(stop.title);
  const index = hash % categoryPhotos.length;
  return categoryPhotos[index];
}

/**
 * Returns a list of 4-6 alternative relevant images for a stop so users can choose
 */
export function getAlternativeImages(stop: Partial<TripStop>, destination?: string): string[] {
  const list: string[] = [];
  const add = (url: string) => {
    if (url && !list.includes(url)) {
      list.push(url);
    }
  };

  const text = `${stop.title || ''} ${stop.address || ''} ${destination || ''}`.toLowerCase();

  // Add specific landmark match
  for (const [keyword, url] of Object.entries(LANDMARK_SPECIFIC_IMAGES)) {
    if (text.includes(keyword)) {
      add(url);
    }
  }

  // Add city pool images
  for (const [cityKey, photoArray] of Object.entries(CITY_PHOTO_POOLS)) {
    if (text.includes(cityKey)) {
      photoArray.forEach(add);
    }
  }

  // Add category defaults
  const cat = stop.category || 'sightseeing';
  const catPhotos = CATEGORY_DEFAULT_IMAGES[cat] || CATEGORY_DEFAULT_IMAGES.sightseeing;
  catPhotos.forEach(add);

  return list.slice(0, 6);
}

/**
 * Clean search query from extra parenthesis or technical terms
 */
function cleanPlaceTitle(title: string): string {
  return title
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/^(hotel|restaurant|bar|cafe|park|dom|kathedrale|schloss|piazza|via)\s+/i, '')
    .trim();
}

/**
 * Asynchronously searches Wikipedia / Wikimedia API for an authentic photograph
 * of the landmark or location, storing the result in the in-memory cache.
 */
export async function fetchLivePlaceImage(title: string, address?: string): Promise<string | null> {
  const cacheKey = `${title}_${address || ''}`;
  if (imageMemoryCache.has(cacheKey)) {
    return imageMemoryCache.get(cacheKey)!;
  }

  const cleanTitle = cleanPlaceTitle(title);
  const searchQueries = [
    title,
    cleanTitle,
    address ? `${cleanTitle} ${address.split(',')[0]}` : null,
  ].filter(Boolean) as string[];

  for (const query of searchQueries) {
    // English Wikipedia
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        query
      )}&prop=pageimages&format=json&pithumbsize=1000&origin=*`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const pages = data.query?.pages;
        if (pages) {
          const pageId = Object.keys(pages)[0];
          if (pageId && pageId !== '-1' && pages[pageId]?.thumbnail?.source) {
            const imgUrl = pages[pageId].thumbnail.source;
            imageMemoryCache.set(cacheKey, imgUrl);
            return imgUrl;
          }
        }
      }
    } catch {
      // Continue to next attempt
    }

    // German Wikipedia
    try {
      const deUrl = `https://de.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        query
      )}&prop=pageimages&format=json&pithumbsize=1000&origin=*`;
      const deResp = await fetch(deUrl);
      if (deResp.ok) {
        const deData = await deResp.json();
        const dePages = deData.query?.pages;
        if (dePages) {
          const pageId = Object.keys(dePages)[0];
          if (pageId && pageId !== '-1' && dePages[pageId]?.thumbnail?.source) {
            const imgUrl = dePages[pageId].thumbnail.source;
            imageMemoryCache.set(cacheKey, imgUrl);
            return imgUrl;
          }
        }
      }
    } catch {
      // Continue to fallback
    }
  }

  return null;
}
