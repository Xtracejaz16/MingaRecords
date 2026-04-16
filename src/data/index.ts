// MINGA RECORDS Static Data

import type { Beat, Producer, PricingTier, Stat, FlowItem } from '../types';

export const beats: Beat[] = [
  {
    id: 'beat-1',
    title: 'TIERRA SANTA',
    genre: 'Muisca Beats',
    price: 29.99,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeS4gYFfZZxiAiwpiQFWNv6F1YeWR4er60GjsQzX-Vp1HIrK9eVZwlzPeSQpwjnvE2tMl7eErssAEl22pLr-ItW4N2jFesNRqSCPJQ5MUZXEbTZibe5e5ONxT-IpSD-eRjR0WEQz6wtFDT1qNtrAIVbgOwbAaPMpHiUBB_8I24uvzwOqs5x0KAPuzBttz9vENnC_UNA3Hl6rbE2gykwlYg9iKlboIk4dOP4A-6DuO0tlepLo28VxoyDec25yFqvJPNuERFXjEBuis',
  },
  {
    id: 'beat-2',
    title: 'JAGUAR SUN',
    genre: 'Tayrona Flow',
    price: 34.99,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzUDVHhbWuGsSc5XSgAMaozxZSSHfrxzZ9KIzWnX2rt6SKJyGWUSD2V_JHBCvnW1rM-5hEZnkorUPh3bFSUb7uufD-eh98TqAL28qL9rhAQgzihZHnniEwRyROfrQqu_Zozm4WJPb2LXZMEBfqcsTIvyTDPNTelCxYF3hWkhY4j-3cQ9W8Mpzt2EGMYXpiJRlQFdLOOfQQN5j-82g7O00C3DKPXEaRkc4MUQDk9zG_j-hQi1sClSjgDsCPPbSOt-S23C684j7JbJs',
  },
  {
    id: 'beat-3',
    title: 'DESIERTO & MAR',
    genre: 'Wayuu Riddim',
    price: 39.99,
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-THEOQzsOQDuiHmvmcIZaI--h38ltcFuUNwfP1g_Y8jB2AQ3CumHCNnWHsRYuUZMoA1z2f6EN1oc6bDY1_Nj680zZgvDEqjGikGY03kj1Fr-63FxWnuwvF5fg2E0B7gEHEu9b3-5RZhFm9NIVXYbp-OhIlPJkSZ5ICWuTk9-ATGHoFu49iwm1f1bOPvyvdFiDVtYCnkJoIrKqxP_mSCGYK3MePczXyzivRckYd2q5XGh3CtjD222WpP_Fc7ejkBfX5BM_lMo9Zbc',
  },
];

