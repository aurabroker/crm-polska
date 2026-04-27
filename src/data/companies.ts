export type Status = 'lead' | 'kontakt' | 'oferta' | 'negocjacje' | 'zamkniety' | 'stracony';

export interface ContactHistory {
  id: string;
  type: 'notatka' | 'telefon' | 'email' | 'spotkanie';
  date: string;
  note: string;
  author: string;
}

export interface Reminder {
  id: string;
  date: string;
  text: string;
  done: boolean;
}

export interface Company {
  id: number;
  company: string;
  contact: string;
  title: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  industry: string;
  revenue: number;
  employees: string;
  url: string;
  status: Status;
  assignedTo?: string;
  history: ContactHistory[];
  reminders: Reminder[];
}

export const INITIAL_COMPANIES: Company[] = [
  { id: 1, company: 'ORLEN PALIWA SP Z O O', contact: 'Pawel Kostyra', title: 'Manager', phone: '48-242566039', email: 'bok.orlenpaliwa@orlen.pl', city: 'Widelka', state: 'Podkarpackie', industry: 'Petroleum Wholesale', revenue: 7107741200, employees: '372', url: 'http://www.orlenpaliwa.com.pl', status: 'lead', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 2, company: 'TAURON SPRZEDAZ SP Z O O', contact: '', title: '', phone: '48-122654330', email: 'obsluga.klienta@tauron.pl', city: 'Kraków', state: 'Malopolskie', industry: 'Electric Power Distribution', revenue: 5765978000, employees: '2153', url: 'http://www.tauron.pl', status: 'kontakt', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 3, company: 'PGNIG OBROT DETALICZNY SP Z O O', contact: 'Dorota Puchala', title: 'CRM Specialist', phone: '48-225894470', email: 'od@pgnig.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Natural Gas Distribution', revenue: 4614102500, employees: '3125', url: 'http://www.pgnig.pl', status: 'oferta', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 4, company: 'ORLEN POLUDNIE S A', contact: 'Malgorzata Michalik-Sieron', title: 'Insurance Specialist', phone: '48-134656100', email: 'zarzad@orlenpoludnie.pl', city: 'Trzebinia', state: 'Malopolskie', industry: 'Petroleum Refining', revenue: 3547127300, employees: '', url: 'http://www.orlenpoludnie.pl', status: 'negocjacje', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 5, company: 'POLSKA SPOLKA GAZOWNICTWA SP Z O O', contact: 'Dawid Szubert', title: 'Customer Service Manager', phone: '48-224121506', email: 'sekretariat@psgaz.pl', city: 'Tarnów', state: 'Malopolskie', industry: 'Natural Gas Distribution', revenue: 3302361600, employees: '', url: 'http://www.psgaz.pl', status: 'zamkniety', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 6, company: 'PKP ENERGETYKA S A', contact: 'Anna Wlosek', title: '', phone: '48-224749400', email: 'pkpe@pkpenergetyka.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Electric Power Distribution', revenue: 2827802400, employees: '', url: 'http://www.pkpenergetyka.pl', status: 'lead', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 7, company: 'NOVATEK GREEN ENERGY SP Z O O', contact: 'Sebastian Palka', title: 'Dyrektor Ds Produkcji I Techniki', phone: '48-416341700', email: 'novatek@novatek.pl', city: 'Nowa Dęba', state: 'Podkarpackie', industry: 'Petroleum Refining', revenue: 2767849500, employees: '', url: 'http://www.novatek.pl', status: 'kontakt', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 8, company: 'UNUM ZYCIE TU I R S A', contact: 'Tomasz Ciesielski', title: 'IT Audit Manager', phone: '48-225984000', email: 'pomoc@unum.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Life Insurance', revenue: 2474316800, employees: '', url: 'http://www.unum.pl', status: 'stracony', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 9, company: 'PHILIPS POLSKA SP Z O O', contact: 'Katarzyna Budnik', title: '', phone: '48-222712222', email: 'kontakt@philips.com', city: 'Warszawa', state: 'Mazowieckie', industry: 'Electrical Equipment Manufacturing', revenue: 2429174300, employees: '', url: 'http://www.philips.pl', status: 'oferta', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 10, company: 'VECTRA S A', contact: 'Robert Jedynak', title: 'Data Network Manager', phone: '48-124216580', email: 'bok@vectra.pl', city: 'Gdynia', state: 'Pomorskie', industry: 'Cable TV Service Providers', revenue: 2296700200, employees: '', url: 'http://www.vectra.pl', status: 'negocjacje', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 11, company: 'POLSKIE GÓRNICTWO NAFTOWE S A', contact: 'Marcin Wolski', title: 'Dyrektor Handlowy', phone: '48-228761100', email: 'biuro@pgnsa.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Natural Gas Distribution', revenue: 2150000000, employees: '1850', url: 'http://www.pgn.pl', status: 'lead', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 12, company: 'ENERGA OPERATOR S A', contact: 'Beata Kaminska', title: 'Key Account Manager', phone: '48-586724000', email: 'kontakt@energa.pl', city: 'Gdańsk', state: 'Pomorskie', industry: 'Electric Power Distribution', revenue: 1980000000, employees: '4200', url: 'http://www.energa.pl', status: 'kontakt', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 13, company: 'POLKOMTEL SP Z O O', contact: 'Krzysztof Wiśniewski', title: 'Dyrektor Regionu', phone: '48-226076000', email: 'bok@polkomtel.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Telecommunications', revenue: 1870000000, employees: '2800', url: 'http://www.plus.pl', status: 'oferta', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 14, company: 'LOTOS PALIWA SP Z O O', contact: 'Agnieszka Korab', title: 'Sales Director', phone: '48-587437000', email: 'biuro@lotos.pl', city: 'Gdańsk', state: 'Pomorskie', industry: 'Petroleum Wholesale', revenue: 1740000000, employees: '320', url: 'http://www.lotos.pl', status: 'negocjacje', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 15, company: 'PKO LEASING S A', contact: 'Piotr Adamczyk', title: 'Kierownik Sprzedaży', phone: '48-226584000', email: 'kontakt@pkoleasing.pl', city: 'Łódź', state: 'Łódzkie', industry: 'Financial Services', revenue: 1620000000, employees: '580', url: 'http://www.pkoleasing.pl', status: 'zamkniety', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 16, company: 'ALIOR BANK S A', contact: 'Monika Zielinska', title: 'Business Development Manager', phone: '48-224992000', email: 'kontakt@aliorbank.pl', city: 'Kraków', state: 'Malopolskie', industry: 'Banking', revenue: 1500000000, employees: '8000', url: 'http://www.aliorbank.pl', status: 'lead', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 17, company: 'CYFROWY POLSAT S A', contact: 'Rafał Kowalczyk', title: 'Dyrektor Sprzedaży', phone: '48-225145100', email: 'kontakt@cyfrowypolsat.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Cable TV Service Providers', revenue: 1430000000, employees: '3100', url: 'http://www.cyfrowypolsat.pl', status: 'kontakt', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 18, company: 'MLEKOVITA SP Z O O', contact: 'Dorota Kwiatkowska', title: 'Key Account Manager', phone: '48-862776001', email: 'biuro@mlekovita.com.pl', city: 'Wysokie Mazowieckie', state: 'Podlaskie', industry: 'Dairy Products', revenue: 1380000000, employees: '2500', url: 'http://www.mlekovita.com.pl', status: 'oferta', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 19, company: 'ŻYWIEC ZDRÓJ S A', contact: 'Tomasz Malinowski', title: 'Account Executive', phone: '48-338609500', email: 'kontakt@zywiec.pl', city: 'Żywiec', state: 'Śląskie', industry: 'Beverage Manufacturing', revenue: 1250000000, employees: '1200', url: 'http://www.zywiec.pl', status: 'negocjacje', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 20, company: 'RABEN TRANSPORT SP Z O O', contact: 'Aleksandra Baran', title: 'Logistics Manager', phone: '48-618306100', email: 'info@raben.com', city: 'Swarzędz', state: 'Wielkopolskie', industry: 'Transportation', revenue: 1180000000, employees: '4800', url: 'http://www.raben-group.com', status: 'stracony', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 21, company: 'AUCHAN POLSKA SP Z O O', contact: 'Michał Stawski', title: 'Category Manager', phone: '48-222555000', email: 'kontakt@auchan.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Retail', revenue: 1120000000, employees: '12000', url: 'http://www.auchan.pl', status: 'lead', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 22, company: 'METRO POLSKA SP Z O O', contact: 'Iwona Głowacka', title: 'Commercial Director', phone: '48-226281000', email: 'info@metro.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Wholesale', revenue: 1050000000, employees: '6500', url: 'http://www.metro.pl', status: 'kontakt', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 23, company: 'TESCO POLSKA SP Z O O', contact: 'Stanisław Krawczyk', title: 'Procurement Manager', phone: '48-126564500', email: 'kontakt@tesco.pl', city: 'Kraków', state: 'Malopolskie', industry: 'Retail', revenue: 980000000, employees: '15000', url: 'http://www.tesco.pl', status: 'oferta', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 24, company: 'APATOR S A', contact: 'Renata Szymańska', title: 'Business Manager', phone: '48-566127600', email: 'apator@apator.com', city: 'Toruń', state: 'Kujawsko-Pomorskie', industry: 'Electrical Equipment Manufacturing', revenue: 890000000, employees: '2100', url: 'http://www.apator.com', status: 'negocjacje', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 25, company: 'BORYSZEW S A', contact: 'Grzegorz Pajak', title: 'Dyrektor Handlowy', phone: '48-228700100', email: 'biuro@boryszew.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Metal Manufacturing', revenue: 840000000, employees: '3400', url: 'http://www.boryszew.pl', status: 'zamkniety', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 26, company: 'COMARCH S A', contact: 'Joanna Kowalska', title: 'Account Manager', phone: '48-126460000', email: 'info@comarch.com', city: 'Kraków', state: 'Malopolskie', industry: 'IT Services', revenue: 790000000, employees: '6000', url: 'http://www.comarch.com', status: 'lead', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 27, company: 'ASSECO POLAND S A', contact: 'Zbigniew Nowicki', title: 'Sales Manager', phone: '48-178888888', email: 'biuro@asseco.pl', city: 'Rzeszów', state: 'Podkarpackie', industry: 'IT Services', revenue: 750000000, employees: '5500', url: 'http://www.asseco.pl', status: 'kontakt', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 28, company: 'STOMIL SANOK S A', contact: 'Barbara Marek', title: 'Export Manager', phone: '48-134650200', email: 'stomil@stomil.pl', city: 'Sanok', state: 'Podkarpackie', industry: 'Rubber Manufacturing', revenue: 680000000, employees: '3800', url: 'http://www.stomil.pl', status: 'oferta', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 29, company: 'LUBELSKI WĘGIEL BOGDANKA S A', contact: 'Marek Lis', title: 'Dyrektor Sprzedaży', phone: '48-815627121', email: 'marketing@lw.com.pl', city: 'Bogdanka', state: 'Lubelskie', industry: 'Coal Mining', revenue: 620000000, employees: '5200', url: 'http://www.lw.com.pl', status: 'negocjacje', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 30, company: 'ZPC OTMUCHÓW S A', contact: 'Kinga Pawlak', title: 'Key Account Manager', phone: '48-774327600', email: 'otmuchow@otmuchow.pl', city: 'Otmuchów', state: 'Opolskie', industry: 'Food Manufacturing', revenue: 580000000, employees: '850', url: 'http://www.otmuchow.pl', status: 'stracony', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 31, company: 'POLPHARMA S A', contact: 'Adam Wojciechowski', title: 'Business Development', phone: '48-586636363', email: 'biuro@polpharma.com', city: 'Starogard Gdański', state: 'Pomorskie', industry: 'Pharmaceutical', revenue: 1320000000, employees: '4600', url: 'http://www.polpharma.com', status: 'lead', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 32, company: 'WIRTUALNA POLSKA HOLDING S A', contact: 'Natalia Wrona', title: 'Partnerships Director', phone: '48-225769000', email: 'kontakt@wp.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Internet Services', revenue: 560000000, employees: '1800', url: 'http://www.wp.pl', status: 'kontakt', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 33, company: 'ZAKLADY AZOTOWE PULAWY S A', contact: 'Leszek Grabowski', title: 'Kierownik ds. Sprzedaży', phone: '48-818860001', email: 'sekretariat@pulawy.com', city: 'Puławy', state: 'Lubelskie', industry: 'Chemical Manufacturing', revenue: 1640000000, employees: '4100', url: 'http://www.pulawy.com', status: 'oferta', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 34, company: 'BUDIMEX S A', contact: 'Elżbieta Sadowska', title: 'Key Account Manager', phone: '48-223236000', email: 'biuro@budimex.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Construction', revenue: 1480000000, employees: '5800', url: 'http://www.budimex.pl', status: 'negocjacje', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 35, company: 'STALPRODUKT S A', contact: 'Jerzy Kowalczyk', title: 'Sales Director', phone: '48-146881200', email: 'stalprodukt@stalprodukt.com.pl', city: 'Bochnia', state: 'Malopolskie', industry: 'Metal Manufacturing', revenue: 780000000, employees: '2200', url: 'http://www.stalprodukt.com.pl', status: 'zamkniety', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 36, company: 'POLSKA GRUPA ZBROJENIOWA S A', contact: 'Andrzej Markowski', title: 'Dyrektor Komercyjny', phone: '48-223140000', email: 'pgz@pgzsa.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Defense', revenue: 2100000000, employees: '17000', url: 'http://www.pgzsa.pl', status: 'lead', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 37, company: 'PFLEIDERER POLSKA SP Z O O', contact: 'Teresa Wojcik', title: 'Commercial Manager', phone: '48-613260700', email: 'info@pfleiderer.com', city: 'Wronki', state: 'Wielkopolskie', industry: 'Wood Manufacturing', revenue: 520000000, employees: '1400', url: 'http://www.pfleiderer.com', status: 'kontakt', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 38, company: 'TORUŃ PACIFIC SP Z O O', contact: 'Kamil Jóźwiak', title: 'Account Executive', phone: '48-566584700', email: 'info@torunpacific.pl', city: 'Toruń', state: 'Kujawsko-Pomorskie', industry: 'Food Manufacturing', revenue: 310000000, employees: '780', url: 'http://www.torunpacific.pl', status: 'oferta', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 39, company: 'MPWiK WROCŁAW S A', contact: 'Halina Ziemniak', title: 'Dyrektor Handlowy', phone: '48-713281444', email: 'kontakt@mpwik.wroc.pl', city: 'Wrocław', state: 'Dolnośląskie', industry: 'Water Utilities', revenue: 480000000, employees: '1600', url: 'http://www.mpwik.wroc.pl', status: 'negocjacje', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 40, company: 'AZOTY TARNÓW S A', contact: 'Waldemar Jędrzejewski', title: 'Key Account Manager', phone: '48-146330100', email: 'kontakt@grupaazoty.com', city: 'Tarnów', state: 'Malopolskie', industry: 'Chemical Manufacturing', revenue: 3100000000, employees: '7800', url: 'http://www.grupaazoty.com', status: 'stracony', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 41, company: 'PGE POLSKA GRUPA ENERGETYCZNA S A', contact: 'Paweł Zając', title: 'Strategic Sales Manager', phone: '48-228150000', email: 'kontakt@gkpge.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Electric Power Distribution', revenue: 11400000000, employees: '40000', url: 'http://www.gkpge.pl', status: 'lead', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 42, company: 'KGHM POLSKA MIEDŹ S A', contact: 'Ewa Konieczna', title: 'Dyrektor Handlowy', phone: '48-768788200', email: 'kghm@kghm.pl', city: 'Lubin', state: 'Dolnośląskie', industry: 'Metal Mining', revenue: 9800000000, employees: '34000', url: 'http://www.kghm.pl', status: 'kontakt', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 43, company: 'POLSKA TELEFONIA CYFROWA S A', contact: 'Radosław Kubiak', title: 'Corporate Sales Manager', phone: '48-226005000', email: 'kontakt@t-mobile.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Telecommunications', revenue: 3600000000, employees: '5500', url: 'http://www.t-mobile.pl', status: 'oferta', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 44, company: 'ORANGE POLSKA S A', contact: 'Sylwia Rutkowska', title: 'Business Development Manager', phone: '48-225275500', email: 'kontakt@orange.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Telecommunications', revenue: 2900000000, employees: '16000', url: 'http://www.orange.pl', status: 'negocjacje', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 45, company: 'PLAY COMMUNICATIONS S A', contact: 'Dariusz Lewandowski', title: 'B2B Sales Director', phone: '48-220202020', email: 'biuro@play.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Telecommunications', revenue: 2600000000, employees: '3800', url: 'http://www.play.pl', status: 'zamkniety', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 46, company: 'CELSA HUTA OSTROWIEC SP Z O O', contact: 'Janina Kowalczyk', title: 'Export Manager', phone: '48-412648000', email: 'info@celsagroup.pl', city: 'Ostrowiec Świętokrzyski', state: 'Świętokrzyskie', industry: 'Metal Manufacturing', revenue: 680000000, employees: '2800', url: 'http://www.celsagroup.pl', status: 'lead', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 47, company: 'ZAKŁADY AZOTOWE ANWIL S A', contact: 'Krystyna Woźniak', title: 'Account Manager', phone: '48-542634000', email: 'anwil@anwil.pl', city: 'Włocławek', state: 'Kujawsko-Pomorskie', industry: 'Chemical Manufacturing', revenue: 1100000000, employees: '1900', url: 'http://www.anwil.pl', status: 'kontakt', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 48, company: 'ENERGA ELEKTRA SP Z O O', contact: 'Marian Wiśniewski', title: 'Sales Manager', phone: '48-586364000', email: 'energaelektra@energa.pl', city: 'Gdańsk', state: 'Pomorskie', industry: 'Electric Power Distribution', revenue: 920000000, employees: '1200', url: 'http://www.energa.pl', status: 'oferta', assignedTo: 'Anna Nowak', history: [], reminders: [] },
  { id: 49, company: 'IMPEL S A', contact: 'Zofia Michalska', title: 'Key Account Manager', phone: '48-717849100', email: 'impel@impel.pl', city: 'Wrocław', state: 'Dolnośląskie', industry: 'Business Services', revenue: 560000000, employees: '65000', url: 'http://www.impel.pl', status: 'negocjacje', assignedTo: 'Jan Kowalski', history: [], reminders: [] },
  { id: 50, company: 'LEROY MERLIN POLSKA SP Z O O', contact: 'Konrad Jankiewicz', title: 'Procurement Director', phone: '48-227296800', email: 'kontakt@leroymerlin.pl', city: 'Warszawa', state: 'Mazowieckie', industry: 'Retail', revenue: 2200000000, employees: '10000', url: 'http://www.leroymerlin.pl', status: 'stracony', assignedTo: 'Anna Nowak', history: [], reminders: [] },
];

export const PIPELINE_STAGES: { key: Status; label: string; color: string }[] = [
  { key: 'lead', label: 'Lead', color: '#6b7280' },
  { key: 'kontakt', label: 'Kontakt', color: '#3b82f6' },
  { key: 'oferta', label: 'Oferta', color: '#f59e0b' },
  { key: 'negocjacje', label: 'Negocjacje', color: '#8b5cf6' },
  { key: 'zamkniety', label: 'Zamknięty', color: '#10b981' },
  { key: 'stracony', label: 'Stracony', color: '#ef4444' },
];

export const ROLES = ['Admin', 'Jan Kowalski', 'Anna Nowak'] as const;
export type Role = (typeof ROLES)[number];
