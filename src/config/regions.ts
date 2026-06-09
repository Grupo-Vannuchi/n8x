/**
 * Service-area regions and cities, shown as a table on every information detail
 * page ("Regiões onde a N8X atende {tema}"). The same list applies to every
 * service/theme, so it lives here as a single source of truth. Region names are
 * São Paulo place names and are kept in Portuguese across locales.
 */
export type ServiceRegion = { name: string; cities: string[] };

export const serviceRegions: ServiceRegion[] = [
  {
    name: "Região Central",
    cities: [
      "Aclimação", "Bela Vista", "Bom Retiro", "Brás", "Cambuci", "Centro",
      "Consolação", "Higienópolis", "Glicério", "Liberdade", "Luz", "Pari",
      "República", "Santa Cecília", "Santa Efigênia", "Sé", "Vila Buarque",
    ],
  },
  {
    name: "Zona Norte",
    cities: [
      "Brasilândia", "Cachoeirinha", "Casa Verde", "Imirim", "Jaçanã",
      "Jardim São Paulo", "Lauzane Paulista", "Mandaqui", "Santana", "Tremembé",
      "Tucuruvi", "Vila Guilherme", "Vila Gustavo", "Vila Maria", "Vila Medeiros",
    ],
  },
  {
    name: "Zona Oeste",
    cities: [
      "Água Branca", "Bairro do Limão", "Barra Funda", "Alto da Lapa",
      "Alto de Pinheiros", "Butantã", "Freguesia do Ó", "Jaguaré", "Jaraguá",
      "Jardim Bonfiglioli", "Lapa", "Pacaembú", "Perdizes", "Perús", "Pinheiros",
      "Pirituba", "Raposo Tavares", "Rio Pequeno", "São Domingos", "Sumaré",
      "Vila Leopoldina", "Vila Sonia",
    ],
  },
  {
    name: "Zona Sul",
    cities: [
      "Aeroporto", "Água Funda", "Brooklin", "Campo Belo", "Campo Grande",
      "Campo Limpo", "Capão Redondo", "Cidade Ademar", "Cidade Dutra",
      "Cidade Jardim", "Grajaú", "Ibirapuera", "Interlagos", "Ipiranga",
      "Itaim Bibi", "Jabaquara", "Jardim Ângela", "Jardim América",
      "Jardim Europa", "Jardim Paulista", "Jardim Paulistano", "Jardim São Luiz",
      "Jardins", "Jockey Club", "M'Boi Mirim", "Moema", "Morumbi", "Parelheiros",
      "Pedreira", "Sacomã", "Santo Amaro", "Saúde", "Socorro", "Vila Andrade",
      "Vila Mariana",
    ],
  },
  {
    name: "Zona Leste",
    cities: [
      "Água Rasa", "Anália Franco", "Aricanduva", "Artur Alvim", "Belém",
      "Cidade Patriarca", "Cidade Tiradentes", "Engenheiro Goulart",
      "Ermelino Matarazzo", "Guianazes", "Itaim Paulista", "Itaquera",
      "Jardim Iguatemi", "José Bonifácio", "Moóca", "Parque do Carmo",
      "Parque São Lucas", "Parque São Rafael", "Penha", "Ponte Rasa",
      "São Mateus", "São Miguel Paulista", "Sapopemba", "Tatuapé", "Vila Carrão",
      "Vila Curuçá", "Vila Esperança", "Vila Formosa", "Vila Matilde",
      "Vila Prudente",
    ],
  },
  {
    name: "Grande São Paulo",
    cities: [
      "São Caetano do Sul", "São Bernardo do Campo", "Santo André", "Diadema",
      "Guarulhos", "Suzano", "Ribeirão Pires", "Mauá", "Embu", "Embu Guaçú",
      "Embu das Artes", "Itapecerica da Serra", "Osasco", "Barueri", "Jandira",
      "Cotia", "Itapevi", "Santana de Parnaíba", "Caierias", "Franco da Rocha",
      "Taboão da Serra", "Cajamar", "Arujá", "Alphaville", "Mairiporã", "ABC",
      "ABCD",
    ],
  },
  {
    name: "Litoral de São Paulo",
    cities: [
      "Bertioga", "Cananéia", "Caraguatatuba", "Cubatão", "Guarujá",
      "Ilha Comprida", "Iguape", "Ilhabela", "Itanhaém", "Mongaguá",
      "Riviera de São Lourenço", "Santos", "São Vicente", "Praia Grande",
      "Ubatuba", "São Sebastião", "Peruíbe",
    ],
  },
];