export const producers: Producer[] = [
  {
    id: 'producer-1',
    name: 'KOGUI VIBES',
    region: 'SIERRA NEVADA',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBB5Kj-BcdZYacAroO9Y94b3hff3yHOOgFcFgDYVUGCv4aV2jOL5vOiRlY7gLHzyTHzvKoj8GKefCEG6cwYWArv4tu_8wFLZ428vNZcUzgjPMAuCo2FcZHm1dxIoNLj9mzxkA88IsFUh0N7gJnPjC7H8sENpQ-JdyK2-Q0gdnQ6Zaku-Be2wYhxkCDOJ-yW2FeBPhRv72vcume-zra9WEig0b__AKlw6FFWMznrNGrDm-BrMwXx9MyTLbADFTYjG6a9p-oLFep4vis',
    rotationSpeed: 10,
    rotationDirection: 'normal',
  },
  {
    id: 'producer-2',
    name: 'ZENU FLOW',
    region: 'SINÚ',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOj8E9YwAOH9wi-SL4PV1niIC7jVI0NMs7B74gkaMT6Ri3a-c2SHGD-C2b02u5edM8vakEGjPGMfXeqWZ1AcrvxbEhTuRsoc6Dfr09LiDtR_4YVtRLMnwFLcZs-wpzqO7PtqnJtBG58UYpNAwP2Gf25TfkM1rPXueTEf_6iSV4b2qPg5uatNvIR4A6K2D0tWHMYxMz1-WxNysoH6vUn0xTB-N4Fhzfrw9gIjVBgqHqKgguY1zu_ROWIE4H90_m8Ndk5Li5-AbXMRs',
    rotationSpeed: 15,
    rotationDirection: 'reverse',
  },
  {
    id: 'producer-3',
    name: 'EMBERA DRUM',
    region: 'CHOCO',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJYofex6CTHE0CEw_rTBoc_9M9CZ_KfwCxqDuNwzqq5MeZEHOnLdOmjDt4_w9JUd_CMLbIZlmFKEWYrjJJGzrVLzagL7UlalmGHWswrqGbhrhLn69eIgrGtZXu9dKa6Vskj8KP7WyyJFdIQ8JlXQE7c9n2L_gLYLXSuQzrmVnMJdoUL2qHSwbXj_HmbIVCelRX_G1y2dzp0ooDlU0VfTvKnQelAqPvx_rGBxaFikHj1Fz5am7PvjYK6B04e27ogKw4seBQZL9Ttpc',
    rotationSpeed: 12,
    rotationDirection: 'normal',
  },
  {
    id: 'producer-4',
    name: 'WAYUU SOUL',
    region: 'GUAJIRA',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAafZeBKw3q90YLDS2_fXdKi4qwkI6GrbfOwrHKQeMKp5VSXfqm_3F0vKQH0Ria2u4283qdbKHn7GoAET2-qbUEjQ-qb7-Q2jF6Jez-1LfriZdqkf36zqqeVJNMf_qKx8QwwhYxsYpnpIjR7V8WRJdpbv96Z_6IvEQblwMaKilrsRNXAAKG4yKbd4mBJ8wJ_ehXfMXFzF-docJ79GPMz24XrrdYrFaQ1AwJ-X-FYlOYjOPrSWO5SkdoulbGnfS007GYfkYBfdQHKa4',
    rotationSpeed: 8,
    rotationDirection: 'reverse',
  },
];

export const pricingTiers: PricingTier[] = [
  {
    id: 'semilla',
    name: 'SEMILLA',
    price: 29,
    description: 'Uso básico en plataformas digitales.',
    features: ['MP3 320kbps', '5,000 Streams', 'Uso No-Lucrativo'],
  },
  {
    id: 'raiz',
    name: 'RAÍZ',
    price: 99,
    description: 'El estándar para el artista profesional.',
    features: ['WAV + STEMS (Pistas)', 'Streams Ilimitados', 'Distribución Comercial', 'Acuerdo de Regalías 50/50'],
    featured: true,
  },
  {
    id: 'ceiba',
    name: 'CEIBA',
    price: 499,
    description: 'Propiedad total y eterna.',
    features: ['EXCLUSIVIDAD TOTAL', 'Contrato de Transferencia', 'Uso en Cine/TV', 'Sin Límites'],
  },
];

export const stats: Stat[] = [
  { value: '1.2K+', label: 'Beats Cosechados' },
  { value: '350', label: 'Minguis (Productores)' },
  { value: '45', label: 'Países Resonando' },
  { value: '8K+', label: 'Rituales (Licencias)' },
];

export const flowItems: FlowItem[] = [
  {
    icon: 'star',
    title: 'EL BUSCADOR (ARTISTA)',
    description: 'Explora la cosecha y encuentra el alma de tu próxima creación entre cientos de texturas únicas.',
  },
  {
    icon: 'music',
    title: 'EL SEMBRADOR (BEATMAKER)',
    description: 'Sube tus ritmos, establece tus leyes y comparte tu medicina con el mundo entero.',
  },
];

export const manifesto = {
  quote: 'Nuestra música no es un producto, es un tejido. Una minga digital donde cada beat lleva el sudor de la montaña y el eco de los ancestros. Somos el puente entre lo antiguo y lo que está por nacer.',
  attribution: '— MANIFIESTO MINGA',
};

export const genres = ['TODO', 'AFROBEAT', 'CHAMPETA', 'CUMBIA'] as const;